const User = require('../models/User');
const { responderError } = require('../utils/ErrorAPI');
const logger = require('../utils/logger');

// Controlador de empleados: SOLO orquesta.
// Todas las operaciones de datos viven en el modelo User.

// GET /api/empleados
const listarEmpleados = async (req, res) => {
  try {
    logger.proceso('Listando empleados');
    const empleados = await User.listarEmpleados();
    res.json(empleados);
  } catch (error) {
    logger.error(`Error listando empleados: ${error.message}`);
    responderError(res, error);
  }
};

// GET /api/empleados/:id
const obtenerEmpleado = async (req, res) => {
  try {
    const empleado = await User.obtenerEmpleadoPorId(req.params.id);
    res.json(empleado);
  } catch (error) {
    logger.error(`Error obteniendo empleado: ${error.message}`);
    responderError(res, error);
  }
};

// POST /api/empleados
const crearEmpleado = async (req, res) => {
  try {
    const empleado = await User.crearEmpleado(req.body);
    logger.exito(`Empleado creado: ${empleado.email}`);
    res.status(201).json(empleado.toJSON());
  } catch (error) {
    logger.error(`Error creando empleado: ${error.message}`);
    responderError(res, error);
  }
};

// PUT /api/empleados/:id
const actualizarEmpleado = async (req, res) => {
  try {
    const empleado = await User.obtenerDocumentoActivo(req.params.id);
    await empleado.actualizarDatos(req.body);
    logger.exito(`Empleado actualizado: ${empleado.email}`);
    res.json(empleado.toJSON());
  } catch (error) {
    logger.error(`Error actualizando empleado: ${error.message}`);
    responderError(res, error);
  }
};

// DELETE /api/empleados/:id
const eliminarEmpleado = async (req, res) => {
  try {
    const empleado = await User.obtenerDocumentoActivo(req.params.id);
    await empleado.desactivar();
    logger.exito(`Empleado eliminado: ${empleado.email}`);
    res.json({ mensaje: 'Empleado eliminado exitosamente' });
  } catch (error) {
    logger.error(`Error eliminando empleado: ${error.message}`);
    responderError(res, error);
  }
};

module.exports = {
  listarEmpleados,
  obtenerEmpleado,
  crearEmpleado,
  actualizarEmpleado,
  eliminarEmpleado,
};
