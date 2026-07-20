require('dotenv').config();
const mongoose = require('mongoose');
const Matricula = require('../models/Matricula');
const Curso = require('../models/Curso');
const logger = require('../utils/logger');

const arreglarSaldos = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    logger.exito('Conectado a MongoDB');

    const matriculas = await Matricula.find();
    logger.proceso(`Encontradas ${matriculas.length} matrículas para revisar`);

    let arregladas = 0;
    for (const mat of matriculas) {
      // Calcular totalPagado real desde el array de pagos
      const totalPagadoReal = mat.pagos.reduce((sum, p) => sum + (p.monto || 0), 0);

      // Obtener el curso para saber el precio
      const curso = await Curso.findById(mat.curso);
      if (!curso) {
        logger.error(`Curso no encontrado para matrícula ${mat._id}`);
        continue;
      }

      // Si el total pagado excede el precio, ajustarlo al precio (matrícula ya pagada)
      const totalPagadoAjustado = Math.min(totalPagadoReal, curso.precio);

      // Calcular saldo correcto
      const saldoCorrecto = Math.max(0, curso.precio - totalPagadoAjustado);

      // Detectar si hay inconsistencia
      if (mat.totalPagado !== totalPagadoAjustado || mat.saldoPendiente !== saldoCorrecto) {
        logger.proceso(`Arreglando matrícula ${mat._id}: totalPagado ${mat.totalPagado} → ${totalPagadoAjustado}, saldo ${mat.saldoPendiente} → ${saldoCorrecto}`);
        mat.totalPagado = totalPagadoAjustado;
        mat.saldoPendiente = saldoCorrecto;
        await mat.save();
        arregladas++;
      }
    }

    logger.exito(`=== REPARACIÓN COMPLETADA ===`);
    logger.exito(`Matrículas revisadas: ${matriculas.length}`);
    logger.exito(`Matrículas arregladas: ${arregladas}`);

    process.exit(0);
  } catch (error) {
    logger.error(`Error: ${error.message}`);
    process.exit(1);
  }
};

arreglarSaldos();
