const bcrypt = require('bcryptjs');
const User = require('../models/User');
const TokenAccion = require('../models/TokenAccion');
const { enviarCorreo, plantillaCodigo } = require('../config/mailer');
const {
  generarAccessToken,
  generarRefreshToken,
  verificarToken,
} = require('../config/jwt');
const { ErrorAPI } = require('../utils/ErrorAPI');
const logger = require('../utils/logger');

// Servicio de autenticación: concentra toda la lógica de sesiones.
// Los controladores solo llaman estas funciones y traducen el resultado a HTTP.

// Valida credenciales y devuelve el usuario junto con los dos tokens JWT.
// Lanza ErrorAPI 401 si las credenciales son inválidas o la cuenta está inactiva.
const login = async (email, password) => {
  logger.proceso(`Intento de login para: ${email}`);

  const usuario = await User.buscarPorEmail(email);
  if (!usuario) {
    logger.error(`Usuario no encontrado: ${email}`);
    throw new ErrorAPI('Credenciales inválidas', 401);
  }

  const passwordValida = await usuario.compararPassword(password);
  if (!passwordValida) {
    logger.error(`Contraseña incorrecta para: ${email}`);
    throw new ErrorAPI('Credenciales inválidas', 401);
  }

  if (!usuario.activo) {
    logger.error(`Usuario inactivo: ${email}`);
    throw new ErrorAPI('Cuenta desactivada', 401);
  }

  return await generarSesion(usuario);
};

// Genera un nuevo par de tokens y guarda el refresh token hasheado en la DB.
// El hash bcrypt impide que un robo de la base de datos exponga las sesiones.
const generarSesion = async (usuario) => {
  const accessToken = generarAccessToken(usuario);
  const refreshToken = generarRefreshToken(usuario);

  await usuario.guardarRefreshToken(await bcrypt.hash(refreshToken, 10));

  return { usuario, accessToken, refreshToken };
};

// Renova la sesión a partir de un refresh token válido (rotación de tokens).
// Lanza ErrorAPI 401 si el token es inválido, expiró o no coincide con el guardado.
const renovarSesion = async (refreshToken) => {
  if (!refreshToken) {
    logger.error('Refresh token no proporcionado');
    throw new ErrorAPI('Refresh token no proporcionado', 401);
  }

  const payload = verificarToken(refreshToken, process.env.JWT_REFRESH_SECRET);
  if (!payload) {
    logger.error('Refresh token inválido o expirado');
    throw new ErrorAPI('Refresh token inválido o expirado', 401);
  }

  const usuario = await User.findById(payload.id);
  if (!usuario || !usuario.refreshToken || !usuario.activo) {
    logger.error('Usuario no encontrado, inactivo o sin refresh token');
    throw new ErrorAPI('Sesión inválida', 401);
  }

  const refreshTokenValido = await bcrypt.compare(refreshToken, usuario.refreshToken);
  if (!refreshTokenValido) {
    logger.error('Refresh token no coincide con el guardado');
    throw new ErrorAPI('Sesión inválida', 401);
  }

  logger.exito(`Token renovado: ${usuario.email}`);
  return await generarSesion(usuario);
};

// Cierra la sesión eliminando el refresh token guardado en la DB
const cerrarSesion = async (usuario) => {
  if (usuario) {
    await usuario.limpiarRefreshToken();
    logger.exito(`Logout: ${usuario.email}`);
  }
};

// ============================================================
// CAMBIO DE CREDENCIALES CON VERIFICACIÓN POR CORREO
// Flujo: solicitar → se envía código de 6 dígitos → confirmar.
// ============================================================

// Paso 1 del cambio de correo: envía el código al NUEVO correo.
const solicitarCambioEmail = async (usuario, nuevoEmail) => {
  const enUso = await User.existeEmail(nuevoEmail, usuario._id);
  if (enUso) throw new ErrorAPI('Ese correo ya está en uso', 400);

  const { codigo } = await TokenAccion.generar(usuario._id, 'email', nuevoEmail);

  await enviarCorreo({
    para: nuevoEmail,
    asunto: 'SchoolNode - Código para cambiar tu correo',
    html: plantillaCodigo(usuario.nombre, codigo, 'cambiar tu correo de acceso'),
  });

  logger.exito(`Código de cambio de correo enviado a ${nuevoEmail} (usuario ${usuario.email})`);
};

// Paso 1 del cambio de contraseña: verifica la actual y envía el código
// al correo actual del usuario.
const solicitarCambioPassword = async (usuario, passwordActual, nuevaPassword) => {
  // Se necesita el documento completo (req.usuario no trae el password)
  const documento = await User.findById(usuario._id);

  const actualValida = await documento.compararPassword(passwordActual);
  if (!actualValida) throw new ErrorAPI('La contraseña actual es incorrecta', 400);

  // Se guarda el HASH bcrypt de la nueva contraseña, nunca el texto plano
  const hashNueva = await bcrypt.hash(nuevaPassword, 10);
  const { codigo } = await TokenAccion.generar(usuario._id, 'password', hashNueva);

  await enviarCorreo({
    para: documento.email,
    asunto: 'SchoolNode - Código para cambiar tu contraseña',
    html: plantillaCodigo(documento.nombre, codigo, 'cambiar tu contraseña'),
  });

  logger.exito(`Código de cambio de contraseña enviado a ${documento.email}`);
};

// Paso 2 (común): verifica el código y aplica el cambio pendiente.
// Devuelve el tipo de cambio aplicado.
const confirmarCambio = async (usuario, codigo) => {
  // Buscar cualquier solicitud activa del usuario
  const tokenEmail = await TokenAccion.findOne({ usuario: usuario._id, tipo: 'email' });
  const tokenPassword = await TokenAccion.findOne({ usuario: usuario._id, tipo: 'password' });
  const token = tokenEmail || tokenPassword;

  if (!token) {
    throw new ErrorAPI('No hay ninguna solicitud pendiente. Solicita un nuevo código', 400);
  }

  await token.verificarCodigo(codigo);

  if (token.tipo === 'email') {
    const enUso = await User.existeEmail(token.valor, usuario._id);
    if (enUso) {
      await token.deleteOne();
      throw new ErrorAPI('Ese correo ya está en uso', 400);
    }
    await User.updateOne({ _id: usuario._id }, { email: token.valor });
    logger.exito(`Correo de acceso actualizado: ${usuario.email} → ${token.valor}`);
  } else {
    // El valor ya es el hash bcrypt: se escribe directo con updateOne
    // para que el pre-save del modelo no lo vuelva a hashear.
    await User.updateOne({ _id: usuario._id }, { password: token.valor });
    // Por seguridad, cerrar las sesiones activas: debe iniciar sesión de nuevo
    await User.updateOne({ _id: usuario._id }, { refreshToken: null });
    logger.exito(`Contraseña actualizada para: ${usuario.email}`);
  }

  const tipo = token.tipo;
  await token.deleteOne();
  return tipo;
};

module.exports = {
  login,
  renovarSesion,
  cerrarSesion,
  solicitarCambioEmail,
  solicitarCambioPassword,
  confirmarCambio,
};
