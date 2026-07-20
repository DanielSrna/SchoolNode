const express = require('express');
const router = express.Router();
const { body } = require('express-validator');
const {
  listarEstudiantes,
  obtenerEstudiante,
  crearEstudiante,
  actualizarEstudiante,
  eliminarEstudiante,
} = require('../controllers/estudianteController');
const authMiddleware = require('../middleware/authMiddleware');
const roleMiddleware = require('../middleware/roleMiddleware');

router.use(authMiddleware);

// GET - todos pueden ver
router.get('/', listarEstudiantes);
router.get('/:id', obtenerEstudiante);

// POST, PUT, DELETE - solo admin
router.post(
  '/',
  roleMiddleware(['admin']),
  [
    body('nombre').notEmpty().withMessage('Nombre requerido'),
    body('apellido').notEmpty().withMessage('Apellido requerido'),
    body('cedula').notEmpty().withMessage('Cédula requerida'),
  ],
  crearEstudiante
);
router.put('/:id', roleMiddleware(['admin']), actualizarEstudiante);
router.delete('/:id', roleMiddleware(['admin']), eliminarEstudiante);

module.exports = router;
