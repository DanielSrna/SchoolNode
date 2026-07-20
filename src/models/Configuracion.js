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

module.exports = mongoose.model('Configuracion', configuracionSchema);
