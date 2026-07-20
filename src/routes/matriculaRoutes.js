const express = require('express');
const router = express.Router();
const { body } = require('express-validator');
const {
  listarMatriculas,
  obtenerMatricula,
  crearMatricula,
  actualizarMatricula,
  eliminarMatricula,
  migrarEstudiante,
} = require('../controllers/matriculaController');
const authMiddleware = require('../middleware/authMiddleware');
const roleMiddleware = require('../middleware/roleMiddleware');

router.use(authMiddleware);

// GET - todos pueden ver
router.get('/', listarMatriculas);
router.get('/:id', obtenerMatricula);

// POST - solo admin puede crear
router.post(
  '/',
  roleMiddleware(['admin']),
  [
    body('estudianteId').notEmpty().withMessage('ID de estudiante requerido'),
    body('cursoId').notEmpty().withMessage('ID de curso requerido'),
    body('aulaId').notEmpty().withMessage('ID de aula requerido'),
  ],
  crearMatricula
);

// PUT, DELETE - solo admin
router.put('/:id', roleMiddleware(['admin']), actualizarMatricula);
router.delete('/:id', roleMiddleware(['admin']), eliminarMatricula);
router.post('/migrar', roleMiddleware(['admin']), migrarEstudiante);

module.exports = router;
