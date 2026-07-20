const express = require('express');
const router = express.Router();
const { generarFacturaPDF } = require('../controllers/facturaController');
const authMiddleware = require('../middleware/authMiddleware');

// GET /api/pagos/factura/:tipo/:matriculaId
// tipo: 'total' o 'aporte'
router.get('/factura/:tipo/:matriculaId', generarFacturaPDF);

module.exports = router;
