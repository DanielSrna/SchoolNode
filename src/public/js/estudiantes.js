// Estudiantes JavaScript
let paginaActual = 1;
let limite = 10;
let estudianteEditandoId = null;

document.addEventListener('DOMContentLoaded', function() {
  cargarEstudiantes();

  document.getElementById('buscarCedula').addEventListener('input', function(e) {
    paginaActual = 1;
    cargarEstudiantes(e.target.value);
  });

  const formEst = document.getElementById('formEstudiante');
  if (formEst) {
    formEst.addEventListener('submit', guardarEstudiante);
  }

  if (window.esEmpleado) {
    const btnNuevo = document.querySelector('[data-bs-target="#modalEstudiante"]');
    if (btnNuevo) btnNuevo.style.display = 'none';
  }
});

async function cargarEstudiantes(cedula = '') {
  try {
    const response = await fetch(`/api/estudiantes?page=${paginaActual}&limit=${limite}&cedula=${cedula}`);
    const data = await response.json();

    const tbody = document.getElementById('tablaEstudiantes');
    tbody.innerHTML = '';

    data.estudiantes.forEach(est => {
      const tr = document.createElement('tr');
      let acciones = `<button class="btn btn-sm btn-info text-white" onclick="verEstudiante('${est._id}')">Ver</button>`;

      if (window.esAdmin) {
        acciones += ` <button class="btn btn-sm btn-warning text-white" onclick="editarEstudiante('${est._id}')">Editar</button>`;
        acciones += ` <button class="btn btn-sm btn-danger" onclick="eliminarEstudiante('${est._id}')">Eliminar</button>`;
      }

      tr.innerHTML = `
        <td>${est.cedula}</td>
        <td>${est.nombre} ${est.apellido}</td>
        <td>${est.email || '-'}</td>
        <td>${est.telefono || '-'}</td>
        <td>${acciones}</td>
      `;
      tbody.appendChild(tr);
    });

    const paginacion = document.getElementById('paginacion');
    paginacion.innerHTML = '';

    if (data.pages > 1) {
      const ul = document.createElement('ul');
      ul.className = 'pagination';

      for (let i = 1; i <= data.pages; i++) {
        const li = document.createElement('li');
        li.className = `page-item ${i === paginaActual ? 'active' : ''}`;
        li.innerHTML = `<a class="page-link" href="#" onclick="cambiarPagina(${i})">${i}</a>`;
        ul.appendChild(li);
      }

      paginacion.appendChild(ul);
    }
  } catch (error) {
    console.error('Error cargando estudiantes:', error);
  }
}

function cambiarPagina(pagina) {
  paginaActual = pagina;
  const cedula = document.getElementById('buscarCedula').value;
  cargarEstudiantes(cedula);
}

async function guardarEstudiante(e) {
  e.preventDefault();

  const data = {
    nombre: document.getElementById('nombre').value,
    apellido: document.getElementById('apellido').value,
    cedula: document.getElementById('cedula').value,
    email: document.getElementById('email').value,
    telefono: document.getElementById('telefono').value,
  };

  try {
    const url = estudianteEditandoId
      ? `/api/estudiantes/${estudianteEditandoId}`
      : '/api/estudiantes';
    const method = estudianteEditandoId ? 'PUT' : 'POST';

    const response = await fetch(url, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });

    if (response.ok) {
      alert(estudianteEditandoId ? 'Estudiante actualizado exitosamente' : 'Estudiante creado exitosamente');
      estudianteEditandoId = null;
      location.reload();
    } else {
      const error = await response.json();
      alert(error.error || 'Error al guardar estudiante');
    }
  } catch (error) {
    console.error('Error:', error);
    alert('Error de conexión');
  }
}

async function verEstudiante(id) {
  const response = await fetch(`/api/estudiantes/${id}`);
  const est = await response.json();
  alert(`Estudiante: ${est.nombre} ${est.apellido}\nCédula: ${est.cedula}\nEmail: ${est.email}\nTeléfono: ${est.telefono}`);
}

async function editarEstudiante(id) {
  try {
    const response = await fetch(`/api/estudiantes/${id}`);
    const est = await response.json();

    document.getElementById('nombre').value = est.nombre;
    document.getElementById('apellido').value = est.apellido;
    document.getElementById('cedula').value = est.cedula;
    document.getElementById('email').value = est.email || '';
    document.getElementById('telefono').value = est.telefono || '';

    estudianteEditandoId = id;
    document.querySelector('#modalEstudiante .modal-title').textContent = 'Editar Estudiante';

    new bootstrap.Modal(document.getElementById('modalEstudiante')).show();
  } catch (error) {
    console.error('Error:', error);
    alert('Error al cargar estudiante');
  }
}

// Limpiar el ID de edición cuando se cierra el modal
document.addEventListener('DOMContentLoaded', function() {
  const modal = document.getElementById('modalEstudiante');
  if (modal) {
    modal.addEventListener('hidden.bs.modal', function() {
      estudianteEditandoId = null;
      document.getElementById('formEstudiante').reset();
      document.querySelector('#modalEstudiante .modal-title').textContent = 'Nuevo Estudiante';
    });
  }
});

async function eliminarEstudiante(id) {
  if (!confirm('¿Está seguro de eliminar este estudiante?')) return;

  try {
    const response = await fetch(`/api/estudiantes/${id}`, { method: 'DELETE' });
    if (response.ok) {
      alert('Estudiante eliminado');
      cargarEstudiantes();
    } else {
      alert('Error al eliminar');
    }
  } catch (error) {
    console.error('Error:', error);
  }
}
