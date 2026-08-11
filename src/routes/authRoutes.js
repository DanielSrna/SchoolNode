const express = require('express');
const router = express.Router();
const { body } = require('express-validator');
const {
  login,
  refresh,
  logout,
  obtenerUsuarioActual,
  cambiarEmail,
  cambiarPassword,
  confirmarCambio,
} = require('../controllers/authController');
const authMiddleware = require('../middleware/authMiddleware');
const validarCampos = require('../middleware/validarCampos');

router.post(
  '/login',
  [
    body('email').isEmail().withMessage('Email válido requerido').normalizeEmail({ gmail_remove_dots: false, gmail_remove_subaddress: false }),
    body('password').notEmpty().withMessage('Contraseña requerida'),
  ],
  validarCampos,
  login
);
router.post('/refresh', refresh);
router.post('/logout', logout);
router.get('/me', authMiddleware, obtenerUsuarioActual);
router.post(
  '/cambiar-email',
  authMiddleware,
  [body('nuevoEmail').isEmail().withMessage('Email válido requerido').normalizeEmail({ gmail_remove_dots: false, gmail_remove_subaddress: false })],
  validarCampos,
  cambiarEmail
);
router.post(
  '/cambiar-password',
  authMiddleware,
  [
    body('passwordActual').notEmpty().withMessage('Contraseña actual requerida'),
    body('nuevaPassword')
      .isLength({ min: 8 })
      .withMessage('La nueva contraseña debe tener al menos 8 caracteres'),
  ],
  validarCampos,
  cambiarPassword
);
router.post(
  '/confirmar-cambio',
  authMiddleware,
  [
    body('codigo')
      .isLength({ min: 6, max: 6 })
      .isNumeric()
      .withMessage('El código debe ser de 6 dígitos'),
  ],
  validarCampos,
  confirmarCambio
);

module.exports = router;
