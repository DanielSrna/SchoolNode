// Facturas PDF: generación correcta, tipos válidos, errores 400/404
// y protección por sesión.

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
let Matricula;
let Aula;

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

// Crea una matrícula con su propia aula y su propio estudiante
// para no chocar con las reglas de matrícula única
const crearMatriculaFactura = async () => {
  const estudiante = await Estudiante.crearNuevo({
    nombre: 'Factura',
    apellido: 'Test',
    cedula: String(Math.floor(Math.random() * 1e9)),
  });
  const aula = await Aula.crearNueva({
    numero: `FA-${Math.floor(Math.random() * 1e6)}`,
    capacidad: 10,
  });
  return await Matricula.crearNueva({
    estudianteId: estudiante._id,
    cursoId: datos.curso._id,
    aulaId: aula._id,
  });
};

before(async () => {
  await conectarTestDB('schoolnode_test_facturas');
  await limpiarDB();

  const app = require('../src/app');
  server = app.listen(0);
  await new Promise((resolve) => server.once('listening', resolve));
  baseURL = `http://127.0.0.1:${server.address().port}`;

  Matricula = require('../src/models/Matricula');
  Aula = require('../src/models/Aula');
  Estudiante = require('../src/models/Estudiante');
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

test('Factura: requiere sesión (401 sin cookies)', async () => {
  const res = await api(`/api/pagos/factura/total/${datos.curso._id}`);
  assert.strictEqual(res.status, 401);
});

test('Factura: tipo inválido responde 400', async () => {
  const matricula = await crearMatriculaFactura();
  const res = await api(`/api/pagos/factura/descuento/${matricula._id}`, {
    cookie: cookieAdmin,
  });
  assert.strictEqual(res.status, 400);
});

test('Factura: matrícula inexistente responde 404', async () => {
  const idInexistente = new mongoose.Types.ObjectId();
  const res = await api(`/api/pagos/factura/total/${idInexistente}`, {
    cookie: cookieAdmin,
  });
  assert.strictEqual(res.status, 404);
});

test('Factura: total genera un PDF con los datos de la matrícula', async () => {
  const matricula = await crearMatriculaFactura();

  const res = await api(`/api/pagos/factura/total/${matricula._id}`, {
    cookie: cookieAdmin,
  });
  assert.strictEqual(res.status, 200);
  assert.match(res.headers.get('content-type'), /application\/pdf/);
  assert.match(res.headers.get('content-disposition'), /attachment; filename="factura-/);

  const bytes = await res.arrayBuffer();
  assert.ok(bytes.byteLength > 500, 'El PDF no debe estar vacío');
  // Todo PDF empieza con la firma %PDF
  const inicio = Buffer.from(bytes.slice(0, 4)).toString('latin1');
  assert.strictEqual(inicio, '%PDF');
});

test('Factura: aporte genera un PDF válido', async () => {
  const matricula = await crearMatriculaFactura();

  const res = await api(`/api/pagos/factura/aporte/${matricula._id}`, {
    cookie: cookieAdmin,
  });
  assert.strictEqual(res.status, 200);
  assert.match(res.headers.get('content-type'), /application\/pdf/);
  const bytes = await res.arrayBuffer();
  assert.strictEqual(Buffer.from(bytes.slice(0, 4)).toString('latin1'), '%PDF');
});

test('Factura: con pagos registrados el PDF incluye el detalle (más contenido)', async () => {
  const matricula = await crearMatriculaFactura();
  await matricula.agregarPago(100000, 'fisico');
  await matricula.agregarPago(50000, 'stripe', 'pi_test_detalle');

  const res = await api(`/api/pagos/factura/total/${matricula._id}`, {
    cookie: cookieAdmin,
  });
  assert.strictEqual(res.status, 200);
  const bytes = await res.arrayBuffer();

  // Comparar contra una factura de una matrícula sin pagos
  const matriculaSinPagos = await crearMatriculaFactura();
  const resVacia = await api(`/api/pagos/factura/total/${matriculaSinPagos._id}`, {
    cookie: cookieAdmin,
  });
  const bytesVacia = await resVacia.arrayBuffer();
  assert.ok(
    bytes.byteLength > bytesVacia.byteLength,
    'El PDF con pagos debe tener más contenido que el vacío'
  );
});

test('Factura: con estudiante eliminado no rompe (200 con PDF válido)', async () => {
  const matricula = await crearMatriculaFactura();
  await matricula.cancelar();
  await Estudiante.deleteOne({ _id: matricula.estudiante });

  const res = await api(`/api/pagos/factura/total/${matricula._id}`, {
    cookie: cookieAdmin,
  });
  assert.strictEqual(res.status, 200);
  assert.match(res.headers.get('content-type'), /application\/pdf/);
  const bytes = await res.arrayBuffer();
  assert.strictEqual(Buffer.from(bytes.slice(0, 4)).toString('latin1'), '%PDF');
});
