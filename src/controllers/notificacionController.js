const Notificacion = require('../models/Notificacion');
const User = require('../models/User');
const { responderError, ErrorAPI } = require('../utils/ErrorAPI');
const logger = require('../utils/logger');

// Controlador de notificaciones internas (empleado → administrador).
// Las notificaciones viven solo dentro de la plataforma, no se envían por correo.

// POST /api/notificaciones - Crea una notificación para los administradores.
// Solo los EMPLEADOS envían notificaciones (los admins son los destinatarios).
const crearNotificacion = async (req, res) => {
  try {
    if (req.usuario.rol !== 'empleado') {
      throw new ErrorAPI('Solo los empleados pueden crear notificaciones', 403);
    }

    const { asunto, mensaje } = req.body;

    // Los administradores activos son los destinatarios
    const admins = await User.find({ rol: 'admin', activo: true }).select('_id');
    if (admins.length === 0) {
      throw new ErrorAPI('No hay administradores activos para recibir la notificación', 400);
    }

    const creadas = await Notificacion.insertMany(
      admins.map((admin) => ({
        remitente: req.usuario._id,
        destinatario: admin._id,
        asunto,
        mensaje,
      }))
    );

    logger.exito(`Notificación creada por ${req.usuario.email} para ${admins.length} admin(s)`);
    res.status(201).json({ creadas: creadas.length, notificaciones: creadas });
  } catch (error) {
    logger.error(`Error creando notificación: ${error.message}`);
    responderError(res, error);
  }
};

// GET /api/notificaciones - Lista según el rol:
// admin → las que recibió; empleado → las que envió
const listarNotificaciones = async (req, res) => {
  try {
    const filtro =
      req.usuario.rol === 'admin'
        ? { destinatario: req.usuario._id }
        : { remitente: req.usuario._id };

    const notificaciones = await Notificacion.find(filtro)
      .populate('remitente', 'nombre email rol')
      .populate('destinatario', 'nombre email rol')
      .sort({ createdAt: -1 });

    res.json(notificaciones);
  } catch (error) {
    logger.error(`Error listando notificaciones: ${error.message}`);
    responderError(res, error);
  }
};

// GET /api/notificaciones/no-leidas - Contador para la campana
const contarNoLeidas = async (req, res) => {
  try {
    const total = await Notificacion.contarNoLeidas(req.usuario._id);
    res.json({ total });
  } catch (error) {
    logger.error(`Error contando notificaciones: ${error.message}`);
    responderError(res, error);
  }
};

// PATCH /api/notificaciones/:id/leida - Marca como leída (solo el destinatario)
const marcarLeida = async (req, res) => {
  try {
    const notificacion = await Notificacion.findById(req.params.id);
    if (!notificacion) throw new ErrorAPI('Notificación no encontrada', 404);

    await notificacion.marcarLeida(req.usuario._id);
    res.json(notificacion);
  } catch (error) {
    logger.error(`Error marcando notificación: ${error.message}`);
    responderError(res, error);
  }
};

module.exports = {
  crearNotificacion,
  listarNotificaciones,
  contarNoLeidas,
  marcarLeida,
};
