// Estudiantes vía API: paginación, búsqueda por cédula, 404s,
// actualización con cédula duplicada y restricción de borrado.

const { test, before, after } = require('node:test');
const mongoose = require('mongoose');
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
let datos;
let cookieAdmin;
let Estudiante;
let Matricula;

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

before(async () => {
  await conectarTestDB('schoolnode_test_estudiantes');
  await limpiarDB();

  const app = require('../src/app');
  server = app.listen(0);
  await new Promise((resolve) => server.once('listening', resolve));
  baseURL = `http://127.0.0.1:${server.address().port}`;

  Estudiante = require('../src/models/Estudiante');
  Matricula = require('../src/models/Matricula');
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
// PAGINACIÓN Y BÚSQUEDA
// ============================================================

test('Estudiantes: GET pagina y calcula total y páginas', async () => {
  // El dataset base ya trae 1 estudiante; agregar 3 más
  const cedulas = ['4001', '4002', '4003'];
  for (const cedula of cedulas) {
    await api('/api/estudiantes', {
      method: 'POST',
      cookie: cookieAdmin,
      body: { nombre: 'Pagi', apellido: 'Nado', cedula },
    });
  }

  const res = await api('/api/estudiantes?page=2&limit=2', { cookie: cookieAdmin });
  assert.strictEqual(res.status, 200);
  const resultado = await res.json();
  assert.strictEqual(resultado.total, 4);
  assert.strictEqual(resultado.pages, 2);
  assert.strictEqual(resultado.currentPage, 2);
  assert.strictEqual(resultado.estudiantes.length, 2);
});

test('Estudiantes: GET filtra por búsqueda parcial de cédula', async () => {
  const res = await api('/api/estudiantes?cedula=400', { cookie: cookieAdmin });
  assert.strictEqual(res.status, 200);
  const resultado = await res.json();
  assert.strictEqual(resultado.total, 3);
  assert.ok(resultado.estudiantes.every((e) => e.cedula.includes('400')));
});

test('Estudiantes: GET de un id inexistente responde 404', async () => {
  const idInexistente = new mongoose.Types.ObjectId();
  const res = await api(`/api/estudiantes/${idInexistente}`, { cookie: cookieAdmin });
  assert.strictEqual(res.status, 404);
});

// ============================================================
// ACTUALIZACIÓN
// ============================================================

test('Estudiantes: PUT con cédula de otro estudiante responde 400', async () => {
  // El estudiante base tiene la cédula 999888777
  const nuevo = await api('/api/estudiantes', {
    method: 'POST',
    cookie: cookieAdmin,
    body: { nombre: 'Otro', apellido: 'Estudiante', cedula: '5001' },
  });
  const creado = await nuevo.json();

  const res = await api(`/api/estudiantes/${creado._id}`, {
    method: 'PUT',
    cookie: cookieAdmin,
    body: { cedula: datos.estudiante.cedula },
  });
  assert.strictEqual(res.status, 400);
  assert.strictEqual((await res.json()).error, 'Cédula ya registrada');
});

test('Estudiantes: PUT actualiza datos correctamente', async () => {
  const res = await api(`/api/estudiantes/${datos.estudiante._id}`, {
    method: 'PUT',
    cookie: cookieAdmin,
    body: { telefono: '5551234', direccion: 'Calle 1' },
  });
  assert.strictEqual(res.status, 200);
  const actualizado = await res.json();
  assert.strictEqual(actualizado.telefono, '5551234');
  assert.strictEqual(actualizado.direccion, 'Calle 1');
});

// ============================================================
// RESTRICCIÓN DE BORRADO
// ============================================================

test('Estudiantes: no se elimina si tiene matrícula morosa', async () => {
  const estudiante = await Estudiante.crearNuevo({
    nombre: 'Pendiente',
    apellido: 'Test',
    cedula: '6001',
  });

  const matricula = await Matricula.crearNueva({
    estudianteId: estudiante._id,
    cursoId: datos.curso._id,
    aulaId: datos.aula._id,
  });
  await matricula.cambiarEstado('moroso');

  const res = await api(`/api/estudiantes/${estudiante._id}`, {
    method: 'DELETE',
    cookie: cookieAdmin,
  });
  assert.strictEqual(res.status, 400);
  assert.match((await res.json()).error, /matrículas activas o pendientes/);
});

test('Estudiantes: se elimina cuando ya no tiene matrículas pendientes', async () => {
  const estudiante = await Estudiante.crearNuevo({
    nombre: 'Sin',
    apellido: 'Matricula',
    cedula: '6002',
  });

  const res = await api(`/api/estudiantes/${estudiante._id}`, {
    method: 'DELETE',
    cookie: cookieAdmin,
  });
  assert.strictEqual(res.status, 200);

  // Ya no aparece en la lista
  const lista = await api('/api/estudiantes?cedula=6002', { cookie: cookieAdmin });
  const resultado = await lista.json();
  assert.strictEqual(resultado.total, 0);
});
