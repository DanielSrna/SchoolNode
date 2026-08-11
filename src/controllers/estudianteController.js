const Estudiante = require('../models/Estudiante');
const { responderError } = require('../utils/ErrorAPI');
const logger = require('../utils/logger');

// Controlador de estudiantes: SOLO orquesta.
// Todas las operaciones de datos viven en el modelo Estudiante.

// GET /api/estudiantes
const listarEstudiantes = async (req, res) => {
  try {
    logger.proceso('Listando estudiantes');
    const resultado = await Estudiante.listar(req.query);
    res.json(resultado);
  } catch (error) {
    logger.error(`Error listando estudiantes: ${error.message}`);
    responderError(res, error);
  }
};

// GET /api/estudiantes/:id
const obtenerEstudiante = async (req, res) => {
  try {
    const estudiante = await Estudiante.obtenerPorId(req.params.id);
    res.json(estudiante);
  } catch (error) {
    logger.error(`Error obteniendo estudiante: ${error.message}`);
    responderError(res, error);
  }
};

// POST /api/estudiantes
const crearEstudiante = async (req, res) => {
  try {
    const estudiante = await Estudiante.crearNuevo(req.body);
    logger.exito(`Estudiante creado: ${estudiante.cedula}`);
    res.status(201).json(estudiante);
  } catch (error) {
    logger.error(`Error creando estudiante: ${error.message}`);
    responderError(res, error);
  }
};

// PUT /api/estudiantes/:id
const actualizarEstudiante = async (req, res) => {
  try {
    const estudiante = await Estudiante.obtenerPorId(req.params.id);
    await estudiante.actualizarDatos(req.body);
    logger.exito(`Estudiante actualizado: ${estudiante.cedula}`);
    res.json(estudiante);
  } catch (error) {
    logger.error(`Error actualizando estudiante: ${error.message}`);
    responderError(res, error);
  }
};

// DELETE /api/estudiantes/:id
const eliminarEstudiante = async (req, res) => {
  try {
    const estudiante = await Estudiante.obtenerPorId(req.params.id);
    await estudiante.eliminar();
    logger.exito(`Estudiante eliminado: ${estudiante.cedula}`);
    res.json({ mensaje: 'Estudiante eliminado exitosamente' });
  } catch (error) {
    logger.error(`Error eliminando estudiante: ${error.message}`);
    responderError(res, error);
  }
};

module.exports = {
  listarEstudiantes,
  obtenerEstudiante,
  crearEstudiante,
  actualizarEstudiante,
  eliminarEstudiante,
};
