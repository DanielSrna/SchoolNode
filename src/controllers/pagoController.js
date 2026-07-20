const stripe = require('../config/stripe');
const Matricula = require('../models/Matricula');
const logger = require('../utils/logger');

// Verificar si Stripe está configurado con claves reales
const stripeConfigurado = () => {
  return process.env.STRIPE_SECRET_KEY &&
    !process.env.STRIPE_SECRET_KEY.includes('replace') &&
    !process.env.STRIPE_SECRET_KEY.includes('change');
};

// POST /api/pagos/crear-sesion
const crearSesionPago = async (req, res) => {
  try {
    const { matriculaId, monto } = req.body;

    const matricula = await Matricula.findById(matriculaId)
      .populate('estudiante', 'nombre email cedula apellido')
      .populate('curso', 'nombre');

    if (!matricula) {
      logger.error(`Matrícula no encontrada: ${matriculaId}`);
      return res.status(404).json({ error: 'Matrícula no encontrada' });
    }

    // Si Stripe está configurado, usar Stripe real
    if (stripeConfigurado()) {
      const session = await stripe.checkout.sessions.create({
        payment_method_types: ['card'],
        line_items: [{
          price_data: {
            currency: 'cop',
            product_data: {
              name: `Pago matrícula - ${matricula.curso.nombre}`,
              description: `Estudiante: ${matricula.estudiante.nombre} ${matricula.estudiante.apellido}`,
            },
            unit_amount: monto * 100,
          },
          quantity: 1,
        }],
        mode: 'payment',
        success_url: `${process.env.APP_URL}/pagos/exito?session_id={CHECKOUT_SESSION_ID}&matricula=${matriculaId}`,
        cancel_url: `${process.env.APP_URL}/pagos?cancelado=1`,
        metadata: { matriculaId, monto: String(monto) },
      });

      logger.exito(`Sesión de Stripe creada: ${session.id}`);
      return res.json({ sessionId: session.id, url: session.url, modo: 'stripe' });
    }

    // Modo simulación (sin claves reales de Stripe)
    const sessionId = `sim_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    logger.proceso(`Sesión simulada creada: ${sessionId} para matrícula ${matriculaId}, monto $${monto}`);

    res.json({
      sessionId,
      url: `/pagos/simular-pago?session_id=${sessionId}&matricula=${matriculaId}&monto=${monto}`,
      modo: 'simulacion',
    });
  } catch (error) {
    logger.error(`Error creando sesión de pago: ${error.message}`);
    res.status(500).json({ error: 'Error en el servidor' });
  }
};

// GET /api/pagos/confirmar-simulacion - Confirma un pago simulado
const confirmarPagoSimulado = async (req, res) => {
  try {
    const { matriculaId, monto } = req.query;

    const matricula = await Matricula.findById(matriculaId);
    if (!matricula) {
      logger.error(`Matrícula no encontrada: ${matriculaId}`);
      return res.status(404).json({ error: 'Matrícula no encontrada' });
    }

    await matricula.agregarPago(parseFloat(monto), 'stripe', `sim_${Date.now()}`);
    logger.exito(`Pago simulado confirmado: matrícula ${matriculaId}, monto $${monto}`);

    res.json({ success: true, matricula });
  } catch (error) {
    logger.error(`Error confirmando pago simulado: ${error.message}`);
    res.status(500).json({ error: 'Error en el servidor' });
  }
};

// POST /api/webhooks/stripe
const webhookStripe = async (req, res) => {
  const sig = req.headers['stripe-signature'];
  try {
    const event = stripe.webhooks.constructEvent(
      req.body, sig, process.env.STRIPE_WEBHOOK_SECRET
    );

    logger.proceso(`Webhook recibido: ${event.type}`);

    if (event.type === 'checkout.session.completed') {
      const session = event.data.object;
      const { matriculaId, monto } = session.metadata;

      const matricula = await Matricula.findById(matriculaId);
      if (matricula) {
        await matricula.agregarPago(parseFloat(monto), 'stripe', session.payment_intent);
        logger.exito(`Pago registrado vía Stripe: ${session.id}`);
      }
    }

    res.json({ received: true });
  } catch (error) {
    logger.error(`Error en webhook: ${error.message}`);
    res.status(400).json({ error: `Webhook error: ${error.message}` });
  }
};

// POST /api/pagos/fisico
const pagoFisico = async (req, res) => {
  try {
    const { matriculaId, monto } = req.body;

    const matricula = await Matricula.findById(matriculaId);
    if (!matricula) {
      logger.error(`Matrícula no encontrada: ${matriculaId}`);
      return res.status(404).json({ error: 'Matrícula no encontrada' });
    }

    await matricula.agregarPago(monto, 'fisico');
    logger.exito(`Pago físico registrado: $${monto} para matrícula ${matriculaId}`);
    res.json(matricula);
  } catch (error) {
    logger.error(`Error registrando pago físico: ${error.message}`);
    res.status(500).json({ error: 'Error en el servidor' });
  }
};

module.exports = {
  crearSesionPago,
  confirmarPagoSimulado,
  webhookStripe,
  pagoFisico,
};
