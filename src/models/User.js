const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const { ErrorAPI, esErrorDuplicado } = require('../utils/ErrorAPI');

const userSchema = new mongoose.Schema(
  {
    email: {
      type: String,
      required: [true, 'El email es obligatorio'],
      unique: true,
      lowercase: true,
      trim: true,
      match: [/^\S+@\S+\.\S+$/, 'Email no válido'],
    },
    password: {
      type: String,
      required: [true, 'La contraseña es obligatoria'],
      minlength: [8, 'La contraseña debe tener al menos 8 caracteres'],
    },
    nombre: {
      type: String,
      required: [true, 'El nombre es obligatorio'],
      trim: true,
    },
    rol: {
      type: String,
      enum: {
        values: ['admin', 'empleado', 'estudiante'],
        message: 'Rol no válido: {VALUE}',
      },
      default: 'empleado',
    },
    refreshToken: {
      type: String,
      default: null,
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
// HOOKS
// ============================================================

// Hash de contraseña antes de guardar (bcrypt, 10 rondas de salt)
userSchema.pre('save', async function (next) {
  if (!this.isModified('password')) {
    return next();
  }
  try {
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error) {
    next(error);
  }
});

// ============================================================
// MÉTODOS DE INSTANCIA (acciones sobre un usuario concreto)
// ============================================================

// Compara una contraseña en texto plano con el hash guardado
userSchema.methods.compararPassword = async function (passwordIngresada) {
  return await bcrypt.compare(passwordIngresada, this.password);
};

// Guarda el refresh token (ya hasheado) que mantiene activa la sesión
userSchema.methods.guardarRefreshToken = async function (refreshTokenHasheado) {
  this.refreshToken = refreshTokenHasheado;
  await this.save();
};

// Elimina el refresh token: cierra la sesión en todos los dispositivos
userSchema.methods.limpiarRefreshToken = async function () {
  this.refreshToken = null;
  await this.save();
};

// Actualiza los datos editables de un empleado
userSchema.methods.actualizarDatos = async function ({ nombre, email, rol }) {
  if (nombre) this.nombre = nombre;
  if (email) {
    const existe = await this.constructor.existeEmail(email, this._id);
    if (existe) throw new ErrorAPI('Email ya registrado', 400);
    this.email = email;
  }
  if (rol) this.rol = rol;
  await this.save();
  return this;
};

// Cambia email y/o contraseña del usuario (la contraseña se hashea en el pre-save)
userSchema.methods.cambiarCredenciales = async function ({ nuevoEmail, nuevaPassword }) {
  if (nuevoEmail && nuevoEmail !== this.email) {
    const existe = await this.constructor.existeEmail(nuevoEmail, this._id);
    if (existe) throw new ErrorAPI('Email ya en uso', 400);
    this.email = nuevoEmail;
  }
  if (nuevaPassword) {
    this.password = nuevaPassword;
  }
  await this.save();
  return this;
};

// Borrado lógico: desactiva al usuario sin eliminar el documento
userSchema.methods.desactivar = async function () {
  this.activo = false;
  await this.save();
  return this;
};

// Ocultar password y refreshToken al convertir a JSON
userSchema.methods.toJSON = function () {
  const obj = this.toObject();
  delete obj.password;
  delete obj.refreshToken;
  return obj;
};

// ============================================================
// MÉTODOS ESTÁTICOS (funciones CRUD de la entidad en la DB)
// ============================================================

// Busca un usuario por email (incluye password y refreshToken, para login)
userSchema.statics.buscarPorEmail = function (email) {
  return this.findOne({ email });
};

// Busca un usuario por id sin campos sensibles
userSchema.statics.buscarPorIdSeguro = function (id) {
  return this.findById(id).select('-password -refreshToken');
};

// Lista todos los usuarios activos (empleados y admins)
userSchema.statics.listarEmpleados = function () {
  return this.find({ activo: true }).select('-password -refreshToken');
};

// Obtiene un empleado activo por id o lanza 404
userSchema.statics.obtenerEmpleadoPorId = async function (id) {
  const empleado = await this.buscarPorIdSeguro(id);
  if (!empleado || !empleado.activo) {
    throw new ErrorAPI('Empleado no encontrado', 404);
  }
  return empleado;
};

// Obtiene el documento completo de un usuario activo (para editarlo) o lanza 404
userSchema.statics.obtenerDocumentoActivo = async function (id) {
  const usuario = await this.findById(id);
  if (!usuario || !usuario.activo) {
    throw new ErrorAPI('Empleado no encontrado', 404);
  }
  return usuario;
};

// Indica si un email ya está registrado (excluyendo opcionalmente un id)
userSchema.statics.existeEmail = async function (email, excluirId = null) {
  const filtro = { email };
  if (excluirId) filtro._id = { $ne: excluirId };
  const existe = await this.findOne(filtro);
  return Boolean(existe);
};

// Crea un empleado nuevo validando que el email no esté repetido
userSchema.statics.crearEmpleado = async function ({ email, password, nombre, rol }) {
  try {
    const existe = await this.existeEmail(email);
    if (existe) throw new ErrorAPI('Email ya registrado', 400);

    const empleado = new this({ email, password, nombre, rol: rol || 'empleado' });
    await empleado.save();
    return empleado;
  } catch (error) {
    if (esErrorDuplicado(error)) throw new ErrorAPI('Email ya registrado', 400);
    throw error;
  }
};

module.exports = mongoose.model('User', userSchema);
