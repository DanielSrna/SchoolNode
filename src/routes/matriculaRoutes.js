const express = require('express');
const router = express.Router();
const { body, param } = require('express-validator');
const {
  listarMatriculas,
  obtenerMatricula,
  crearMatricula,
  actualizarMatricula,
  eliminarMatricula,
  migrarEstudiante,
  notificarPago,
} = require('../controllers/matriculaController');
const authMiddleware = require('../middleware/authMiddleware');
const roleMiddleware = require('../middleware/roleMiddleware');
const validarCampos = require('../middleware/validarCampos');

router.use(authMiddleware);

const validarId = [param('id').isMongoId().withMessage('ID de matrícula no válido')];

// GET - todos pueden ver
router.get('/', listarMatriculas);
router.get('/:id', validarId, validarCampos, obtenerMatricula);

// POST - solo admin puede crear
router.post(
  '/',
  roleMiddleware(['admin']),
  [
    body('estudianteId').isMongoId().withMessage('ID de estudiante no válido'),
    body('cursoId').isMongoId().withMessage('ID de curso no válido'),
    body('aulaId').isMongoId().withMessage('ID de aula no válido'),
  ],
  validarCampos,
  crearMatricula
);

// PUT, DELETE - solo admin
router.put(
  '/:id',
  roleMiddleware(['admin']),
  [
    ...validarId,
    body('estado')
      .optional()
      .isIn(['activa', 'vencida', 'moroso', 'cancelada'])
      .withMessage('Estado no válido'),
  ],
  validarCampos,
  actualizarMatricula
);
router.delete('/:id', roleMiddleware(['admin']), validarId, validarCampos, eliminarMatricula);
router.post(
  '/migrar',
  roleMiddleware(['admin']),
  [
    body('matriculaId').isMongoId().withMessage('ID de matrícula no válido'),
    body('nuevoAulaId').isMongoId().withMessage('ID de aula destino no válido'),
  ],
  validarCampos,
  migrarEstudiante
);

// Enviar recordatorio de pago por correo al estudiante (admin y empleado)
router.post(
  '/:id/notificar',
  validarId,
  validarCampos,
  notificarPago
);

module.exports = router;
