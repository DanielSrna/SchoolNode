const { verificarToken, decodificarToken } = require('../config/jwt');
const User = require('../models/User');
const logger = require('../utils/logger');

// Middleware estricto: requiere access token válido
// Si el token expiró, intenta renovarlo con el refresh token antes de fallar
const authMiddleware = async (req, res, next) => {
  try {
    let token = req.cookies.accessToken || req.headers.authorization?.split(' ')[1];

    // Si no hay access token, intentar con refresh token directamente
    if (!token) {
      const nuevoToken = await intentarRefresh(req, res);
      if (nuevoToken) {
        token = nuevoToken;
      } else {
        logger.error('Intento de acceso sin token');
        return res.status(401).json({ error: 'No autorizado - Token no proporcionado' });
      }
    }

    // Verificar access token
    let payload = verificarToken(token, process.env.JWT_SECRET);

    // Si el access token expiró, intentar refresh automático
    if (!payload) {
      const decoded = decodificarToken(token);
      if (decoded && decoded.exp && decoded.exp * 1000 < Date.now()) {
        // El access token expiró, intentar refresh
        logger.proceso('Access token expirado, intentando refresh automático');
        const nuevoToken = await intentarRefresh(req, res);
        if (nuevoToken) {
          // Usar el token NUEVO (el viejo quedó en las cookies de la petición)
          token = nuevoToken;
          payload = verificarToken(token, process.env.JWT_SECRET);
        }
      }

      if (!payload) {
        logger.error('Token inválido o expirado sin posibilidad de refresh');
        return res.status(401).json({ error: 'Token inválido o expirado' });
      }
    }

    // Buscar usuario en DB
    const usuario = await User.findById(payload.id).select('-password -refreshToken');
    if (!usuario || !usuario.activo) {
      logger.error(`Usuario no encontrado o inactivo: ${payload.email}`);
      return res.status(401).json({ error: 'Usuario no encontrado o inactivo' });
    }

    req.usuario = usuario;
    logger.proceso(`Autenticación exitosa: ${usuario.email}`);
    next();
  } catch (error) {
    logger.error(`Error en middleware de autenticación: ${error.message}`);
    res.status(401).json({ error: 'No autorizado' });
  }
};

// Función auxiliar para intentar refresh automático.
// Devuelve el NUEVO access token si el refresh fue exitoso, o null si falló.
const intentarRefresh = async (req, res) => {
  try {
    const refreshToken = req.cookies.refreshToken;
    if (!refreshToken) return null;

    const payload = verificarToken(refreshToken, process.env.JWT_REFRESH_SECRET);
    if (!payload) return null;

    const usuario = await User.findById(payload.id);
    if (!usuario || !usuario.refreshToken || !usuario.activo) return null;

    const refreshValido = await require('bcryptjs').compare(
      refreshToken,
      usuario.refreshToken
    );
    if (!refreshValido) return null;

    // Generar nuevos tokens
    const { generarAccessToken, generarRefreshToken } = require('../config/jwt');
    const newAccessToken = generarAccessToken(usuario);
    const newRefreshToken = generarRefreshToken(usuario);

    // Guardar en DB
    usuario.refreshToken = await require('bcryptjs').hash(newRefreshToken, 10);
    await usuario.save();

    // Actualizar cookies
    const cookieOptions = {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
    };

    res.cookie('accessToken', newAccessToken, {
      ...cookieOptions,
      maxAge: 15 * 60 * 1000,
    });

    res.cookie('refreshToken', newRefreshToken, {
      ...cookieOptions,
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    logger.exito(`Token auto-renovado: ${usuario.email}`);
    return newAccessToken;
  } catch (error) {
    logger.error(`Error en refresh automático: ${error.message}`);
    return null;
  }
};

// Middleware opcional: adjunta el usuario a res.locals si está autenticado.
// NO rota tokens: solo identifica (con el access token o, si expiró, con el
// refresh token). La rotación real ocurre en authMiddleware al consumir una
// ruta protegida, para no invalidar la cookie a medio camino.
const attachUser = async (req, res, next) => {
  // Siempre inicializar las variables con false por defecto
  res.locals.usuario = null;
  res.locals.esAdmin = false;
  res.locals.esEmpleado = false;
  res.locals.esEstudiante = false;

  try {
    let token = req.cookies.accessToken || req.headers.authorization?.split(' ')[1];

    let payload = token ? verificarToken(token, process.env.JWT_SECRET) : null;

    // Access token ausente o vencido: identificar con el refresh token
    // (solo lectura, sin rotación ni nuevas cookies)
    if (!payload && req.cookies.refreshToken) {
      payload = verificarToken(req.cookies.refreshToken, process.env.JWT_REFRESH_SECRET);
    }

    if (payload && payload.id) {
      const usuario = await User.findById(payload.id).select('-password -refreshToken');
      if (usuario && usuario.activo) {
        req.usuario = usuario;
        res.locals.usuario = usuario;
        res.locals.esAdmin = usuario.rol === 'admin';
        res.locals.esEmpleado = usuario.rol === 'empleado';
        res.locals.esEstudiante = usuario.rol === 'estudiante';
      }
    }
  } catch (error) {
    // Silenciar errores en este middleware opcional
  }
  next();
};

module.exports = authMiddleware;
module.exports.attachUser = attachUser;
