const mongoose = require('mongoose');

const aulaSchema = new mongoose.Schema(
  {
    numero: {
      type: String,
      required: true,
      trim: true,
    },
    capacidad: {
      type: Number,
      required: true,
      min: 1,
    },
    ubicacion: {
      type: String,
      default: '',
    },
    activo: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
  }
);

// Método para obtener población actual
aulaSchema.methods.obtenerPoblacionActual = async function () {
  const Matricula = mongoose.model('Matricula');
  return await Matricula.countDocuments({
    aula: this._id,
    estado: { $in: ['activa'] },
  });
};

module.exports = mongoose.model('Aula', aulaSchema);
