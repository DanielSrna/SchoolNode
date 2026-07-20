const { validationResult } = require('express-validator');
const Curso = require('../models/Curso');
const logger = require('../utils/logger');

// GET /api/cursos
const listarCursos = async (req, res) => {
  try {
    logger.proceso('Listando cursos');
    const cursos = await Curso.find({ activo: true });
    res.json(cursos);
  } catch (error) {
    logger.error(`Error listando cursos: ${error.message}`);
    res.status(500).json({ error: 'Error en el servidor' });
  }
};

// GET /api/cursos/:id
const obtenerCurso = async (req, res) => {
  try {
    const curso = await Curso.findById(req.params.id);
    if (!curso || !curso.activo) {
      logger.error(`Curso no encontrado: ${req.params.id}`);
      return res.status(404).json({ error: 'Curso no encontrado' });
    }
    res.json(curso);
  } catch (error) {
    logger.error(`Error obteniendo curso: ${error.message}`);
    res.status(500).json({ error: 'Error en el servidor' });
  }
};

// POST /api/cursos
const crearCurso = async (req, res) => {
  try {
    const errores = validationResult(req);
    if (!errores.isEmpty()) {
      logger.error(`Validación fallida: ${JSON.stringify(errores.array())}`);
      return res.status(400).json({ errores: errores.array() });
    }

    const curso = new Curso(req.body);
    await curso.save();

    logger.exito(`Curso creado: ${curso.nombre}`);
    res.status(201).json(curso);
  } catch (error) {
    logger.error(`Error creando curso: ${error.message}`);
    res.status(500).json({ error: 'Error en el servidor' });
  }
};

// PUT /api/cursos/:id
const actualizarCurso = async (req, res) => {
  try {
    const curso = await Curso.findById(req.params.id);
    if (!curso || !curso.activo) {
      logger.error(`Curso no encontrado: ${req.params.id}`);
      return res.status(404).json({ error: 'Curso no encontrado' });
    }

    Object.assign(curso, req.body);
    await curso.save();

    logger.exito(`Curso actualizado: ${curso.nombre}`);
    res.json(curso);
  } catch (error) {
    logger.error(`Error actualizando curso: ${error.message}`);
    res.status(500).json({ error: 'Error en el servidor' });
  }
};

// DELETE /api/cursos/:id
const eliminarCurso = async (req, res) => {
  try {
    const curso = await Curso.findById(req.params.id);
    if (!curso) {
      logger.error(`Curso no encontrado: ${req.params.id}`);
      return res.status(404).json({ error: 'Curso no encontrado' });
    }

    curso.activo = false;
    await curso.save();

    logger.exito(`Curso eliminado: ${curso.nombre}`);
    res.json({ mensaje: 'Curso eliminado exitosamente' });
  } catch (error) {
    logger.error(`Error eliminando curso: ${error.message}`);
    res.status(500).json({ error: 'Error en el servidor' });
  }
};

module.exports = {
  listarCursos,
  obtenerCurso,
  crearCurso,
  actualizarCurso,
  eliminarCurso,
};
