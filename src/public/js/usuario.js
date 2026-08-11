// Usuario JavaScript - Cambio de correo y contraseña con verificación por email
// Flujo: 1) se solicita el cambio → llega un código de 6 dígitos al correo
//        2) el usuario ingresa el código → el cambio se aplica
document.addEventListener('DOMContentLoaded', async function () {
  await cargarInfoUsuario();
});

async function cargarInfoUsuario() {
  try {
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

// Pide el código recibido por correo y lo envía al servidor para confirmar
async function confirmarConCodigo() {
  const codigo = prompt('Ingresa el código de 6 dígitos que llegó a tu correo:');
  if (!codigo) return false;

  const response = await fetch('/api/auth/confirmar-cambio', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ codigo: codigo.trim() }),
  });

  const data = await response.json();
  if (response.ok) {
    alert(data.mensaje);
    if (data.cerrarSesion) {
      window.location.href = '/login';
      return true;
    }
    await cargarInfoUsuario();
    return true;
  }

  alert(data.error || (data.errores && data.errores[0].msg) || 'Código inválido');
  return false;
}

async function cambiarEmail() {
  const nuevoEmail = document.getElementById('nuevoEmail').value.trim();

  if (!nuevoEmail || !nuevoEmail.includes('@')) {
    alert('Por favor ingresa un correo válido');
    return;
  }

  if (!confirm(`¿Enviar código de verificación a "${nuevoEmail}"?`)) {
    return;
  }

  try {
    const response = await fetch('/api/auth/cambiar-email', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ nuevoEmail }),
    });

    const data = await response.json();
    if (response.ok) {
      alert(data.mensaje);
      if (await confirmarConCodigo()) {
        document.getElementById('nuevoEmail').value = '';
      }
    } else {
      alert(data.error || (data.errores && data.errores[0].msg) || 'Error al solicitar el cambio');
    }
  } catch (error) {
    console.error('Error:', error);
    alert('Error de conexión');
  }
}

async function cambiarPassword() {
  const passwordActual = document.getElementById('passwordActual').value;
  const nuevaPassword = document.getElementById('nuevaPassword').value;

  if (!passwordActual) {
    alert('Ingresa tu contraseña actual');
    return;
  }
  if (!nuevaPassword || nuevaPassword.length < 8) {
    alert('La nueva contraseña debe tener al menos 8 caracteres');
    return;
  }

  if (!confirm('¿Enviar código de verificación a tu correo actual?')) {
    return;
  }

  try {
    const response = await fetch('/api/auth/cambiar-password', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ passwordActual, nuevaPassword }),
    });

    const data = await response.json();
    if (response.ok) {
      alert(data.mensaje);
      if (await confirmarConCodigo()) {
        document.getElementById('passwordActual').value = '';
        document.getElementById('nuevaPassword').value = '';
      }
    } else {
      alert(data.error || (data.errores && data.errores[0].msg) || 'Error al solicitar el cambio');
    }
  } catch (error) {
    console.error('Error:', error);
    alert('Error de conexión');
  }
}
