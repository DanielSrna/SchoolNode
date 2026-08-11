const mongoose = require('mongoose');
const { ErrorAPI } = require('../utils/ErrorAPI');

const cursoSchema = new mongoose.Schema(
  {
    nombre: {
      type: String,
      required: [true, 'El nombre es obligatorio'],
      trim: true,
    },
    descripcion: {
      type: String,
      default: '',
    },
    precio: {
      type: Number,
      required: [true, 'El precio es obligatorio'],
      min: [0, 'El precio no puede ser negativo'],
    },
    duracion: {
      type: String,
      required: [true, 'La duración es obligatoria'],
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

// Actualiza los datos del curso
cursoSchema.methods.actualizarDatos = async function (datos) {
  Object.assign(this, datos);
  await this.save();
  return this;
};

// Borrado lógico: desactiva el curso sin eliminar el documento
cursoSchema.methods.desactivar = async function () {
  this.activo = false;
  await this.save();
  return this;
};

// ============================================================
// MÉTODOS ESTÁTICOS (funciones CRUD de la entidad en la DB)
// ============================================================

// Lista solo los cursos activos
cursoSchema.statics.listarActivos = function () {
  return this.find({ activo: true });
};

// Obtiene un curso activo por id o lanza 404
cursoSchema.statics.obtenerActivoPorId = async function (id) {
  const curso = await this.findById(id);
  if (!curso || !curso.activo) throw new ErrorAPI('Curso no encontrado', 404);
  return curso;
};

// Crea un curso nuevo
cursoSchema.statics.crearNuevo = async function (datos) {
  const curso = new this(datos);
  await curso.save();
  return curso;
};

module.exports = mongoose.model('Curso', cursoSchema);
