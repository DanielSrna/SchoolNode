const { validationResult } = require('express-validator');
const User = require('../models/User');
const logger = require('../utils/logger');

// GET /api/empleados
const listarEmpleados = async (req, res) => {
  try {
    logger.proceso('Listando empleados');
    const empleados = await User.find({ activo: true }).select('-password -refreshToken');
    res.json(empleados);
  } catch (error) {
    logger.error(`Error listando empleados: ${error.message}`);
    res.status(500).json({ error: 'Error en el servidor' });
  }
};

// GET /api/empleados/:id
const obtenerEmpleado = async (req, res) => {
  try {
    const empleado = await User.findById(req.params.id).select('-password -refreshToken');
    if (!empleado || !empleado.activo) {
      logger.error(`Empleado no encontrado: ${req.params.id}`);
      return res.status(404).json({ error: 'Empleado no encontrado' });
    }
    res.json(empleado);
  } catch (error) {
    logger.error(`Error obteniendo empleado: ${error.message}`);
    res.status(500).json({ error: 'Error en el servidor' });
  }
};

// POST /api/empleados
const crearEmpleado = async (req, res) => {
  try {
    const errores = validationResult(req);
    if (!errores.isEmpty()) {
      logger.error(`Validación fallida: ${JSON.stringify(errores.array())}`);
      return res.status(400).json({ errores: errores.array() });
    }

    const { email, password, nombre, rol } = req.body;

    // Verificar si email ya existe
    const existe = await User.findOne({ email });
    if (existe) {
      logger.error(`Email ya registrado: ${email}`);
      return res.status(400).json({ error: 'Email ya registrado' });
    }

    const empleado = new User({ email, password, nombre, rol: rol || 'empleado' });
    await empleado.save();

    logger.exito(`Empleado creado: ${email}`);
    res.status(201).json(empleado.toJSON());
  } catch (error) {
    logger.error(`Error creando empleado: ${error.message}`);
    res.status(500).json({ error: 'Error en el servidor' });
  }
};

// PUT /api/empleados/:id
const actualizarEmpleado = async (req, res) => {
  try {
    const { nombre, email, rol } = req.body;
    const empleado = await User.findById(req.params.id);

    if (!empleado || !empleado.activo) {
      logger.error(`Empleado no encontrado: ${req.params.id}`);
      return res.status(404).json({ error: 'Empleado no encontrado' });
    }

    if (nombre) empleado.nombre = nombre;
    if (email) {
      // Verificar si nuevo email ya existe
      const existe = await User.findOne({ email, _id: { $ne: req.params.id } });
      if (existe) {
        logger.error(`Email ya registrado: ${email}`);
        return res.status(400).json({ error: 'Email ya registrado' });
      }
      empleado.email = email;
    }
    if (rol) empleado.rol = rol;

    await empleado.save();
    logger.exito(`Empleado actualizado: ${empleado.email}`);
    res.json(empleado.toJSON());
  } catch (error) {
    logger.error(`Error actualizando empleado: ${error.message}`);
    res.status(500).json({ error: 'Error en el servidor' });
  }
};

// DELETE /api/empleados/:id
const eliminarEmpleado = async (req, res) => {
  try {
    const empleado = await User.findById(req.params.id);
    if (!empleado) {
      logger.error(`Empleado no encontrado: ${req.params.id}`);
      return res.status(404).json({ error: 'Empleado no encontrado' });
    }

    empleado.activo = false;
    await empleado.save();

    logger.exito(`Empleado eliminado: ${empleado.email}`);
    res.json({ mensaje: 'Empleado eliminado exitosamente' });
  } catch (error) {
    logger.error(`Error eliminando empleado: ${error.message}`);
    res.status(500).json({ error: 'Error en el servidor' });
  }
};

module.exports = {
  listarEmpleados,
  obtenerEmpleado,
  crearEmpleado,
  actualizarEmpleado,
  eliminarEmpleado,
};
