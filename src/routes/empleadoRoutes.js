const express = require('express');
const router = express.Router();
const { body } = require('express-validator');
const {
  listarEmpleados,
  obtenerEmpleado,
  crearEmpleado,
  actualizarEmpleado,
  eliminarEmpleado,
} = require('../controllers/empleadoController');
const authMiddleware = require('../middleware/authMiddleware');
const roleMiddleware = require('../middleware/roleMiddleware');

router.use(authMiddleware);
router.use(roleMiddleware(['admin']));

router.get('/', listarEmpleados);
router.get('/:id', obtenerEmpleado);
router.post(
  '/',
  [
    body('email').isEmail().withMessage('Email válido requerido'),
    body('password').isLength({ min: 8 }).withMessage('Contraseña mínima 8 caracteres'),
    body('nombre').notEmpty().withMessage('Nombre requerido'),
    body('rol').isIn(['admin', 'empleado']).withMessage('Rol válido requerido'),
  ],
  crearEmpleado
);
router.put('/:id', actualizarEmpleado);
router.delete('/:id', eliminarEmpleado);

module.exports = router;
