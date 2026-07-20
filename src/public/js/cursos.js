// Cursos JavaScript
let cursoEditandoId = null;
let aulaEditandoId = null;

document.addEventListener('DOMContentLoaded', function() {
  cargarCursos();
  cargarAulas();
  cargarSelects();

  const formAula = document.getElementById('formNuevaAula');
  if (formAula) {
    formAula.addEventListener('submit', guardarAula);
  }

  const formCurso = document.getElementById('formNuevoCurso');
  if (formCurso) {
    formCurso.addEventListener('submit', guardarCurso);
  }

  if (window.esEmpleado) {
    const btnNuevaAula = document.querySelector('[data-bs-target="#modalNuevaAula"]');
    if (btnNuevaAula) btnNuevaAula.style.display = 'none';
    const btnNuevoCurso = document.querySelector('[data-bs-target="#modalNuevoCurso"]');
    if (btnNuevoCurso) btnNuevoCurso.style.display = 'none';
  }

  // Limpiar IDs al cerrar modales
  const modalAula = document.getElementById('modalNuevaAula');
  if (modalAula) {
    modalAula.addEventListener('hidden.bs.modal', function() {
      aulaEditandoId = null;
      document.getElementById('formNuevaAula').reset();
      document.querySelector('#modalNuevaAula .modal-title').textContent = 'Crear Nueva Aula';
    });
  }
  const modalCurso = document.getElementById('modalNuevoCurso');
  if (modalCurso) {
    modalCurso.addEventListener('hidden.bs.modal', function() {
      cursoEditandoId = null;
      document.getElementById('formNuevoCurso').reset();
      document.querySelector('#modalNuevoCurso .modal-title').textContent = 'Crear Nuevo Curso';
    });
  }
});

async function cargarCursos() {
  try {
    const response = await fetch('/api/cursos');
    const cursos = await response.json();
    document.getElementById('totalCursos').textContent = cursos.length;

    const tbody = document.getElementById('tablaCursos');
    tbody.innerHTML = '';

    for (const curso of cursos) {
      const aulasResponse = await fetch('/api/aulas');
      const aulas = await aulasResponse.json();

      const tr = document.createElement('tr');
      let acciones = '';
      if (window.esAdmin) {
        acciones = `
          <button class="btn btn-sm btn-warning text-white" onclick="editarCurso('${curso._id}')">Editar</button>
          <button class="btn btn-sm btn-danger" onclick="eliminarCurso('${curso._id}')">Eliminar</button>
        `;
      } else {
        acciones = '<span class="text-muted small">Solo administrador</span>';
      }

      tr.innerHTML = `
        <td>${curso._id.substr(-6)}</td>
        <td><strong>${curso.nombre}</strong><br><small class="text-muted">${curso.descripcion || ''}</small></td>
        <td>${curso.duracion}</td>
        <td>$${curso.precio.toLocaleString()}</td>
        <td><span class="badge bg-info">${aulas.length} aulas</span></td>
        <td>${acciones}</td>
      `;
      tbody.appendChild(tr);
    }
  } catch (error) {
    console.error('Error cargando cursos:', error);
  }
}

async function cargarAulas() {
  try {
    const response = await fetch('/api/aulas');
    const aulas = await response.json();
    document.getElementById('totalAulas').textContent = aulas.length;

    const tbody = document.getElementById('tablaAulas');
    tbody.innerHTML = '';

    aulas.forEach(aula => {
      const porcentaje = (aula.poblacionActual / aula.capacidad) * 100;
      let badgeClass = 'bg-success';
      if (porcentaje >= 100) badgeClass = 'bg-danger';
      else if (porcentaje >= 75) badgeClass = 'bg-warning text-dark';

      const tr = document.createElement('tr');
      let acciones = '';
      if (window.esAdmin) {
        acciones = `
          <button class="btn btn-sm btn-warning text-white" onclick="editarAula('${aula._id}')">Editar</button>
          <button class="btn btn-sm btn-danger" onclick="eliminarAula('${aula._id}')">Eliminar</button>
        `;
      } else {
        acciones = '<span class="text-muted small">Solo administrador</span>';
      }

      tr.innerHTML = `
        <td>${aula._id.substr(-6)}</td>
        <td><strong>Aula ${aula.numero}</strong></td>
        <td>${aula.capacidad}</td>
        <td><span class="badge ${badgeClass}">${aula.poblacionActual} / ${aula.capacidad}</span></td>
        <td>${aula.ubicacion || '-'}</td>
        <td>${acciones}</td>
      `;
      tbody.appendChild(tr);
    });
  } catch (error) {
    console.error('Error cargando aulas:', error);
  }
}

async function cargarSelects() {
  try {
    const cursosResponse = await fetch('/api/cursos');
    const cursos = await cursosResponse.json();
    const selectCurso = document.getElementById('aulaCurso');
    if (selectCurso) {
      cursos.forEach(curso => {
        const option = document.createElement('option');
        option.value = curso._id;
        option.textContent = curso.nombre;
        selectCurso.appendChild(option);
      });
    }

    const aulasResponse = await fetch('/api/aulas');
    const aulas = await aulasResponse.json();
    const selectAula = document.getElementById('cursoAula');
    if (selectAula) {
      aulas.forEach(aula => {
        const option = document.createElement('option');
        option.value = aula._id;
        option.textContent = `Aula ${aula.numero}`;
        selectAula.appendChild(option);
      });
    }
  } catch (error) {
    console.error('Error cargando selects:', error);
  }
}

async function guardarAula(e) {
  e.preventDefault();
  const data = {
    numero: document.getElementById('aulaNumero').value,
    capacidad: parseInt(document.getElementById('aulaCapacidad').value),
    ubicacion: document.getElementById('aulaUbicacion').value,
  };

  try {
    const url = aulaEditandoId ? `/api/aulas/${aulaEditandoId}` : '/api/aulas';
    const method = aulaEditandoId ? 'PUT' : 'POST';
    const response = await fetch(url, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });

    if (response.ok) {
      alert(aulaEditandoId ? 'Aula actualizada exitosamente' : 'Aula creada exitosamente');
      location.reload();
    } else {
      const error = await response.json();
      alert(error.error || 'Error al guardar aula');
    }
  } catch (error) {
    console.error('Error:', error);
    alert('Error de conexión');
  }
}

async function guardarCurso(e) {
  e.preventDefault();
  const data = {
    nombre: document.getElementById('cursoNombre').value,
    descripcion: document.getElementById('cursoDescripcion').value,
    duracion: document.getElementById('cursoDuracion').value,
    precio: parseInt(document.getElementById('cursoPrecio').value),
  };

  try {
    const url = cursoEditandoId ? `/api/cursos/${cursoEditandoId}` : '/api/cursos';
    const method = cursoEditandoId ? 'PUT' : 'POST';
    const response = await fetch(url, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });

    if (response.ok) {
      alert(cursoEditandoId ? 'Curso actualizado exitosamente' : 'Curso creado exitosamente');
      location.reload();
    } else {
      const error = await response.json();
      alert(error.error || 'Error al guardar curso');
    }
  } catch (error) {
    console.error('Error:', error);
    alert('Error de conexión');
  }
}

async function editarAula(id) {
  try {
    const response = await fetch(`/api/aulas/${id}`);
    const aula = await response.json();
    document.getElementById('aulaNumero').value = aula.numero;
    document.getElementById('aulaCapacidad').value = aula.capacidad;
    document.getElementById('aulaUbicacion').value = aula.ubicacion || '';
    aulaEditandoId = id;
    document.querySelector('#modalNuevaAula .modal-title').textContent = 'Editar Aula';
    new bootstrap.Modal(document.getElementById('modalNuevaAula')).show();
  } catch (error) {
    console.error('Error:', error);
  }
}

async function editarCurso(id) {
  try {
    const response = await fetch(`/api/cursos/${id}`);
    const curso = await response.json();
    document.getElementById('cursoNombre').value = curso.nombre;
    document.getElementById('cursoDescripcion').value = curso.descripcion || '';
    document.getElementById('cursoDuracion').value = curso.duracion;
    document.getElementById('cursoPrecio').value = curso.precio;
    cursoEditandoId = id;
    document.querySelector('#modalNuevoCurso .modal-title').textContent = 'Editar Curso';
    new bootstrap.Modal(document.getElementById('modalNuevoCurso')).show();
  } catch (error) {
    console.error('Error:', error);
  }
}

async function eliminarAula(id) {
  if (!confirm('¿Está seguro de eliminar esta aula?')) return;
  try {
    const response = await fetch(`/api/aulas/${id}`, { method: 'DELETE' });
    if (response.ok) {
      alert('Aula eliminada');
      cargarAulas();
    } else {
      alert('Error al eliminar');
    }
  } catch (error) {
    console.error('Error:', error);
  }
}

async function eliminarCurso(id) {
  if (!confirm('¿Está seguro de eliminar este curso?')) return;
  try {
    const response = await fetch(`/api/cursos/${id}`, { method: 'DELETE' });
    if (response.ok) {
      alert('Curso eliminado');
      cargarCursos();
    } else {
      alert('Error al eliminar');
    }
  } catch (error) {
    console.error('Error:', error);
  }
}
