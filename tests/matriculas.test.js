// Reglas de negocio de matrículas ejercitadas vía API:
//   - validaciones de existencia (404)
//   - doble matrícula activa (400)
//   - cupo del aula al matricular (400)
//   - pagos parciales y saldos
//   - morosidad automática por vencimiento
//   - migración de aula con control de cupo

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
let Curso;
let Aula;
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

const crearMatriculaApi = (estudianteId, cursoId, aulaId) =>
  api('/api/matriculas', {
    method: 'POST',
    cookie: cookieAdmin,
    body: { estudianteId, cursoId, aulaId },
  });

before(async () => {
  await conectarTestDB('schoolnode_test_matriculas');
  await limpiarDB();

  // El índice único viejo (estudiante+curso SIN filtro) persiste entre corridas
  // porque limpiarDB solo borra documentos. Se elimina para que mongoose cree
  // el índice parcial nuevo (solo matrículas activas).
  await mongoose.connection.dropCollection('matriculas').catch(() => {});

  const app = require('../src/app');
  server = app.listen(0);
  await new Promise((resolve) => server.once('listening', resolve));
  baseURL = `http://127.0.0.1:${server.address().port}`;

  Matricula = require('../src/models/Matricula');
  Curso = require('../src/models/Curso');
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

// ============================================================
// VALIDACIONES DE EXISTENCIA (404)
// ============================================================

test('Matrícula: estudiante, curso o aula inexistentes responden 404', async () => {
  const idInexistente = new mongoose.Types.ObjectId();

  const resEst = await crearMatriculaApi(idInexistente, datos.curso._id, datos.aula._id);
  assert.strictEqual(resEst.status, 404);

  const resCur = await crearMatriculaApi(datos.estudiante._id, idInexistente, datos.aula._id);
  assert.strictEqual(resCur.status, 404);

  const resAula = await crearMatriculaApi(datos.estudiante._id, datos.curso._id, idInexistente);
  assert.strictEqual(resAula.status, 404);
});

test('Matrícula: curso inactivo o aula inactiva responden 404', async () => {
  const curso = await Curso.crearNuevo({
    nombre: 'Curso Inactivo',
    precio: 100000,
    duracion: '2 semanas',
  });
  await curso.desactivar();

  const aula = await Aula.crearNueva({ numero: 'T99', capacidad: 10 });
  await aula.desactivar();

  const resCur = await crearMatriculaApi(datos.estudiante._id, curso._id, datos.aula._id);
  assert.strictEqual(resCur.status, 404);

  const resAula = await crearMatriculaApi(datos.estudiante._id, datos.curso._id, aula._id);
  assert.strictEqual(resAula.status, 404);
});

test('Matrícula: GET de una matrícula inexistente responde 404', async () => {
  const idInexistente = new mongoose.Types.ObjectId();
  const res = await api(`/api/matriculas/${idInexistente}`, { cookie: cookieAdmin });
  assert.strictEqual(res.status, 404);
});

// ============================================================
// DOBLE MATRÍCULA ACTIVA (400)
// ============================================================

test('Matrícula: un estudiante NO puede tener dos matrículas activas (400)', async () => {
  // El estudiante base no tiene matrícula aún (BD limpia por archivo)
  const res1 = await crearMatriculaApi(
    datos.estudiante._id,
    datos.curso._id,
    datos.aula._id
  );
  assert.strictEqual(res1.status, 201);

  const res2 = await crearMatriculaApi(
    datos.estudiante._id,
    datos.curso._id,
    datos.aula._id
  );
  assert.strictEqual(res2.status, 400);
  assert.match((await res2.json()).error, /matrícula activa/);
});

test('Matrícula: cancelar una matrícula libera al estudiante para matricularse de nuevo', async () => {
  // Buscar la matrícula activa del estudiante base
  const matricula = await Matricula.findOne({
    estudiante: datos.estudiante._id,
    estado: 'activa',
  });
  assert.ok(matricula);

  const resCancel = await api(`/api/matriculas/${matricula._id}`, {
    method: 'DELETE',
    cookie: cookieAdmin,
  });
  assert.strictEqual(resCancel.status, 200);

  const resNueva = await crearMatriculaApi(
    datos.estudiante._id,
    datos.curso._id,
    datos.aula._id
  );
  assert.strictEqual(resNueva.status, 201);
});

// ============================================================
// CUPO DEL AULA (400)
// ============================================================

test('Matrícula: aula llena rechaza nuevas matrículas (400)', async () => {
  const aula = await Aula.crearNueva({ numero: 'CUPO1', capacidad: 1 });
  const e1 = await Estudiante.crearNuevo({ nombre: 'Ana', apellido: 'Uno', cedula: '1001' });
  const e2 = await Estudiante.crearNuevo({ nombre: 'Beto', apellido: 'Dos', cedula: '1002' });

  const res1 = await crearMatriculaApi(e1._id, datos.curso._id, aula._id);
  assert.strictEqual(res1.status, 201);

  const res2 = await crearMatriculaApi(e2._id, datos.curso._id, aula._id);
  assert.strictEqual(res2.status, 400);
  assert.match((await res2.json()).error, /aula está llena/);
});

// ============================================================
// PAGOS PARCIALES Y SALDOS
// ============================================================

test('Matrícula: pagar por partes actualiza saldo y estado correctamente', async () => {
  const aula = await Aula.crearNueva({ numero: 'PAGOS1', capacidad: 10 });
  const estudiante = await Estudiante.crearNuevo({
    nombre: 'Pago',
    apellido: 'Parcial',
    cedula: '2001',
  });

  const res = await crearMatriculaApi(estudiante._id, datos.curso._id, aula._id);
  assert.strictEqual(res.status, 201);
  const matricula = await res.json();
  assert.strictEqual(matricula.saldoPendiente, 300000);
  assert.strictEqual(matricula.totalPagado, 0);

  // Pago parcial 1
  const resPago1 = await api('/api/pagos/fisico', {
    method: 'POST',
    cookie: cookieAdmin,
    body: { matriculaId: matricula._id, monto: 100000 },
  });
  assert.strictEqual(resPago1.status, 200);
  const conPago1 = await resPago1.json();
  assert.strictEqual(conPago1.totalPagado, 100000);
  assert.strictEqual(conPago1.saldoPendiente, 200000);

  // Pago parcial 2
  const resPago2 = await api('/api/pagos/fisico', {
    method: 'POST',
    cookie: cookieAdmin,
    body: { matriculaId: matricula._id, monto: 150000 },
  });
  const conPago2 = await resPago2.json();
  assert.strictEqual(conPago2.totalPagado, 250000);
  assert.strictEqual(conPago2.saldoPendiente, 50000);

  // Pago final: saldo en 0 y estado activa
  const resPago3 = await api('/api/pagos/fisico', {
    method: 'POST',
    cookie: cookieAdmin,
    body: { matriculaId: matricula._id, monto: 50000 },
  });
  const conPago3 = await resPago3.json();
  assert.strictEqual(conPago3.saldoPendiente, 0);
  assert.strictEqual(conPago3.estado, 'activa');
  assert.strictEqual(conPago3.pagos.length, 3);
});

test('Matrícula: pago mayor al saldo deja saldo 0 y registra el excedente', async () => {
  const aula = await Aula.crearNueva({ numero: 'PAGOS2', capacidad: 10 });
  const estudiante = await Estudiante.crearNuevo({
    nombre: 'Excede',
    apellido: 'Monto',
    cedula: '2002',
  });

  const res = await crearMatriculaApi(estudiante._id, datos.curso._id, aula._id);
  const matricula = await res.json();

  const resPago = await api('/api/pagos/fisico', {
    method: 'POST',
    cookie: cookieAdmin,
    body: { matriculaId: matricula._id, monto: 500000 },
  });
  assert.strictEqual(resPago.status, 200);
  const conPago = await resPago.json();
  assert.strictEqual(conPago.saldoPendiente, 0);
  assert.strictEqual(conPago.totalPagado, 500000);
});

// ============================================================
// MOROSIDAD AUTOMÁTICA
// ============================================================

test('Matrícula: vencida con saldo pasa a moroso al listar', async () => {
  const aula = await Aula.crearNueva({ numero: 'PAGOS3', capacidad: 10 });
  const estudiante = await Estudiante.crearNuevo({
    nombre: 'Moroso',
    apellido: 'Test',
    cedula: '2003',
  });

  const res = await crearMatriculaApi(estudiante._id, datos.curso._id, aula._id);
  const matricula = await res.json();

  // Forzar vencimiento en el pasado (7 días atrás) directamente en la DB
  await Matricula.updateOne(
    { _id: matricula._id },
    { fechaVencimiento: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) }
  );

  // GET /api/matriculas ejecuta la semaforización automática
  const resLista = await api('/api/matriculas', { cookie: cookieAdmin });
  assert.strictEqual(resLista.status, 200);
  const lista = await resLista.json();
  const actualizada = lista.find((m) => String(m._id) === String(matricula._id));
  assert.ok(actualizada);
  assert.strictEqual(actualizada.estado, 'moroso');
});

// ============================================================
// CAMBIO DE ESTADO VÍA PUT
// ============================================================

test('Matrícula: PUT con estado inválido responde 400', async () => {
  const aula = await Aula.crearNueva({ numero: 'PAGOS4', capacidad: 10 });
  const estudiante = await Estudiante.crearNuevo({
    nombre: 'Estado',
    apellido: 'Invalido',
    cedula: '2004',
  });
  const res = await crearMatriculaApi(estudiante._id, datos.curso._id, aula._id);
  const matricula = await res.json();

  const resPut = await api(`/api/matriculas/${matricula._id}`, {
    method: 'PUT',
    cookie: cookieAdmin,
    body: { estado: 'inexistente' },
  });
  assert.strictEqual(resPut.status, 400);
});

// ============================================================
// MIGRACIÓN DE AULA
// ============================================================

test('Matrícula: migrar a aula llena responde 400, a aula con cupo funciona', async () => {
  const aulaLlena = await Aula.crearNueva({ numero: 'LLENA', capacidad: 1 });
  const aulaVacia = await Aula.crearNueva({ numero: 'VACIA', capacidad: 5 });

  // Llenar el aula destino
  const e1 = await Estudiante.crearNuevo({ nombre: 'Llena', apellido: 'Uno', cedula: '3001' });
  const res1 = await crearMatriculaApi(e1._id, datos.curso._id, aulaLlena._id);
  assert.strictEqual(res1.status, 201);

  // Estudiante a migrar
  const e2 = await Estudiante.crearNuevo({ nombre: 'Migra', apellido: 'Dos', cedula: '3002' });
  const res2 = await crearMatriculaApi(e2._id, datos.curso._id, aulaVacia._id);
  const matricula = await res2.json();

  // Migrar al aula llena → 400
  const resM1 = await api('/api/matriculas/migrar', {
    method: 'POST',
    cookie: cookieAdmin,
    body: { matriculaId: matricula._id, nuevoAulaId: aulaLlena._id },
  });
  assert.strictEqual(resM1.status, 400);
  assert.match((await resM1.json()).error, /destino está llena/);

  // Migrar al aula vacía → 200 y aula actualizada
  const resM2 = await api('/api/matriculas/migrar', {
    method: 'POST',
    cookie: cookieAdmin,
    body: { matriculaId: matricula._id, nuevoAulaId: aulaVacia._id },
  });
  assert.strictEqual(resM2.status, 200);
  const migrada = await resM2.json();
  assert.strictEqual(String(migrada.aula), String(aulaVacia._id));
});

test('Matrícula: migrar una matrícula inexistente responde 404', async () => {
  const idInexistente = new mongoose.Types.ObjectId();
  const res = await api('/api/matriculas/migrar', {
    method: 'POST',
    cookie: cookieAdmin,
    body: { matriculaId: idInexistente, nuevoAulaId: String(datos.aula._id) },
  });
  assert.strictEqual(res.status, 404);
});

// ============================================================
// REGRESIONES: bugs corregidos
// ============================================================

test('Matrícula: una cancelada vencida con saldo NO pasa a moroso', async () => {
  const aula = await Aula.crearNueva({ numero: 'REG1', capacidad: 10 });
  const estudiante = await Estudiante.crearNuevo({
    nombre: 'Cancelada',
    apellido: 'Test',
    cedula: '7001',
  });
  const res = await crearMatriculaApi(estudiante._id, datos.curso._id, aula._id);
  const creada = await res.json();

  const matricula = await Matricula.findById(creada._id);
  await matricula.cancelar();

  // Vencida hace 30 días y con saldo pendiente
  await Matricula.updateOne(
    { _id: matricula._id },
    { fechaVencimiento: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) }
  );

  // GET /api/matriculas aplica verificarVencimiento a todas
  const resLista = await api('/api/matriculas', { cookie: cookieAdmin });
  assert.strictEqual(resLista.status, 200);
  const lista = await resLista.json();
  const actualizada = lista.find((m) => String(m._id) === String(matricula._id));
  assert.ok(actualizada);
  assert.strictEqual(actualizada.estado, 'cancelada', 'Una cancelada nunca vuelve a moroso');
});

test('Matrícula: lista responde 200 si un estudiante fue eliminado (ref nula)', async () => {
  // Escenario real de producción: estudiante eliminado dejando la matrícula huérfana
  const aula = await Aula.crearNueva({ numero: 'REG2', capacidad: 10 });
  const estudiante = await Estudiante.crearNuevo({
    nombre: 'Huerfano',
    apellido: 'Test',
    cedula: '7002',
  });
  const res = await crearMatriculaApi(estudiante._id, datos.curso._id, aula._id);
  const creada = await res.json();

  // Cancelar para poder eliminar al estudiante y romper la referencia
  const matricula = await Matricula.findById(creada._id);
  await matricula.cancelar();
  await estudiante.eliminar();

  const resLista = await api('/api/matriculas', { cookie: cookieAdmin });
  assert.strictEqual(resLista.status, 200);
  const lista = await resLista.json();
  const huerfana = lista.find((m) => String(m._id) === String(matricula._id));
  assert.ok(huerfana, 'La matrícula huérfana debe seguir listada');
  assert.strictEqual(huerfana.estudiante, null);
});
