const mongoose = require('mongoose');
const logger = require('../utils/logger');

const conectarDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGODB_URI);
    logger.exito(`MongoDB conectado: ${conn.connection.host}`);
  } catch (error) {
    logger.error(`Error conectando a MongoDB: ${error.message}`);
    process.exit(1);
  }
};

module.exports = conectarDB;
