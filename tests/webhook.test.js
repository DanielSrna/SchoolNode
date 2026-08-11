// Pruebas del webhook de Stripe: firma HMAC real (esquema t=...,v1=...)
// contra el endpoint /api/pagos/webhook/stripe.

const { test, before, after } = require('node:test');
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

const WEBHOOK_SECRET = 'whsec_replace_with_real_secret'; // el de helpers.js

let server;
let baseURL;
let datos;
let Matricula;

// Construye el header stripe-signature exactamente como lo hace Stripe
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
    body: payload, // se envía CRUDO, como hace Stripe
  });

before(async () => {
  await conectarTestDB('schoolnode_test_webhook');
  await limpiarDB();

  const app = require('../src/app');
  server = app.listen(0);
  await new Promise((resolve) => server.once('listening', resolve));
  baseURL = `http://127.0.0.1:${server.address().port}`;

  Matricula = require('../src/models/Matricula');
  datos = await crearDatosBase();
});

after(async () => {
  server.close();
  await limpiarDB();
  await desconectarDB();
});

test('Webhook: checkout.session.completed con firma válida registra el pago', async () => {
  // Crear matrícula para esta prueba
  const matricula = await Matricula.crearNueva({
    estudianteId: datos.estudiante._id,
    cursoId: datos.curso._id,
    aulaId: datos.aula._id,
  });
  assert.strictEqual(matricula.totalPagado, 0);

  // Evento igual al que envía Stripe al completarse un checkout
  const evento = {
    id: 'evt_test_123',
    type: 'checkout.session.completed',
    data: {
      object: {
        id: 'cs_test_fake_123',
        payment_intent: 'pi_test_fake_123',
        metadata: {
          matriculaId: String(matricula._id),
          monto: '120000',
        },
      },
    },
  };
  const payload = JSON.stringify(evento);

  // Nota: el webhook NO lleva cookies → demuestra que no pide autenticación
  const res = await postWebhook(payload, firmarPayload(payload));
  assert.strictEqual(res.status, 200);
  assert.strictEqual((await res.json()).received, true);

  // El pago quedó registrado en la matrícula
  const actualizada = await Matricula.findById(matricula._id);
  assert.strictEqual(actualizada.totalPagado, 120000);
  assert.strictEqual(actualizada.saldoPendiente, 180000); // 300000 - 120000
  assert.strictEqual(actualizada.pagos.length, 1);
  assert.strictEqual(actualizada.pagos[0].metodo, 'stripe');
  assert.strictEqual(actualizada.pagos[0].stripePaymentId, 'pi_test_fake_123');
});

test('Webhook: firma inválida se rechaza con 400 y no registra nada', async () => {
  const matricula = await Matricula.findOne({
    estudiante: datos.estudiante._id,
  });
  const pagosAntes = matricula.pagos.length;

  const payload = JSON.stringify({
    id: 'evt_malo',
    type: 'checkout.session.completed',
    data: { object: { metadata: { matriculaId: String(matricula._id), monto: '999999' } } },
  });

  const res = await postWebhook(payload, 't=123,v1=firma_falsa');
  assert.strictEqual(res.status, 400);

  const sinCambios = await Matricula.findById(matricula._id);
  assert.strictEqual(sinCambios.pagos.length, pagosAntes);
  assert.ok(!sinCambios.pagos.some((p) => p.monto === 999999));
});

test('Webhook: evento de otro tipo se ignora sin error', async () => {
  const payload = JSON.stringify({
    id: 'evt_otro',
    type: 'payment_intent.created',
    data: { object: {} },
  });
  const res = await postWebhook(payload, firmarPayload(payload));
  assert.strictEqual(res.status, 200);
});
