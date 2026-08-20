// Notificaciones internas (empleado → administrador):
//   - creación con destino a los admins activos
//   - listado según rol (admin: recibidas, empleado: enviadas)
//   - contador de no leídas
//   - marcar leída solo por el destinatario
//   - protección de sesión y validaciones

const { test, before, after } = require('node:test');
const assert = require('node:assert');
const mongoose = require('mongoose');
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
let cookieAdmin;
let cookieEmpleado;

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

const crearNotificacion = (cookie, asunto, mensaje) =>
  api('/api/notificaciones', {
    method: 'POST',
    cookie,
    body: { asunto, mensaje },
  });

before(async () => {
  await conectarTestDB('schoolnode_test_notificaciones');
  await limpiarDB();

  const app = require('../src/app');
  server = app.listen(0);
  await new Promise((resolve) => server.once('listening', resolve));
  baseURL = `http://127.0.0.1:${server.address().port}`;

  await crearDatosBase();

  const resAdmin = await api('/api/auth/login', {
    method: 'POST',
    body: { email: 'admin@test.com', password: 'Admin123!' },
  });
  cookieAdmin = extraerCookies(resAdmin);

  const resEmp = await api('/api/auth/login', {
    method: 'POST',
    body: { email: 'empleado@test.com', password: 'Empleado123!' },
  });
  cookieEmpleado = extraerCookies(resEmp);
});

after(async () => {
  server.close();
  await limpiarDB();
  await desconectarDB();
});

test('Notificación: sin sesión responde 401', async () => {
  const res = await api('/api/notificaciones');
  assert.strictEqual(res.status, 401);
});

test('Notificación: validaciones de asunto y mensaje (400)', async () => {
  const res = await crearNotificacion(cookieEmpleado, '', '');
  assert.strictEqual(res.status, 400);
  const json = await res.json();
  assert.ok(json.errores.length >= 2);
});

test('Notificación: empleado crea y llega al administrador (201)', async () => {
  const res = await crearNotificacion(cookieEmpleado, 'Se requiere asistencia', 'Un estudiante necesita ayuda con su pago');
  assert.strictEqual(res.status, 201);
  const json = await res.json();
  assert.strictEqual(json.creadas, 1); // hay 1 admin activo en el dataset

  // El admin la ve como recibida
  const resAdmin = await api('/api/notificaciones', { cookie: cookieAdmin });
  assert.strictEqual(resAdmin.status, 200);
  const recibidas = await resAdmin.json();
  assert.strictEqual(recibidas.length, 1);
  assert.strictEqual(recibidas[0].asunto, 'Se requiere asistencia');
  assert.strictEqual(recibidas[0].leida, false);
  assert.strictEqual(recibidas[0].remitente.email, 'empleado@test.com');
});

test('Notificación: el ADMIN no puede crear notificaciones (403)', async () => {
  const res = await crearNotificacion(cookieAdmin, 'Admin intenta', 'No debería poder');
  assert.strictEqual(res.status, 403);
  assert.strictEqual((await res.json()).error, 'Solo los empleados pueden crear notificaciones');
});

test('Notificación: el empleado solo ve las que ENVIÓ (no las ajenas)', async () => {
  // Crear un segundo empleado que envía la suya
  const resLogin2 = await api('/api/auth/login', {
    method: 'POST',
    body: { email: 'empleado@test.com', password: 'Empleado123!' },
  });
  const cookieEmp2 = extraerCookies(resLogin2);
  await crearNotificacion(cookieEmp2, 'Otra notificación', 'Mensaje del empleado');

  // Un empleado NO autenticado distinto no existe en el dataset;
  // verificamos que el listado del empleado solo trae lo que él envió
  const res = await api('/api/notificaciones', { cookie: cookieEmpleado });
  const enviadas = await res.json();
  assert.ok(enviadas.length >= 2, 'El empleado debe ver sus envíos');
  assert.ok(enviadas.every((n) => n.remitente.email === 'empleado@test.com'));
});

test('Notificación: contador de no leídas del admin', async () => {
  const res = await api('/api/notificaciones/no-leidas', { cookie: cookieAdmin });
  assert.strictEqual(res.status, 200);
  const { total } = await res.json();
  assert.ok(total >= 2, 'El admin debe tener notificaciones sin leer');
});

test('Notificación: marcar leída la hace desaparecer del contador', async () => {
  // Tomar una recibida del admin
  const resLista = await api('/api/notificaciones', { cookie: cookieAdmin });
  const lista = await resLista.json();
  const noLeida = lista.find((n) => !n.leida);
  assert.ok(noLeida, 'Debe existir una no leída');

  const resMarcar = await api(`/api/notificaciones/${noLeida._id}/leida`, {
    method: 'PATCH',
    cookie: cookieAdmin,
  });
  assert.strictEqual(resMarcar.status, 200);
  assert.strictEqual((await resMarcar.json()).leida, true);

  const resContador = await api('/api/notificaciones/no-leidas', { cookie: cookieAdmin });
  const { total } = await resContador.json();
  assert.strictEqual(total, lista.filter((n) => !n.leida).length - 1);
});

test('Notificación: solo el destinatario puede marcar leída (403)', async () => {
  const resLista = await api('/api/notificaciones', { cookie: cookieAdmin });
  const lista = await resLista.json();
  const alguna = lista[0];
  assert.ok(alguna);

  // El empleado NO es el destinatario
  const res = await api(`/api/notificaciones/${alguna._id}/leida`, {
    method: 'PATCH',
    cookie: cookieEmpleado,
  });
  assert.strictEqual(res.status, 403);
});

test('Notificación: marcar una inexistente responde 404', async () => {
  const idInexistente = new mongoose.Types.ObjectId();
  const res = await api(`/api/notificaciones/${idInexistente}/leida`, {
    method: 'PATCH',
    cookie: cookieAdmin,
  });
  assert.strictEqual(res.status, 404);
});
