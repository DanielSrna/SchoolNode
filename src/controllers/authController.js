const authService = require('../services/authService');
const { establecerCookiesAuth, limpiarCookiesAuth } = require('../utils/cookies');
const { responderError } = require('../utils/ErrorAPI');
const logger = require('../utils/logger');

// Controlador de autenticación: SOLO orquesta.
// La lógica vive en authService (sesiones) y en el modelo User (DB).

// POST /api/auth/login
const login = async (req, res) => {
  try {
    const { email, password } = req.body;
    const { usuario, accessToken, refreshToken } = await authService.login(email, password);

    establecerCookiesAuth(res, accessToken, refreshToken);

    logger.exito(`Login exitoso: ${email}`);
    res.json({ usuario: usuario.toJSON(), accessToken });
  } catch (error) {
    responderError(res, error);
  }
};

// POST /api/auth/refresh - Renueva el access token usando el refresh token
const refresh = async (req, res) => {
  try {
    const refreshToken = req.cookies.refreshToken || req.body.refreshToken;
    const { accessToken, refreshToken: nuevoRefreshToken } =
      await authService.renovarSesion(refreshToken);

    establecerCookiesAuth(res, accessToken, nuevoRefreshToken);
    res.json({ accessToken });
  } catch (error) {
    responderError(res, error);
  }
};

// POST /api/auth/logout
const logout = async (req, res) => {
  try {
    await authService.cerrarSesion(req.usuario);
    limpiarCookiesAuth(res);
    res.json({ mensaje: 'Sesión cerrada exitosamente' });
  } catch (error) {
    logger.error(`Error en logout: ${error.message}`);
    responderError(res, error);
  }
};

// GET /api/auth/me
const obtenerUsuarioActual = async (req, res) => {
  try {
    res.json({
      nombre: req.usuario.nombre,
      email: req.usuario.email,
      rol: req.usuario.rol,
    });
  } catch (error) {
    logger.error(`Error obteniendo usuario actual: ${error.message}`);
    responderError(res, error);
  }
};

// POST /api/auth/cambiar-email - Paso 1: envía código al nuevo correo
const cambiarEmail = async (req, res) => {
  try {
    await authService.solicitarCambioEmail(req.usuario, req.body.nuevoEmail);
    res.json({ mensaje: `Código de verificación enviado a ${req.body.nuevoEmail}` });
  } catch (error) {
    logger.error(`Error en cambio de email: ${error.message}`);
    responderError(res, error);
  }
};

// POST /api/auth/cambiar-password - Paso 1: verifica la actual y envía código
const cambiarPassword = async (req, res) => {
  try {
    const { passwordActual, nuevaPassword } = req.body;
    await authService.solicitarCambioPassword(req.usuario, passwordActual, nuevaPassword);
    res.json({ mensaje: 'Código de verificación enviado a tu correo actual' });
  } catch (error) {
    logger.error(`Error en cambio de contraseña: ${error.message}`);
    responderError(res, error);
  }
};

// POST /api/auth/confirmar-cambio - Paso 2: verifica el código y aplica
const confirmarCambio = async (req, res) => {
  try {
    const tipo = await authService.confirmarCambio(req.usuario, req.body.codigo);

    if (tipo === 'password') {
      // La sesión se cerró en el servidor por seguridad: limpiar cookies
      limpiarCookiesAuth(res);
      return res.json({
        mensaje: 'Contraseña actualizada. Inicia sesión con tu nueva contraseña.',
        cerrarSesion: true,
      });
    }

    res.json({ mensaje: 'Correo de acceso actualizado exitosamente' });
  } catch (error) {
    logger.error(`Error confirmando cambio: ${error.message}`);
    responderError(res, error);
  }
};

module.exports = {
  login,
  refresh,
  logout,
  obtenerUsuarioActual,
  cambiarEmail,
  cambiarPassword,
  confirmarCambio,
};
