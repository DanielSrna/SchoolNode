const mongoose = require('mongoose');
const { ErrorAPI, esErrorDuplicado } = require('../utils/ErrorAPI');

const aulaSchema = new mongoose.Schema(
  {
    numero: {
      type: String,
      required: [true, 'El número de aula es obligatorio'],
      unique: true,
      trim: true,
    },
    capacidad: {
      type: Number,
      required: [true, 'La capacidad es obligatoria'],
      min: [1, 'La capacidad mínima es 1'],
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

// ============================================================
// MÉTODOS DE INSTANCIA
// ============================================================

// Cuenta las matrículas activas de esta aula (población en tiempo real)
aulaSchema.methods.obtenerPoblacionActual = async function () {
  const Matricula = mongoose.model('Matricula');
  return await Matricula.countDocuments({
    aula: this._id,
    estado: { $in: ['activa'] },
  });
};

// Indica si el aula tiene cupo disponible
aulaSchema.methods.tieneCupoDisponible = async function () {
  const poblacion = await this.obtenerPoblacionActual();
  return poblacion < this.capacidad;
};

// Actualiza los datos del aula
aulaSchema.methods.actualizarDatos = async function (datos) {
  try {
    Object.assign(this, datos);
    await this.save();
    return this;
  } catch (error) {
    if (esErrorDuplicado(error)) {
      throw new ErrorAPI('Ya existe un aula con ese número', 400);
    }
    throw error;
  }
};

// Borrado lógico: desactiva el aula sin eliminar el documento
aulaSchema.methods.desactivar = async function () {
  this.activo = false;
  await this.save();
  return this;
};

// ============================================================
// MÉTODOS ESTÁTICOS (funciones CRUD de la entidad en la DB)
// ============================================================

// Lista las aulas activas con su población actual calculada
aulaSchema.statics.listarActivasConPoblacion = async function () {
  const aulas = await this.find({ activo: true });
  return await Promise.all(
    aulas.map(async (aula) => ({
      ...aula.toObject(),
      poblacionActual: await aula.obtenerPoblacionActual(),
    }))
  );
};

// Obtiene un aula activa por id con su población actual, o lanza 404
aulaSchema.statics.obtenerActivaConPoblacion = async function (id) {
  const aula = await this.obtenerActivaPorId(id);
  return {
    ...aula.toObject(),
    poblacionActual: await aula.obtenerPoblacionActual(),
  };
};

// Obtiene un aula activa por id (documento mongoose) o lanza 404
aulaSchema.statics.obtenerActivaPorId = async function (id) {
  const aula = await this.findById(id);
  if (!aula || !aula.activo) throw new ErrorAPI('Aula no encontrada', 404);
  return aula;
};

// Crea un aula validando que el número no esté repetido
aulaSchema.statics.crearNueva = async function (datos) {
  try {
    const aula = new this(datos);
    await aula.save();
    return aula;
  } catch (error) {
    if (esErrorDuplicado(error)) {
      throw new ErrorAPI('Ya existe un aula con ese número', 400);
    }
    throw error;
  }
};

module.exports = mongoose.model('Aula', aulaSchema);
