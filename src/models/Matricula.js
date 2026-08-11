const mongoose = require('mongoose');
const { ErrorAPI } = require('../utils/ErrorAPI');

const matriculaSchema = new mongoose.Schema(
  {
    estudiante: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Estudiante',
      required: [true, 'El estudiante es obligatorio'],
    },
    curso: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Curso',
      required: [true, 'El curso es obligatorio'],
    },
    aula: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Aula',
      required: [true, 'El aula es obligatoria'],
    },
    fechaInicio: {
      type: Date,
      default: Date.now,
    },
    fechaVencimiento: {
      type: Date,
      default: function () {
        const fecha = new Date();
        fecha.setDate(fecha.getDate() + 7);
        return fecha;
      },
    },
    estado: {
      type: String,
      enum: {
        values: ['activa', 'vencida', 'moroso', 'cancelada'],
        message: 'Estado no válido: {VALUE}',
      },
      default: 'activa',
    },
    pagos: [
      {
        monto: {
          type: Number,
          required: [true, 'El monto del pago es obligatorio'],
          min: [0, 'El monto no puede ser negativo'],
        },
        fecha: {
          type: Date,
          default: Date.now,
        },
        metodo: {
          type: String,
          enum: {
            values: ['fisico', 'stripe'],
            message: 'Método de pago no válido: {VALUE}',
          },
          required: [true, 'El método de pago es obligatorio'],
        },
        stripePaymentId: {
          type: String,
          default: null,
        },
      },
    ],
    totalPagado: {
      type: Number,
      default: 0,
    },
    saldoPendiente: {
      type: Number,
      default: 0,
    },
  },
  {
    timestamps: true,
  }
);

// Índice compuesto para evitar matrículas duplicadas (mismo estudiante + mismo curso)
matriculaSchema.index({ estudiante: 1, curso: 1 }, { unique: true });

// ============================================================
// HOOKS
// ============================================================

// Pre-save: calcular saldo pendiente a partir del precio del curso
matriculaSchema.pre('save', async function (next) {
  if (this.isNew) {
    // En creación, saldo = precio del curso
    const curso = await mongoose.model('Curso').findById(this.curso);
    if (curso) {
      this.saldoPendiente = curso.precio;
    }
  } else {
    // En actualización, recalcular siempre desde totalPagado
    const curso = await mongoose.model('Curso').findById(this.curso);
    if (curso) {
      this.saldoPendiente = Math.max(0, curso.precio - (this.totalPagado || 0));
    }
  }
  next();
});

// ============================================================
// MÉTODOS DE INSTANCIA (acciones sobre una matrícula concreta)
// ============================================================

// Agrega un pago y recalcula totalPagado, saldoPendiente y estado
matriculaSchema.methods.agregarPago = async function (monto, metodo, stripePaymentId = null) {
  this.pagos.push({
    monto,
    metodo,
    stripePaymentId,
  });

  // Sumar al total pagado
  this.totalPagado = (this.totalPagado || 0) + monto;

  // Recalcular saldo desde el precio del curso (NO resta sucesiva)
  const curso = await mongoose.model('Curso').findById(this.curso);
  if (curso && curso.precio > 0) {
    this.saldoPendiente = Math.max(0, curso.precio - this.totalPagado);
  } else {
    this.saldoPendiente = 0;
  }

  // Si ya no debe nada, queda activa
  if (this.saldoPendiente === 0) {
    this.estado = 'activa';
  }

  await this.save();
  return this;
};

// Recalcula totalPagado y saldoPendiente sumando el array de pagos
matriculaSchema.methods.recalcularTotales = async function () {
  this.totalPagado = this.pagos.reduce((sum, p) => sum + (p.monto || 0), 0);

  const curso = await mongoose.model('Curso').findById(this.curso);
  if (curso) {
    this.saldoPendiente = Math.max(0, curso.precio - this.totalPagado);
  }

  return this;
};

// Si pasó la fecha de vencimiento y aún hay saldo, pasa a estado "moroso"
matriculaSchema.methods.verificarVencimiento = function () {
  const hoy = new Date();
  if (hoy > this.fechaVencimiento && this.saldoPendiente > 0) {
    this.estado = 'moroso';
    return true;
  }
  return false;
};

// Cambia el estado validando que sea uno de los permitidos
matriculaSchema.methods.cambiarEstado = async function (estado) {
  const estadosValidos = ['activa', 'vencida', 'moroso', 'cancelada'];
  if (!estadosValidos.includes(estado)) {
    throw new ErrorAPI(`Estado no válido. Permitidos: ${estadosValidos.join(', ')}`, 400);
  }
  this.estado = estado;
  await this.save();
  return this;
};

// Cancela la matrícula (borrado lógico por estado)
matriculaSchema.methods.cancelar = async function () {
  this.estado = 'cancelada';
  await this.save();
  return this;
};

// ============================================================
// MÉTODOS ESTÁTICOS (funciones CRUD de la entidad en la DB)
// ============================================================

// Lista todas las matrículas con sus relaciones y actualiza vencimientos
matriculaSchema.statics.listarConDetalles = async function () {
  const matriculas = await this.find()
    .populate('estudiante', 'nombre apellido cedula')
    .populate('curso', 'nombre precio')
    .populate('aula', 'numero capacidad')
    .sort({ createdAt: -1 });

  // Verificar vencimiento de cada matrícula (semaforización automática)
  return await Promise.all(
    matriculas.map(async (matricula) => {
      matricula.verificarVencimiento();
      await matricula.save();
      return matricula;
    })
  );
};

// Obtiene una matrícula con todas sus relaciones completas, o lanza 404
matriculaSchema.statics.obtenerDetallePorId = async function (id) {
  const matricula = await this.findById(id)
    .populate('estudiante')
    .populate('curso')
    .populate('aula');

  if (!matricula) throw new ErrorAPI('Matrícula no encontrada', 404);
  return matricula;
};

// Crea una matrícula aplicando las reglas de negocio:
// 1. El estudiante debe existir.
// 2. El curso debe existir y estar activo.
// 3. El estudiante no debe tener otra matrícula activa.
// 4. El aula debe existir, estar activa y tener cupo disponible.
matriculaSchema.statics.crearNueva = async function ({ estudianteId, cursoId, aulaId }) {
  const Estudiante = mongoose.model('Estudiante');
  const Curso = mongoose.model('Curso');
  const Aula = mongoose.model('Aula');

  const estudiante = await Estudiante.findById(estudianteId);
  if (!estudiante) throw new ErrorAPI('Estudiante no encontrado', 404);

  const curso = await Curso.findById(cursoId);
  if (!curso || !curso.activo) throw new ErrorAPI('Curso no encontrado', 404);

  const matriculaExistente = await this.findOne({
    estudiante: estudianteId,
    estado: { $in: ['activa'] },
  });
  if (matriculaExistente) {
    throw new ErrorAPI('El estudiante ya tiene una matrícula activa', 400);
  }

  const aula = await Aula.findById(aulaId);
  if (!aula || !aula.activo) throw new ErrorAPI('Aula no encontrada', 404);

  const cupoDisponible = await aula.tieneCupoDisponible();
  if (!cupoDisponible) throw new ErrorAPI('El aula está llena', 400);

  const matricula = new this({
    estudiante: estudianteId,
    curso: cursoId,
    aula: aulaId,
  });
  await matricula.save();
  return matricula;
};

// Migra una matrícula a otra aula validando cupo del aula destino
matriculaSchema.statics.migrarAula = async function (matriculaId, nuevoAulaId) {
  const Aula = mongoose.model('Aula');

  const matricula = await this.findById(matriculaId);
  if (!matricula) throw new ErrorAPI('Matrícula no encontrada', 404);

  const nuevoAula = await Aula.findById(nuevoAulaId);
  if (!nuevoAula || !nuevoAula.activo) throw new ErrorAPI('Aula destino no encontrada', 404);

  const cupoDisponible = await nuevoAula.tieneCupoDisponible();
  if (!cupoDisponible) throw new ErrorAPI('El aula destino está llena', 400);

  matricula.aula = nuevoAulaId;
  await matricula.save();
  return matricula;
};

module.exports = mongoose.model('Matricula', matriculaSchema);
