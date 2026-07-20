const express = require('express');
const router = express.Router();
const { login, refresh, logout, obtenerUsuarioActual, cambiarID, cambiarPassword } = require('../controllers/authController');
const authMiddleware = require('../middleware/authMiddleware');

router.post('/login', login);
router.post('/refresh', refresh);
router.post('/logout', logout);
router.get('/me', authMiddleware, obtenerUsuarioActual);
router.post('/cambiar-id', authMiddleware, cambiarID);
router.post('/cambiar-password', authMiddleware, cambiarPassword);

module.exports = router;
