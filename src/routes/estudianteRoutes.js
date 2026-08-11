const express = require('express');
const router = express.Router();
const { body, param } = require('express-validator');
const {
  listarEstudiantes,
  obtenerEstudiante,
  crearEstudiante,
  actualizarEstudiante,
  eliminarEstudiante,
} = require('../controllers/estudianteController');
const authMiddleware = require('../middleware/authMiddleware');
const roleMiddleware = require('../middleware/roleMiddleware');
const validarCampos = require('../middleware/validarCampos');

router.use(authMiddleware);

// Validación del id en la URL (reutilizable)
const validarId = [param('id').isMongoId().withMessage('ID de estudiante no válido')];

// GET - todos pueden ver
router.get('/', listarEstudiantes);
router.get('/:id', validarId, validarCampos, obtenerEstudiante);

// POST, PUT, DELETE - solo admin
router.post(
  '/',
  roleMiddleware(['admin']),
  [
    body('nombre').notEmpty().withMessage('Nombre requerido').trim(),
    body('apellido').notEmpty().withMessage('Apellido requerido').trim(),
    body('cedula')
      .notEmpty().withMessage('Cédula requerida')
      .matches(/^\d+$/).withMessage('La cédula solo debe contener números')
      .trim(),
    body('email').optional({ values: 'falsy' }).isEmail().withMessage('Email no válido'),
    body('fechaNacimiento')
      .optional({ values: 'falsy' })
      .isISO8601()
      .withMessage('Fecha de nacimiento no válida'),
  ],
  validarCampos,
  crearEstudiante
);
router.put(
  '/:id',
  roleMiddleware(['admin']),
  [
    ...validarId,
    body('nombre').optional().notEmpty().withMessage('Nombre no puede estar vacío').trim(),
    body('apellido').optional().notEmpty().withMessage('Apellido no puede estar vacío').trim(),
    body('cedula')
      .optional()
      .matches(/^\d+$/).withMessage('La cédula solo debe contener números')
      .trim(),
    body('email').optional({ values: 'falsy' }).isEmail().withMessage('Email no válido'),
    body('fechaNacimiento')
      .optional({ values: 'falsy' })
      .isISO8601()
      .withMessage('Fecha de nacimiento no válida'),
  ],
  validarCampos,
  actualizarEstudiante
);
router.delete('/:id', roleMiddleware(['admin']), validarId, validarCampos, eliminarEstudiante);

module.exports = router;
