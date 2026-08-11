const facturaService = require('../services/facturaService');
const { responderError } = require('../utils/ErrorAPI');
const logger = require('../utils/logger');

// Controlador de facturas: SOLO orquesta.
// La construcción del PDF vive en facturaService.

// GET /api/pagos/factura/:tipo/:matriculaId
// tipo: 'total' o 'aporte'
const generarFacturaPDF = async (req, res) => {
  try {
    const { tipo, matriculaId } = req.params;
    await facturaService.generarFacturaPDF(tipo, matriculaId, res);
  } catch (error) {
    logger.error(`Error generando PDF: ${error.message}`);
    // Si los headers ya se enviaron (PDF parcial), no se puede responder JSON
    if (!res.headersSent) {
      responderError(res, error);
    }
  }
};

module.exports = { generarFacturaPDF };
