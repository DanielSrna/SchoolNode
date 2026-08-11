// Pruebas unitarias de los modelos: statics, methods, hooks y validaciones.
// Se ejecutan contra MongoDB local en la base "schoolnode_test_modelos".

const { test, before, after } = require('node:test');
const assert = require('node:assert');
const {
  conectarTestDB,
  limpiarDB,
  desconectarDB,
  silenciarLogger,
} = require('./helpers');

silenciarLogger();

let User, Estudiante, Curso, Aula, Matricula, Configuracion;

before(async () => {
  await conectarTestDB('schoolnode_test_modelos');
  await limpiarDB();
  User = require('../src/models/User');
  Estudiante = require('../src/models/Estudiante');
  Curso = require('../src/models/Curso');
  Aula = require('../src/models/Aula');
  Matricula = require('../src/models/Matricula');
  Configuracion = require('../src/models/Configuracion');
});

after(async () => {
  await limpiarDB();
  await desconectarDB();
});

// ============================================================
// USER
// ============================================================

test('User: al guardar, la contraseña se hashea con bcrypt', async () => {
  const u = await new User({
    email: 'hash@test.com',
    password: 'Secreto123!',
    nombre: 'Hash',
  }).save();

  assert.notStrictEqual(u.password, 'Secreto123!');
  assert.ok(u.password.startsWith('$2'), 'Debe ser un hash bcrypt');
  assert.ok(await u.compararPassword('Secreto123!'));
  assert.strictEqual(await u.compararPassword('incorrecta'), false);
});

test('User: toJSON oculta password y refreshToken', async () => {
  const u = await new User({
    email: 'json@test.com',
    password: 'Secreto123!',
    nombre: 'Json',
  }).save();
  await u.guardarRefreshToken('token-hasheado');

  const obj = u.toJSON();
  assert.strictEqual(obj.password, undefined);
  assert.strictEqual(obj.refreshToken, undefined);
});

test('User: crearEmpleado rechaza email duplicado con ErrorAPI 400', async () => {
  await User.crearEmpleado({
    email: 'dup@test.com',
    password: 'Secreto123!',
    nombre: 'Uno',
  });

  await assert.rejects(
    User.crearEmpleado({ email: 'dup@test.com', password: 'Secreto123!', nombre: 'Dos' }),
    (err) => {
      assert.strictEqual(err.statusCode, 400);
      assert.match(err.message, /Email ya registrado/);
      return true;
    }
  );
});

test('User: refreshToken se guarda y se limpia (sesión)', async () => {
  const u = await new User({
    email: 'sesion@test.com',
    password: 'Secreto123!',
    nombre: 'Sesion',
  }).save();

  await u.guardarRefreshToken('hash-del-refresh');
  assert.strictEqual(u.refreshToken, 'hash-del-refresh');

  await u.limpiarRefreshToken();
  assert.strictEqual(u.refreshToken, null);
});

test('User: desactivar es borrado lógico', async () => {
  const u = await new User({
    email: 'desactivar@test.com',
    password: 'Secreto123!',
    nombre: 'Desc',
  }).save();

  await u.desactivar();
  assert.strictEqual(u.activo, false);

  await assert.rejects(User.obtenerDocumentoActivo(u._id), (err) => {
    assert.strictEqual(err.statusCode, 404);
    return true;
  });
});

// ============================================================
// ESTUDIANTE
// ============================================================

test('Estudiante: crearNuevo guarda correctamente', async () => {
  const e = await Estudiante.crearNuevo({
    nombre: 'Ana',
    apellido: 'Prueba',
    cedula: '1001',
    email: 'ana@test.com',
  });
  assert.ok(e._id);
  assert.strictEqual(e.cedula, '1001');
});

test('Estudiante: cédula duplicada se rechaza con 400', async () => {
  await assert.rejects(
    Estudiante.crearNuevo({ nombre: 'Otra', apellido: 'Persona', cedula: '1001' }),
    (err) => {
      assert.strictEqual(err.statusCode, 400);
      assert.match(err.message, /Cédula ya registrada/);
      return true;
    }
  );
});

test('Estudiante: validación mongoose rechaza cédula con letras', async () => {
  await assert.rejects(
    Estudiante.crearNuevo({ nombre: 'Mal', apellido: 'Dato', cedula: 'ABC123' }),
    (err) => {
      assert.strictEqual(err.name, 'ValidationError');
      assert.match(err.message, /solo debe contener números/);
      return true;
    }
  );
});

test('Estudiante: validación mongoose rechaza email inválido pero permite vacío', async () => {
  await assert.rejects(
    Estudiante.crearNuevo({
      nombre: 'Mal',
      apellido: 'Email',
      cedula: '1002',
      email: 'no-es-email',
    }),
    (err) => err.name === 'ValidationError'
  );

  const sinEmail = await Estudiante.crearNuevo({
    nombre: 'Sin',
    apellido: 'Email',
    cedula: '1003',
  });
  assert.strictEqual(sinEmail.email, '');
});

test('Estudiante: listar pagina y busca por cédula', async () => {
  const resultado = await Estudiante.listar({ page: 1, limit: 2 });
  assert.strictEqual(resultado.estudiantes.length, 2);
  assert.strictEqual(resultado.total, 2); // solo existen cedulas 1001 y 1003
  assert.strictEqual(resultado.pages, 1);

  const busqueda = await Estudiante.listar({ cedula: '1001' });
  assert.strictEqual(busqueda.total, 1);
  assert.strictEqual(busqueda.estudiantes[0].cedula, '1001');
});

test('Estudiante: actualizarDatos rechaza cédula de otro estudiante', async () => {
  const e = await Estudiante.obtenerPorId(
    (await Estudiante.findOne({ cedula: '1003' }))._id
  );
  await assert.rejects(e.actualizarDatos({ cedula: '1001' }), (err) => {
    assert.strictEqual(err.statusCode, 400);
    return true;
  });
});

// ============================================================
// CURSO
// ============================================================

test('Curso: validación rechaza precio negativo', async () => {
  await assert.rejects(
    Curso.crearNuevo({ nombre: 'Malo', precio: -5, duracion: '1 semana' }),
    (err) => err.name === 'ValidationError'
  );
});

test('Curso: desactivar lo excluye de listarActivos y obtenerActivoPorId', async () => {
  const c = await Curso.crearNuevo({
    nombre: 'Curso Activo',
    precio: 100000,
    duracion: '2 semanas',
  });
  assert.ok((await Curso.listarActivos()).some((x) => x.nombre === 'Curso Activo'));

  await c.desactivar();
  assert.ok(!(await Curso.listarActivos()).some((x) => x.nombre === 'Curso Activo'));
  await assert.rejects(Curso.obtenerActivoPorId(c._id), (err) => err.statusCode === 404);
});

// ============================================================
// AULA
// ============================================================

test('Aula: número duplicado se rechaza con mensaje claro', async () => {
  await Aula.crearNueva({ numero: 'A-DUP', capacidad: 5 });
  await assert.rejects(Aula.crearNueva({ numero: 'A-DUP', capacidad: 5 }), (err) => {
    assert.strictEqual(err.statusCode, 400);
    assert.match(err.message, /Ya existe un aula con ese número/);
    return true;
  });
});

test('Aula: capacidad mínima 1 (validación mongoose)', async () => {
  await assert.rejects(Aula.crearNueva({ numero: 'A0', capacidad: 0 }), (err) => {
    assert.strictEqual(err.name, 'ValidationError');
    return true;
  });
});

test('Aula: obtenerPoblacionActual y tieneCupoDisponible', async () => {
  const curso = await Curso.crearNuevo({
    nombre: 'Curso Cupo',
    precio: 50000,
    duracion: '1 semana',
  });
  const aula = await Aula.crearNueva({ numero: 'A-CUPO', capacidad: 1 });
  const est = await Estudiante.crearNuevo({
    nombre: 'Cupo',
    apellido: 'Uno',
    cedula: '2001',
  });

  assert.strictEqual(await aula.obtenerPoblacionActual(), 0);
  assert.strictEqual(await aula.tieneCupoDisponible(), true);

  await Matricula.crearNueva({ estudianteId: est._id, cursoId: curso._id, aulaId: aula._id });

  assert.strictEqual(await aula.obtenerPoblacionActual(), 1);
  assert.strictEqual(await aula.tieneCupoDisponible(), false);
});

// ============================================================
// MATRÍCULA
// ============================================================

test('Matricula: crearNueva asigna saldoPendiente = precio del curso', async () => {
  const curso = await Curso.crearNuevo({
    nombre: 'Curso Saldo',
    precio: 250000,
    duracion: '3 semanas',
  });
  const aula = await Aula.crearNueva({ numero: 'A-SALDO', capacidad: 5 });
  const est = await Estudiante.crearNuevo({
    nombre: 'Saldo',
    apellido: 'Prueba',
    cedula: '3001',
  });

  const m = await Matricula.crearNueva({
    estudianteId: est._id,
    cursoId: curso._id,
    aulaId: aula._id,
  });

  assert.strictEqual(m.saldoPendiente, 250000);
  assert.strictEqual(m.totalPagado, 0);
  assert.strictEqual(m.estado, 'activa');
});

test('Matricula: no permite estudiante con matrícula activa', async () => {
  const est = await Estudiante.findOne({ cedula: '3001' });
  const curso = await Curso.findOne({ nombre: 'Curso Saldo' });
  const aula = await Aula.findOne({ numero: 'A-SALDO' });

  await assert.rejects(
    Matricula.crearNueva({ estudianteId: est._id, cursoId: curso._id, aulaId: aula._id }),
    (err) => {
      assert.strictEqual(err.statusCode, 400);
      assert.match(err.message, /ya tiene una matrícula activa/);
      return true;
    }
  );
});

test('Matricula: rechaza estudiante, curso o aula inexistentes con 404', async () => {
  const idFalso = new (require('mongoose').Types.ObjectId)();
  const est = await Estudiante.crearNuevo({
    nombre: 'Ref',
    apellido: 'Prueba',
    cedula: '3002',
  });
  const curso = await Curso.findOne({ nombre: 'Curso Saldo' });
  const aula = await Aula.findOne({ numero: 'A-SALDO' });

  await assert.rejects(
    Matricula.crearNueva({ estudianteId: idFalso, cursoId: curso._id, aulaId: aula._id }),
    (err) => err.statusCode === 404
  );
  await assert.rejects(
    Matricula.crearNueva({ estudianteId: est._id, cursoId: idFalso, aulaId: aula._id }),
    (err) => err.statusCode === 404
  );
  await assert.rejects(
    Matricula.crearNueva({ estudianteId: est._id, cursoId: curso._id, aulaId: idFalso }),
    (err) => err.statusCode === 404
  );
});

test('Matricula: agregarPago actualiza totales y estado', async () => {
  // Matrícula del estudiante 3001 (curso de $250.000)
  const est = await Estudiante.findOne({ cedula: '3001' });
  const m = await Matricula.findOne({ estudiante: est._id }).populate('curso');
  const precio = m.curso.precio;

  await m.agregarPago(100000, 'fisico');
  assert.strictEqual(m.totalPagado, 100000);
  assert.strictEqual(m.saldoPendiente, precio - 100000);
  assert.strictEqual(m.pagos.length, 1);

  // Pagar el resto deja saldo 0 y estado activa
  await m.agregarPago(precio - 100000, 'stripe', 'pi_test_123');
  assert.strictEqual(m.saldoPendiente, 0);
  assert.strictEqual(m.estado, 'activa');
  assert.strictEqual(m.pagos[1].stripePaymentId, 'pi_test_123');
});

test('Matricula: verificarVencimiento marca moroso si venció con saldo', async () => {
  const curso = await Curso.crearNuevo({
    nombre: 'Curso Vence',
    precio: 80000,
    duracion: '1 semana',
  });
  const aula = await Aula.crearNueva({ numero: 'A-VENCE', capacidad: 5 });
  const est = await Estudiante.crearNuevo({
    nombre: 'Vence',
    apellido: 'Prueba',
    cedula: '4001',
  });

  const m = await Matricula.crearNueva({
    estudianteId: est._id,
    cursoId: curso._id,
    aulaId: aula._id,
  });

  // Forzar vencimiento en el pasado
  m.fechaVencimiento = new Date(Date.now() - 24 * 60 * 60 * 1000);
  assert.strictEqual(m.verificarVencimiento(), true);
  assert.strictEqual(m.estado, 'moroso');
  await m.save(); // persiste el estado moroso para la siguiente prueba
});

test('Matricula: cambiarEstado valida el enum y cancelar funciona', async () => {
  const m = await Matricula.findOne({ estado: 'moroso' });

  await assert.rejects(m.cambiarEstado('inventado'), (err) => err.statusCode === 400);

  await m.cancelar();
  assert.strictEqual(m.estado, 'cancelada');
});

test('Matricula: migrarAula cambia de aula y valida cupo', async () => {
  const curso = await Curso.crearNuevo({
    nombre: 'Curso Migra',
    precio: 60000,
    duracion: '2 semanas',
  });
  const aulaLlena = await Aula.crearNueva({ numero: 'A-LLENA', capacidad: 1 });
  const aulaDestino = await Aula.crearNueva({ numero: 'A-DEST', capacidad: 3 });

  const est1 = await Estudiante.crearNuevo({ nombre: 'M1', apellido: 'P', cedula: '5001' });
  const est2 = await Estudiante.crearNuevo({ nombre: 'M2', apellido: 'P', cedula: '5002' });

  // Llenar el aula
  await Matricula.crearNueva({
    estudianteId: est1._id,
    cursoId: curso._id,
    aulaId: aulaLlena._id,
  });
  const m2 = await Matricula.crearNueva({
    estudianteId: est2._id,
    cursoId: curso._id,
    aulaId: aulaDestino._id,
  });

  // Migrar al aula llena debe fallar
  await assert.rejects(Matricula.migrarAula(m2._id, aulaLlena._id), (err) => {
    assert.strictEqual(err.statusCode, 400);
    assert.match(err.message, /aula destino está llena/);
    return true;
  });

  // Migrar entre aulas con cupo debe funcionar
  const migrada = await Matricula.migrarAula(m2._id, aulaDestino._id);
  assert.strictEqual(String(migrada.aula), String(aulaDestino._id));
});

test('Estudiante: no se puede eliminar con matrícula activa', async () => {
  const est = await Estudiante.findOne({ cedula: '3001' });
  await assert.rejects(est.eliminar(), (err) => {
    assert.strictEqual(err.statusCode, 400);
    assert.match(err.message, /matrículas activas/);
    return true;
  });

  // Sin matrículas sí se puede
  const libre = await Estudiante.crearNuevo({
    nombre: 'Libre',
    apellido: 'Prueba',
    cedula: '6001',
  });
  await libre.eliminar();
  assert.strictEqual(await Estudiante.findOne({ cedula: '6001' }), null);
});

// ============================================================
// CONFIGURACIÓN
// ============================================================

test('Configuracion: obtenerGeneral crea valores por defecto y actualiza parcial', async () => {
  const config = await Configuracion.obtenerGeneral();
  assert.strictEqual(config.clave, 'general');
  assert.strictEqual(config.nombreInstitucion, 'Motos BSA la 23');

  const actualizada = await Configuracion.actualizarGeneral({
    nombreInstitucion: 'Escuela Nueva',
    facturacion: { prefijoFactura: 'XYZ' },
  });
  assert.strictEqual(actualizada.nombreInstitucion, 'Escuela Nueva');
  assert.strictEqual(actualizada.facturacion.prefijoFactura, 'XYZ');
  // Lo no enviado se conserva
  assert.strictEqual(actualizada.nit, '900.123.456-7');
});
