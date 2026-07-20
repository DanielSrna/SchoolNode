const logger = require('../utils/logger');

// Middleware para verificar roles
const roleMiddleware = (rolesPermitidos) => {
  return (req, res, next) => {
    if (!req.usuario) {
      logger.error('Intento de acceso sin usuario autenticado');
      return res.status(401).json({ error: 'No autorizado' });
    }

    if (!rolesPermitidos.includes(req.usuario.rol)) {
      logger.error(`Acceso denegado para rol ${req.usuario.rol} en ${req.originalUrl}`);
      return res.status(403).json({
        error: 'Acceso denegado - No tiene permisos suficientes',
      });
    }

    logger.proceso(`Acceso autorizado para ${req.usuario.email} con rol ${req.usuario.rol}`);
    next();
  };
};

// Helper para verificar si el usuario es admin
const esAdmin = (req) => {
  return req.usuario && req.usuario.rol === 'admin';
};

// Helper para verificar si el usuario es empleado
const esEmpleado = (req) => {
  return req.usuario && req.usuario.rol === 'empleado';
};

module.exports = roleMiddleware;
module.exports.esAdmin = esAdmin;
module.exports.esEmpleado = esEmpleado;
