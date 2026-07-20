const jwt = require('jsonwebtoken');

const ACCESS_TOKEN_EXPIRATION = '15m';
const REFRESH_TOKEN_EXPIRATION = '7d';

const generarAccessToken = (usuario) => {
  return jwt.sign(
    { id: usuario._id, email: usuario.email, rol: usuario.rol },
    process.env.JWT_SECRET,
    { expiresIn: ACCESS_TOKEN_EXPIRATION }
  );
};

const generarRefreshToken = (usuario) => {
  return jwt.sign(
    { id: usuario._id },
    process.env.JWT_REFRESH_SECRET,
    { expiresIn: REFRESH_TOKEN_EXPIRATION }
  );
};

const verificarToken = (token, secreto) => {
  try {
    return jwt.verify(token, secreto);
  } catch (error) {
    return null;
  }
};

// Decodifica el token sin verificar (para inspeccionar la expiración)
const decodificarToken = (token) => {
  try {
    return jwt.decode(token);
  } catch (error) {
    return null;
  }
};

// Verifica si un token está próximo a expirar (menos de 2 minutos)
const tokenProximoAExpirar = (token) => {
  const decoded = decodificarToken(token);
  if (!decoded || !decoded.exp) return false;
  
  const ahora = Math.floor(Date.now() / 1000);
  const tiempoRestante = decoded.exp - ahora;
  
  // Si quedan menos de 2 minutos, considerarlo próximo a expirar
  return tiempoRestante < 120;
};

module.exports = {
  generarAccessToken,
  generarRefreshToken,
  verificarToken,
  decodificarToken,
  tokenProximoAExpirar,
  ACCESS_TOKEN_EXPIRATION,
  REFRESH_TOKEN_EXPIRATION,
};
