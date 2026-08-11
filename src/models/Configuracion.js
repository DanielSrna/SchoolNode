const mongoose = require('mongoose');

const configuracionSchema = new mongoose.Schema(
  {
    clave: {
      type: String,
      required: true,
      unique: true,
      default: 'general',
    },
    nombreInstitucion: {
      type: String,
      default: 'Motos BSA la 23',
    },
    ubicacion: {
      type: String,
      default: 'Tuluá, Valle del Cauca',
    },
    nit: {
      type: String,
      default: '900.123.456-7',
    },
    telefono: {
      type: String,
      default: '',
    },
    email: {
      type: String,
      default: '',
    },
    colorPrimario: {
      type: String,
      default: '#0d6efd',
    },
    logoEmoji: {
      type: String,
      default: '🏫',
    },
    // Configuración de facturación
    facturacion: {
      prefijoFactura: { type: String, default: 'FAC' },
      regimen: { type: String, default: 'Simplificado' },
      resolucionDIAN: { type: String, default: '' },
      pieFactura: { type: String, default: 'Gracias por su pago' },
    },
  },
  {
    timestamps: true,
  }
);

// ============================================================
// MÉTODOS ESTÁTICOS (funciones CRUD de la entidad en la DB)
// ============================================================

// Obtiene la configuración general; si no existe, la crea con valores por defecto
configuracionSchema.statics.obtenerGeneral = async function () {
  let config = await this.findOne({ clave: 'general' });
  if (!config) {
    config = new this({ clave: 'general' });
    await config.save();
  }
  return config;
};

// Actualiza solo los campos recibidos de la configuración general
configuracionSchema.statics.actualizarGeneral = async function (datos) {
  const config = await this.obtenerGeneral();

  const camposSimples = [
    'nombreInstitucion',
    'ubicacion',
    'nit',
    'telefono',
    'email',
    'colorPrimario',
    'logoEmoji',
  ];

  camposSimples.forEach((campo) => {
    if (datos[campo] !== undefined) config[campo] = datos[campo];
  });

  if (datos.facturacion) {
    config.facturacion = { ...config.facturacion.toObject(), ...datos.facturacion };
  }

  await config.save();
  return config;
};

module.exports = mongoose.model('Configuracion', configuracionSchema);
