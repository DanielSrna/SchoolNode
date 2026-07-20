const express = require('express');
const router = express.Router();
const {
  obtenerConfiguracion,
  actualizarConfiguracion,
  cambiarCredencialesAdmin,
} = require('../controllers/configuracionController');
const authMiddleware = require('../middleware/authMiddleware');
const roleMiddleware = require('../middleware/roleMiddleware');

router.use(authMiddleware);
router.use(roleMiddleware(['admin']));

router.get('/', obtenerConfiguracion);
router.put('/', actualizarConfiguracion);
router.post('/cambiar-credenciales', cambiarCredencialesAdmin);

module.exports = router;
