const nodemailer = require('nodemailer');
const logger = require('../utils/logger');

// Configuración del envío de correos con Gmail SMTP.
// Las credenciales llegan por variables de entorno (NUNCA en el código):
//   EMAIL_USER          → cuenta de Gmail que envía los correos
//   EMAIL_APP_PASSWORD  → "contraseña de aplicación" de Google (no la normal)
//
// En modo test (NODE_ENV=test) no se envía nada real: el correo queda
// guardado en memoria para que las pruebas puedan leerlo.

// Indica si hay credenciales de correo configuradas
const correoConfigurado = () =>
  Boolean(process.env.EMAIL_USER && process.env.EMAIL_APP_PASSWORD);

// Crea el transporte según el entorno
const crearTransporte = () => {
  if (process.env.NODE_ENV === 'test') {
    // Transporte falso: "envía" el correo a un buffer en memoria
    return nodemailer.createTransport({ jsonTransport: true });
  }
  return nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: process.env.EMAIL_USER,
      // Google muestra la contraseña con espacios; se quitan por seguridad
      pass: (process.env.EMAIL_APP_PASSWORD || '').replace(/\s/g, ''),
    },
  });
};

const transporte = crearTransporte();

// Último correo "enviado" en modo test (para aserciones de las pruebas)
let ultimoCorreoTest = null;

// Envía un correo. Devuelve true si se envió, false si no hay configuración.
const enviarCorreo = async ({ para, asunto, html }) => {
  if (process.env.NODE_ENV !== 'test' && !correoConfigurado()) {
    logger.error('Correo no configurado: faltan EMAIL_USER / EMAIL_APP_PASSWORD');
    return false;
  }

  const info = await transporte.sendMail({
    from: `"SchoolNode" <${process.env.EMAIL_USER || 'no-reply@schoolnode.local'}>`,
    to: para,
    subject: asunto,
    html,
  });

  if (process.env.NODE_ENV === 'test') {
    // jsonTransport devuelve el mensaje serializado en info.message
    ultimoCorreoTest = JSON.parse(info.message);
    logger.proceso(`[TEST] Correo simulado para ${para}: ${asunto}`);
    return true;
  }

  logger.exito(`Correo enviado a ${para}: ${asunto}`);
  return true;
};

// Plantilla HTML del correo con el código de verificación
const plantillaCodigo = (nombre, codigo, accion) => `
  <div style="font-family: Arial, sans-serif; max-width: 480px; margin: 0 auto;">
    <div style="background: #0d6efd; color: #fff; padding: 16px; text-align: center; border-radius: 8px 8px 0 0;">
      <h2 style="margin: 0;">SchoolNode</h2>
    </div>
    <div style="border: 1px solid #ddd; border-top: none; padding: 24px; border-radius: 0 0 8px 8px;">
      <p>Hola <strong>${nombre}</strong>,</p>
      <p>Recibimos una solicitud para <strong>${accion}</strong> en tu cuenta.
         Usa este código de verificación:</p>
      <p style="text-align: center; font-size: 32px; letter-spacing: 8px; font-weight: bold; color: #0d6efd; margin: 24px 0;">
        ${codigo}
      </p>
      <p>El código vence en <strong>10 minutos</strong>. Si no solicitaste este cambio,
         ignora este correo y tu cuenta seguirá igual.</p>
      <p style="color: #888; font-size: 12px; margin-top: 24px;">
        Este es un correo automático, por favor no respondas.
      </p>
    </div>
  </div>
`;

module.exports = {
  enviarCorreo,
  plantillaCodigo,
  correoConfigurado,
  // Solo para pruebas
  _obtenerUltimoCorreoTest: () => ultimoCorreoTest,
};
