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

router.use(authMiddleware);

// Webhook no requiere autenticación estándar (lo valida Stripe)
router.post(
  '/webhook/stripe',
  express.raw({ type: 'application/json' }),
  webhookStripe
);

// Crear sesión de pago (Stripe real o simulación)
router.post(
  '/crear-sesion',
  roleMiddleware(['admin', 'empleado']),
  [
    body('matriculaId').notEmpty().withMessage('ID de matrícula requerido'),
    body('monto').isFloat({ min: 0 }).withMessage('Monto válido requerido'),
  ],
  crearSesionPago
);

// Confirmar pago simulado (sin Stripe real)
router.post('/confirmar-simulacion', confirmarPagoSimulado);

// Pago físico
router.post(
  '/fisico',
  roleMiddleware(['admin', 'empleado']),
  [
    body('matriculaId').notEmpty().withMessage('ID de matrícula requerido'),
    body('monto').isFloat({ min: 0 }).withMessage('Monto válido requerido'),
  ],
  pagoFisico
);

module.exports = router;
