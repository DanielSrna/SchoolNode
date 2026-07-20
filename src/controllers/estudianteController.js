const { validationResult } = require('express-validator');
const Estudiante = require('../models/Estudiante');
const logger = require('../utils/logger');

// GET /api/estudiantes
const listarEstudiantes = async (req, res) => {
  try {
    logger.proceso('Listando estudiantes');
    const { page = 1, limit = 10, cedula } = req.query;
    
    let query = {};
    if (cedula) {
      query.cedula = { $regex: cedula, $options: 'i' };
    }
    
    const estudiantes = await Estudiante.find(query)
      .skip((page - 1) * limit)
      .limit(parseInt(limit))
      .sort({ createdAt: -1 });
    
    const total = await Estudiante.countDocuments(query);
    
    res.json({
      estudiantes,
      total,
      pages: Math.ceil(total / limit),
      currentPage: parseInt(page),
    });
  } catch (error) {
    logger.error(`Error listando estudiantes: ${error.message}`);
    res.status(500).json({ error: 'Error en el servidor' });
  }
};

// GET /api/estudiantes/:id
const obtenerEstudiante = async (req, res) => {
  try {
    const estudiante = await Estudiante.findById(req.params.id);
    if (!estudiante) {
      logger.error(`Estudiante no encontrado: ${req.params.id}`);
      return res.status(404).json({ error: 'Estudiante no encontrado' });
    }
    res.json(estudiante);
  } catch (error) {
    logger.error(`Error obteniendo estudiante: ${error.message}`);
    res.status(500).json({ error: 'Error en el servidor' });
  }
};

// POST /api/estudiantes
const crearEstudiante = async (req, res) => {
  try {
    const errores = validationResult(req);
    if (!errores.isEmpty()) {
      logger.error(`Validación fallida: ${JSON.stringify(errores.array())}`);
      return res.status(400).json({ errores: errores.array() });
    }

    const { cedula } = req.body;
    
    // Verificar si cédula ya existe
    const existe = await Estudiante.findOne({ cedula });
    if (existe) {
      logger.error(`Cédula ya registrada: ${cedula}`);
      return res.status(400).json({ error: 'Cédula ya registrada' });
    }

    const estudiante = new Estudiante(req.body);
    await estudiante.save();

    logger.exito(`Estudiante creado: ${cedula}`);
    res.status(201).json(estudiante);
  } catch (error) {
    logger.error(`Error creando estudiante: ${error.message}`);
    res.status(500).json({ error: 'Error en el servidor' });
  }
};

// PUT /api/estudiantes/:id
const actualizarEstudiante = async (req, res) => {
  try {
    const estudiante = await Estudiante.findById(req.params.id);
    if (!estudiante) {
      logger.error(`Estudiante no encontrado: ${req.params.id}`);
      return res.status(404).json({ error: 'Estudiante no encontrado' });
    }

    const { cedula } = req.body;
    if (cedula) {
      // Verificar si nueva cédula ya existe
      const existe = await Estudiante.findOne({ cedula, _id: { $ne: req.params.id } });
      if (existe) {
        logger.error(`Cédula ya registrada: ${cedula}`);
        return res.status(400).json({ error: 'Cédula ya registrada' });
      }
    }

    Object.assign(estudiante, req.body);
    await estudiante.save();

    logger.exito(`Estudiante actualizado: ${estudiante.cedula}`);
    res.json(estudiante);
  } catch (error) {
    logger.error(`Error actualizando estudiante: ${error.message}`);
    res.status(500).json({ error: 'Error en el servidor' });
  }
};

// DELETE /api/estudiantes/:id
const eliminarEstudiante = async (req, res) => {
  try {
    const estudiante = await Estudiante.findById(req.params.id);
    if (!estudiante) {
      logger.error(`Estudiante no encontrado: ${req.params.id}`);
      return res.status(404).json({ error: 'Estudiante no encontrado' });
    }

    await Estudiante.findByIdAndDelete(req.params.id);

    logger.exito(`Estudiante eliminado: ${estudiante.cedula}`);
    res.json({ mensaje: 'Estudiante eliminado exitosamente' });
  } catch (error) {
    logger.error(`Error eliminando estudiante: ${error.message}`);
    res.status(500).json({ error: 'Error en el servidor' });
  }
};

module.exports = {
  listarEstudiantes,
  obtenerEstudiante,
  crearEstudiante,
  actualizarEstudiante,
  eliminarEstudiante,
};
