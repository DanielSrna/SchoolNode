const mongoose = require('mongoose');

const matriculaSchema = new mongoose.Schema(
  {
    estudiante: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Estudiante',
      required: true,
    },
    curso: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Curso',
      required: true,
    },
    aula: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Aula',
      required: true,
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
      enum: ['activa', 'vencida', 'moroso', 'cancelada'],
      default: 'activa',
    },
    pagos: [
      {
        monto: {
          type: Number,
          required: true,
          min: 0,
        },
        fecha: {
          type: Date,
          default: Date.now,
        },
        metodo: {
          type: String,
          enum: ['fisico', 'stripe'],
          required: true,
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

// Índice compuesto para evitar matrículas duplicadas
matriculaSchema.index({ estudiante: 1, curso: 1 }, { unique: true });

// Pre-save: calcular saldo pendiente correctamente
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

// Método para agregar pago
matriculaSchema.methods.agregarPago = async function (monto, metodo, stripePaymentId = null) {
  this.pagos.push({
    monto,
    metodo,
    stripePaymentId,
  });

  // Sumar al total pagado
  this.totalPagado = (this.totalPagado || 0) + monto;

  // Recalcular saldo desde el precio del curso (NO resta sucesiva)
  // Si el precio es 0 o no existe, el saldo es 0
  const curso = await mongoose.model('Curso').findById(this.curso);
  if (curso && curso.precio > 0) {
    this.saldoPendiente = Math.max(0, curso.precio - this.totalPagado);
  } else {
    this.saldoPendiente = 0;
  }

  // Actualizar estado según pagos
  if (this.saldoPendiente === 0) {
    this.estado = 'activa';
  }

  await this.save();
  return this;
};

// Método para recalcular totales desde los pagos
matriculaSchema.methods.recalcularTotales = async function () {
  // Sumar todos los pagos
  this.totalPagado = this.pagos.reduce((sum, p) => sum + (p.monto || 0), 0);

  // Recalcular saldo desde el precio del curso
  const curso = await mongoose.model('Curso').findById(this.curso);
  if (curso) {
    this.saldoPendiente = Math.max(0, curso.precio - this.totalPagado);
  }

  return this;
};

// Método para verificar vencimiento
matriculaSchema.methods.verificarVencimiento = function () {
  const hoy = new Date();
  if (hoy > this.fechaVencimiento && this.saldoPendiente > 0) {
    this.estado = 'moroso';
    return true;
  }
  return false;
};

module.exports = mongoose.model('Matricula', matriculaSchema);
