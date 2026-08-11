const pagoService = require('../services/pagoService');
const { responderError } = require('../utils/ErrorAPI');
const logger = require('../utils/logger');

// Controlador de pagos: SOLO orquesta.
// La lógica de Stripe, simulación y pagos físicos vive en pagoService.

// POST /api/pagos/crear-sesion
const crearSesionPago = async (req, res) => {
  try {
    const { matriculaId, monto } = req.body;
    const sesion = await pagoService.crearSesionPago(matriculaId, monto);
    res.json(sesion);
  } catch (error) {
    logger.error(`Error creando sesión de pago: ${error.message}`);
    responderError(res, error);
  }
};

// POST /api/pagos/confirmar-simulacion - Confirma un pago simulado
const confirmarPagoSimulado = async (req, res) => {
  try {
    const { matriculaId, monto } = { ...req.query, ...req.body };
    const matricula = await pagoService.confirmarPagoSimulado(matriculaId, monto);
    res.json({ success: true, matricula });
  } catch (error) {
    logger.error(`Error confirmando pago simulado: ${error.message}`);
    responderError(res, error);
  }
};

// POST /api/pagos/webhook/stripe
const webhookStripe = async (req, res) => {
  try {
    const firma = req.headers['stripe-signature'];
    const resultado = await pagoService.procesarWebhookStripe(req.body, firma);
    res.json(resultado);
  } catch (error) {
    logger.error(`Error en webhook: ${error.message}`);
    res.status(400).json({ error: `Webhook error: ${error.message}` });
  }
};

// POST /api/pagos/fisico
const pagoFisico = async (req, res) => {
  try {
    const { matriculaId, monto } = req.body;
    const matricula = await pagoService.registrarPagoFisico(matriculaId, monto);
    res.json(matricula);
  } catch (error) {
    logger.error(`Error registrando pago físico: ${error.message}`);
    responderError(res, error);
  }
};

module.exports = {
  crearSesionPago,
  confirmarPagoSimulado,
  webhookStripe,
  pagoFisico,
};
