const Matricula = require('../models/Matricula');
const { responderError } = require('../utils/ErrorAPI');
const logger = require('../utils/logger');

// Controlador de matrículas: SOLO orquesta.
// Las reglas de negocio (cupo, duplicados, estados) viven en el modelo Matricula.

// GET /api/matriculas
const listarMatriculas = async (req, res) => {
  try {
    logger.proceso('Listando matrículas');
    const matriculas = await Matricula.listarConDetalles();
    res.json(matriculas);
  } catch (error) {
    logger.error(`Error listando matrículas: ${error.message}`);
    responderError(res, error);
  }
};

// GET /api/matriculas/:id
const obtenerMatricula = async (req, res) => {
  try {
    const matricula = await Matricula.obtenerDetallePorId(req.params.id);
    res.json(matricula);
  } catch (error) {
    logger.error(`Error obteniendo matrícula: ${error.message}`);
    responderError(res, error);
  }
};

// POST /api/matriculas
const crearMatricula = async (req, res) => {
  try {
    const matricula = await Matricula.crearNueva(req.body);
    logger.exito(`Matrícula creada: ${matricula._id}`);
    res.status(201).json(matricula);
  } catch (error) {
    logger.error(`Error creando matrícula: ${error.message}`);
    responderError(res, error);
  }
};

// PUT /api/matriculas/:id
const actualizarMatricula = async (req, res) => {
  try {
    const matricula = await Matricula.obtenerDetallePorId(req.params.id);
    if (req.body.estado) {
      await matricula.cambiarEstado(req.body.estado);
    }
    logger.exito(`Matrícula actualizada: ${matricula._id}`);
    res.json(matricula);
  } catch (error) {
    logger.error(`Error actualizando matrícula: ${error.message}`);
    responderError(res, error);
  }
};

// DELETE /api/matriculas/:id
const eliminarMatricula = async (req, res) => {
  try {
    const matricula = await Matricula.obtenerDetallePorId(req.params.id);
    await matricula.cancelar();
    logger.exito(`Matrícula cancelada: ${matricula._id}`);
    res.json({ mensaje: 'Matrícula cancelada exitosamente' });
  } catch (error) {
    logger.error(`Error eliminando matrícula: ${error.message}`);
    responderError(res, error);
  }
};

// POST /api/matriculas/migrar
const migrarEstudiante = async (req, res) => {
  try {
    const { matriculaId, nuevoAulaId } = req.body;
    const matricula = await Matricula.migrarAula(matriculaId, nuevoAulaId);
    logger.exito(`Estudiante migrado: ${matriculaId} -> ${nuevoAulaId}`);
    res.json(matricula);
  } catch (error) {
    logger.error(`Error migrando estudiante: ${error.message}`);
    responderError(res, error);
  }
};

// POST /api/matriculas/:id/notificar
const notificarPago = async (req, res) => {
  try {
    const pagoService = require('../services/pagoService');
    const resultado = await pagoService.enviarRecordatorioPago(req.params.id);
    logger.exito(`Recordatorio enviado para matrícula ${req.params.id}`);
    res.json(resultado);
  } catch (error) {
    logger.error(`Error enviando recordatorio: ${error.message}`);
    responderError(res, error);
  }
};

module.exports = {
  listarMatriculas,
  obtenerMatricula,
  crearMatricula,
  actualizarMatricula,
  eliminarMatricula,
  migrarEstudiante,
  notificarPago,
};
