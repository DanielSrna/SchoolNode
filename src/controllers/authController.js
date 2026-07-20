const bcrypt = require('bcryptjs');
const User = require('../models/User');
const {
  generarAccessToken,
  generarRefreshToken,
  verificarToken,
} = require('../config/jwt');
const logger = require('../utils/logger');

const COOKIE_OPTIONS = {
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: 'lax',
  path: '/',
};

const ACCESS_TOKEN_MAX_AGE = 15 * 60 * 1000; // 15 minutos
const REFRESH_TOKEN_MAX_AGE = 7 * 24 * 60 * 60 * 1000; // 7 días

// POST /api/auth/login
const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    logger.proceso(`Intento de login para: ${email}`);

    const usuario = await User.findOne({ email });
    if (!usuario) {
      logger.error(`Usuario no encontrado: ${email}`);
      return res.status(401).json({ error: 'Credenciales inválidas' });
    }

    const passwordValida = await usuario.compararPassword(password);
    if (!passwordValida) {
      logger.error(`Contraseña incorrecta para: ${email}`);
      return res.status(401).json({ error: 'Credenciales inválidas' });
    }

    if (!usuario.activo) {
      logger.error(`Usuario inactivo: ${email}`);
      return res.status(401).json({ error: 'Cuenta desactivada' });
    }

    // Generar tokens
    const accessToken = generarAccessToken(usuario);
    const refreshToken = generarRefreshToken(usuario);

    // Guardar refresh token hasheado en DB
    usuario.refreshToken = await bcrypt.hash(refreshToken, 10);
    await usuario.save();

    // Establecer cookies
    res.cookie('accessToken', accessToken, {
      ...COOKIE_OPTIONS,
      maxAge: ACCESS_TOKEN_MAX_AGE,
    });

    res.cookie('refreshToken', refreshToken, {
      ...COOKIE_OPTIONS,
      maxAge: REFRESH_TOKEN_MAX_AGE,
    });

    logger.exito(`Login exitoso: ${email}`);
    res.json({
      usuario: usuario.toJSON(),
      accessToken,
    });
  } catch (error) {
    logger.error(`Error en login: ${error.message}`);
    res.status(500).json({ error: 'Error en el servidor' });
  }
};

// POST /api/auth/refresh - Renueva el access token usando el refresh token
const refresh = async (req, res) => {
  try {
    const refreshToken = req.cookies.refreshToken || req.body.refreshToken;

    if (!refreshToken) {
      logger.error('Refresh token no proporcionado');
      return res.status(401).json({ error: 'Refresh token no proporcionado' });
    }

    // Verificar refresh token
    const payload = verificarToken(refreshToken, process.env.JWT_REFRESH_SECRET);
    if (!payload) {
      logger.error('Refresh token inválido o expirado');
      return res.status(401).json({ error: 'Refresh token inválido o expirado' });
    }

    // Buscar usuario
    const usuario = await User.findById(payload.id);
    if (!usuario || !usuario.refreshToken || !usuario.activo) {
      logger.error('Usuario no encontrado, inactivo o sin refresh token');
      return res.status(401).json({ error: 'Sesión inválida' });
    }

    // Comparar refresh token con el guardado en DB
    const refreshTokenValido = await bcrypt.compare(refreshToken, usuario.refreshToken);
    if (!refreshTokenValido) {
      logger.error('Refresh token no coincide con el guardado');
      return res.status(401).json({ error: 'Sesión inválida' });
    }

    // Generar nuevos tokens (rotación)
    const newAccessToken = generarAccessToken(usuario);
    const newRefreshToken = generarRefreshToken(usuario);

    // Actualizar refresh token en DB
    usuario.refreshToken = await bcrypt.hash(newRefreshToken, 10);
    await usuario.save();

    // Establecer nuevas cookies
    res.cookie('accessToken', newAccessToken, {
      ...COOKIE_OPTIONS,
      maxAge: ACCESS_TOKEN_MAX_AGE,
    });

    res.cookie('refreshToken', newRefreshToken, {
      ...COOKIE_OPTIONS,
      maxAge: REFRESH_TOKEN_MAX_AGE,
    });

    logger.exito(`Token renovado: ${usuario.email}`);
    res.json({ accessToken: newAccessToken });
  } catch (error) {
    logger.error(`Error en refresh: ${error.message}`);
    res.status(500).json({ error: 'Error en el servidor' });
  }
};

// POST /api/auth/logout
const logout = async (req, res) => {
  try {
    if (req.usuario) {
      req.usuario.refreshToken = null;
      await req.usuario.save();
      logger.exito(`Logout: ${req.usuario.email}`);
    }

    // Limpiar cookies
    res.clearCookie('accessToken', COOKIE_OPTIONS);
    res.clearCookie('refreshToken', COOKIE_OPTIONS);

    res.json({ mensaje: 'Sesión cerrada exitosamente' });
  } catch (error) {
    logger.error(`Error en logout: ${error.message}`);
    res.status(500).json({ error: 'Error en el servidor' });
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
    res.status(500).json({ error: 'Error en el servidor' });
  }
};

// POST /api/auth/cambiar-id
const cambiarID = async (req, res) => {
  try {
    const { nuevoId } = req.body;

    if (!nuevoId) {
      return res.status(400).json({ error: 'Nuevo ID requerido' });
    }

    logger.proceso(`Solicitud de cambio de ID para ${req.usuario.email}: ${nuevoId}`);
    res.json({ mensaje: 'Email de confirmación enviado' });
  } catch (error) {
    logger.error(`Error cambiando ID: ${error.message}`);
    res.status(500).json({ error: 'Error en el servidor' });
  }
};

// POST /api/auth/cambiar-password
const cambiarPassword = async (req, res) => {
  try {
    const { nuevaPassword } = req.body;

    if (!nuevaPassword || nuevaPassword.length < 8) {
      return res.status(400).json({ error: 'Contraseña debe tener al menos 8 caracteres' });
    }

    logger.proceso(`Solicitud de cambio de contraseña para ${req.usuario.email}`);
    res.json({ mensaje: 'Email de confirmación enviado' });
  } catch (error) {
    logger.error(`Error cambiando contraseña: ${error.message}`);
    res.status(500).json({ error: 'Error en el servidor' });
  }
};

module.exports = {
  login,
  refresh,
  logout,
  obtenerUsuarioActual,
  cambiarID,
  cambiarPassword,
};
