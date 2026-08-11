const express = require('express');
const router = express.Router();
const { body } = require('express-validator');
const {
  crearSesionPago,
  confirmarPagoSimulado,
  webhookStripe,
  pagoFisico,
} = require('../controllers/pagoController');
const authMiddleware = require('../middleware/authMiddleware');
const roleMiddleware = require('../middleware/roleMiddleware');
const validarCampos = require('../middleware/validarCampos');

// Webhook de Stripe: se define ANTES del middleware de autenticación
// porque Stripe no envía cookies de sesión; se valida con la firma.
// El body crudo (raw) se configura en app.js para poder verificar la firma.
router.post('/webhook/stripe', webhookStripe);

router.use(authMiddleware);

// Crear sesión de pago (Stripe real o simulación)
router.post(
  '/crear-sesion',
  roleMiddleware(['admin', 'empleado']),
  [
    body('matriculaId').isMongoId().withMessage('ID de matrícula no válido'),
    body('monto').isFloat({ min: 1 }).withMessage('El monto debe ser mayor a 0'),
  ],
  validarCampos,
  crearSesionPago
);

// Confirmar pago simulado (sin Stripe real)
router.post('/confirmar-simulacion', confirmarPagoSimulado);

// Pago físico
router.post(
  '/fisico',
  roleMiddleware(['admin', 'empleado']),
  [
    body('matriculaId').isMongoId().withMessage('ID de matrícula no válido'),
    body('monto').isFloat({ min: 1 }).withMessage('El monto debe ser mayor a 0'),
  ],
  validarCampos,
  pagoFisico
);

module.exports = router;
