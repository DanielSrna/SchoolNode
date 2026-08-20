// Autenticación avanzada: refresh token inválido/expirado, rotación de
// tokens, auto-refresh con access token vencido, cookies de seguridad
// y usuarios desactivados.

const { test, before, after } = require('node:test');
const assert = require('node:assert');
const jwt = require('jsonwebtoken');
const {
  conectarTestDB,
  limpiarDB,
  desconectarDB,
  silenciarLogger,
  crearDatosBase,
} = require('./helpers');

silenciarLogger();

// Mismos valores que define helpers.js ANTES de cargar la app
const JWT_SECRET = 'test_jwt_secret';
const JWT_REFRESH_SECRET = 'test_jwt_refresh_secret';

let server;
let baseURL;
let datos;
let User;

const extraerCookies = (res) =>
  res.headers
    .getSetCookie()
    .map((c) => c.split(';')[0])
    .join('; ');

const api = (ruta, { method = 'GET', cookie, body } = {}) =>
  fetch(`${baseURL}${ruta}`, {
    method,
    headers: {
      'Content-Type': 'application/json',
      ...(cookie ? { Cookie: cookie } : {}),
    },
    body: body ? JSON.stringify(body) : undefined,
  });

const login = async (email, password) => {
  const res = await api('/api/auth/login', {
    method: 'POST',
    body: { email, password },
  });
  return { res, cookie: extraerCookies(res) };
};

before(async () => {
  await conectarTestDB('schoolnode_test_auth');
  await limpiarDB();

  const app = require('../src/app');
  server = app.listen(0);
  await new Promise((resolve) => server.once('listening', resolve));
  baseURL = `http://127.0.0.1:${server.address().port}`;

  User = require('../src/models/User');
  datos = await crearDatosBase();
});

after(async () => {
  server.close();
  await limpiarDB();
  await desconectarDB();
});

// ============================================================
// REFRESH TOKEN: casos de rechazo
// ============================================================

test('Auth: refresh sin cookie responde 401', async () => {
  const res = await api('/api/auth/refresh', { method: 'POST' });
  assert.strictEqual(res.status, 401);
});

test('Auth: refresh con token inválido responde 401', async () => {
  const res = await api('/api/auth/refresh', {
    method: 'POST',
    cookie: 'refreshToken=token.falso.invalido',
  });
  assert.strictEqual(res.status, 401);
});

test('Auth: refresh con token expirado responde 401', async () => {
  const tokenExpirado = jwt.sign(
    { id: String(datos.admin._id) },
    JWT_REFRESH_SECRET,
    { expiresIn: '-10s' }
  );
  const res = await api('/api/auth/refresh', {
    method: 'POST',
    cookie: `refreshToken=${tokenExpirado}`,
  });
  assert.strictEqual(res.status, 401);
});

test('Auth: refresh con token válido pero no guardado en DB responde 401', async () => {
  // Firma un refresh token válido que nunca se guardó hasheado en la DB
  const tokenHuérfano = jwt.sign({ id: String(datos.admin._id) }, JWT_REFRESH_SECRET, {
    expiresIn: '1h',
  });
  const res = await api('/api/auth/refresh', {
    method: 'POST',
    cookie: `refreshToken=${tokenHuérfano}`,
  });
  assert.strictEqual(res.status, 401);
  assert.strictEqual((await res.json()).error, 'Sesión inválida');
});

// ============================================================
// ROTACIÓN DE TOKENS
// ============================================================

test('Auth: refresh rota los tokens y el viejo queda inutilizable', async () => {
  const { cookie } = await login('empleado@test.com', 'Empleado123!');

  // 1er refresh: emite un par NUEVO
  const res1 = await api('/api/auth/refresh', { method: 'POST', cookie });
  assert.strictEqual(res1.status, 200);
  const cookiesNuevas = extraerCookies(res1);

  // El refresh viejo ya no sirve (fue rotado en la DB)
  const res2 = await api('/api/auth/refresh', { method: 'POST', cookie });
  assert.strictEqual(res2.status, 401);

  // El refresh nuevo sí sirve
  const res3 = await api('/api/auth/refresh', { method: 'POST', cookie: cookiesNuevas });
  assert.strictEqual(res3.status, 200);
});

// ============================================================
// AUTO-REFRESH CON ACCESS TOKEN VENCIDO
// ============================================================

test('Auth: access token vencido + refresh válido se renueva solo (200)', async () => {
  const { cookie } = await login('empleado@test.com', 'Empleado123!');
  const refreshToken = cookie
    .split('; ')
    .find((c) => c.startsWith('refreshToken='))
    .split('=')[1];

  // Access token vencido (expirado hace 1 minuto)
  const tokenVencido = jwt.sign(
    { id: String(datos.empleado._id), email: 'empleado@test.com', rol: 'empleado' },
    JWT_SECRET,
    { expiresIn: '-60s' }
  );

  const res = await api('/api/auth/me', {
    cookie: `accessToken=${tokenVencido}; refreshToken=${refreshToken}`,
  });
  assert.strictEqual(res.status, 200);
  const json = await res.json();
  assert.strictEqual(json.email, 'empleado@test.com');

  // Además fijó cookies nuevas (renovación automática)
  const nuevasCookies = res.headers.getSetCookie();
  assert.ok(nuevasCookies.some((c) => c.startsWith('accessToken=')));
  assert.ok(nuevasCookies.some((c) => c.startsWith('refreshToken=')));
});

// ============================================================
// /ME Y COOKIES DE SEGURIDAD
// ============================================================

test('Auth: /me devuelve el usuario sin password ni refreshToken', async () => {
  const { cookie } = await login('admin@test.com', 'Admin123!');
  const res = await api('/api/auth/me', { cookie });
  assert.strictEqual(res.status, 200);
  const usuario = await res.json();
  assert.strictEqual(usuario.email, 'admin@test.com');
  assert.strictEqual(usuario.nombre, 'Admin Prueba');
  assert.strictEqual(usuario.rol, 'admin');
  assert.strictEqual(usuario.password, undefined);
  assert.strictEqual(usuario.refreshToken, undefined);
});

test('Auth: /me sin sesión responde 401', async () => {
  const res = await api('/api/auth/me');
  assert.strictEqual(res.status, 401);
});

test('Auth: las cookies de sesión son httpOnly y sameSite=lax', async () => {
  const { res } = await login('admin@test.com', 'Admin123!');
  const setCookies = res.headers.getSetCookie();

  for (const cookie of setCookies) {
    assert.match(cookie, /HttpOnly/i, `Falta HttpOnly en: ${cookie}`);
    assert.match(cookie, /SameSite=lax/i, `Falta SameSite en: ${cookie}`);
  }
  assert.ok(setCookies.some((c) => c.startsWith('accessToken=')));
  assert.ok(setCookies.some((c) => c.startsWith('refreshToken=')));
});

// ============================================================
// USUARIO DESACTIVADO
// ============================================================

test('Auth: usuario desactivado no puede iniciar sesión (401)', async () => {
  // Crear un empleado extra y desactivarlo
  const empleado = await User.crearEmpleado({
    email: 'inactivo@test.com',
    password: 'Password123!',
    nombre: 'Inactivo',
    rol: 'empleado',
  });
  await empleado.desactivar();

  const { res } = await login('inactivo@test.com', 'Password123!');
  assert.strictEqual(res.status, 401);
  assert.strictEqual((await res.json()).error, 'Cuenta desactivada');
});
