const Configuracion = require('../models/Configuracion');
const User = require('../models/User');
const { responderError, ErrorAPI } = require('../utils/ErrorAPI');
const logger = require('../utils/logger');

// Controlador de configuración: SOLO orquesta.
// Los datos viven en los modelos Configuracion y User.

// GET /api/configuracion
const obtenerConfiguracion = async (req, res) => {
  try {
    const config = await Configuracion.obtenerGeneral();
    res.json(config);
  } catch (error) {
    logger.error(`Error obteniendo configuración: ${error.message}`);
    responderError(res, error);
  }
};

// PUT /api/configuracion
const actualizarConfiguracion = async (req, res) => {
  try {
    const config = await Configuracion.actualizarGeneral(req.body);
    logger.exito(`Configuración actualizada por: ${req.usuario.email}`);
    res.json(config);
  } catch (error) {
    logger.error(`Error actualizando configuración: ${error.message}`);
    responderError(res, error);
  }
};

// POST /api/configuracion/cambiar-credenciales
const cambiarCredencialesAdmin = async (req, res) => {
  try {
    if (req.usuario.rol !== 'admin') {
      throw new ErrorAPI('Solo administradores pueden cambiar credenciales aquí', 403);
    }

    const admin = await User.findById(req.usuario._id);
    await admin.cambiarCredenciales(req.body);

    logger.exito(`Credenciales de admin actualizadas: ${admin.email}`);
    res.json({ mensaje: 'Credenciales actualizadas exitosamente' });
  } catch (error) {
    logger.error(`Error cambiando credenciales: ${error.message}`);
    responderError(res, error);
  }
};

module.exports = {
  obtenerConfiguracion,
  actualizarConfiguracion,
  cambiarCredencialesAdmin,
};
