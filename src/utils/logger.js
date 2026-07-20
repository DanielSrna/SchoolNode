const winston = require('winston');

// Niveles personalizados: proceso, exito, error
const nivelesPersonalizados = {
  levels: {
    error: 0,
    exito: 1,
    proceso: 2,
  },
};

// Formateador con colores
const formateador = winston.format.combine(
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
  winston.format.colorize({
    colors: {
      error: 'red',
      exito: 'green',
      proceso: 'cyan',
    },
  }),
  winston.format.printf(({ level, message, timestamp }) => {
    return `[${timestamp}] ${level}: ${message}`;
  })
);

// Crear logger
const logger = winston.createLogger({
  levels: nivelesPersonalizados.levels,
  level: 'proceso', // Mostrar todos los niveles
  format: formateador,
  transports: [
    new winston.transports.Console(),
  ],
});

module.exports = logger;
