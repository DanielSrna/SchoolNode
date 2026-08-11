const express = require('express');
const router = express.Router();
const { body, param } = require('express-validator');
const {
  listarAulas,
  obtenerAula,
  crearAula,
  actualizarAula,
  eliminarAula,
} = require('../controllers/aulaController');
const authMiddleware = require('../middleware/authMiddleware');
const roleMiddleware = require('../middleware/roleMiddleware');
const validarCampos = require('../middleware/validarCampos');

router.use(authMiddleware);

const validarId = [param('id').isMongoId().withMessage('ID de aula no válido')];

// GET - todos pueden ver
router.get('/', listarAulas);
router.get('/:id', validarId, validarCampos, obtenerAula);

// POST, PUT, DELETE - solo admin
router.post(
  '/',
  roleMiddleware(['admin']),
  [
    body('numero').notEmpty().withMessage('Número de aula requerido').trim(),
    body('capacidad').isInt({ min: 1 }).withMessage('Capacidad válida requerida (mínimo 1)'),
  ],
  validarCampos,
  crearAula
);
router.put(
  '/:id',
  roleMiddleware(['admin']),
  [
    ...validarId,
    body('numero').optional().notEmpty().withMessage('Número no puede estar vacío').trim(),
    body('capacidad').optional().isInt({ min: 1 }).withMessage('Capacidad mínima es 1'),
  ],
  validarCampos,
  actualizarAula
);
router.delete('/:id', roleMiddleware(['admin']), validarId, validarCampos, eliminarAula);

module.exports = router;
