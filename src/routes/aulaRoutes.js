const express = require('express');
const router = express.Router();
const { body } = require('express-validator');
const {
  listarAulas,
  obtenerAula,
  crearAula,
  actualizarAula,
  eliminarAula,
} = require('../controllers/aulaController');
const authMiddleware = require('../middleware/authMiddleware');
const roleMiddleware = require('../middleware/roleMiddleware');

router.use(authMiddleware);

// GET - todos pueden ver
router.get('/', listarAulas);
router.get('/:id', obtenerAula);

// POST, PUT, DELETE - solo admin
router.post(
  '/',
  roleMiddleware(['admin']),
  [
    body('numero').notEmpty().withMessage('Número de aula requerido'),
    body('capacidad').isInt({ min: 1 }).withMessage('Capacidad válida requerida'),
  ],
  crearAula
);
router.put('/:id', roleMiddleware(['admin']), actualizarAula);
router.delete('/:id', roleMiddleware(['admin']), eliminarAula);

module.exports = router;
