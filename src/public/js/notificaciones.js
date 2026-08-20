// Notificaciones JavaScript
document.addEventListener('DOMContentLoaded', function () {
  // En todas las páginas: actualizar el contador de la campana
  actualizarContador();

  // Solo en la página de notificaciones: cargar la lista y el formulario
  if (!document.getElementById('listaNotificaciones')) return;

  cargarNotificaciones();

  const form = document.getElementById('formNuevaNotificacion');
  if (form) {
    form.addEventListener('submit', crearNotificacion);
  }

  const modal = document.getElementById('modalNuevaNotificacion');
  if (modal) {
    modal.addEventListener('hidden.bs.modal', function () {
      form.reset();
    });
  }
});

async function cargarNotificaciones() {
  try {
    const response = await fetch('/api/notificaciones');
    const notificaciones = await response.json();

    const contenedor = document.getElementById('listaNotificaciones');
    contenedor.innerHTML = '';

    if (notificaciones.length === 0) {
      contenedor.innerHTML = `
        <p class="text-center text-muted py-4">
          No hay notificaciones ${window.esAdmin ? 'recibidas' : 'enviadas'}
        </p>`;
      return;
    }

    notificaciones.forEach(notif => {
      const remitente = notif.remitente ? `${notif.remitente.nombre}` : 'Usuario';
      const fecha = new Date(notif.createdAt).toLocaleString('es-CO', {
        day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit',
      });

      const card = document.createElement('div');
      card.className = `card mb-2 ${notif.leida ? '' : 'border-primary'}`;
      card.innerHTML = `
        <div class="card-body py-2">
          <div class="d-flex justify-content-between align-items-start gap-2 flex-wrap">
            <div class="flex-grow-1 min-w-0">
              <h6 class="mb-1 ${notif.leida ? '' : 'fw-bold'}">
                ${notif.leida ? '' : '<span class="badge bg-primary me-1">Nueva</span>'}
                ${notif.asunto}
              </h6>
              <p class="mb-1 text-muted">${notif.mensaje}</p>
              <small class="text-muted">
                ${window.esAdmin ? `De: <strong>${remitente}</strong> · ` : `Para: <strong>Administrador</strong> · `}
                ${fecha}
              </small>
            </div>
            ${window.esAdmin && !notif.leida
              ? `<button class="btn btn-sm btn-outline-primary" onclick="marcarLeida('${notif._id}')">Marcar leída</button>`
              : ''}
          </div>
        </div>
      `;
      contenedor.appendChild(card);
    });
  } catch (error) {
    console.error('Error cargando notificaciones:', error);
  }
}

async function crearNotificacion(e) {
  e.preventDefault();
  const data = {
    asunto: document.getElementById('notifAsunto').value,
    mensaje: document.getElementById('notifMensaje').value,
  };

  try {
    const response = await fetch('/api/notificaciones', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });

    if (response.ok) {
      alert('Notificación enviada');
      bootstrap.Modal.getInstance(document.getElementById('modalNuevaNotificacion')).hide();
      cargarNotificaciones();
    } else {
      const error = await response.json();
      alert(error.error || 'Error al enviar notificación');
    }
  } catch (error) {
    console.error('Error:', error);
    alert('Error de conexión');
  }
}

async function marcarLeida(id) {
  try {
    const response = await fetch(`/api/notificaciones/${id}/leida`, { method: 'PATCH' });
    if (response.ok) {
      cargarNotificaciones();
      actualizarContador();
    } else {
      alert('Error al marcar como leída');
    }
  } catch (error) {
    console.error('Error:', error);
  }
}

// Actualiza el contador de la campana del header
async function actualizarContador() {
  try {
    const response = await fetch('/api/notificaciones/no-leidas');
    const { total } = await response.json();
    const badge = document.getElementById('notifBadge');
    if (badge) {
      badge.textContent = total;
      badge.style.display = total > 0 ? 'inline-block' : 'none';
    }
  } catch (error) {
    console.error('Error contando notificaciones:', error);
  }
}
