const { validationResult } = require('express-validator');
const logger = require('../utils/logger');

// Middleware que recoge los errores de las cadenas de express-validator.
// Se coloca después de las validaciones en cada ruta y evita repetir
// el mismo bloque de "validationResult" en todos los controladores.
const validarCampos = (req, res, next) => {
  const errores = validationResult(req);
  if (!errores.isEmpty()) {
    logger.error(`Validación fallida en ${req.originalUrl}: ${JSON.stringify(errores.array())}`);
    return res.status(400).json({ errores: errores.array() });
  }
  next();
};

module.exports = validarCampos;
