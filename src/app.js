require('dotenv').config();
const express = require('express');
const cookieParser = require('cookie-parser');
const path = require('path');
const conectarDB = require('./config/db');
const logger = require('./utils/logger');
const { attachUser } = require('./middleware/authMiddleware');

// Importar rutas
const authRoutes = require('./routes/authRoutes');
const empleadoRoutes = require('./routes/empleadoRoutes');
const cursoRoutes = require('./routes/cursoRoutes');
const aulaRoutes = require('./routes/aulaRoutes');
const estudianteRoutes = require('./routes/estudianteRoutes');
const matriculaRoutes = require('./routes/matriculaRoutes');
const pagoRoutes = require('./routes/pagoRoutes');
const facturaRoutes = require('./routes/facturaRoutes');
const configuracionRoutes = require('./routes/configuracionRoutes');

const app = express();

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

// Servir archivos estáticos
app.use(express.static(path.join(__dirname, 'public')));

// Configurar EJS
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// Middleware para adjuntar usuario a res.locals (disponible en todas las vistas)
app.use(attachUser);

// Conectar a MongoDB
conectarDB();

// Rutas API
app.use('/api/auth', authRoutes);
app.use('/api/empleados', empleadoRoutes);
app.use('/api/cursos', cursoRoutes);
app.use('/api/aulas', aulaRoutes);
app.use('/api/estudiantes', estudianteRoutes);
app.use('/api/matriculas', matriculaRoutes);
app.use('/api/pagos', pagoRoutes);
app.use('/api/pagos', facturaRoutes);
app.use('/api/configuracion', configuracionRoutes);

// Ruta principal - redirigir según estado de autenticación
app.get('/', (req, res) => {
  if (req.usuario) {
    // Usuario autenticado: redirigir a su destino
    if (req.usuario.rol === 'admin') {
      return res.redirect('/dashboard');
    } else {
      // Empleado va a la primera sección que pueda ver
      return res.redirect('/estudiantes');
    }
  }
  // No autenticado: redirigir a login
  res.redirect('/login');
});

// Ruta de login
app.get('/login', (req, res) => {
  if (req.usuario) {
    // Ya está autenticado, redirigir
    if (req.usuario.rol === 'admin') {
      return res.redirect('/dashboard');
    } else {
      return res.redirect('/estudiantes');
    }
  }
  res.render('auth/login', { title: 'Iniciar Sesión' });
});

// Middleware para verificar que el usuario esté autenticado en las vistas protegidas
const requireAuth = (req, res, next) => {
  if (!req.usuario) {
    return res.redirect('/login');
  }
  next();
};

// GET /api/auth/logout - Logout directo que limpia cookies y redirige
app.get('/api/auth/logout', async (req, res) => {
  try {
    if (req.usuario) {
      req.usuario.refreshToken = null;
      await req.usuario.save();
      logger.exito(`Logout: ${req.usuario.email}`);
    }
    res.clearCookie('accessToken', { path: '/' });
    res.clearCookie('refreshToken', { path: '/' });
    res.redirect('/login');
  } catch (error) {
    logger.error(`Error en logout: ${error.message}`);
    res.redirect('/login');
  }
});

// Middleware para verificar que el usuario sea admin en las vistas protegidas
const requireAdmin = (req, res, next) => {
  if (!req.usuario) {
    return res.redirect('/login');
  }
  if (req.usuario.rol !== 'admin') {
    return res.status(403).render('error', {
      title: 'Acceso Denegado',
      mensaje: 'No tiene permisos para acceder a esta sección.',
    });
  }
  next();
};

// Rutas de vistas
app.get('/dashboard', requireAdmin, (req, res) => {
  res.render('dashboard', { title: 'Dashboard' });
});

app.get('/estudiantes', requireAuth, (req, res) => {
  res.render('estudiantes/lista', { title: 'Estudiantes' });
});

app.get('/cursos', requireAuth, (req, res) => {
  res.render('cursos/lista', { title: 'Cursos' });
});

app.get('/matriculas', requireAuth, (req, res) => {
  res.render('matriculas/lista', { title: 'Matrículas' });
});

app.get('/pagos', requireAuth, (req, res) => {
  res.render('pagos/lista', { title: 'Pagos' });
});

app.get('/pagos/simular-pago', requireAuth, (req, res) => {
  res.render('pagos/simular-pago', { title: 'Procesar Pago' });
});

app.get('/empleados', requireAdmin, (req, res) => {
  res.render('empleados/lista', { title: 'Empleados' });
});

app.get('/ajustes', requireAdmin, (req, res) => {
  res.render('ajustes', { title: 'Ajustes' });
});

app.get('/ayuda', requireAuth, (req, res) => {
  res.render('ayuda', { title: 'Ayuda' });
});

// Manejo de errores 404
app.use((req, res) => {
  res.status(404).json({ error: 'Ruta no encontrada' });
});

// Manejo de errores global
app.use((err, req, res, next) => {
  logger.error(`Error: ${err.message}`);
  res.status(500).json({ error: 'Error interno del servidor' });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  logger.exito(`Servidor corriendo en puerto ${PORT}`);
  logger.proceso(`Entorno: ${process.env.NODE_ENV || 'development'}`);
  logger.exito('=== CREDENCIALES DE PRUEBA ===');
  logger.exito('Admin: admin@schoolnode.com / Admin123!');
  logger.exito('Empleado: empleado1@schoolnode.com / Empleado123!');
  logger.exito('Empleado: empleado2@schoolnode.com / Empleado123!');
  logger.exito('Empleado: empleado3@schoolnode.com / Empleado123!');
  logger.exito('==============================');
});

module.exports = app;
