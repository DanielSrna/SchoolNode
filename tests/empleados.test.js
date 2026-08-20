// Empleados y configuración vía API (ambos solo-admin):
//   - CRUD de empleados con validaciones y duplicados
//   - Borrado lógico bloquea el login
//   - Configuración: valores por defecto, actualización y
//     cambio de credenciales del admin

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

const crearEmpleadoApi = (datosEmpleado) =>
  api('/api/empleados', { method: 'POST', cookie: cookieAdmin, body: datosEmpleado });

before(async () => {
  await conectarTestDB('schoolnode_test_empleados');
  await limpiarDB();

  const app = require('../src/app');
  server = app.listen(0);
  await new Promise((resolve) => server.once('listening', resolve));
  baseURL = `http://127.0.0.1:${server.address().port}`;

  User = require('../src/models/User');
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
// CRUD DE EMPLEADOS
// ============================================================

test('Empleados: crear responde 201 sin exponer el password', async () => {
  const res = await crearEmpleadoApi({
    email: 'juan.perez@test.com',
    password: 'Password123!',
    nombre: 'Juan Pérez',
    rol: 'empleado',
  });
  assert.strictEqual(res.status, 201);
  const empleado = await res.json();
  assert.strictEqual(empleado.email, 'juan.perez@test.com');
  assert.strictEqual(empleado.password, undefined);
  assert.strictEqual(empleado.refreshToken, undefined);
});

test('Empleados: email duplicado responde 400', async () => {
  const res = await crearEmpleadoApi({
    email: 'admin@test.com',
    password: 'Password123!',
    nombre: 'Duplicado',
    rol: 'empleado',
  });
  assert.strictEqual(res.status, 400);
  assert.strictEqual((await res.json()).error, 'Email ya registrado');
});

test('Empleados: validaciones de email y contraseña (400)', async () => {
  const resEmail = await crearEmpleadoApi({
    email: 'correo-malo',
    password: 'Password123!',
    nombre: 'X',
    rol: 'empleado',
  });
  assert.strictEqual(resEmail.status, 400);

  const resPass = await crearEmpleadoApi({
    email: 'corta@test.com',
    password: 'corta',
    nombre: 'X',
    rol: 'empleado',
  });
  assert.strictEqual(resPass.status, 400);

  const resRol = await crearEmpleadoApi({
    email: 'rolmalo@test.com',
    password: 'Password123!',
    nombre: 'X',
    rol: 'estudiante',
  });
  assert.strictEqual(resRol.status, 400);
});

test('Empleados: listar y obtener por id', async () => {
  const resLista = await api('/api/empleados', { cookie: cookieAdmin });
  assert.strictEqual(resLista.status, 200);
  const lista = await resLista.json();
  // admin + empleado del dataset base + juan.perez creado en la 1ª prueba
  assert.strictEqual(lista.length, 3);

  const resUno = await api(`/api/empleados/${datos.empleado._id}`, { cookie: cookieAdmin });
  assert.strictEqual(resUno.status, 200);
  assert.strictEqual((await resUno.json()).email, 'empleado@test.com');
});

test('Empleados: obtener un id inexistente responde 404', async () => {
  const idInexistente = new mongoose.Types.ObjectId();
  const res = await api(`/api/empleados/${idInexistente}`, { cookie: cookieAdmin });
  assert.strictEqual(res.status, 404);
});

test('Empleados: actualizar con email de otro usuario responde 400', async () => {
  const res = await api(`/api/empleados/${datos.empleado._id}`, {
    method: 'PUT',
    cookie: cookieAdmin,
    body: { email: 'admin@test.com' },
  });
  assert.strictEqual(res.status, 400);
  assert.strictEqual((await res.json()).error, 'Email ya registrado');
});

test('Empleados: actualizar nombre funciona', async () => {
  const res = await api(`/api/empleados/${datos.empleado._id}`, {
    method: 'PUT',
    cookie: cookieAdmin,
    body: { nombre: 'Empleado Renombrado' },
  });
  assert.strictEqual(res.status, 200);
  assert.strictEqual((await res.json()).nombre, 'Empleado Renombrado');
});

test('Empleados: eliminar es borrado lógico y bloquea el login', async () => {
  const resCrear = await crearEmpleadoApi({
    email: 'eliminar@test.com',
    password: 'Password123!',
    nombre: 'A Eliminar',
    rol: 'empleado',
  });
  const empleado = await resCrear.json();

  const resDel = await api(`/api/empleados/${empleado._id}`, {
    method: 'DELETE',
    cookie: cookieAdmin,
  });
  assert.strictEqual(resDel.status, 200);

  // Ya no aparece al listar
  const resLista = await api('/api/empleados', { cookie: cookieAdmin });
  const lista = await resLista.json();
  assert.ok(!lista.some((e) => e.email === 'eliminar@test.com'));

  // Su sesión deja de funcionar
  const resLogin = await api('/api/auth/login', {
    method: 'POST',
    body: { email: 'eliminar@test.com', password: 'Password123!' },
  });
  assert.strictEqual(resLogin.status, 401);
  assert.strictEqual((await resLogin.json()).error, 'Cuenta desactivada');
});

// ============================================================
// CONFIGURACIÓN
// ============================================================

test('Configuración: GET crea y devuelve valores por defecto', async () => {
  const res = await api('/api/configuracion', { cookie: cookieAdmin });
  assert.strictEqual(res.status, 200);
  const config = await res.json();
  assert.strictEqual(config.nombreInstitucion, 'Motos BSA la 23');
  assert.strictEqual(config.facturacion.prefijoFactura, 'FAC');
});

test('Configuración: PUT actualiza campos simples y de facturación', async () => {
  const res = await api('/api/configuracion', {
    method: 'PUT',
    cookie: cookieAdmin,
    body: {
      nombreInstitucion: 'Escuela Nueva',
      telefono: '555-0000',
      facturacion: { prefijoFactura: 'SN' },
    },
  });
  assert.strictEqual(res.status, 200);
  const config = await res.json();
  assert.strictEqual(config.nombreInstitucion, 'Escuela Nueva');
  assert.strictEqual(config.telefono, '555-0000');
  assert.strictEqual(config.facturacion.prefijoFactura, 'SN');
});

test('Configuración: cambiar credenciales del admin funciona', async () => {
  const res = await api('/api/configuracion/cambiar-credenciales', {
    method: 'POST',
    cookie: cookieAdmin,
    body: { nuevoEmail: 'admin.nuevo@test.com' },
  });
  assert.strictEqual(res.status, 200);
  assert.strictEqual((await res.json()).mensaje, 'Credenciales actualizadas exitosamente');

  // El login con el correo viejo falla, con el nuevo funciona
  const resViejo = await api('/api/auth/login', {
    method: 'POST',
    body: { email: 'admin@test.com', password: 'Admin123!' },
  });
  assert.strictEqual(resViejo.status, 401);

  const resNuevo = await api('/api/auth/login', {
    method: 'POST',
    body: { email: 'admin.nuevo@test.com', password: 'Admin123!' },
  });
  assert.strictEqual(resNuevo.status, 200);
});

test('Configuración: cambiar credenciales con email en uso responde 400', async () => {
  // Restaurar el correo del admin (lo cambió la prueba anterior)
  const admin = await User.buscarPorEmail('admin.nuevo@test.com');
  await admin.cambiarCredenciales({ nuevoEmail: 'admin@test.com' });

  const res = await api('/api/configuracion/cambiar-credenciales', {
    method: 'POST',
    cookie: cookieAdmin,
    body: { nuevoEmail: 'empleado@test.com' },
  });
  assert.strictEqual(res.status, 400);
  assert.strictEqual((await res.json()).error, 'Email ya en uso');
});
