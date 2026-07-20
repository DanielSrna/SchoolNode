// Empleados JavaScript
let empleadoEditandoId = null;

document.addEventListener('DOMContentLoaded', function() {
  cargarEmpleados();
  const form = document.getElementById('formNuevoEmpleado');
  if (form) {
    form.addEventListener('submit', guardarEmpleado);
  }

  const modal = document.getElementById('modalNuevoEmpleado');
  if (modal) {
    modal.addEventListener('hidden.bs.modal', function() {
      empleadoEditandoId = null;
      document.getElementById('formNuevoEmpleado').reset();
      document.getElementById('empPassword').required = true;
      document.querySelector('#modalNuevoEmpleado .modal-title').textContent = 'Crear Nuevo Empleado';
    });
  }
});

async function cargarEmpleados() {
  try {
    const response = await fetch('/api/empleados');
    const empleados = await response.json();

    const tbody = document.getElementById('tablaEmpleados');
    tbody.innerHTML = '';

    empleados.forEach(emp => {
      const fecha = new Date(emp.createdAt).toLocaleDateString('es-CO');
      const rolBadge = emp.rol === 'admin' ? 'bg-danger' : 'bg-primary';

      const tr = document.createElement('tr');
      tr.innerHTML = `
        <td><strong>${emp.nombre}</strong></td>
        <td>${emp.email}</td>
        <td><span class="badge ${rolBadge}">${emp.rol.toUpperCase()}</span></td>
        <td>${fecha}</td>
        <td>
          <button class="btn btn-sm btn-info text-white" onclick="verEmpleado('${emp._id}')">Ver</button>
          <button class="btn btn-sm btn-warning text-white" onclick="editarEmpleado('${emp._id}')">Editar</button>
          <button class="btn btn-sm btn-danger" onclick="eliminarEmpleado('${emp._id}')">Eliminar</button>
        </td>
      `;
      tbody.appendChild(tr);
    });
  } catch (error) {
    console.error('Error cargando empleados:', error);
  }
}

async function guardarEmpleado(e) {
  e.preventDefault();

  const data = {
    nombre: document.getElementById('empNombre').value,
    email: document.getElementById('empEmail').value,
    rol: document.getElementById('empRol').value,
  };

  // Solo enviar password si se proporcionó (en edición)
  const password = document.getElementById('empPassword').value;
  if (password) {
    data.password = password;
  }

  try {
    let url = '/api/empleados';
    let method = 'POST';

    if (empleadoEditandoId) {
      url = `/api/empleados/${empleadoEditandoId}`;
      method = 'PUT';
    } else {
      // En creación, password es obligatorio
      if (!password || password.length < 8) {
        alert('La contraseña debe tener al menos 8 caracteres');
        return;
      }
      data.password = password;
    }

    const response = await fetch(url, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });

    if (response.ok) {
      alert(empleadoEditandoId ? 'Empleado actualizado exitosamente' : 'Empleado creado exitosamente');
      location.reload();
    } else {
      const error = await response.json();
      alert(error.error || 'Error al guardar empleado');
    }
  } catch (error) {
    console.error('Error:', error);
    alert('Error de conexión');
  }
}

async function verEmpleado(id) {
  const response = await fetch(`/api/empleados/${id}`);
  const emp = await response.json();
  alert(`Empleado: ${emp.nombre}\nEmail: ${emp.email}\nRol: ${emp.rol}\nActivo: ${emp.activo ? 'Sí' : 'No'}\nRegistrado: ${new Date(emp.createdAt).toLocaleDateString('es-CO')}`);
}

async function editarEmpleado(id) {
  try {
    const response = await fetch(`/api/empleados/${id}`);
    const emp = await response.json();

    document.getElementById('empNombre').value = emp.nombre;
    document.getElementById('empEmail').value = emp.email;
    document.getElementById('empRol').value = emp.rol;
    document.getElementById('empPassword').value = '';
    document.getElementById('empPassword').required = false;
    document.getElementById('empPassword').placeholder = 'Dejar vacío para no cambiar';

    empleadoEditandoId = id;
    document.querySelector('#modalNuevoEmpleado .modal-title').textContent = 'Editar Empleado';

    new bootstrap.Modal(document.getElementById('modalNuevoEmpleado')).show();
  } catch (error) {
    console.error('Error:', error);
    alert('Error al cargar empleado');
  }
}

async function eliminarEmpleado(id) {
  if (!confirm('¿Está seguro de eliminar este empleado?\n\nEsta acción desactivará la cuenta.')) return;
  try {
    const response = await fetch(`/api/empleados/${id}`, { method: 'DELETE' });
    if (response.ok) {
      alert('Empleado eliminado exitosamente');
      cargarEmpleados();
    } else {
      alert('Error al eliminar empleado');
    }
  } catch (error) {
    console.error('Error:', error);
  }
}
