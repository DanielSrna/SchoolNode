// Error de aplicación con código HTTP asociado.
// Los modelos y servicios lanzan ErrorAPI para que los controladores
// solo tengan que traducirlo a una respuesta HTTP.
class ErrorAPI extends Error {
  constructor(mensaje, statusCode = 500) {
    super(mensaje);
    this.name = 'ErrorAPI';
    this.statusCode = statusCode;
  }
}

// Traduce cualquier error a una respuesta HTTP uniforme.
// Si es un ErrorAPI usa su statusCode y mensaje; si no, responde 500 genérico.
const responderError = (res, error) => {
  const status = error.statusCode || 500;
  const mensaje = error.statusCode ? error.message : 'Error en el servidor';
  res.status(status).json({ error: mensaje });
};

// Convierte errores de llave duplicada de MongoDB (código 11000) en ErrorAPI 400.
const esErrorDuplicado = (error) => error && error.code === 11000;

module.exports = { ErrorAPI, responderError, esErrorDuplicado };
