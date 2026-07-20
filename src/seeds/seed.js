require('dotenv').config();
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const User = require('../models/User');
const Curso = require('../models/Curso');
const Aula = require('../models/Aula');
const Estudiante = require('../models/Estudiante');
const Matricula = require('../models/Matricula');
const logger = require('../utils/logger');

const seed = async () => {
  try {
    // Conectar a MongoDB
    await mongoose.connect(process.env.MONGODB_URI);
    logger.exito('Conectado a MongoDB para seed');

    // Limpiar colecciones
    logger.proceso('Limpiando colecciones...');
    await User.deleteMany({});
    await Curso.deleteMany({});
    await Aula.deleteMany({});
    await Estudiante.deleteMany({});
    await Matricula.deleteMany({});
    logger.exito('Colecciones limpiadas');

    // Crear admin
    logger.proceso('Creando admin...');
    const admin = new User({
      email: 'admin@schoolnode.com',
      password: 'Admin123!',
      nombre: 'Administrador',
      rol: 'admin',
    });
    await admin.save();
    logger.exito('Admin creado: admin@schoolnode.com / Admin123!');

    // Crear empleados
    logger.proceso('Creando empleados...');
    const empleados = [
      { email: 'empleado1@schoolnode.com', password: 'Empleado123!', nombre: 'Juan Pérez', rol: 'empleado' },
      { email: 'empleado2@schoolnode.com', password: 'Empleado123!', nombre: 'María García', rol: 'empleado' },
      { email: 'empleado3@schoolnode.com', password: 'Empleado123!', nombre: 'Carlos López', rol: 'empleado' },
    ];

    for (const emp of empleados) {
      await new User(emp).save();
      logger.exito(`Empleado creado: ${emp.email}`);
    }

    // Crear cursos
    logger.proceso('Creando cursos...');
    const cursos = [
      { nombre: 'Conducción Básica', descripcion: 'Curso fundamental de manejo de motocicletas', precio: 350000, duracion: '4 semanas' },
      { nombre: 'Conducción Avanzada', descripcion: 'Técnicas avanzadas de manejo', precio: 450000, duracion: '6 semanas' },
      { nombre: 'Mantenimiento de Motos', descripcion: 'Aprende a dar mantenimiento básico', precio: 280000, duracion: '3 semanas' },
      { nombre: 'Seguridad Vial', descripcion: 'Normas y seguridad en la vía', precio: 150000, duracion: '2 semanas' },
    ];

    const cursosCreados = [];
    for (const curso of cursos) {
      const c = await new Curso(curso).save();
      cursosCreados.push(c);
      logger.exito(`Curso creado: ${curso.nombre}`);
    }

    // Crear aulas
    logger.proceso('Creando aulas...');
    const aulas = [
      { numero: 'A01', capacidad: 15, ubicacion: 'Sede principal' },
      { numero: 'A02', capacidad: 12, ubicacion: 'Sede norte' },
      { numero: 'A03', capacidad: 10, ubicacion: 'Sede sur' },
      { numero: 'A04', capacidad: 15, ubicacion: 'Sede principal' },
    ];

    const aulasCreadas = [];
    for (const aula of aulas) {
      const a = await new Aula(aula).save();
      aulasCreadas.push(a);
      logger.exito(`Aula creada: ${aula.numero}`);
    }

    // Crear estudiantes
    logger.proceso('Creando estudiantes...');
    const estudiantesData = [
      { nombre: 'Daniel Felipe', apellido: 'Serna López', cedula: '1116278383', email: 'daniel.serna@email.com', telefono: '3001234567' },
      { nombre: 'Danny Alejandro', apellido: 'Velasco Patiño', cedula: '123456789', email: 'danny.velasco@email.com', telefono: '3012345678' },
      { nombre: 'Idelgar', apellido: 'Diaz Narvaez', cedula: '123456780', email: 'idelgar.diaz@email.com', telefono: '3023456789' },
      { nombre: 'Andrés', apellido: 'Rodríguez Gómez', cedula: '123456781', email: 'andres.rodriguez@email.com', telefono: '3034567890' },
      { nombre: 'Laura', apellido: 'Martínez Silva', cedula: '123456782', email: 'laura.martinez@email.com', telefono: '3045678901' },
      { nombre: 'Carlos', apellido: 'Sánchez Torres', cedula: '123456783', email: 'carlos.sanchez@email.com', telefono: '3056789012' },
      { nombre: 'Ana', apellido: 'López Hernández', cedula: '123456784', email: 'ana.lopez@email.com', telefono: '3067890123' },
      { nombre: 'Jorge', apellido: 'Ramírez Castro', cedula: '123456785', email: 'jorge.ramirez@email.com', telefono: '3078901234' },
      { nombre: 'Patricia', apellido: 'González Ruiz', cedula: '123456786', email: 'patricia.gonzalez@email.com', telefono: '3089012345' },
      { nombre: 'Miguel', apellido: 'Torres Vargas', cedula: '123456787', email: 'miguel.torres@email.com', telefono: '3090123456' },
      { nombre: 'Sofía', apellido: 'Morales Jiménez', cedula: '123456788', email: 'sofia.morales@email.com', telefono: '3101234567' },
      { nombre: 'Fernando', apellido: 'Castro Mendoza', cedula: '123456798', email: 'fernando.castro@email.com', telefono: '3112345678' },
      { nombre: 'Valentina', apellido: 'Ríos Paredes', cedula: '123456790', email: 'valentina.rios@email.com', telefono: '3123456789' },
      { nombre: 'Ricardo', apellido: 'Flores Aguilar', cedula: '123456791', email: 'ricardo.flores@email.com', telefono: '3134567890' },
      { nombre: 'Camila', apellido: 'Vega Delgado', cedula: '123456792', email: 'camila.vega@email.com', telefono: '3145678901' },
      { nombre: 'Diego', apellido: 'Herrera Suárez', cedula: '123456793', email: 'diego.herrera@email.com', telefono: '3156789012' },
      { nombre: 'Isabella', apellido: 'Cruz Navarro', cedula: '123456794', email: 'isabella.cruz@email.com', telefono: '3167890123' },
      { nombre: 'Sebastián', apellido: 'Reyes Ortiz', cedula: '123456795', email: 'sebastian.reyes@email.com', telefono: '3178901234' },
      { nombre: 'Mariana', apellido: 'Díaz Fuentes', cedula: '123456796', email: 'mariana.diaz@email.com', telefono: '3189012345' },
      { nombre: 'Alejandro', apellido: 'Moreno Rojas', cedula: '123456797', email: 'alejandro.moreno@email.com', telefono: '3190123456' },
    ];

    const estudiantesCreados = [];
    for (const est of estudiantesData) {
      const e = await new Estudiante(est).save();
      estudiantesCreados.push(e);
      logger.exito(`Estudiante creado: ${est.cedula}`);
    }

    // Crear matrículas
    logger.proceso('Creando matrículas...');
    const matriculasData = [
      { estudianteIdx: 0, cursoIdx: 0, aulaIdx: 0, pagos: 350000, estado: 'activa' },
      { estudianteIdx: 1, cursoIdx: 0, aulaIdx: 0, pagos: 150000, estado: 'activa' },
      { estudianteIdx: 2, cursoIdx: 0, aulaIdx: 0, pagos: 0, estado: 'moroso' },
      { estudianteIdx: 3, cursoIdx: 1, aulaIdx: 1, pagos: 450000, estado: 'activa' },
      { estudianteIdx: 4, cursoIdx: 1, aulaIdx: 1, pagos: 200000, estado: 'activa' },
      { estudianteIdx: 5, cursoIdx: 2, aulaIdx: 2, pagos: 280000, estado: 'activa' },
      { estudianteIdx: 6, cursoIdx: 2, aulaIdx: 2, pagos: 100000, estado: 'activa' },
      { estudianteIdx: 7, cursoIdx: 3, aulaIdx: 3, pagos: 150000, estado: 'activa' },
      { estudianteIdx: 8, cursoIdx: 3, aulaIdx: 3, pagos: 0, estado: 'moroso' },
      { estudianteIdx: 9, cursoIdx: 0, aulaIdx: 0, pagos: 350000, estado: 'activa' },
      { estudianteIdx: 10, cursoIdx: 1, aulaIdx: 1, pagos: 450000, estado: 'activa' },
      { estudianteIdx: 11, cursoIdx: 2, aulaIdx: 2, pagos: 0, estado: 'vencida' },
      { estudianteIdx: 12, cursoIdx: 3, aulaIdx: 3, pagos: 150000, estado: 'activa' },
      { estudianteIdx: 13, cursoIdx: 0, aulaIdx: 0, pagos: 200000, estado: 'activa' },
      { estudianteIdx: 14, cursoIdx: 1, aulaIdx: 1, pagos: 450000, estado: 'activa' },
    ];

    for (const mat of matriculasData) {
      const estudiante = estudiantesCreados[mat.estudianteIdx];
      const curso = cursosCreados[mat.cursoIdx];
      const aula = aulasCreadas[mat.aulaIdx];

      // Calcular pago ajustado (nunca mayor al precio del curso)
      const pagoAjustado = Math.min(mat.pagos, curso.precio);

      // Crear matrícula
      const m = await new Matricula({
        estudiante: estudiante._id,
        curso: curso._id,
        aula: aula._id,
        estado: mat.estado,
      }).save();

      // Agregar pago usando el método del modelo (que calcula correctamente)
      if (pagoAjustado > 0) {
        await m.agregarPago(pagoAjustado, 'fisico');
      }

      // Si el estado es moroso, no debe tener saldo pendiente a 0
      if (mat.estado === 'moroso' && m.saldoPendiente === 0) {
        m.estado = 'activa';
        await m.save();
      }

      logger.exito(
        `Matrícula: ${estudiante.cedula} -> ${curso.nombre} | ` +
        `Precio: $${curso.precio.toLocaleString()} | ` +
        `Pagado: $${m.totalPagado.toLocaleString()} | ` +
        `Faltante: $${m.saldoPendiente.toLocaleString()} | ` +
        `Estado: ${m.estado}`
      );
    }

    logger.exito('=== SEED COMPLETADO EXITOSAMENTE ===');
    logger.proceso('Credenciales de prueba:');
    logger.proceso('  Admin: admin@schoolnode.com / Admin123!');
    logger.proceso('  Empleado: empleado1@schoolnode.com / Empleado123!');
    
    process.exit(0);
  } catch (error) {
    logger.error(`Error en seed: ${error.message}`);
    process.exit(1);
  }
};

seed();
