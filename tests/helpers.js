// Utilidades compartidas por las pruebas.
// Usan el MongoDB LOCAL (127.0.0.1) con bases de datos exclusivas de prueba,
// para no tocar nunca la base de datos real de Atlas.

const mongoose = require('mongoose');

// Variables de entorno controladas ANTES de cargar cualquier módulo del proyecto
// (dotenv no sobrescribe variables que ya existen).
process.env.JWT_SECRET = 'test_jwt_secret';
process.env.JWT_REFRESH_SECRET = 'test_jwt_refresh_secret';
process.env.STRIPE_SECRET_KEY = 'sk_test_replace_with_real_key'; // fuerza modo simulación
process.env.STRIPE_PUBLISHABLE_KEY = 'pk_test_replace_with_real_key';
process.env.STRIPE_WEBHOOK_SECRET = 'whsec_replace_with_real_secret';
process.env.APP_URL = 'http://localhost:3000';
process.env.NODE_ENV = 'test';

const MONGO_BASE = 'mongodb://127.0.0.1:27017';

// Conecta mongoose a una base de datos de prueba (cada archivo usa la suya)
const conectarTestDB = async (nombreDB) => {
  await mongoose.connect(`${MONGO_BASE}/${nombreDB}`);
};

// Deja todas las colecciones vacías
const limpiarDB = async () => {
  const colecciones = await mongoose.connection.db.collections();
  for (const coleccion of colecciones) {
    await coleccion.deleteMany({});
  }
};

// Cierra la conexión
const desconectarDB = async () => {
  await mongoose.connection.close();
};

// Silencia el logger de Winston para que la salida de las pruebas sea legible
const silenciarLogger = () => {
  const logger = require('../src/utils/logger');
  logger.transports.forEach((t) => {
    t.silent = true;
  });
};

// Crea el conjunto mínimo de datos: admin, empleado, curso, aula y estudiante
const crearDatosBase = async () => {
  const User = require('../src/models/User');
  const Curso = require('../src/models/Curso');
  const Aula = require('../src/models/Aula');
  const Estudiante = require('../src/models/Estudiante');

  const admin = await new User({
    email: 'admin@test.com',
    password: 'Admin123!',
    nombre: 'Admin Prueba',
    rol: 'admin',
  }).save();

  const empleado = await new User({
    email: 'empleado@test.com',
    password: 'Empleado123!',
    nombre: 'Empleado Prueba',
    rol: 'empleado',
  }).save();

  const curso = await Curso.crearNuevo({
    nombre: 'Curso Prueba',
    precio: 300000,
    duracion: '4 semanas',
  });

  const aula = await Aula.crearNueva({ numero: 'T01', capacidad: 2 });

  const estudiante = await Estudiante.crearNuevo({
    nombre: 'Estudiante',
    apellido: 'Prueba',
    cedula: '999888777',
  });

  return { admin, empleado, curso, aula, estudiante };
};

module.exports = {
  conectarTestDB,
  limpiarDB,
  desconectarDB,
  silenciarLogger,
  crearDatosBase,
};
