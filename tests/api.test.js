// Pruebas de integración HTTP: levantan la app Express en un puerto efímero
// y ejercitan los endpoints con fetch, contra "schoolnode_test_api".

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
let datos;
let cookieAdmin; // cookies de sesión del admin
let cookieEmpleado;

// Extrae las cookies Set-Cookie de una respuesta como un header "Cookie"
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
  await conectarTestDB('schoolnode_test_api');
  await limpiarDB();

  // La app se importa DESPUÉS de definir las variables de entorno de prueba.
  // No conecta ni escucha sola gracias al guard require.main de app.js.
  const app = require('../src/app');
  server = app.listen(0);
  await new Promise((resolve) => server.once('listening', resolve));
  baseURL = `http://127.0.0.1:${server.address().port}`;

  datos = await crearDatosBase();

  // Login admin y empleado
  const resAdmin = await api('/api/auth/login', {
    method: 'POST',
    body: { email: 'admin@test.com', password: 'Admin123!' },
  });
  assert.strictEqual(resAdmin.status, 200);
  cookieAdmin = extraerCookies(resAdmin);

  const resEmp = await api('/api/auth/login', {
    method: 'POST',
    body: { email: 'empleado@test.com', password: 'Empleado123!' },
  });
  assert.strictEqual(resEmp.status, 200);
  cookieEmpleado = extraerCookies(resEmp);
});

after(async () => {
  server.close();
  await limpiarDB();
  await desconectarDB();
});

// ============================================================
// AUTENTICACIÓN
// ============================================================

test('API login: sin datos responde 400 con errores de validación', async () => {
  const res = await api('/api/auth/login', { method: 'POST', body: {} });
  assert.strictEqual(res.status, 400);
  const json = await res.json();
  assert.ok(Array.isArray(json.errores));
});

test('API login: credenciales incorrectas responden 401', async () => {
  const res = await api('/api/auth/login', {
    method: 'POST',
    body: { email: 'admin@test.com', password: 'mala-password' },
  });
  assert.strictEqual(res.status, 401);
  const json = await res.json();
  assert.strictEqual(json.error, 'Credenciales inválidas');
});

test('API login: correcto devuelve usuario sin password y fija cookies', async () => {
  const res = await api('/api/auth/login', {
    method: 'POST',
    body: { email: 'admin@test.com', password: 'Admin123!' },
  });
  assert.strictEqual(res.status, 200);
  const json = await res.json();
  assert.strictEqual(json.usuario.email, 'admin@test.com');
  assert.strictEqual(json.usuario.password, undefined);
  assert.strictEqual(json.usuario.refreshToken, undefined);
  assert.ok(res.headers.getSetCookie().some((c) => c.startsWith('accessToken=')));
  assert.ok(res.headers.getSetCookie().some((c) => c.startsWith('refreshToken=')));
});

test('API rutas protegidas: sin sesión responden 401', async () => {
  const res = await api('/api/estudiantes');
  assert.strictEqual(res.status, 401);
});

test('API refresh: renueva el access token con la cookie de refresh', async () => {
  // Sesión fresca: la rotación de tokens invalida cookies de logins anteriores
  const resLogin = await api('/api/auth/login', {
    method: 'POST',
    body: { email: 'admin@test.com', password: 'Admin123!' },
  });
  const cookie = extraerCookies(resLogin);

  const res = await api('/api/auth/refresh', { method: 'POST', cookie });
  assert.strictEqual(res.status, 200);
  const json = await res.json();
  assert.ok(json.accessToken);
});

// ============================================================
// VALIDACIONES (express-validator)
// ============================================================

test('API estudiantes: cédula con letras rechazada por express-validator (400)', async () => {
  const res = await api('/api/estudiantes', {
    method: 'POST',
    cookie: cookieAdmin,
    body: { nombre: 'Test', apellido: 'Test', cedula: 'ABC' },
  });
  assert.strictEqual(res.status, 400);
  const json = await res.json();
  assert.ok(json.errores.some((e) => e.path === 'cedula'));
});

test('API estudiantes: id inválido en la URL responde 400 (isMongoId)', async () => {
  const res = await api('/api/estudiantes/no-es-un-id', { cookie: cookieAdmin });
  assert.strictEqual(res.status, 400);
});

test('API estudiantes: PUT valida email inválido (validación nueva en PUT)', async () => {
  const res = await api(`/api/estudiantes/${datos.estudiante._id}`, {
    method: 'PUT',
    cookie: cookieAdmin,
    body: { email: 'correo-malo' },
  });
  assert.strictEqual(res.status, 400);
});

test('API matrículas: ids inválidos en el body responden 400', async () => {
  const res = await api('/api/matriculas', {
    method: 'POST',
    cookie: cookieAdmin,
    body: { estudianteId: 'x', cursoId: 'y', aulaId: 'z' },
  });
  assert.strictEqual(res.status, 400);
  const json = await res.json();
  assert.strictEqual(json.errores.length, 3);
});

test('API pagos: monto 0 es rechazado (min: 1)', async () => {
  const res = await api('/api/pagos/fisico', {
    method: 'POST',
    cookie: cookieAdmin,
    body: { matriculaId: String(datos.estudiante._id), monto: 0 },
  });
  assert.strictEqual(res.status, 400);
});

// ============================================================
// ROLES
// ============================================================

test('API roles: empleado NO puede crear cursos (403), admin sí (201)', async () => {
  const resEmp = await api('/api/cursos', {
    method: 'POST',
    cookie: cookieEmpleado,
    body: { nombre: 'Curso Prohibido', precio: 1000, duracion: '1 semana' },
  });
  assert.strictEqual(resEmp.status, 403);

  const resAdmin = await api('/api/cursos', {
    method: 'POST',
    cookie: cookieAdmin,
    body: { nombre: 'Curso Permitido', precio: 1000, duracion: '1 semana' },
  });
  assert.strictEqual(resAdmin.status, 201);
});

// ============================================================
// FLUJO COMPLETO: estudiante → matrícula → pagos → factura
// ============================================================

test('API flujo completo: CRUD estudiante, matrícula, pagos y factura PDF', async () => {
  // 1. Crear estudiante
  const resEst = await api('/api/estudiantes', {
    method: 'POST',
    cookie: cookieAdmin,
    body: { nombre: 'Flujo', apellido: 'Completo', cedula: '777111' },
  });
  assert.strictEqual(resEst.status, 201);
  const estudiante = await resEst.json();

  // 1b. Cédula duplicada → 400
  const resDup = await api('/api/estudiantes', {
    method: 'POST',
    cookie: cookieAdmin,
    body: { nombre: 'Flujo', apellido: 'Duplicado', cedula: '777111' },
  });
  assert.strictEqual(resDup.status, 400);
  assert.strictEqual((await resDup.json()).error, 'Cédula ya registrada');

  // 2. Listar con búsqueda por cédula
  const resLista = await api('/api/estudiantes?cedula=777111', { cookie: cookieAdmin });
  const lista = await resLista.json();
  assert.strictEqual(lista.total, 1);

  // 3. Crear matrícula
  const resMat = await api('/api/matriculas', {
    method: 'POST',
    cookie: cookieAdmin,
    body: {
      estudianteId: estudiante._id,
      cursoId: String(datos.curso._id),
      aulaId: String(datos.aula._id),
    },
  });
  assert.strictEqual(resMat.status, 201);
  const matricula = await resMat.json();
  assert.strictEqual(matricula.saldoPendiente, 300000);

  // 3b. Segunda matrícula activa → 400
  const resMat2 = await api('/api/matriculas', {
    method: 'POST',
    cookie: cookieAdmin,
    body: {
      estudianteId: estudiante._id,
      cursoId: String(datos.curso._id),
      aulaId: String(datos.aula._id),
    },
  });
  assert.strictEqual(resMat2.status, 400);

  // 4. Pago físico (empleado puede)
  const resPago = await api('/api/pagos/fisico', {
    method: 'POST',
    cookie: cookieEmpleado,
    body: { matriculaId: matricula._id, monto: 100000 },
  });
  assert.strictEqual(resPago.status, 200);
  const conPago = await resPago.json();
  assert.strictEqual(conPago.totalPagado, 100000);
  assert.strictEqual(conPago.saldoPendiente, 200000);

  // 5. Sesión de pago simulada (Stripe en modo simulación por claves placeholder)
  const resSesion = await api('/api/pagos/crear-sesion', {
    method: 'POST',
    cookie: cookieEmpleado,
    body: { matriculaId: matricula._id, monto: 200000 },
  });
  assert.strictEqual(resSesion.status, 200);
  const sesion = await resSesion.json();
  assert.strictEqual(sesion.modo, 'simulacion');

  // 6. Confirmar pago simulado → saldo 0 y estado activa
  const resConf = await api('/api/pagos/confirmar-simulacion', {
    method: 'POST',
    cookie: cookieEmpleado,
    body: { matriculaId: matricula._id, monto: 200000 },
  });
  assert.strictEqual(resConf.status, 200);
  const confirmada = (await resConf.json()).matricula;
  assert.strictEqual(confirmada.saldoPendiente, 0);
  assert.strictEqual(confirmada.estado, 'activa');

  // 7. Listar matrículas (incluye semaforización)
  const resMats = await api('/api/matriculas', { cookie: cookieAdmin });
  assert.strictEqual(resMats.status, 200);
  const mats = await resMats.json();
  assert.ok(mats.some((m) => m._id === matricula._id));

  // 8. Factura PDF
  const resPdf = await api(`/api/pagos/factura/total/${matricula._id}`, {
    cookie: cookieAdmin,
  });
  assert.strictEqual(resPdf.status, 200);
  assert.match(resPdf.headers.get('content-type'), /application\/pdf/);
  const bytes = await resPdf.arrayBuffer();
  assert.ok(bytes.byteLength > 500, 'El PDF no debe estar vacío');

  // 9. Eliminar estudiante con matrícula activa → 400
  const resDel = await api(`/api/estudiantes/${estudiante._id}`, {
    method: 'DELETE',
    cookie: cookieAdmin,
  });
  assert.strictEqual(resDel.status, 400);

  // 10. Cancelar matrícula y luego sí eliminar estudiante
  const resCancel = await api(`/api/matriculas/${matricula._id}`, {
    method: 'DELETE',
    cookie: cookieAdmin,
  });
  assert.strictEqual(resCancel.status, 200);

  const resDel2 = await api(`/api/estudiantes/${estudiante._id}`, {
    method: 'DELETE',
    cookie: cookieAdmin,
  });
  assert.strictEqual(resDel2.status, 200);
});

// ============================================================
// LOGOUT
// ============================================================

test('API logout: cierra sesión y el refresh token queda inválido', async () => {
  // Sesión nueva para no afectar cookieAdmin de otras pruebas
  const resLogin = await api('/api/auth/login', {
    method: 'POST',
    body: { email: 'empleado@test.com', password: 'Empleado123!' },
  });
  const cookie = extraerCookies(resLogin);

  const resLogout = await api('/api/auth/logout', { method: 'POST', cookie });
  assert.strictEqual(resLogout.status, 200);

  // El refresh token guardado en DB se eliminó: refrescar debe fallar
  const resRefresh = await api('/api/auth/refresh', { method: 'POST', cookie });
  assert.strictEqual(resRefresh.status, 401);
});
