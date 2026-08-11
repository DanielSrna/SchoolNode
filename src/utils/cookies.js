// Manejo centralizado de las cookies de autenticación.
// Así, si cambian las opciones de seguridad, solo se modifica este archivo.

const COOKIE_OPTIONS = {
  httpOnly: true, // No accesible desde JavaScript del navegador (anti-XSS)
  secure: process.env.NODE_ENV === 'production', // Solo HTTPS en producción
  sameSite: 'lax',
  path: '/',
};

const ACCESS_TOKEN_MAX_AGE = 15 * 60 * 1000; // 15 minutos
const REFRESH_TOKEN_MAX_AGE = 7 * 24 * 60 * 60 * 1000; // 7 días

// Escribe las dos cookies de sesión en la respuesta
const establecerCookiesAuth = (res, accessToken, refreshToken) => {
  res.cookie('accessToken', accessToken, {
    ...COOKIE_OPTIONS,
    maxAge: ACCESS_TOKEN_MAX_AGE,
  });
  res.cookie('refreshToken', refreshToken, {
    ...COOKIE_OPTIONS,
    maxAge: REFRESH_TOKEN_MAX_AGE,
  });
};

// Borra las dos cookies de sesión
const limpiarCookiesAuth = (res) => {
  res.clearCookie('accessToken', COOKIE_OPTIONS);
  res.clearCookie('refreshToken', COOKIE_OPTIONS);
};

module.exports = {
  COOKIE_OPTIONS,
  ACCESS_TOKEN_MAX_AGE,
  REFRESH_TOKEN_MAX_AGE,
  establecerCookiesAuth,
  limpiarCookiesAuth,
};
