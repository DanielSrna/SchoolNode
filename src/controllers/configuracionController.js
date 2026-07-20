const Configuracion = require('../models/Configuracion');
const bcrypt = require('bcryptjs');
const User = require('../models/User');
const logger = require('../utils/logger');

// GET /api/configuracion
const obtenerConfiguracion = async (req, res) => {
  try {
    let config = await Configuracion.findOne({ clave: 'general' });
    if (!config) {
      config = new Configuracion({ clave: 'general' });
      await config.save();
    }
    res.json(config);
  } catch (error) {
    logger.error(`Error obteniendo configuración: ${error.message}`);
    res.status(500).json({ error: 'Error en el servidor' });
  }
};

// PUT /api/configuracion
const actualizarConfiguracion = async (req, res) => {
  try {
    const {
      nombreInstitucion,
      ubicacion,
      nit,
      telefono,
      email,
      colorPrimario,
      facturacion,
    } = req.body;

    let config = await Configuracion.findOne({ clave: 'general' });
    if (!config) {
      config = new Configuracion({ clave: 'general' });
    }

    if (nombreInstitucion !== undefined) config.nombreInstitucion = nombreInstitucion;
    if (ubicacion !== undefined) config.ubicacion = ubicacion;
    if (nit !== undefined) config.nit = nit;
    if (telefono !== undefined) config.telefono = telefono;
    if (email !== undefined) config.email = email;
    if (colorPrimario !== undefined) config.colorPrimario = colorPrimario;
    if (facturacion) {
      config.facturacion = { ...config.facturacion.toObject(), ...facturacion };
    }

    await config.save();
    logger.exito(`Configuración actualizada por: ${req.usuario.email}`);
    res.json(config);
  } catch (error) {
    logger.error(`Error actualizando configuración: ${error.message}`);
    res.status(500).json({ error: 'Error en el servidor' });
  }
};

// POST /api/auth/cambiar-credenciales-admin
const cambiarCredencialesAdmin = async (req, res) => {
  try {
    const { nuevoEmail, nuevaPassword } = req.body;

    if (req.usuario.rol !== 'admin') {
      return res.status(403).json({ error: 'Solo administradores pueden cambiar credenciales aquí' });
    }

    const admin = await User.findById(req.usuario._id);

    if (nuevoEmail && nuevoEmail !== admin.email) {
      // Verificar que el email no esté en uso
      const existe = await User.findOne({ email: nuevoEmail, _id: { $ne: admin._id } });
      if (existe) {
        return res.status(400).json({ error: 'Email ya en uso' });
      }
      admin.email = nuevoEmail;
    }

    if (nuevaPassword) {
      if (nuevaPassword.length < 8) {
        return res.status(400).json({ error: 'Contraseña mínimo 8 caracteres' });
      }
      admin.password = nuevaPassword; // Se hashea automáticamente en el pre-save
    }

    await admin.save();
    logger.exito(`Credenciales de admin actualizadas: ${admin.email}`);
    res.json({ mensaje: 'Credenciales actualizadas exitosamente' });
  } catch (error) {
    logger.error(`Error cambiando credenciales: ${error.message}`);
    res.status(500).json({ error: 'Error en el servidor' });
  }
};

module.exports = {
  obtenerConfiguracion,
  actualizarConfiguracion,
  cambiarCredencialesAdmin,
};
