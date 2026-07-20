const { validationResult } = require('express-validator');
const Aula = require('../models/Aula');
const Matricula = require('../models/Matricula');
const logger = require('../utils/logger');

// GET /api/aulas
const listarAulas = async (req, res) => {
  try {
    logger.proceso('Listando aulas');
    const aulas = await Aula.find({ activo: true });
    
    // Calcular población actual para cada aula
    const aulasConPoblacion = await Promise.all(
      aulas.map(async (aula) => {
        const poblacion = await aula.obtenerPoblacionActual();
        return {
          ...aula.toObject(),
          poblacionActual: poblacion,
        };
      })
    );
    
    res.json(aulasConPoblacion);
  } catch (error) {
    logger.error(`Error listando aulas: ${error.message}`);
    res.status(500).json({ error: 'Error en el servidor' });
  }
};

// GET /api/aulas/:id
const obtenerAula = async (req, res) => {
  try {
    const aula = await Aula.findById(req.params.id);
    if (!aula || !aula.activo) {
      logger.error(`Aula no encontrada: ${req.params.id}`);
      return res.status(404).json({ error: 'Aula no encontrada' });
    }

    const poblacion = await aula.obtenerPoblacionActual();
    res.json({
      ...aula.toObject(),
      poblacionActual: poblacion,
    });
  } catch (error) {
    logger.error(`Error obteniendo aula: ${error.message}`);
    res.status(500).json({ error: 'Error en el servidor' });
  }
};

// POST /api/aulas
const crearAula = async (req, res) => {
  try {
    const errores = validationResult(req);
    if (!errores.isEmpty()) {
      logger.error(`Validación fallida: ${JSON.stringify(errores.array())}`);
      return res.status(400).json({ errores: errores.array() });
    }

    const aula = new Aula(req.body);
    await aula.save();

    logger.exito(`Aula creada: ${aula.numero}`);
    res.status(201).json(aula);
  } catch (error) {
    logger.error(`Error creando aula: ${error.message}`);
    res.status(500).json({ error: 'Error en el servidor' });
  }
};

// PUT /api/aulas/:id
const actualizarAula = async (req, res) => {
  try {
    const aula = await Aula.findById(req.params.id);
    if (!aula || !aula.activo) {
      logger.error(`Aula no encontrada: ${req.params.id}`);
      return res.status(404).json({ error: 'Aula no encontrada' });
    }

    Object.assign(aula, req.body);
    await aula.save();

    logger.exito(`Aula actualizada: ${aula.numero}`);
    res.json(aula);
  } catch (error) {
    logger.error(`Error actualizando aula: ${error.message}`);
    res.status(500).json({ error: 'Error en el servidor' });
  }
};

// DELETE /api/aulas/:id
const eliminarAula = async (req, res) => {
  try {
    const aula = await Aula.findById(req.params.id);
    if (!aula) {
      logger.error(`Aula no encontrada: ${req.params.id}`);
      return res.status(404).json({ error: 'Aula no encontrada' });
    }

    aula.activo = false;
    await aula.save();

    logger.exito(`Aula eliminada: ${aula.numero}`);
    res.json({ mensaje: 'Aula eliminada exitosamente' });
  } catch (error) {
    logger.error(`Error eliminando aula: ${error.message}`);
    res.status(500).json({ error: 'Error en el servidor' });
  }
};

module.exports = {
  listarAulas,
  obtenerAula,
  crearAula,
  actualizarAula,
  eliminarAula,
};
