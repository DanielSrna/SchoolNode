const express = require('express');
const router = express.Router();
const { body } = require('express-validator');
const {
  listarCursos,
  obtenerCurso,
  crearCurso,
  actualizarCurso,
  eliminarCurso,
} = require('../controllers/cursoController');
const authMiddleware = require('../middleware/authMiddleware');
const roleMiddleware = require('../middleware/roleMiddleware');

router.use(authMiddleware);

// GET - todos pueden ver
router.get('/', listarCursos);
router.get('/:id', obtenerCurso);

// POST, PUT, DELETE - solo admin
router.post(
  '/',
  roleMiddleware(['admin']),
  [
    body('nombre').notEmpty().withMessage('Nombre requerido'),
    body('precio').isFloat({ min: 0 }).withMessage('Precio válido requerido'),
    body('duracion').notEmpty().withMessage('Duración requerida'),
  ],
  crearCurso
);
router.put('/:id', roleMiddleware(['admin']), actualizarCurso);
router.delete('/:id', roleMiddleware(['admin']), eliminarCurso);

module.exports = router;
