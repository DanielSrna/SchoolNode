const PDFDocument = require('pdfkit');
const Matricula = require('../models/Matricula');
const Configuracion = require('../models/Configuracion');
const { ErrorAPI } = require('../utils/ErrorAPI');
const logger = require('../utils/logger');

// ============================================================
// Servicio de facturación: construye el PDF y lo envía por el stream.
// tipo: 'total' (factura del valor completo) o 'aporte' (recibo de abono).
//
// Metodología del diseño:
//  - Cabecera institucional a la izquierda, datos de la factura a la derecha.
//  - Cajas de información con fondo suave para estudiante y matrícula.
//  - Tabla de pagos con encabezado coloreado, filas zebra y bordes.
//  - Totales alineados a la derecha con separador.
//  - Flujo controlado con doc.y (sin posiciones fijas frágiles).
// ============================================================

const MARGEN = 50;
const ANCHO_CONTENIDO = 612 - MARGEN * 2; // 512

const generarFacturaPDF = async (tipo, matriculaId, res) => {
  if (!['total', 'aporte'].includes(tipo)) {
    throw new ErrorAPI('Tipo de factura inválido', 400);
  }

  const matricula = await Matricula.findById(matriculaId)
    .populate('estudiante')
    .populate('curso')
    .populate('aula');

  if (!matricula) {
    throw new ErrorAPI('Matrícula no encontrada', 404);
  }

  const config = (await Configuracion.obtenerGeneral()) || {
    nombreInstitucion: 'Motos BSA la 23',
    ubicacion: 'Tuluá, Valle del Cauca',
    nit: '900.123.456-7',
  };

  const colorPrimario = config.colorPrimario || '#0d6efd';

  const doc = new PDFDocument({ size: 'LETTER', margin: MARGEN });

  const nombreArchivo = `factura-${tipo}-${matricula.estudiante ? matricula.estudiante.cedula : 'na'}-${Date.now()}.pdf`;
  res.setHeader('Content-Type', 'application/pdf');
  res.setHeader('Content-Disposition', `attachment; filename="${nombreArchivo}"`);

  doc.pipe(res);

  // ---------- Fuentes auxiliares ----------
  const normal = () => doc.font('Helvetica');
  const negrita = () => doc.font('Helvetica-Bold');

  // ---------- Cabecera: institución (izquierda) + factura (derecha) ----------
  negrita().fillColor(colorPrimario).fontSize(20).text(config.nombreInstitucion, MARGEN, 50);
  normal().fillColor('#666').fontSize(9);
  doc.text(config.ubicacion, MARGEN, 76);
  doc.text(`NIT: ${config.nit}`, MARGEN, 88);

  const tituloFactura = tipo === 'total' ? 'FACTURA DE PAGO TOTAL' : 'FACTURA DE APORTE';
  negrita().fillColor(colorPrimario).fontSize(14).text(tituloFactura, MARGEN, 50, {
    align: 'right',
    width: ANCHO_CONTENIDO,
  });

  const numeroFactura = `FAC-${tipo.toUpperCase()}-${Date.now().toString().slice(-8)}`;
  const fechaEmision = new Date().toLocaleDateString('es-CO', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
  normal().fillColor('#666').fontSize(9);
  doc.text(`No. ${numeroFactura}`, MARGEN, 68, { align: 'right', width: ANCHO_CONTENIDO });
  doc.text(`Fecha de emisión: ${fechaEmision}`, MARGEN, 80, { align: 'right', width: ANCHO_CONTENIDO });

  // Línea de acento
  doc.moveDown(1.6);
  const yLinea = doc.y;
  doc.strokeColor(colorPrimario).lineWidth(1.5).moveTo(MARGEN, yLinea).lineTo(562, yLinea).stroke();
  doc.y = yLinea + 14;

  // ---------- Caja de información: estudiante | matrícula ----------
  const tituloSeccion = (texto) => {
    doc.moveDown(0.4);
    negrita().fillColor(colorPrimario).fontSize(10.5).text(texto);
    doc.moveDown(0.2);
  };

  const parEtiquetaValor = (etiqueta, valor, x, y, anchoEtiqueta = 130) => {
    normal().fillColor('#888').fontSize(9).text(etiqueta, x, y, { width: anchoEtiqueta });
    negrita().fillColor('#222').fontSize(9).text(valor, x + anchoEtiqueta, y, {
      width: 512 - anchoEtiqueta,
    });
  };

  // Estudiante (columna izquierda)
  tituloSeccion('ESTUDIANTE');
  const yEstudiante = doc.y;
  const nombreEstudiante = matricula.estudiante
    ? `${matricula.estudiante.nombre} ${matricula.estudiante.apellido}`
    : 'Estudiante eliminado';
  const cedulaEstudiante = matricula.estudiante ? matricula.estudiante.cedula : '-';
  const emailEstudiante = matricula.estudiante?.email || '-';
  const telefonoEstudiante = matricula.estudiante?.telefono || '-';

  parEtiquetaValor('Nombre:', nombreEstudiante, MARGEN, doc.y);
  doc.y += 13;
  parEtiquetaValor('Cédula:', cedulaEstudiante, MARGEN, doc.y);
  doc.y += 13;
  parEtiquetaValor('Email:', emailEstudiante, MARGEN, doc.y);
  doc.y += 13;
  parEtiquetaValor('Teléfono:', telefonoEstudiante, MARGEN, doc.y);
  doc.y += 6;

  // Matrícula (columna derecha, misma altura visual)
  const xDerecha = MARGEN + 256;
  const anchoDerecha = 512 - 256;
  normal().fillColor('#888').fontSize(9).text('CURSO / MATRÍCULA', xDerecha, yEstudiante - 20, {
    width: anchoDerecha,
  });
  negrita().fillColor(colorPrimario).fontSize(10.5).text(
    matricula.curso ? matricula.curso.nombre : 'Curso eliminado',
    xDerecha,
    yEstudiante - 4,
    { width: anchoDerecha }
  );

  const parDerecha = (etiqueta, valor, y) => {
    normal().fillColor('#888').fontSize(9).text(etiqueta, xDerecha, y, { width: 90 });
    negrita().fillColor('#222').fontSize(9).text(valor, xDerecha + 95, y, {
      width: anchoDerecha - 95,
    });
  };

  parDerecha('Aula:', matricula.aula ? `Aula ${matricula.aula.numero}` : '-', yEstudiante + 14);
  parDerecha(
    'Duración:',
    matricula.curso ? matricula.curso.duracion : '-',
    yEstudiante + 27
  );
  parDerecha(
    'Inicio:',
    new Date(matricula.fechaInicio).toLocaleDateString('es-CO'),
    yEstudiante + 40
  );
  parDerecha(
    'Vence:',
    new Date(matricula.fechaVencimiento).toLocaleDateString('es-CO'),
    yEstudiante + 53
  );

  doc.y = Math.max(doc.y, yEstudiante + 70);

  // ---------- Tabla de pagos ----------
  doc.moveDown(0.8);
  tituloSeccion('DETALLE DE PAGOS');

  const tablaX = MARGEN;
  const tablaAncho = ANCHO_CONTENIDO;
  const cols = [
    { x: 0, w: 150, titulo: 'Fecha', align: 'left' },
    { x: 150, w: 100, titulo: 'Método', align: 'left' },
    { x: 250, w: 160, titulo: 'ID Transacción', align: 'left' },
    { x: 410, w: 102, titulo: 'Monto', align: 'right' },
  ];
  const alturaFila = 20;
  const alturaEncabezado = 22;

  const dibujarFila = (y, altura, { fondo, textoColor }) => {
    if (fondo) {
      doc.rect(tablaX, y, tablaAncho, altura).fill(fondo);
    }
  };

  // Encabezado
  let y = doc.y;
  doc.rect(tablaX, y, tablaAncho, alturaEncabezado).fill(colorPrimario);
  negrita().fillColor('#ffffff').fontSize(9);
  for (const col of cols) {
    doc.text(col.titulo, tablaX + col.x + 8, y + 7, {
      width: col.w - 16,
      align: col.align,
    });
  }
  y += alturaEncabezado;

  // Filas
  const pagos = matricula.pagos || [];
  normal().fontSize(9);
  pagos.forEach((pago, index) => {
    if (index % 2 === 0) dibujarFila(y, alturaFila, { fondo: '#f1f3f5' });
    const valores = [
      new Date(pago.fecha).toLocaleDateString('es-CO'),
      pago.metodo === 'stripe' ? 'Stripe' : 'Físico',
      (pago.stripePaymentId || '-').substr(0, 22),
      `$${(pago.monto || 0).toLocaleString('es-CO')}`,
    ];
    negrita().fillColor('#222');
    if (index % 2 === 0) negrita().fillColor('#222');
    for (const col of cols) {
      doc.text(valores[cols.indexOf(col)], tablaX + col.x + 8, y + 6, {
        width: col.w - 16,
        align: col.align,
      });
    }
    y += alturaFila;
  });

  if (pagos.length === 0) {
    normal().fillColor('#888').text('No se han registrado pagos aún.', tablaX + 8, y + 6);
    y += alturaFila;
  }

  // Bordes de la tabla
  doc.strokeColor('#ced4da').lineWidth(0.6);
  doc.rect(tablaX, doc.y - alturaEncabezado, tablaAncho, y - (doc.y - alturaEncabezado)).stroke();

  doc.y = y + 16;

  // ---------- Totales ----------
  const precioTotal = matricula.curso ? matricula.curso.precio : 0;
  const totalPagado = matricula.totalPagado || 0;
  const saldoPendiente = Math.max(0, precioTotal - totalPagado);

  const totalesX = MARGEN + 210;
  const anchoTotales = ANCHO_CONTENIDO - 210;

  const filaTotal = (etiqueta, valor, { color = '#222', negrilla = false } = {}) => {
    const y0 = doc.y;
    if (negrilla) negrita(); else normal();
    doc.fillColor('#888').fontSize(9).text(etiqueta, totalesX, y0, { width: anchoTotales - 90 });
    doc.fillColor(color).fontSize(negrilla ? 12 : 9).text(valor, totalesX + anchoTotales - 90, y0, {
      width: 90,
      align: 'right',
    });
    doc.y = y0 + 16;
  };

  // Separador superior
  doc.strokeColor(colorPrimario).lineWidth(0.8).moveTo(totalesX, doc.y).lineTo(562, doc.y).stroke();
  doc.y += 8;

  filaTotal('Costo total del curso:', `$${precioTotal.toLocaleString('es-CO')}`);
  filaTotal('Ya pagado:', `$${totalPagado.toLocaleString('es-CO')}`, { color: '#198754' });
  doc.y += 2;
  filaTotal(
    saldoPendiente > 0 ? 'Faltante por pagar:' : 'Totalmente pagado:',
    `$${saldoPendiente.toLocaleString('es-CO')}`,
    { color: saldoPendiente > 0 ? '#dc3545' : '#198754', negrilla: true }
  );

  // ---------- Pie de página ----------
  const pieY = Math.min(Math.max(doc.y + 30, 690), 735);
  normal().fillColor('#666').fontSize(8);
  doc.text('Este documento es una factura generada electrónicamente.', MARGEN, pieY, {
    align: 'center',
    width: ANCHO_CONTENIDO,
  });
  doc.text(`Generado el ${new Date().toLocaleString('es-CO')}`, MARGEN, pieY + 12, {
    align: 'center',
    width: ANCHO_CONTENIDO,
  });
  negrita()
    .fillColor(colorPrimario)
    .fontSize(8.5)
    .text(`${config.nombreInstitucion} - ${config.ubicacion}`, MARGEN, pieY + 24, {
      align: 'center',
      width: ANCHO_CONTENIDO,
    });
  normal()
    .fillColor('#666')
    .fontSize(8)
    .text(
      config.facturacion && config.facturacion.pieFactura
        ? config.facturacion.pieFactura
        : 'Gracias por su pago',
      MARGEN,
      pieY + 36,
      { align: 'center', width: ANCHO_CONTENIDO }
    );

  doc.end();

  logger.exito(`Factura ${tipo} generada para matrícula ${matriculaId}: ${nombreArchivo}`);
};

module.exports = { generarFacturaPDF };
