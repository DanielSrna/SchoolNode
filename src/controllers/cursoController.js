const Curso = require('../models/Curso');
const { responderError } = require('../utils/ErrorAPI');
const logger = require('../utils/logger');

// Controlador de cursos: SOLO orquesta.
// Todas las operaciones de datos viven en el modelo Curso.

// GET /api/cursos
const listarCursos = async (req, res) => {
  try {
    logger.proceso('Listando cursos');
    const cursos = await Curso.listarActivos();
    res.json(cursos);
  } catch (error) {
    logger.error(`Error listando cursos: ${error.message}`);
    responderError(res, error);
  }
};

// GET /api/cursos/:id
const obtenerCurso = async (req, res) => {
  try {
    const curso = await Curso.obtenerActivoPorId(req.params.id);
    res.json(curso);
  } catch (error) {
    logger.error(`Error obteniendo curso: ${error.message}`);
    responderError(res, error);
  }
};

// POST /api/cursos
const crearCurso = async (req, res) => {
  try {
    const curso = await Curso.crearNuevo(req.body);
    logger.exito(`Curso creado: ${curso.nombre}`);
    res.status(201).json(curso);
  } catch (error) {
    logger.error(`Error creando curso: ${error.message}`);
    responderError(res, error);
  }
};

// PUT /api/cursos/:id
const actualizarCurso = async (req, res) => {
  try {
    const curso = await Curso.obtenerActivoPorId(req.params.id);
    await curso.actualizarDatos(req.body);
    logger.exito(`Curso actualizado: ${curso.nombre}`);
    res.json(curso);
  } catch (error) {
    logger.error(`Error actualizando curso: ${error.message}`);
    responderError(res, error);
  }
};

// DELETE /api/cursos/:id
const eliminarCurso = async (req, res) => {
  try {
    const curso = await Curso.obtenerActivoPorId(req.params.id);
    await curso.desactivar();
    logger.exito(`Curso eliminado: ${curso.nombre}`);
    res.json({ mensaje: 'Curso eliminado exitosamente' });
  } catch (error) {
    logger.error(`Error eliminando curso: ${error.message}`);
    responderError(res, error);
  }
};

module.exports = {
  listarCursos,
  obtenerCurso,
  crearCurso,
  actualizarCurso,
  eliminarCurso,
};
