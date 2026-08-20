// Pruebas del flujo de cambio de credenciales con verificación por correo.
// En NODE_ENV=test el mailer NO envía correos reales: quedan en memoria
// y las pruebas extraen el código de 6 dígitos del HTML generado.

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
let cookieEmpleado;
let mailer;
let TokenAccion;

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

// Saca el código de 6 dígitos del último correo "enviado" en modo test
const obtenerCodigoDelCorreo = () => {
  const correo = mailer._obtenerUltimoCorreoTest();
  assert.ok(correo, 'Debe haberse generado un correo');
  const match = correo.html.match(/\b(\d{6})\b/);
  assert.ok(match, 'El correo debe contener un código de 6 dígitos');
  // jsonTransport entrega "to" como array de objetos { address, name }
  const para = Array.isArray(correo.to) ? correo.to[0].address : correo.to;
  return { codigo: match[1], para };
};

before(async () => {
  await conectarTestDB('schoolnode_test_email');
  await limpiarDB();

  const app = require('../src/app');
  server = app.listen(0);
  await new Promise((resolve) => server.once('listening', resolve));
  baseURL = `http://127.0.0.1:${server.address().port}`;

  mailer = require('../src/config/mailer');
  TokenAccion = require('../src/models/TokenAccion');

  await crearDatosBase();

  const res = await api('/api/auth/login', {
    method: 'POST',
    body: { email: 'empleado@test.com', password: 'Empleado123!' },
  });
  cookieEmpleado = extraerCookies(res);
});

after(async () => {
  server.close();
  await limpiarDB();
  await desconectarDB();
});

test('Cambio contraseña: rechaza contraseña actual incorrecta (400)', async () => {
  const res = await api('/api/auth/cambiar-password', {
    method: 'POST',
    cookie: cookieEmpleado,
    body: { passwordActual: 'NoEsEsta123', nuevaPassword: 'NuevaClave123!' },
  });
  assert.strictEqual(res.status, 400);
  assert.match((await res.json()).error, /contraseña actual es incorrecta/);
});

test('Cambio contraseña: valida campos con express-validator (400)', async () => {
  const res = await api('/api/auth/cambiar-password', {
    method: 'POST',
    cookie: cookieEmpleado,
    body: { passwordActual: '', nuevaPassword: 'corta' },
  });
  assert.strictEqual(res.status, 400);
  const json = await res.json();
  assert.ok(json.errores.length >= 2);
});

test('Cambio contraseña: flujo completo con código por correo', async () => {
  // 1. Solicitar el cambio
  const resSol = await api('/api/auth/cambiar-password', {
    method: 'POST',
    cookie: cookieEmpleado,
    body: { passwordActual: 'Empleado123!', nuevaPassword: 'NuevaClave123!' },
  });
  assert.strictEqual(resSol.status, 200);

  // El correo va dirigido al correo ACTUAL del usuario
  const { codigo, para } = obtenerCodigoDelCorreo();
  assert.strictEqual(para, 'empleado@test.com');

  // 2. Código incorrecto → 400
  const resMal = await api('/api/auth/confirmar-cambio', {
    method: 'POST',
    cookie: cookieEmpleado,
    body: { codigo: codigo === '000000' ? '000001' : '000000' },
  });
  assert.strictEqual(resMal.status, 400);
  assert.match((await resMal.json()).error, /Código incorrecto/);

  // 3. Código correcto → 200 y avisa que debe iniciar sesión de nuevo
  const resOk = await api('/api/auth/confirmar-cambio', {
    method: 'POST',
    cookie: cookieEmpleado,
    body: { codigo },
  });
  assert.strictEqual(resOk.status, 200);
  assert.strictEqual((await resOk.json()).cerrarSesion, true);

  // 4. El token se consumió: reusarlo falla
  const resReuso = await api('/api/auth/confirmar-cambio', {
    method: 'POST',
    cookie: cookieEmpleado,
    body: { codigo },
  });
  assert.strictEqual(resReuso.status, 400);

  // 5. La contraseña vieja ya no sirve, la nueva sí
  const resVieja = await api('/api/auth/login', {
    method: 'POST',
    body: { email: 'empleado@test.com', password: 'Empleado123!' },
  });
  assert.strictEqual(resVieja.status, 401);

  const resNueva = await api('/api/auth/login', {
    method: 'POST',
    body: { email: 'empleado@test.com', password: 'NuevaClave123!' },
  });
  assert.strictEqual(resNueva.status, 200);
  cookieEmpleado = extraerCookies(resNueva); // actualizar cookie para las demás pruebas
});

test('Cambio email: rechaza un correo ya en uso (400)', async () => {
  const res = await api('/api/auth/cambiar-email', {
    method: 'POST',
    cookie: cookieEmpleado,
    body: { nuevoEmail: 'admin@test.com' },
  });
  assert.strictEqual(res.status, 400);
  assert.match((await res.json()).error, /ya está en uso/);
});

test('Cambio email: flujo completo con código al NUEVO correo', async () => {
  const resSol = await api('/api/auth/cambiar-email', {
    method: 'POST',
    cookie: cookieEmpleado,
    body: { nuevoEmail: 'empleado.nuevo@test.com' },
  });
  assert.strictEqual(resSol.status, 200);

  // El código se envía al NUEVO correo (para verificar que le pertenece)
  const { codigo, para } = obtenerCodigoDelCorreo();
  assert.strictEqual(para, 'empleado.nuevo@test.com');

  const resOk = await api('/api/auth/confirmar-cambio', {
    method: 'POST',
    cookie: cookieEmpleado,
    body: { codigo },
  });
  assert.strictEqual(resOk.status, 200);

  // Login con el correo nuevo funciona, con el viejo no
  const resViejo = await api('/api/auth/login', {
    method: 'POST',
    body: { email: 'empleado@test.com', password: 'NuevaClave123!' },
  });
  assert.strictEqual(resViejo.status, 401);

  const resNuevo = await api('/api/auth/login', {
    method: 'POST',
    body: { email: 'empleado.nuevo@test.com', password: 'NuevaClave123!' },
  });
  assert.strictEqual(resNuevo.status, 200);
});

test('Token: código expirado se rechaza (400)', async () => {
  // Login de nuevo (el correo cambió en la prueba anterior)
  const resLogin = await api('/api/auth/login', {
    method: 'POST',
    body: { email: 'empleado.nuevo@test.com', password: 'NuevaClave123!' },
  });
  const cookie = extraerCookies(resLogin);

  await api('/api/auth/cambiar-password', {
    method: 'POST',
    cookie,
    body: { passwordActual: 'NuevaClave123!', nuevaPassword: 'OtraClave123!' },
  });
  const { codigo } = obtenerCodigoDelCorreo();

  // Forzar expiración directamente en la DB
  await TokenAccion.updateMany({}, { expira: new Date(Date.now() - 1000) });

  const res = await api('/api/auth/confirmar-cambio', {
    method: 'POST',
    cookie,
    body: { codigo },
  });
  assert.strictEqual(res.status, 400);
  assert.match((await res.json()).error, /expiró/);
});

// ============================================================
// RECORDATORIO DE PAGO (cercanía de vencimiento)
// ============================================================

test('Recordatorio: envía correo al email del estudiante con saldo y vencimiento', async () => {
  const Estudiante = require('../src/models/Estudiante');
  const Matricula = require('../src/models/Matricula');

  const estudiante = await Estudiante.crearNuevo({
    nombre: 'Estudiante',
    apellido: 'Recordatorio',
    cedula: '888000111',
    email: 'estudiante.recordatorio@test.com',
  });
  const curso = await require('../src/models/Curso').crearNuevo({
    nombre: 'Curso Recordatorio',
    precio: 250000,
    duracion: '2 semanas',
  });
  const aula = await require('../src/models/Aula').crearNueva({
    numero: 'REC1',
    capacidad: 10,
  });
  const matricula = await Matricula.crearNueva({
    estudianteId: estudiante._id,
    cursoId: curso._id,
    aulaId: aula._id,
  });

  const resLogin = await api('/api/auth/login', {
    method: 'POST',
    body: { email: 'empleado.nuevo@test.com', password: 'NuevaClave123!' },
  });
  const cookie = extraerCookies(resLogin);

  const res = await api(`/api/matriculas/${matricula._id}/notificar`, {
    method: 'POST',
    cookie,
  });
  assert.strictEqual(res.status, 200);
  const resultado = await res.json();
  assert.strictEqual(resultado.enviado, true);
  assert.strictEqual(resultado.para, 'estudiante.recordatorio@test.com');

  // El correo capturado en modo test tiene los datos del recordatorio
  const correo = mailer._obtenerUltimoCorreoTest();
  assert.ok(correo, 'Debe haberse generado el correo');
  const para = Array.isArray(correo.to) ? correo.to[0].address : correo.to;
  assert.strictEqual(para, 'estudiante.recordatorio@test.com');
  assert.match(correo.subject, /Recordatorio de pago/);
  assert.match(correo.html, /250\.000/);
  assert.match(correo.html, /Curso Recordatorio/);
});

test('Recordatorio: sin sesión responde 401', async () => {
  const idFalso = '000000000000000000000000';
  const res = await api(`/api/matriculas/${idFalso}/notificar`, { method: 'POST' });
  assert.strictEqual(res.status, 401);
});

test('Recordatorio: matrícula inexistente responde 404', async () => {
  const idInexistente = new (require('mongoose').Types.ObjectId)();
  const resLogin = await api('/api/auth/login', {
    method: 'POST',
    body: { email: 'empleado.nuevo@test.com', password: 'NuevaClave123!' },
  });
  const cookie = extraerCookies(resLogin);

  const res = await api(`/api/matriculas/${idInexistente}/notificar`, {
    method: 'POST',
    cookie,
  });
  assert.strictEqual(res.status, 404);
});

test('Recordatorio: estudiante sin correo responde 400', async () => {
  const Estudiante = require('../src/models/Estudiante');
  const Matricula = require('../src/models/Matricula');

  const estudiante = await Estudiante.crearNuevo({
    nombre: 'Sin',
    apellido: 'Correo',
    cedula: '888000222',
  });
  const curso = await require('../src/models/Curso').crearNuevo({
    nombre: 'Curso Sin Correo',
    precio: 100000,
    duracion: '1 semana',
  });
  const aula = await require('../src/models/Aula').crearNueva({
    numero: 'REC2',
    capacidad: 10,
  });
  const matricula = await Matricula.crearNueva({
    estudianteId: estudiante._id,
    cursoId: curso._id,
    aulaId: aula._id,
  });

  const resLogin = await api('/api/auth/login', {
    method: 'POST',
    body: { email: 'empleado.nuevo@test.com', password: 'NuevaClave123!' },
  });
  const cookie = extraerCookies(resLogin);

  const res = await api(`/api/matriculas/${matricula._id}/notificar`, {
    method: 'POST',
    cookie,
  });
  assert.strictEqual(res.status, 400);
  assert.match((await res.json()).error, /no tiene un correo/);
});

test('Recordatorio: matrícula sin saldo pendiente responde 400', async () => {
  const Estudiante = require('../src/models/Estudiante');
  const Matricula = require('../src/models/Matricula');

  const estudiante = await Estudiante.crearNuevo({
    nombre: 'Pago',
    apellido: 'Total',
    cedula: '888000333',
    email: 'pagado@test.com',
  });
  const curso = await require('../src/models/Curso').crearNuevo({
    nombre: 'Curso Pagado',
    precio: 100000,
    duracion: '1 semana',
  });
  const aula = await require('../src/models/Aula').crearNueva({
    numero: 'REC3',
    capacidad: 10,
  });
  const matricula = await Matricula.crearNueva({
    estudianteId: estudiante._id,
    cursoId: curso._id,
    aulaId: aula._id,
  });
  await matricula.agregarPago(100000, 'fisico');

  const resLogin = await api('/api/auth/login', {
    method: 'POST',
    body: { email: 'empleado.nuevo@test.com', password: 'NuevaClave123!' },
  });
  const cookie = extraerCookies(resLogin);

  const res = await api(`/api/matriculas/${matricula._id}/notificar`, {
    method: 'POST',
    cookie,
  });
  assert.strictEqual(res.status, 400);
  assert.match((await res.json()).error, /no tiene saldo pendiente/);
});
