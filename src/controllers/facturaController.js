const PDFDocument = require('pdfkit');
const Matricula = require('../models/Matricula');
const Configuracion = require('../models/Configuracion');
const logger = require('../utils/logger');

// GET /api/pagos/factura/:tipo/:matriculaId
// tipo: 'total' o 'aporte'
const generarFacturaPDF = async (req, res) => {
  try {
    const { tipo, matriculaId } = req.params;

    if (!['total', 'aporte'].includes(tipo)) {
      return res.status(400).json({ error: 'Tipo de factura inválido' });
    }

    const matricula = await Matricula.findById(matriculaId)
      .populate('estudiante')
      .populate('curso')
      .populate('aula');

    if (!matricula) {
      return res.status(404).json({ error: 'Matrícula no encontrada' });
    }

    // Obtener configuración de la institución
    const config = await Configuracion.findOne({ clave: 'general' }) || {
      nombreInstitucion: 'Motos BSA la 23',
      ubicacion: 'Tuluá, Valle del Cauca',
      nit: '900.123.456-7',
    };

    // Crear documento PDF
    const doc = new PDFDocument({ size: 'LETTER', margin: 50 });

    // Configurar headers de respuesta
    const nombreArchivo = `factura-${tipo}-${matricula.estudiante.cedula}-${Date.now()}.pdf`;
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="${nombreArchivo}"`);

    doc.pipe(res);

    // === ENCABEZADO ===
    doc.fillColor('#0d6efd').fontSize(20).text(config.nombreInstitucion, { align: 'center' });
    doc.moveDown(0.2);
    doc.fillColor('#666').fontSize(10).text(config.ubicacion, { align: 'center' });
    doc.fillColor('#666').fontSize(10).text(`NIT: ${config.nit}`, { align: 'center' });
    doc.moveDown(0.5);

    // Línea separadora
    doc.strokeColor('#0d6efd').lineWidth(2).moveTo(50, doc.y).lineTo(562, doc.y).stroke();
    doc.moveDown(1);

    // Título de la factura
    const tituloFactura = tipo === 'total' ? 'FACTURA DE PAGO TOTAL' : 'FACTURA DE APORTE';
    doc.fillColor('#000').fontSize(16).text(tituloFactura, { align: 'center' });
    doc.moveDown(0.5);

    // Número de factura
    doc.fontSize(9).fillColor('#666');
    const numeroFactura = `FAC-${tipo.toUpperCase()}-${Date.now().toString().slice(-8)}`;
    const fechaEmision = new Date().toLocaleDateString('es-CO', {
      year: 'numeric', month: 'long', day: 'numeric',
    });
    doc.text(`No. ${numeroFactura}`, { align: 'right' });
    doc.text(`Fecha de emisión: ${fechaEmision}`, { align: 'right' });
    doc.moveDown(1);

    // === DATOS DEL ESTUDIANTE ===
    doc.fillColor('#0d6efd').fontSize(12).text('DATOS DEL ESTUDIANTE', { underline: true });
    doc.moveDown(0.3);
    doc.fillColor('#000').fontSize(10);
    doc.text(`Nombre: ${matricula.estudiante.nombre} ${matricula.estudiante.apellido}`);
    doc.text(`Cédula: ${matricula.estudiante.cedula}`);
    if (matricula.estudiante.email) doc.text(`Email: ${matricula.estudiante.email}`);
    if (matricula.estudiante.telefono) doc.text(`Teléfono: ${matricula.estudiante.telefono}`);
    doc.moveDown(1);

    // === DETALLE DE LA MATRÍCULA ===
    doc.fillColor('#0d6efd').fontSize(12).text('DETALLE DE LA MATRÍCULA', { underline: true });
    doc.moveDown(0.3);
    doc.fillColor('#000').fontSize(10);
    doc.text(`Curso: ${matricula.curso.nombre}`);
    doc.text(`Aula: ${matricula.curso.nombre} - Aula ${matricula.aula.numero}`);
    doc.text(`Duración: ${matricula.curso.duracion}`);
    doc.text(`Fecha de inicio: ${new Date(matricula.fechaInicio).toLocaleDateString('es-CO')}`);
    doc.text(`Fecha de vencimiento: ${new Date(matricula.fechaVencimiento).toLocaleDateString('es-CO')}`);
    doc.moveDown(1);

    // === DETALLE DE PAGOS ===
    doc.fillColor('#0d6efd').fontSize(12).text('DETALLE DE PAGOS', { underline: true });
    doc.moveDown(0.3);

    // Tabla de pagos
    const tablaTop = doc.y;
    const col1 = 50, col2 = 250, col3 = 380, col4 = 480;

    // Headers
    doc.fillColor('#fff').fontSize(10);
    doc.rect(col1, tablaTop, 512, 20).fill('#0d6efd');
    doc.fillColor('#fff').text('Fecha', col1 + 5, tablaTop + 5);
    doc.text('Método', col2, tablaTop + 5);
    doc.text('ID Transacción', col3, tablaTop + 5);
    doc.text('Monto', col4, tablaTop + 5);

    let y = tablaTop + 25;
    doc.fillColor('#000').fontSize(9);

    matricula.pagos.forEach((pago, index) => {
      if (index % 2 === 0) {
        doc.rect(col1, y - 3, 512, 18).fill('#f8f9fa');
        doc.fillColor('#000');
      }
      doc.text(new Date(pago.fecha).toLocaleDateString('es-CO'), col1 + 5, y);
      doc.text(pago.metodo === 'stripe' ? 'Stripe' : 'Físico', col2, y);
      doc.text((pago.stripePaymentId || '-').substr(0, 20), col3, y);
      doc.text(`$${pago.monto.toLocaleString('es-CO')}`, col4, y);
      y += 18;
    });

    if (matricula.pagos.length === 0) {
      doc.text('No se han registrado pagos aún.', col1 + 5, y);
      y += 18;
    }

    doc.y = y + 10;

    // === TOTALES ===
    const precioTotal = matricula.curso.precio;
    const totalPagado = matricula.totalPagado || 0;
    const saldoPendiente = Math.max(0, precioTotal - totalPagado);

    doc.moveDown(0.5);
    const totalesX = 380;
    doc.fillColor('#000').fontSize(11);
    doc.text('Costo total del curso:', totalesX, doc.y);
    doc.text(`$${precioTotal.toLocaleString('es-CO')}`, totalesX + 130, doc.y, { align: 'right', width: 52 });
    doc.moveDown(0.3);
    doc.fillColor('#198754').text('Ya pagado:', totalesX, doc.y);
    doc.text(`$${totalPagado.toLocaleString('es-CO')}`, totalesX + 130, doc.y, { align: 'right', width: 52 });
    doc.moveDown(0.3);
    doc.fillColor(saldoPendiente > 0 ? '#dc3545' : '#198754').fontSize(13).text(
      saldoPendiente > 0 ? 'Faltante por pagar:' : 'Totalmente pagado:',
      totalesX, doc.y
    );
    doc.text(`$${saldoPendiente.toLocaleString('es-CO')}`, totalesX + 130, doc.y, { align: 'right', width: 52 });
    doc.moveDown(2);

    // === PIE DE PÁGINA ===
    doc.fillColor('#666').fontSize(8);
    const pieY = 700;
    doc.text('Este documento es una factura generada electrónicamente.', 50, pieY, { align: 'center' });
    doc.text(`Generado el ${new Date().toLocaleString('es-CO')}`, 50, pieY + 12, { align: 'center' });
    doc.text(`${config.nombreInstitucion} - ${config.ubicacion}`, 50, pieY + 24, { align: 'center' });

    // Finalizar
    doc.end();

    logger.exito(`Factura ${tipo} generada para matrícula ${matriculaId}: ${nombreArchivo}`);
  } catch (error) {
    logger.error(`Error generando PDF: ${error.message}`);
    res.status(500).json({ error: 'Error generando PDF: ' + error.message });
  }
};

module.exports = { generarFacturaPDF };
