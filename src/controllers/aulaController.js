const Aula = require('../models/Aula');
const { responderError } = require('../utils/ErrorAPI');
const logger = require('../utils/logger');

// Controlador de aulas: SOLO orquesta.
// Todas las operaciones de datos viven en el modelo Aula.

// GET /api/aulas
const listarAulas = async (req, res) => {
  try {
    logger.proceso('Listando aulas');
    const aulas = await Aula.listarActivasConPoblacion();
    res.json(aulas);
  } catch (error) {
    logger.error(`Error listando aulas: ${error.message}`);
    responderError(res, error);
  }
};

// GET /api/aulas/:id
const obtenerAula = async (req, res) => {
  try {
    const aula = await Aula.obtenerActivaConPoblacion(req.params.id);
    res.json(aula);
  } catch (error) {
    logger.error(`Error obteniendo aula: ${error.message}`);
    responderError(res, error);
  }
};

// POST /api/aulas
const crearAula = async (req, res) => {
  try {
    const aula = await Aula.crearNueva(req.body);
    logger.exito(`Aula creada: ${aula.numero}`);
    res.status(201).json(aula);
  } catch (error) {
    logger.error(`Error creando aula: ${error.message}`);
    responderError(res, error);
  }
};

// PUT /api/aulas/:id
const actualizarAula = async (req, res) => {
  try {
    const aula = await Aula.obtenerActivaPorId(req.params.id);
    await aula.actualizarDatos(req.body);
    logger.exito(`Aula actualizada: ${aula.numero}`);
    res.json(aula);
  } catch (error) {
    logger.error(`Error actualizando aula: ${error.message}`);
    responderError(res, error);
  }
};

// DELETE /api/aulas/:id
const eliminarAula = async (req, res) => {
  try {
    const aula = await Aula.obtenerActivaPorId(req.params.id);
    await aula.desactivar();
    logger.exito(`Aula eliminada: ${aula.numero}`);
    res.json({ mensaje: 'Aula eliminada exitosamente' });
  } catch (error) {
    logger.error(`Error eliminando aula: ${error.message}`);
    responderError(res, error);
  }
};

module.exports = {
  listarAulas,
  obtenerAula,
  crearAula,
  actualizarAula,
  eliminarAula,
};
