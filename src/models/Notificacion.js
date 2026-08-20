const mongoose = require('mongoose');

// Notificación interna entre usuarios del sistema
// (empleado → administrador). Vive solo dentro de la plataforma.
const notificacionSchema = new mongoose.Schema(
  {
    remitente: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'El remitente es obligatorio'],
    },
    destinatario: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'El destinatario es obligatorio'],
    },
    asunto: {
      type: String,
      required: [true, 'El asunto es obligatorio'],
      trim: true,
      maxlength: [100, 'El asunto no puede superar 100 caracteres'],
    },
    mensaje: {
      type: String,
      required: [true, 'El mensaje es obligatorio'],
      trim: true,
      maxlength: [500, 'El mensaje no puede superar 500 caracteres'],
    },
    leida: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  }
);

// Marca la notificación como leída si el usuario es el destinatario
notificacionSchema.methods.marcarLeida = async function (usuarioId) {
  if (String(this.destinatario) !== String(usuarioId)) {
    const { ErrorAPI } = require('../utils/ErrorAPI');
    throw new ErrorAPI('Solo el destinatario puede marcar la notificación como leída', 403);
  }
  this.leida = true;
  await this.save();
  return this;
};

// Cuenta las no leídas de un usuario
notificacionSchema.statics.contarNoLeidas = function (usuarioId) {
  return this.countDocuments({ destinatario: usuarioId, leida: false });
};

module.exports = mongoose.model('Notificacion', notificacionSchema);
