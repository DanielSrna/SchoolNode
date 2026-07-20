const { validationResult } = require('express-validator');
const Matricula = require('../models/Matricula');
const Estudiante = require('../models/Estudiante');
const Curso = require('../models/Curso');
const Aula = require('../models/Aula');
const logger = require('../utils/logger');

// GET /api/matriculas
const listarMatriculas = async (req, res) => {
  try {
    logger.proceso('Listando matrículas');
    const matriculas = await Matricula.find()
      .populate('estudiante', 'nombre apellido cedula')
      .populate('curso', 'nombre precio')
      .populate('aula', 'numero capacidad')
      .sort({ createdAt: -1 });

    // Verificar vencimiento de cada matrícula
    const matriculasActualizadas = await Promise.all(
      matriculas.map(async (matricula) => {
        matricula.verificarVencimiento();
        await matricula.save();
        return matricula;
      })
    );

    res.json(matriculasActualizadas);
  } catch (error) {
    logger.error(`Error listando matrículas: ${error.message}`);
    res.status(500).json({ error: 'Error en el servidor' });
  }
};

// GET /api/matriculas/:id
const obtenerMatricula = async (req, res) => {
  try {
    const matricula = await Matricula.findById(req.params.id)
      .populate('estudiante')
      .populate('curso')
      .populate('aula');

    if (!matricula) {
      logger.error(`Matrícula no encontrada: ${req.params.id}`);
      return res.status(404).json({ error: 'Matrícula no encontrada' });
    }

    res.json(matricula);
  } catch (error) {
    logger.error(`Error obteniendo matrícula: ${error.message}`);
    res.status(500).json({ error: 'Error en el servidor' });
  }
};

// POST /api/matriculas
const crearMatricula = async (req, res) => {
  try {
    const errores = validationResult(req);
    if (!errores.isEmpty()) {
      logger.error(`Validación fallida: ${JSON.stringify(errores.array())}`);
      return res.status(400).json({ errores: errores.array() });
    }

    const { estudianteId, cursoId, aulaId } = req.body;

    // Verificar que estudiante no esté ya matriculado en otro curso
    const matriculaExistente = await Matricula.findOne({
      estudiante: estudianteId,
      estado: { $in: ['activa'] },
    });

    if (matriculaExistente) {
      logger.error(`Estudiante ya matriculado: ${estudianteId}`);
      return res.status(400).json({ error: 'El estudiante ya tiene una matrícula activa' });
    }

    // Verificar capacidad del aula
    const aula = await Aula.findById(aulaId);
    const poblacionActual = await aula.obtenerPoblacionActual();
    if (poblacionActual >= aula.capacidad) {
      logger.error(`Aula llena: ${aulaId}`);
      return res.status(400).json({ error: 'El aula está llena' });
    }

    // Crear matrícula
    const matricula = new Matricula({
      estudiante: estudianteId,
      curso: cursoId,
      aula: aulaId,
    });

    await matricula.save();

    logger.exito(`Matrícula creada: ${matricula._id}`);
    res.status(201).json(matricula);
  } catch (error) {
    logger.error(`Error creando matrícula: ${error.message}`);
    res.status(500).json({ error: 'Error en el servidor' });
  }
};

// PUT /api/matriculas/:id
const actualizarMatricula = async (req, res) => {
  try {
    const matricula = await Matricula.findById(req.params.id);
    if (!matricula) {
      logger.error(`Matrícula no encontrada: ${req.params.id}`);
      return res.status(404).json({ error: 'Matrícula no encontrada' });
    }

    const { estado } = req.body;
    if (estado) {
      matricula.estado = estado;
    }

    await matricula.save();

    logger.exito(`Matrícula actualizada: ${matricula._id}`);
    res.json(matricula);
  } catch (error) {
    logger.error(`Error actualizando matrícula: ${error.message}`);
    res.status(500).json({ error: 'Error en el servidor' });
  }
};

// DELETE /api/matriculas/:id
const eliminarMatricula = async (req, res) => {
  try {
    const matricula = await Matricula.findById(req.params.id);
    if (!matricula) {
      logger.error(`Matrícula no encontrada: ${req.params.id}`);
      return res.status(404).json({ error: 'Matrícula no encontrada' });
    }

    matricula.estado = 'cancelada';
    await matricula.save();

    logger.exito(`Matrícula cancelada: ${matricula._id}`);
    res.json({ mensaje: 'Matrícula cancelada exitosamente' });
  } catch (error) {
    logger.error(`Error eliminando matrícula: ${error.message}`);
    res.status(500).json({ error: 'Error en el servidor' });
  }
};

// POST /api/matriculas/migrar
const migrarEstudiante = async (req, res) => {
  try {
    const { matriculaId, nuevoAulaId } = req.body;

    const matricula = await Matricula.findById(matriculaId);
    if (!matricula) {
      logger.error(`Matrícula no encontrada: ${matriculaId}`);
      return res.status(404).json({ error: 'Matrícula no encontrada' });
    }

    // Verificar capacidad del nuevo aula
    const nuevoAula = await Aula.findById(nuevoAulaId);
    const poblacionActual = await nuevoAula.obtenerPoblacionActual();
    if (poblacionActual >= nuevoAula.capacidad) {
      logger.error(`Nuevo aula llena: ${nuevoAulaId}`);
      return res.status(400).json({ error: 'El aula destino está llena' });
    }

    // Migrar
    matricula.aula = nuevoAulaId;
    await matricula.save();

    logger.exito(`Estudiante migrado: ${matriculaId} -> ${nuevoAulaId}`);
    res.json(matricula);
  } catch (error) {
    logger.error(`Error migrando estudiante: ${error.message}`);
    res.status(500).json({ error: 'Error en el servidor' });
  }
};

module.exports = {
  listarMatriculas,
  obtenerMatricula,
  crearMatricula,
  actualizarMatricula,
  eliminarMatricula,
  migrarEstudiante,
};
