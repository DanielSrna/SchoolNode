const express = require('express');
const router = express.Router();
const { body, param } = require('express-validator');
const {
  listarCursos,
  obtenerCurso,
  crearCurso,
  actualizarCurso,
  eliminarCurso,
} = require('../controllers/cursoController');
const authMiddleware = require('../middleware/authMiddleware');
const roleMiddleware = require('../middleware/roleMiddleware');
const validarCampos = require('../middleware/validarCampos');

router.use(authMiddleware);

const validarId = [param('id').isMongoId().withMessage('ID de curso no válido')];

// GET - todos pueden ver
router.get('/', listarCursos);
router.get('/:id', validarId, validarCampos, obtenerCurso);

// POST, PUT, DELETE - solo admin
router.post(
  '/',
  roleMiddleware(['admin']),
  [
    body('nombre').notEmpty().withMessage('Nombre requerido').trim(),
    body('precio').isFloat({ min: 0 }).withMessage('Precio válido requerido'),
    body('duracion').notEmpty().withMessage('Duración requerida').trim(),
  ],
  validarCampos,
  crearCurso
);
router.put(
  '/:id',
  roleMiddleware(['admin']),
  [
    ...validarId,
    body('nombre').optional().notEmpty().withMessage('Nombre no puede estar vacío').trim(),
    body('precio').optional().isFloat({ min: 0 }).withMessage('Precio no puede ser negativo'),
    body('duracion').optional().notEmpty().withMessage('Duración no puede estar vacía').trim(),
  ],
  validarCampos,
  actualizarCurso
);
router.delete('/:id', roleMiddleware(['admin']), validarId, validarCampos, eliminarCurso);

module.exports = router;
