// Pagos: sesión de checkout (simulación), pagos físicos, pago simulado
// y webhook de Stripe con verificación de montos e idempotencia.

const { test, before, after } = require('node:test');
const mongoose = require('mongoose');
const assert = require('node:assert');
const crypto = require('crypto');
const {
  conectarTestDB,
  limpiarDB,
  desconectarDB,
  silenciarLogger,
  crearDatosBase,
} = require('./helpers');

silenciarLogger();

const WEBHOOK_SECRET = 'whsec_replace_with_real_secret';

let server;
let baseURL;
let datos;
let cookieAdmin;
let Matricula;
let Estudiante;

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

const firmarPayload = (payload) => {
  const timestamp = Math.floor(Date.now() / 1000);
  const firma = crypto
    .createHmac('sha256', WEBHOOK_SECRET)
    .update(`${timestamp}.${payload}`)
    .digest('hex');
  return `t=${timestamp},v1=${firma}`;
};

const postWebhook = (payload, firma) =>
  fetch(`${baseURL}/api/pagos/webhook/stripe`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'stripe-signature': firma,
    },
    body: payload,
  });

// Crea una matrícula directo en la DB con su propio aula y devuelve el documento
const crearMatriculaDB = async () => {
  const estudiante = await Estudiante.crearNuevo({
    nombre: 'Pago',
    apellido: 'Stripe',
    cedula: String(Math.floor(Math.random() * 1e9)),
  });
  const aula = await Aula.crearNueva({
    numero: `PA-${Math.floor(Math.random() * 1e6)}`,
    capacidad: 10,
  });
  return await Matricula.crearNueva({
    estudianteId: estudiante._id,
    cursoId: datos.curso._id,
    aulaId: aula._id,
  });
};

// Evento checkout.session.completed tal como lo envía Stripe
const eventoCheckout = (matriculaId, monto, { id = 'cs_test_1', paymentIntent = 'pi_test_1' } = {}) =>
  JSON.stringify({
    id: `evt_${id}`,
    type: 'checkout.session.completed',
    data: {
      object: {
        id,
        payment_intent: paymentIntent,
        metadata: { matriculaId: String(matriculaId), monto: String(monto) },
      },
    },
  });

before(async () => {
  await conectarTestDB('schoolnode_test_pagos');
  await limpiarDB();

  const app = require('../src/app');
  server = app.listen(0);
  await new Promise((resolve) => server.once('listening', resolve));
  baseURL = `http://127.0.0.1:${server.address().port}`;

  Matricula = require('../src/models/Matricula');
  Estudiante = require('../src/models/Estudiante');
  Aula = require('../src/models/Aula');

  datos = await crearDatosBase();

  const res = await api('/api/auth/login', {
    method: 'POST',
    body: { email: 'admin@test.com', password: 'Admin123!' },
  });
  cookieAdmin = extraerCookies(res);
});

after(async () => {
  server.close();
  await limpiarDB();
  await desconectarDB();
});

// ============================================================
// SESIÓN DE CHECKOUT (modo simulación)
// ============================================================

test('Pagos: crear-sesion con matrícula inexistente responde 404', async () => {
  const idInexistente = new mongoose.Types.ObjectId();
  const res = await api('/api/pagos/crear-sesion', {
    method: 'POST',
    cookie: cookieAdmin,
    body: { matriculaId: idInexistente, monto: 10000 },
  });
  assert.strictEqual(res.status, 404);
});

test('Pagos: crear-sesion en modo simulación devuelve URL con matrícula y monto', async () => {
  const matricula = await crearMatriculaDB();

  const res = await api('/api/pagos/crear-sesion', {
    method: 'POST',
    cookie: cookieAdmin,
    body: { matriculaId: matricula._id, monto: 120000 },
  });
  assert.strictEqual(res.status, 200);
  const sesion = await res.json();
  assert.strictEqual(sesion.modo, 'simulacion');
  assert.ok(sesion.sessionId.startsWith('sim_'));
  assert.ok(sesion.url.includes(`matricula=${matricula._id}`));
  assert.ok(sesion.url.includes('monto=120000'));
});

test('Pagos: monto negativo es rechazado por validación (400)', async () => {
  const matricula = await crearMatriculaDB();
  const res = await api('/api/pagos/crear-sesion', {
    method: 'POST',
    cookie: cookieAdmin,
    body: { matriculaId: matricula._id, monto: -500 },
  });
  assert.strictEqual(res.status, 400);
});

// ============================================================
// PAGO FÍSICO Y PAGO SIMULADO
// ============================================================

test('Pagos: pago físico con matrícula inexistente responde 404', async () => {
  const idInexistente = new mongoose.Types.ObjectId();
  const res = await api('/api/pagos/fisico', {
    method: 'POST',
    cookie: cookieAdmin,
    body: { matriculaId: idInexistente, monto: 10000 },
  });
  assert.strictEqual(res.status, 404);
});

test('Pagos: confirmar-simulacion registra el pago y actualiza saldo', async () => {
  const matricula = await crearMatriculaDB();

  const res = await api('/api/pagos/confirmar-simulacion', {
    method: 'POST',
    cookie: cookieAdmin,
    body: { matriculaId: matricula._id, monto: 100000 },
  });
  assert.strictEqual(res.status, 200);
  const { matricula: actualizada } = await res.json();
  assert.strictEqual(actualizada.totalPagado, 100000);
  assert.strictEqual(actualizada.saldoPendiente, 200000);
  assert.strictEqual(actualizada.pagos.length, 1);
  assert.strictEqual(actualizada.pagos[0].metodo, 'stripe');
});

test('Pagos: confirmar-simulacion con matrícula inexistente responde 404', async () => {
  const idInexistente = new mongoose.Types.ObjectId();
  const res = await api('/api/pagos/confirmar-simulacion', {
    method: 'POST',
    cookie: cookieAdmin,
    body: { matriculaId: idInexistente, monto: 10000 },
  });
  assert.strictEqual(res.status, 404);
});

// ============================================================
// WEBHOOK: montos e idempotencia
// ============================================================

test('Webhook: pago parcial de 50% actualiza saldo correctamente', async () => {
  const matricula = await crearMatriculaDB();

  const payload = eventoCheckout(matricula._id, 150000, {
    id: 'cs_parcial',
    paymentIntent: 'pi_parcial',
  });
  const res = await postWebhook(payload, firmarPayload(payload));
  assert.strictEqual(res.status, 200);

  const actualizada = await Matricula.findById(matricula._id);
  assert.strictEqual(actualizada.totalPagado, 150000);
  assert.strictEqual(actualizada.saldoPendiente, 150000);
});

test('Webhook: evento duplicado (retry de Stripe) NO duplica el pago', async () => {
  const matricula = await crearMatriculaDB();

  const payload = eventoCheckout(matricula._id, 300000, {
    id: 'cs_dupe',
    paymentIntent: 'pi_dupe',
  });
  const firma = firmarPayload(payload);

  // Stripe reintenta el mismo evento exacto (mismo payment_intent)
  const res1 = await postWebhook(payload, firma);
  assert.strictEqual(res1.status, 200);
  const res2 = await postWebhook(payload, firma);
  assert.strictEqual(res2.status, 200);

  const actualizada = await Matricula.findById(matricula._id);
  assert.strictEqual(actualizada.pagos.length, 1, 'No debe registrarse el pago dos veces');
  assert.strictEqual(actualizada.totalPagado, 300000);
  assert.strictEqual(actualizada.saldoPendiente, 0);
});

test('Webhook: matrícula inexistente en metadata se ignora sin romper (200)', async () => {
  const idInexistente = new mongoose.Types.ObjectId();
  const payload = eventoCheckout(idInexistente, 10000, {
    id: 'cs_nomat',
    paymentIntent: 'pi_nomat',
  });
  const res = await postWebhook(payload, firmarPayload(payload));
  assert.strictEqual(res.status, 200);
  assert.strictEqual((await res.json()).received, true);
});
