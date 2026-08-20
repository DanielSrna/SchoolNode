const express = require('express');
const router = express.Router();
const { body, param } = require('express-validator');
const {
  crearNotificacion,
  listarNotificaciones,
  contarNoLeidas,
  marcarLeida,
} = require('../controllers/notificacionController');
const authMiddleware = require('../middleware/authMiddleware');
const validarCampos = require('../middleware/validarCampos');

router.use(authMiddleware);

// Cualquier usuario autenticado (empleado/admin) puede crear notificaciones
router.post(
  '/',
  [
    body('asunto').notEmpty().withMessage('El asunto es obligatorio').trim(),
    body('mensaje').notEmpty().withMessage('El mensaje es obligatorio').trim(),
  ],
  validarCampos,
  crearNotificacion
);

// Listado según el rol (admin: recibidas; empleado: enviadas)
router.get('/', listarNotificaciones);

// Contador de no leídas (para la campana del header)
router.get('/no-leidas', contarNoLeidas);

// Marcar como leída (solo el destinatario)
router.patch(
  '/:id/leida',
  [param('id').isMongoId().withMessage('ID de notificación no válido')],
  validarCampos,
  marcarLeida
);

module.exports = router;
