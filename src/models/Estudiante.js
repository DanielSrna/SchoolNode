const mongoose = require('mongoose');
const { ErrorAPI, esErrorDuplicado } = require('../utils/ErrorAPI');

const estudianteSchema = new mongoose.Schema(
  {
    nombre: {
      type: String,
      required: [true, 'El nombre es obligatorio'],
      trim: true,
    },
    apellido: {
      type: String,
      required: [true, 'El apellido es obligatorio'],
      trim: true,
    },
    cedula: {
      type: String,
      required: [true, 'La cédula es obligatoria'],
      unique: true,
      trim: true,
      match: [/^\d+$/, 'La cédula solo debe contener números'],
    },
    email: {
      type: String,
      default: '',
      lowercase: true,
      trim: true,
      // Permite vacío (opcional) pero si tiene valor debe ser un email válido
      match: [/^$|^\S+@\S+\.\S+$/, 'Email no válido'],
    },
    telefono: {
      type: String,
      default: '',
    },
    fechaNacimiento: {
      type: Date,
      default: null,
    },
    direccion: {
      type: String,
      default: '',
    },
  },
  {
    timestamps: true,
  }
);

// ============================================================
// MÉTODOS DE INSTANCIA
// ============================================================

// Actualiza los datos del estudiante validando cédula única
estudianteSchema.methods.actualizarDatos = async function (datos) {
  if (datos.cedula && datos.cedula !== this.cedula) {
    const existe = await this.constructor.existeCedula(datos.cedula, this._id);
    if (existe) throw new ErrorAPI('Cédula ya registrada', 400);
  }
  Object.assign(this, datos);
  await this.save();
  return this;
};

// Elimina al estudiante solo si no tiene matrículas activas
estudianteSchema.methods.eliminar = async function () {
  const Matricula = mongoose.model('Matricula');
  const matriculasActivas = await Matricula.countDocuments({
    estudiante: this._id,
    estado: { $in: ['activa', 'vencida', 'moroso'] },
  });
  if (matriculasActivas > 0) {
    throw new ErrorAPI(
      'No se puede eliminar: el estudiante tiene matrículas activas o pendientes',
      400
    );
  }
  await this.constructor.findByIdAndDelete(this._id);
};

// ============================================================
// MÉTODOS ESTÁTICOS (funciones CRUD de la entidad en la DB)
// ============================================================

// Lista estudiantes con paginación y búsqueda opcional por cédula
estudianteSchema.statics.listar = async function ({ page = 1, limit = 10, cedula } = {}) {
  const pagina = parseInt(page) || 1;
  const porPagina = parseInt(limit) || 10;

  const filtro = {};
  if (cedula) {
    filtro.cedula = { $regex: cedula, $options: 'i' };
  }

  const [estudiantes, total] = await Promise.all([
    this.find(filtro)
      .skip((pagina - 1) * porPagina)
      .limit(porPagina)
      .sort({ createdAt: -1 }),
    this.countDocuments(filtro),
  ]);

  return {
    estudiantes,
    total,
    pages: Math.ceil(total / porPagina),
    currentPage: pagina,
  };
};

// Obtiene un estudiante por id o lanza 404
estudianteSchema.statics.obtenerPorId = async function (id) {
  const estudiante = await this.findById(id);
  if (!estudiante) throw new ErrorAPI('Estudiante no encontrado', 404);
  return estudiante;
};

// Indica si una cédula ya está registrada (excluyendo opcionalmente un id)
estudianteSchema.statics.existeCedula = async function (cedula, excluirId = null) {
  const filtro = { cedula };
  if (excluirId) filtro._id = { $ne: excluirId };
  const existe = await this.findOne(filtro);
  return Boolean(existe);
};

// Crea un estudiante validando que la cédula no esté repetida
estudianteSchema.statics.crearNuevo = async function (datos) {
  try {
    const existe = await this.existeCedula(datos.cedula);
    if (existe) throw new ErrorAPI('Cédula ya registrada', 400);

    const estudiante = new this(datos);
    await estudiante.save();
    return estudiante;
  } catch (error) {
    if (esErrorDuplicado(error)) throw new ErrorAPI('Cédula ya registrada', 400);
    throw error;
  }
};

module.exports = mongoose.model('Estudiante', estudianteSchema);
