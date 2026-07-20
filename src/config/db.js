const mongoose = require('mongoose');
const logger = require('../utils/logger');

const conectarDB = async () => {
  try {
    const opciones = {
      maxPoolSize: 10,
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 45000,
    };

    const conn = await mongoose.connect(process.env.MONGODB_URI, opciones);
    logger.exito(`MongoDB conectado: ${conn.connection.host}`);
  } catch (error) {
    logger.error(`Error conectando a MongoDB: ${error.message}`);
    // En producción, no salir del proceso, permitir reintentos
    if (process.env.NODE_ENV === 'production') {
      logger.error('Reintentando conexión en 5 segundos...');
      setTimeout(conectarDB, 5000);
    } else {
      process.exit(1);
    }
  }
};

module.exports = conectarDB;
