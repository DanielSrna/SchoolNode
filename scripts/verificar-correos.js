#!/usr/bin/env node
// ============================================================
// Verificación REAL del envío de correos vía Gmail SMTP.
// Usa una base de datos LOCAL (no toca Atlas) y el SMTP real
// con las credenciales del .env (EMAIL_USER / EMAIL_APP_PASSWORD).
//
// Flujos verificados (todos entregan en el correo de destino):
//   1. Código de cambio de contraseña (al correo actual)
//   2. Código de cambio de email (al NUEVO correo)
//   3. Recordatorio de pago al estudiante (cercanía de vencimiento)
//
// Uso: npm run check:correos
// ============================================================

// Entorno ANTES de cargar la app (dotenv no sobrescribe variables existentes)
process.env.NODE_ENV = 'development';
process.env.MONGODB_URI = 'mongodb://127.0.0.1:27017/schoolnode_correos';
process.env.JWT_SECRET = 'correos_verify_secret';
process.env.JWT_REFRESH_SECRET = 'correos_verify_refresh';
process.env.STRIPE_SECRET_KEY = 'sk_test_replace_with_real_key';
process.env.STRIPE_PUBLISHABLE_KEY = 'pk_test_replace_with_real_key';
process.env.STRIPE_WEBHOOK_SECRET = 'whsec_replace_with_real_secret';

require('dotenv').config(); // carga EMAIL_USER / EMAIL_APP_PASSWORD / APP_URL

const mongoose = require('mongoose');

const DESTINO = process.env.CORREO_DESTINO || 'monokronia@gmail.com';
const RESULTADOS = [];
let FALLOS = 0;

const ok = (msg) => RESULTADOS.push(`  ✔ ${msg}`);
const fail = (msg) => {
  RESULTADOS.push(`  ✖ ${msg}`);
  FALLOS++;
};

const api = (base, ruta, { method = 'GET', cookie, body } = {}) =>
  fetch(`${base}${ruta}`, {
    method,
    headers: {
      'Content-Type': 'application/json',
      ...(cookie ? { Cookie: cookie } : {}),
    },
    body: body ? JSON.stringify(body) : undefined,
  });

const login = async (base, email, password) => {
  const res = await api(base, '/api/auth/login', {
    method: 'POST',
    body: { email, password },
  });
  if (res.status !== 200) throw new Error(`Login falló: ${res.status}`);
  const cookie = res.headers
    .getSetCookie()
    .map((c) => c.split(';')[0])
    .join('; ');
  return cookie;
};

(async () => {
  await mongoose.connect('mongodb://127.0.0.1:27017/schoolnode_correos', {
    serverSelectionTimeoutMS: 5000,
  });
  await mongoose.connection.dropDatabase();

  const User = require('../src/models/User');
  const Estudiante = require('../src/models/Estudiante');
  const Curso = require('../src/models/Curso');
  const Aula = require('../src/models/Aula');
  const Matricula = require('../src/models/Matricula');

  const app = require('../src/app');
  const server = app.listen(0);
  await new Promise((r) => server.once('listening', r));
  const base = `http://127.0.0.1:${server.address().port}`;

  console.log(`Enviando correos reales a: ${DESTINO}\n`);

  try {
    // ============ FLUJO 1: Cambio de contraseña ============
    const admin = await User.crearEmpleado({
      email: DESTINO,
      password: 'Password123!',
      nombre: 'Verificación',
      rol: 'admin',
    });
    const cookie1 = await login(base, DESTINO, 'Password123!');
    const res1 = await api(base, '/api/auth/cambiar-password', {
      method: 'POST',
      cookie: cookie1,
      body: { passwordActual: 'Password123!', nuevaPassword: 'NuevaClave123!' },
    });
    if (res1.status === 200) {
      ok(`1. Código de cambio de contraseña -> ${DESTINO} (HTTP 200)`);
    } else {
      fail(`1. Cambio de contraseña falló: HTTP ${res1.status} ${await res1.text()}`);
    }

    // Liberar el correo para el flujo 2 (el destino no puede estar "en uso")
    await User.deleteOne({ email: DESTINO });

    // ============ FLUJO 2: Cambio de email ============
    const user2 = await User.crearEmpleado({
      email: 'verifica.cambio@test.local',
      password: 'Password123!',
      nombre: 'Cambio Email',
      rol: 'empleado',
    });
    const cookie2 = await login(base, 'verifica.cambio@test.local', 'Password123!');
    const res2 = await api(base, '/api/auth/cambiar-email', {
      method: 'POST',
      cookie: cookie2,
      body: { nuevoEmail: DESTINO },
    });
    if (res2.status === 200) {
      ok(`2. Código de cambio de email (al NUEVO correo) -> ${DESTINO} (HTTP 200)`);
    } else {
      fail(`2. Cambio de email falló: HTTP ${res2.status} ${await res2.text()}`);
    }

    // ============ FLUJO 3: Recordatorio de pago ============
    // user2 sigue con su correo original (el cambio requiere confirmar el código)
    const cookie3 = await login(base, 'verifica.cambio@test.local', 'Password123!');
    const estudiante = await Estudiante.crearNuevo({
      nombre: 'Estudiante',
      apellido: 'Verificación',
      cedula: '555000111',
      email: DESTINO,
    });
    const curso = await Curso.crearNuevo({
      nombre: 'Curso Verificación',
      precio: 300000,
      duracion: '4 semanas',
    });
    const aula = await Aula.crearNueva({ numero: 'VER1', capacidad: 10 });
    const matricula = await Matricula.crearNueva({
      estudianteId: estudiante._id,
      cursoId: curso._id,
      aulaId: aula._id,
    });
    const res3 = await api(base, `/api/matriculas/${matricula._id}/notificar`, {
      method: 'POST',
      cookie: cookie3,
    });
    if (res3.status === 200) {
      const data = await res3.json();
      ok(`3. Recordatorio de pago -> ${data.para} (HTTP 200, saldo $${data.saldo})`);
    } else {
      fail(`3. Recordatorio de pago falló: HTTP ${res3.status} ${await res3.text()}`);
    }
  } catch (error) {
    fail('Error general: ' + error.message);
  } finally {
    server.close();
    await mongoose.connection.dropDatabase().catch(() => {});
    await mongoose.connection.close();
  }

  console.log('=== Verificación de correos (SMTP real) ===');
  console.log(RESULTADOS.join('\n'));
  console.log(
    FALLOS === 0
      ? `\nRESULTADO: OK - revisa la bandeja de ${DESTINO} (incluido spam)`
      : `\nRESULTADO: ${FALLOS} FALLO(S)`
  );
  process.exit(FALLOS === 0 ? 0 : 1);
})();
