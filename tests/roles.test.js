// Matriz de autorización: verifica qué puede hacer cada rol en cada endpoint.
// Reglas esperadas:
//  - GET (ver) en estudiantes/cursos/aulas/matrículas/facturas: admin Y empleado
//  - POST/PUT/DELETE en estudiantes/cursos/aulas/matrículas: SOLO admin
//  - /api/empleados y /api/configuracion completos: SOLO admin
//  - Pagos (crear-sesion, fisico): admin Y empleado

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

before(async () => {
  await conectarTestDB('schoolnode_test_roles');
  await limpiarDB();

  const app = require('../src/app');
  server = app.listen(0);
  await new Promise((resolve) => server.once('listening', resolve));
  baseURL = `http://127.0.0.1:${server.address().port}`;

  datos = await crearDatosBase();

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

// ============================================================
// SIN SESIÓN: todo lo protegido debe dar 401
// ============================================================

test('Roles: sin sesión, TODOS los endpoints protegidos dan 401', async () => {
  const rutas = [
    ['GET', '/api/estudiantes'],
    ['GET', '/api/cursos'],
    ['GET', '/api/aulas'],
    ['GET', '/api/matriculas'],
    ['GET', '/api/empleados'],
    ['GET', '/api/configuracion'],
    ['GET', '/api/auth/me'],
    ['POST', '/api/pagos/fisico'],
    ['GET', `/api/pagos/factura/total/${datos.curso._id}`],
  ];
  for (const [method, ruta] of rutas) {
    const res = await api(ruta, { method });
    assert.strictEqual(res.status, 401, `${method} ${ruta} debería dar 401`);
  }
});

// ============================================================
// EMPLEADO: puede VER, pero NO crear/modificar/eliminar
// ============================================================

test('Roles: empleado puede VER estudiantes, cursos, aulas y matrículas (200)', async () => {
  const resEst = await api('/api/estudiantes', { cookie: cookieEmpleado });
  assert.strictEqual(resEst.status, 200);

  const resCur = await api('/api/cursos', { cookie: cookieEmpleado });
  assert.strictEqual(resCur.status, 200);

  const resAula = await api('/api/aulas', { cookie: cookieEmpleado });
  assert.strictEqual(resAula.status, 200);

  const resMat = await api('/api/matriculas', { cookie: cookieEmpleado });
  assert.strictEqual(resMat.status, 200);
});

test('Roles: empleado NO puede crear estudiantes, aulas ni matrículas (403)', async () => {
  const resEst = await api('/api/estudiantes', {
    method: 'POST',
    cookie: cookieEmpleado,
    body: { nombre: 'X', apellido: 'Y', cedula: '999999999' },
  });
  assert.strictEqual(resEst.status, 403);

  const resAula = await api('/api/aulas', {
    method: 'POST',
    cookie: cookieEmpleado,
    body: { numero: 'A99', capacidad: 10 },
  });
  assert.strictEqual(resAula.status, 403);

  const resMat = await api('/api/matriculas', {
    method: 'POST',
    cookie: cookieEmpleado,
    body: {
      estudianteId: String(datos.estudiante._id),
      cursoId: String(datos.curso._id),
      aulaId: String(datos.aula._id),
    },
  });
  assert.strictEqual(resMat.status, 403);
});

test('Roles: empleado NO puede modificar ni eliminar estudiantes/cursos/aulas/matrículas (403)', async () => {
  const idEst = datos.estudiante._id;
  const idCur = datos.curso._id;
  const idAula = datos.aula._id;
  const idMat = new mongoose.Types.ObjectId();

  const acciones = [
    ['PUT', `/api/estudiantes/${idEst}`, { nombre: 'Cambio' }],
    ['DELETE', `/api/estudiantes/${idEst}`],
    ['PUT', `/api/cursos/${idCur}`, { precio: 1 }],
    ['DELETE', `/api/cursos/${idCur}`],
    ['PUT', `/api/aulas/${idAula}`, { capacidad: 1 }],
    ['DELETE', `/api/aulas/${idAula}`],
    ['PUT', `/api/matriculas/${idMat}`, { estado: 'cancelada' }],
    ['DELETE', `/api/matriculas/${idMat}`],
    ['POST', '/api/matriculas/migrar', { matriculaId: idMat, nuevoAulaId: idAula }],
  ];
  for (const [method, ruta, body] of acciones) {
    const res = await api(ruta, { method, cookie: cookieEmpleado, body });
    assert.strictEqual(res.status, 403, `${method} ${ruta} debería dar 403`);
  }
});

test('Roles: empleado NO puede ver empleados ni configuración (403)', async () => {
  const resEmp = await api('/api/empleados', { cookie: cookieEmpleado });
  assert.strictEqual(resEmp.status, 403);

  const resConf = await api('/api/configuracion', { cookie: cookieEmpleado });
  assert.strictEqual(resConf.status, 403);
});

test('Roles: empleado SÍ puede crear sesiones de pago y pagos físicos', async () => {
  // Matrícula creada por admin para poder pagar
  const resMat = await api('/api/matriculas', {
    method: 'POST',
    cookie: cookieAdmin,
    body: {
      estudianteId: String(datos.estudiante._id),
      cursoId: String(datos.curso._id),
      aulaId: String(datos.aula._id),
    },
  });
  assert.strictEqual(resMat.status, 201);
  const matricula = await resMat.json();

  const resSesion = await api('/api/pagos/crear-sesion', {
    method: 'POST',
    cookie: cookieEmpleado,
    body: { matriculaId: matricula._id, monto: 10000 },
  });
  assert.strictEqual(resSesion.status, 200);

  const resFisico = await api('/api/pagos/fisico', {
    method: 'POST',
    cookie: cookieEmpleado,
    body: { matriculaId: matricula._id, monto: 10000 },
  });
  assert.strictEqual(resFisico.status, 200);
});

// ============================================================
// ADMIN: puede hacer todo
// ============================================================

test('Roles: admin crea aula, empleado y actualiza configuración', async () => {
  const resAula = await api('/api/aulas', {
    method: 'POST',
    cookie: cookieAdmin,
    body: { numero: 'R01', capacidad: 5 },
  });
  assert.strictEqual(resAula.status, 201);

  const resEmp = await api('/api/empleados', {
    method: 'POST',
    cookie: cookieAdmin,
    body: {
      email: 'nuevo.empleado@test.com',
      password: 'Password123!',
      nombre: 'Nuevo',
      rol: 'empleado',
    },
  });
  assert.strictEqual(resEmp.status, 201);

  const resConf = await api('/api/configuracion', {
    method: 'PUT',
    cookie: cookieAdmin,
    body: { nombreInstitucion: 'Institución de Test' },
  });
  assert.strictEqual(resConf.status, 200);
});

test('Roles: admin puede leer empleados y configuración', async () => {
  const resEmp = await api('/api/empleados', { cookie: cookieAdmin });
  assert.strictEqual(resEmp.status, 200);
  const empleados = await resEmp.json();
  assert.ok(empleados.some((e) => e.rol === 'admin'));
  assert.ok(empleados.some((e) => e.rol === 'empleado'));

  const resConf = await api('/api/configuracion', { cookie: cookieAdmin });
  assert.strictEqual(resConf.status, 200);
});
