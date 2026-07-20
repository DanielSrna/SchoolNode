// Ajustes JavaScript
document.addEventListener('DOMContentLoaded', function() {
  cargarConfiguracion();
  cargarEstadisticas();
  cargarInfoAdmin();

  // Preview del logo al escribir
  const inputLogo = document.getElementById('cfgLogoEmoji');
  if (inputLogo) {
    inputLogo.addEventListener('input', function() {
      document.getElementById('logoPreview').textContent = this.value || '🏫';
    });
  }

  document.getElementById('formConfigGeneral').addEventListener('submit', guardarConfigGeneral);
  document.getElementById('formConfigFacturacion').addEventListener('submit', guardarConfigFacturacion);
  document.getElementById('formCredenciales').addEventListener('submit', cambiarCredenciales);
});

async function cargarConfiguracion() {
  try {
    const response = await fetch('/api/configuracion', { credentials: 'same-origin' });
    const config = await response.json();

    document.getElementById('cfgNombre').value = config.nombreInstitucion || '';
    document.getElementById('cfgUbicacion').value = config.ubicacion || '';
    document.getElementById('cfgNit').value = config.nit || '';
    document.getElementById('cfgTelefono').value = config.telefono || '';
    document.getElementById('cfgEmail').value = config.email || '';
    document.getElementById('cfgColor').value = config.colorPrimario || '#0d6efd';
    document.getElementById('cfgLogoEmoji').value = config.logoEmoji || '🏫';
    document.getElementById('logoPreview').textContent = config.logoEmoji || '🏫';

    if (config.facturacion) {
      document.getElementById('cfgPrefijo').value = config.facturacion.prefijoFactura || 'FAC';
      document.getElementById('cfgRegimen').value = config.facturacion.regimen || 'Simplificado';
      document.getElementById('cfgResolucion').value = config.facturacion.resolucionDIAN || '';
      document.getElementById('cfgPieFactura').value = config.facturacion.pieFactura || '';
    }
  } catch (error) {
    console.error('Error cargando configuración:', error);
  }
}

async function cargarEstadisticas() {
  try {
    const [est, cursos, aulas, matriculas] = await Promise.all([
      fetch('/api/estudiantes', { credentials: 'same-origin' }).then(r => r.json()),
      fetch('/api/cursos', { credentials: 'same-origin' }).then(r => r.json()),
      fetch('/api/aulas', { credentials: 'same-origin' }).then(r => r.json()),
      fetch('/api/matriculas', { credentials: 'same-origin' }).then(r => r.json()),
    ]);

    document.getElementById('statEstudiantes').textContent = est.total || 0;
    document.getElementById('statCursos').textContent = cursos.length;
    document.getElementById('statAulas').textContent = aulas.length;
    document.getElementById('statMatriculas').textContent = matriculas.length;
    document.getElementById('ultimaActualizacion').textContent = new Date().toLocaleDateString('es-CO');
  } catch (error) {
    console.error('Error cargando estadísticas:', error);
  }
}

async function cargarInfoAdmin() {
  try {
    const response = await fetch('/api/auth/me', { credentials: 'same-origin' });
    const data = await response.json();
    document.getElementById('adminEmailActual').value = data.email;
  } catch (error) {
    console.error('Error:', error);
  }
}

async function guardarConfigGeneral(e) {
  e.preventDefault();
  const data = {
    nombreInstitucion: document.getElementById('cfgNombre').value,
    ubicacion: document.getElementById('cfgUbicacion').value,
    nit: document.getElementById('cfgNit').value,
    telefono: document.getElementById('cfgTelefono').value,
    email: document.getElementById('cfgEmail').value,
    colorPrimario: document.getElementById('cfgColor').value,
    logoEmoji: document.getElementById('cfgLogoEmoji').value || '🏫',
  };

  try {
    const response = await fetch('/api/configuracion', {
      method: 'PUT',
      credentials: 'same-origin',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });

    if (response.ok) {
      alert('Configuración guardada exitosamente. Recargando para aplicar cambios...');
      // Recargar la página para que se apliquen los cambios en el header
      setTimeout(() => location.reload(), 800);
    } else {
      const err = await response.json();
      alert(err.error || 'Error al guardar');
    }
  } catch (error) {
    console.error('Error:', error);
    alert('Error de conexión');
  }
}

async function guardarConfigFacturacion(e) {
  e.preventDefault();
  const data = {
    facturacion: {
      prefijoFactura: document.getElementById('cfgPrefijo').value,
      regimen: document.getElementById('cfgRegimen').value,
      resolucionDIAN: document.getElementById('cfgResolucion').value,
      pieFactura: document.getElementById('cfgPieFactura').value,
    },
  };

  try {
    const response = await fetch('/api/configuracion', {
      method: 'PUT',
      credentials: 'same-origin',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });

    if (response.ok) {
      alert('Configuración de facturación guardada');
    } else {
      const err = await response.json();
      alert(err.error || 'Error al guardar');
    }
  } catch (error) {
    console.error('Error:', error);
    alert('Error de conexión');
  }
}

async function cambiarCredenciales(e) {
  e.preventDefault();
  const nuevoEmail = document.getElementById('adminNuevoEmail').value;
  const nuevaPassword = document.getElementById('adminNuevaPassword').value;

  if (!nuevoEmail && !nuevaPassword) {
    alert('Ingresa al menos un cambio (email o contraseña)');
    return;
  }

  if (!confirm('¿Confirmar cambio de credenciales?')) return;

  try {
    const response = await fetch('/api/configuracion/cambiar-credenciales', {
      method: 'POST',
      credentials: 'same-origin',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ nuevoEmail, nuevaPassword }),
    });

    if (response.ok) {
      alert('Credenciales actualizadas. Vuelve a iniciar sesión.');
      setTimeout(() => {
        window.location.href = '/api/auth/logout';
      }, 1500);
    } else {
      const err = await response.json();
      alert(err.error || 'Error al cambiar credenciales');
    }
  } catch (error) {
    console.error('Error:', error);
    alert('Error de conexión');
  }
}
