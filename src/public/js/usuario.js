// Usuario JavaScript - Cambiar ID y Contraseña
document.addEventListener('DOMContentLoaded', async function() {
  await cargarInfoUsuario();
});

async function cargarInfoUsuario() {
  try {
    // Obtener info del usuario actual (necesitamos agregar este endpoint)
    const response = await fetch('/api/auth/me');
    if (response.ok) {
      const data = await response.json();
      document.getElementById('usuarioNombre').textContent = data.nombre;
      document.getElementById('usuarioEmail').textContent = data.email;
      document.getElementById('usuarioRol').textContent = data.rol.toUpperCase();
    }
  } catch (error) {
    console.error('Error cargando info de usuario:', error);
  }
}

async function cambiarID() {
  const nuevoId = document.getElementById('nuevoId').value;
  
  if (!nuevoId) {
    alert('Por favor ingresa un nuevo ID');
    return;
  }
  
  if (!confirm(`¿Confirmar cambio de ID a "${nuevoId}" con email?`)) {
    return;
  }
  
  try {
    const response = await fetch('/api/auth/cambiar-id', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ nuevoId }),
    });
    
    if (response.ok) {
      alert('Se ha enviado un email de confirmación. Revisa tu bandeja de entrada.');
      document.getElementById('nuevoId').value = '';
    } else {
      const error = await response.json();
      alert(error.error || 'Error al cambiar ID');
    }
  } catch (error) {
    console.error('Error:', error);
    alert('Error de conexión');
  }
}

async function cambiarPassword() {
  const nuevaPassword = document.getElementById('nuevaPassword').value;
  
  if (!nuevaPassword || nuevaPassword.length < 8) {
    alert('La contraseña debe tener al menos 8 caracteres');
    return;
  }
  
  if (!confirm('¿Confirmar cambio de contraseña con email?')) {
    return;
  }
  
  try {
    const response = await fetch('/api/auth/cambiar-password', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ nuevaPassword }),
    });
    
    if (response.ok) {
      alert('Se ha enviado un email de confirmación. Revisa tu bandeja de entrada.');
      document.getElementById('nuevaPassword').value = '';
    } else {
      const error = await response.json();
      alert(error.error || 'Error al cambiar contraseña');
    }
  } catch (error) {
    console.error('Error:', error);
    alert('Error de conexión');
  }
}
