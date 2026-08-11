const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const crypto = require('crypto');
const { ErrorAPI } = require('../utils/ErrorAPI');

// Token de un solo uso para confirmar acciones sensibles por email
// (cambio de correo de acceso, cambio de contraseña).
const tokenAccionSchema = new mongoose.Schema(
  {
    usuario: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    tipo: {
      type: String,
      enum: ['email', 'password'],
      required: true,
    },
    // Código de 6 dígitos hasheado con bcrypt (nunca se guarda en claro)
    codigoHash: {
      type: String,
      required: true,
    },
    // Valor del cambio pendiente:
    //  - tipo 'email': el nuevo correo en texto plano
    //  - tipo 'password': el hash bcrypt de la nueva contraseña
    valor: {
      type: String,
      required: true,
    },
    expira: {
      type: Date,
      required: true,
    },
    intentos: {
      type: Number,
      default: 0,
    },
  },
  {
    timestamps: true,
  }
);

const MAX_INTENTOS = 5;
const DURACION_MINUTOS = 10;

// ============================================================
// MÉTODOS DE INSTANCIA
// ============================================================

// Verifica el código ingresado. Lanza ErrorAPI si es incorrecto,
// expiró o se superaron los intentos. Incrementa el contador de intentos.
tokenAccionSchema.methods.verificarCodigo = async function (codigo) {
  if (this.expira < new Date()) {
    await this.deleteOne();
    throw new ErrorAPI('El código expiró. Solicita uno nuevo', 400);
  }

  if (this.intentos >= MAX_INTENTOS) {
    await this.deleteOne();
    throw new ErrorAPI('Demasiados intentos. Solicita un nuevo código', 400);
  }

  const coincide = await bcrypt.compare(String(codigo), this.codigoHash);
  if (!coincide) {
    this.intentos += 1;
    await this.save();
    throw new ErrorAPI(
      `Código incorrecto. Te quedan ${MAX_INTENTOS - this.intentos} intentos`,
      400
    );
  }

  return true;
};

// ============================================================
// MÉTODOS ESTÁTICOS
// ============================================================

// Genera un código de 6 dígitos para un usuario y un tipo de acción.
// Reemplaza cualquier solicitud anterior del mismo tipo (solo una activa).
// Devuelve { token, codigo } con el código en claro para enviarlo por correo.
tokenAccionSchema.statics.generar = async function (usuarioId, tipo, valor) {
  // Invalidar solicitudes anteriores del mismo usuario y tipo
  await this.deleteMany({ usuario: usuarioId, tipo });

  const codigo = crypto.randomInt(100000, 999999).toString();

  const token = new this({
    usuario: usuarioId,
    tipo,
    codigoHash: await bcrypt.hash(codigo, 10),
    valor,
    expira: new Date(Date.now() + DURACION_MINUTOS * 60 * 1000),
  });
  await token.save();

  return { token, codigo };
};

// Busca la solicitud activa de un usuario para un tipo de acción
tokenAccionSchema.statics.buscarActivo = async function (usuarioId, tipo) {
  const token = await this.findOne({ usuario: usuarioId, tipo });
  if (!token) {
    throw new ErrorAPI('No hay ninguna solicitud pendiente. Solicita un nuevo código', 400);
  }
  return token;
};

module.exports = mongoose.model('TokenAccion', tokenAccionSchema);
