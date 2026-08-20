const stripe = require('../config/stripe');
const Matricula = require('../models/Matricula');
const { enviarCorreo, plantillaRecordatorioPago } = require('../config/mailer');
const { ErrorAPI } = require('../utils/ErrorAPI');
const logger = require('../utils/logger');

// Servicio de pagos: concentra la lógica de Stripe, pagos simulados
// y pagos físicos. Los controladores solo orquestan estas funciones.

// Indica si hay claves reales de Stripe configuradas.
// Si el .env tiene placeholders, el sistema trabaja en modo simulación.
const stripeConfigurado = () => {
  return (
    process.env.STRIPE_SECRET_KEY &&
    !process.env.STRIPE_SECRET_KEY.includes('replace') &&
    !process.env.STRIPE_SECRET_KEY.includes('change')
  );
};

// Crea una sesión de pago para una matrícula.
// Con Stripe real devuelve la URL de checkout; sin claves, devuelve
// una URL de simulación para probar el flujo completo sin dinero real.
const crearSesionPago = async (matriculaId, monto) => {
  const matricula = await Matricula.findById(matriculaId)
    .populate('estudiante', 'nombre email cedula apellido')
    .populate('curso', 'nombre');

  if (!matricula) {
    logger.error(`Matrícula no encontrada: ${matriculaId}`);
    throw new ErrorAPI('Matrícula no encontrada', 404);
  }

  if (stripeConfigurado()) {
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [
        {
          price_data: {
            currency: 'cop',
            product_data: {
              name: `Pago matrícula - ${matricula.curso.nombre}`,
              description: `Estudiante: ${matricula.estudiante.nombre} ${matricula.estudiante.apellido}`,
            },
            unit_amount: monto * 100,
          },
          quantity: 1,
        },
      ],
      mode: 'payment',
      success_url: `${process.env.APP_URL}/pagos/exito?session_id={CHECKOUT_SESSION_ID}&matricula=${matriculaId}`,
      cancel_url: `${process.env.APP_URL}/pagos?cancelado=1`,
      metadata: { matriculaId, monto: String(monto) },
    });

    logger.exito(`Sesión de Stripe creada: ${session.id}`);
    return { sessionId: session.id, url: session.url, modo: 'stripe' };
  }

  // Modo simulación (sin claves reales de Stripe)
  const sessionId = `sim_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  logger.proceso(
    `Sesión simulada creada: ${sessionId} para matrícula ${matriculaId}, monto $${monto}`
  );

  return {
    sessionId,
    url: `/pagos/simular-pago?session_id=${sessionId}&matricula=${matriculaId}&monto=${monto}`,
    modo: 'simulacion',
  };
};

// Confirma un pago hecho con la simulación y lo registra en la matrícula
const confirmarPagoSimulado = async (matriculaId, monto) => {
  const matricula = await Matricula.findById(matriculaId);
  if (!matricula) {
    logger.error(`Matrícula no encontrada: ${matriculaId}`);
    throw new ErrorAPI('Matrícula no encontrada', 404);
  }

  await matricula.agregarPago(parseFloat(monto), 'stripe', `sim_${Date.now()}`);
  logger.exito(`Pago simulado confirmado: matrícula ${matriculaId}, monto $${monto}`);

  return matricula;
};

// Registra un pago en efectivo/transferencia hecho presencialmente
const registrarPagoFisico = async (matriculaId, monto) => {
  const matricula = await Matricula.findById(matriculaId);
  if (!matricula) {
    logger.error(`Matrícula no encontrada: ${matriculaId}`);
    throw new ErrorAPI('Matrícula no encontrada', 404);
  }

  await matricula.agregarPago(monto, 'fisico');
  logger.exito(`Pago físico registrado: $${monto} para matrícula ${matriculaId}`);

  return matricula;
};

// Procesa el webhook de Stripe: verifica la firma y registra el pago.
// Necesita el body CRUDO (raw) para poder verificar la firma.
const procesarWebhookStripe = async (rawBody, firma) => {
  const event = stripe.webhooks.constructEvent(
    rawBody,
    firma,
    process.env.STRIPE_WEBHOOK_SECRET
  );

  logger.proceso(`Webhook recibido: ${event.type}`);

  if (event.type === 'checkout.session.completed') {
    const session = event.data.object;
    const { matriculaId, monto } = session.metadata;

    const matricula = await Matricula.findById(matriculaId);
    if (matricula) {
      // Idempotencia: si Stripe reintenta el mismo evento (mismo payment_intent),
      // NO volver a acreditar el pago.
      const yaRegistrado = matricula.pagos.some(
        (pago) => pago.stripePaymentId && pago.stripePaymentId === session.payment_intent
      );
      if (!yaRegistrado) {
        await matricula.agregarPago(parseFloat(monto), 'stripe', session.payment_intent);
        logger.exito(`Pago registrado vía Stripe: ${session.id}`);
      } else {
        logger.proceso(`Webhook duplicado ignorado: ${session.id}`);
      }
    }
  }

  return { received: true };
};

// Envía un recordatorio de pago al correo del estudiante de una matrícula.
// Requiere que la matrícula exista y que el estudiante tenga correo registrado.
const enviarRecordatorioPago = async (matriculaId) => {
  const matricula = await Matricula.findById(matriculaId).populate('estudiante').populate('curso');
  if (!matricula) {
    logger.error(`Matrícula no encontrada: ${matriculaId}`);
    throw new ErrorAPI('Matrícula no encontrada', 404);
  }

  const estudiante = matricula.estudiante;
  if (!estudiante || !estudiante.email) {
    logger.error(`Estudiante sin correo registrado: ${matriculaId}`);
    throw new ErrorAPI('El estudiante no tiene un correo registrado', 400);
  }

  const saldo = matricula.saldoPendiente || 0;
  if (saldo <= 0) {
    logger.error(`Matrícula sin saldo pendiente: ${matriculaId}`);
    throw new ErrorAPI('La matrícula no tiene saldo pendiente', 400);
  }

  await enviarCorreo({
    para: estudiante.email,
    asunto: `SchoolNode - Recordatorio de pago: ${matricula.curso ? matricula.curso.nombre : 'matrícula'}`,
    html: plantillaRecordatorioPago({
      nombre: estudiante.nombre,
      curso: matricula.curso ? matricula.curso.nombre : 'matrícula',
      saldo,
      fechaVencimiento: matricula.fechaVencimiento,
      appUrl: process.env.APP_URL,
    }),
  });

  logger.exito(`Recordatorio de pago enviado a ${estudiante.email} (matrícula ${matriculaId})`);
  return { enviado: true, para: estudiante.email, saldo, fechaVencimiento: matricula.fechaVencimiento };
};

module.exports = {
  stripeConfigurado,
  crearSesionPago,
  confirmarPagoSimulado,
  registrarPagoFisico,
  procesarWebhookStripe,
  enviarRecordatorioPago,
};
