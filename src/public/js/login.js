// Login form handler
document.addEventListener('DOMContentLoaded', function() {
  const loginForm = document.getElementById('loginForm');

  if (loginForm) {
    loginForm.addEventListener('submit', async function(e) {
      e.preventDefault();

      const email = document.getElementById('email').value;
      const password = document.getElementById('password').value;

      try {
        const response = await fetch('/api/auth/login', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email, password }),
        });

        const data = await response.json();

        if (response.ok) {
          // Login exitoso - redirigir según el rol del usuario
          const usuario = data.usuario;
          if (usuario.rol === 'admin') {
            window.location.href = '/dashboard';
          } else {
            // Empleado: redirigir a una sección que pueda ver
            window.location.href = '/estudiantes';
          }
        } else {
          alert(data.error || 'Error al iniciar sesión');
        }
      } catch (error) {
        console.error('Error:', error);
        alert('Error de conexión con el servidor');
      }
    });
  }
});
