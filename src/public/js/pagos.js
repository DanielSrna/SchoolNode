// Pagos JavaScript
document.addEventListener('DOMContentLoaded', function() {
  cargarPagos();
  const form = document.getElementById('formPagoFisico');
  if (form) {
    form.addEventListener('submit', registrarPagoFisico);
  }
});

async function cargarPagos() {
  try {
    const response = await fetch('/api/matriculas', { credentials: 'same-origin' });
    const matriculas = await response.json();

    let totalGanado = 0;
    let totalDeuda = 0;

    const tbody = document.getElementById('tablaPagos');
    tbody.innerHTML = '';

    matriculas.forEach(mat => {
      // deudaTotal = costo total del curso
      // totalPagado = lo que ya se ha pagado
      // faltante = lo que falta por pagar
      totalGanado += mat.totalPagado || 0;
      totalDeuda += mat.saldoPendiente || 0;

      const cursoId = mat.curso._id.substr(-6);
      const alumnoId = mat.estudiante.cedula;
      const pagosCount = mat.pagos.length;
      const deudaTotal = mat.curso.precio; // Costo total del curso
      const totalPagado = mat.totalPagado || 0; // Ya pagado
      const faltante = mat.saldoPendiente || 0; // Faltante por pagar

      const tr = document.createElement('tr');
      let acciones = '';

      // Botones siempre visibles: descargar factura
      acciones += `<a href="/api/pagos/factura/total/${mat._id}" target="_blank" class="btn btn-sm btn-success mb-1">Factura Total</a>`;
      acciones += `<button class="btn btn-sm btn-info text-white mb-1" onclick="facturarAporte('${mat._id}', ${faltante})">Factura Aporte</button>`;

      // Stripe: solo admin, pregunta monto
      if (window.esAdmin) {
        acciones += `<button class="btn btn-sm btn-primary mb-1" onclick="pagoStripe('${mat._id}', ${faltante})">Pagar con Stripe</button>`;
        acciones += `<button class="btn btn-sm btn-danger mb-1" onclick="cancelarDeuda('${mat._id}')">Cancelar Deuda</button>`;
      }

      // Ambos pueden registrar pago físico
      acciones += `<button class="btn btn-sm btn-warning text-white mb-1" onclick="abrirPagoFisico('${mat._id}', ${faltante})">Pago Físico</button>`;

      tr.innerHTML = `
        <td>${alumnoId}</td>
        <td>${cursoId}</td>
        <td><span class="badge bg-primary">${pagosCount}</span></td>
        <td>$${deudaTotal.toLocaleString()}</td>
        <td class="text-success">$${totalPagado.toLocaleString()}</td>
        <td class="text-danger fw-bold">$${faltante.toLocaleString()}</td>
        <td>${acciones}</td>
      `;
      tbody.appendChild(tr);
    });

    document.getElementById('totalGanado').textContent = `$${totalGanado.toLocaleString()}`;
    document.getElementById('totalDeuda').textContent = `$${totalDeuda.toLocaleString()}`;
  } catch (error) {
    console.error('Error cargando pagos:', error);
  }
}

async function registrarPagoFisico(e) {
  e.preventDefault();
  const data = {
    matriculaId: document.getElementById('pagoMatriculaId').value,
    monto: parseInt(document.getElementById('pagoMonto').value),
  };

  try {
    const response = await fetch('/api/pagos/fisico', {
      method: 'POST',
      credentials: 'same-origin',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });

    if (response.ok) {
      alert('Pago físico registrado exitosamente');
      location.reload();
    } else {
      const error = await response.json();
      alert(error.error || 'Error al registrar pago');
    }
  } catch (error) {
    console.error('Error:', error);
    alert('Error de conexión');
  }
}

function abrirPagoFisico(matriculaId, saldoPendiente) {
  document.getElementById('pagoMatriculaId').value = matriculaId;
  document.getElementById('pagoMonto').value = saldoPendiente;
  document.getElementById('saldoPendienteInfo').textContent = saldoPendiente.toLocaleString();
  new bootstrap.Modal(document.getElementById('modalPagoFisico')).show();
}

async function pagoStripe(matriculaId, faltante) {
  if (faltante <= 0) {
    alert('No hay saldo pendiente para pagar');
    return;
  }

  const montoStr = prompt(
    `¿Cuánto va a pagar?\n\nSaldo pendiente: $${faltante.toLocaleString('es-CO')}\n\nIngrese el monto (o deje vacío para pagar el total):`,
    faltante.toString()
  );

  if (montoStr === null) return; // Canceló

  const monto = parseInt(montoStr);
  if (isNaN(monto) || monto <= 0) {
    alert('Monto inválido');
    return;
  }
  if (monto > faltante) {
    alert(`El monto no puede ser mayor al saldo pendiente ($${faltante.toLocaleString('es-CO')})`);
    return;
  }

  if (!confirm(`¿Iniciar pago de $${monto.toLocaleString('es-CO')} con Stripe?`)) return;

  try {
    const response = await fetch('/api/pagos/crear-sesion', {
      method: 'POST',
      credentials: 'same-origin',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ matriculaId, monto }),
    });

    const data = await response.json();

    if (response.ok) {
      window.location.href = data.url;
    } else {
      alert(data.error || 'Error al crear sesión de pago');
    }
  } catch (error) {
    console.error('Error:', error);
    alert('Error de conexión');
  }
}

async function facturarAporte(matriculaId, faltante) {
  if (faltante <= 0) {
    alert('Esta matrícula ya está totalmente pagada');
    return;
  }

  const montoStr = prompt(
    `¿De cuánto es el aporte que va a facturar?\n\nSaldo pendiente: $${faltante.toLocaleString('es-CO')}\n\nIngrese el monto del aporte:`,
    faltante.toString()
  );

  if (montoStr === null) return;

  const monto = parseInt(montoStr);
  if (isNaN(monto) || monto <= 0) {
    alert('Monto inválido');
    return;
  }
  if (monto > faltante) {
    alert(`El monto no puede ser mayor al saldo pendiente ($${faltante.toLocaleString('es-CO')})`);
    return;
  }

  // Registrar el aporte como pago físico y luego descargar la factura
  try {
    const response = await fetch('/api/pagos/fisico', {
      method: 'POST',
      credentials: 'same-origin',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ matriculaId, monto }),
    });

    if (response.ok) {
      // Descargar factura de aporte (con el nuevo pago registrado)
      window.open(`/api/pagos/factura/aporte/${matriculaId}?monto=${monto}`, '_blank');
      setTimeout(() => location.reload(), 1000);
    } else {
      const error = await response.json();
      alert(error.error || 'Error al registrar aporte');
    }
  } catch (error) {
    console.error('Error:', error);
    alert('Error de conexión');
  }
}

async function cancelarDeuda(matriculaId) {
  if (!confirm('¿Está seguro de cancelar esta deuda? Esta acción no se puede deshacer.')) return;
  try {
    const response = await fetch(`/api/matriculas/${matriculaId}`, {
      method: 'PUT',
      credentials: 'same-origin',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ estado: 'cancelada' }),
    });
    if (response.ok) {
      alert('Deuda cancelada');
      cargarPagos();
    } else {
      alert('Error al cancelar deuda');
    }
  } catch (error) {
    console.error('Error:', error);
  }
}
