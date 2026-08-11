const express = require('express');
const router = express.Router();
const { body, param } = require('express-validator');
const {
  listarEmpleados,
  obtenerEmpleado,
  crearEmpleado,
  actualizarEmpleado,
  eliminarEmpleado,
} = require('../controllers/empleadoController');
const authMiddleware = require('../middleware/authMiddleware');
const roleMiddleware = require('../middleware/roleMiddleware');
const validarCampos = require('../middleware/validarCampos');

router.use(authMiddleware);
router.use(roleMiddleware(['admin']));

const validarId = [param('id').isMongoId().withMessage('ID de empleado no válido')];

router.get('/', listarEmpleados);
router.get('/:id', validarId, validarCampos, obtenerEmpleado);
router.post(
  '/',
  [
    body('email').isEmail().withMessage('Email válido requerido').normalizeEmail({ gmail_remove_dots: false, gmail_remove_subaddress: false }),
    body('password').isLength({ min: 8 }).withMessage('Contraseña mínima 8 caracteres'),
    body('nombre').notEmpty().withMessage('Nombre requerido').trim(),
    body('rol').isIn(['admin', 'empleado']).withMessage('Rol válido requerido'),
  ],
  validarCampos,
  crearEmpleado
);
router.put(
  '/:id',
  [
    ...validarId,
    body('email').optional().isEmail().withMessage('Email no válido').normalizeEmail({ gmail_remove_dots: false, gmail_remove_subaddress: false }),
    body('nombre').optional().notEmpty().withMessage('Nombre no puede estar vacío').trim(),
    body('rol').optional().isIn(['admin', 'empleado']).withMessage('Rol válido requerido'),
  ],
  validarCampos,
  actualizarEmpleado
);
router.delete('/:id', validarId, validarCampos, eliminarEmpleado);

module.exports = router;
