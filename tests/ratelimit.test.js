// Rate limiting: el login se bloquea después de N intentos fallidos (429).
// Este archivo define LOGIN_RATE_LIMIT_MAX=3 ANTES de cargar la app para
// activar un límite bajo y verificable. El resto de los tests corren sin
// límite (NODE_ENV=test sin la variable -> limiter desactivado).

process.env.LOGIN_RATE_LIMIT_MAX = '3';

const { test, before, after } = require('node:test');
const assert = require('node:assert');
const {
  conectarTestDB,
  limpiarDB,
  desconectarDB,
  silenciarLogger,
  crearDatosBase,
} = require('./helpers');

silenciarLogger();

let server;
let baseURL;

const api = (ruta, { method = 'POST', body } = {}) =>
  fetch(`${baseURL}${ruta}`, {
    method,
    headers: { 'Content-Type': 'application/json' },
    body: body ? JSON.stringify(body) : undefined,
  });

before(async () => {
  await conectarTestDB('schoolnode_test_ratelimit');
  await limpiarDB();

  const app = require('../src/app');
  server = app.listen(0);
  await new Promise((resolve) => server.once('listening', resolve));
  baseURL = `http://127.0.0.1:${server.address().port}`;

  await crearDatosBase();
});

after(async () => {
  server.close();
  await limpiarDB();
  await desconectarDB();
});

test('Rate limit: login con credenciales incorrectas da 401 hasta el límite', async () => {
  // Los primeros 3 intentos fallan por credenciales (401), no por límite
  for (let i = 0; i < 3; i++) {
    const res = await api('/api/auth/login', {
      body: { email: 'admin@test.com', password: 'incorrecta' },
    });
    assert.strictEqual(res.status, 401, `Intento ${i + 1} debe ser 401`);
  }
});

test('Rate limit: el 4º intento queda bloqueado con 429', async () => {
  const res = await api('/api/auth/login', {
    body: { email: 'admin@test.com', password: 'incorrecta' },
  });
  assert.strictEqual(res.status, 429);
  const json = await res.json();
  assert.match(json.error, /Demasiados intentos/);
});

test('Rate limit: incluso con credenciales CORRECTAS se mantiene bloqueado', async () => {
  // El bloqueo aplica por IP, no solo por intentos fallidos
  const res = await api('/api/auth/login', {
    body: { email: 'admin@test.com', password: 'Admin123!' },
  });
  assert.strictEqual(res.status, 429);
});
