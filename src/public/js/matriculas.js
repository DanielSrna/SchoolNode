// Matrículas JavaScript
let matriculaEditandoId = null;

document.addEventListener('DOMContentLoaded', function() {
  cargarMatriculas();
  cargarSelects();

  const form = document.getElementById('formNuevaMatricula');
  if (form) {
    form.addEventListener('submit', crearMatricula);
  }

  if (window.esEmpleado) {
    const btnNueva = document.querySelector('[data-bs-target="#modalNuevaMatricula"]');
    if (btnNueva) btnNueva.style.display = 'none';
  }
});

async function cargarMatriculas() {
  try {
    const response = await fetch('/api/matriculas');
    const matriculas = await response.json();

    const totalAlumnos = new Set(matriculas.map(m => m.estudiante._id)).size;
    const activas = matriculas.filter(m => m.estado === 'activa').length;
    const vencidas = matriculas.filter(m => m.estado === 'vencida' || m.estado === 'moroso').length;

    document.getElementById('totalAlumnos').textContent = totalAlumnos;
    document.getElementById('matriculasActivas').textContent = activas;
    document.getElementById('matriculasVencidas').textContent = vencidas;

    const tbody = document.getElementById('tablaMatriculas');
    tbody.innerHTML = '';

    matriculas.forEach(mat => {
      const fechaVenc = new Date(mat.fechaVencimiento);
      const hoy = new Date();
      const diasRestantes = Math.ceil((fechaVenc - hoy) / (1000 * 60 * 60 * 24));

      let badgeClass = 'bg-success';
      let fechaClass = '';

      if (mat.estado === 'moroso') {
        badgeClass = 'bg-danger';
        fechaClass = 'text-danger fw-bold';
      } else if (mat.estado === 'vencida') {
        badgeClass = 'bg-warning text-dark';
        fechaClass = 'text-warning fw-bold';
      } else if (diasRestantes <= 3) {
        fechaClass = 'text-warning fw-bold';
      }

      const estadoText = {
        'activa': 'ACTIVO', 'vencida': 'VENCIDO', 'moroso': 'MOROSO', 'cancelada': 'CANCELADO'
      }[mat.estado] || mat.estado.toUpperCase();

      const tr = document.createElement('tr');
      let acciones = `<button class="btn btn-sm btn-info text-white" onclick="verMatricula('${mat._id}')">Ver</button>`;

      if (window.esAdmin) {
        acciones += ` <button class="btn btn-sm btn-warning text-white" onclick="migrarMatricula('${mat._id}')">Migrar</button>`;
        acciones += ` <button class="btn btn-sm btn-success" onclick="reactivarMatricula('${mat._id}')">Reactivar</button>`;
        acciones += ` <button class="btn btn-sm btn-danger" onclick="cancelarMatricula('${mat._id}')">Cancelar</button>`;
        acciones += ` <button class="btn btn-sm btn-secondary" onclick="enviarNotificacion('${mat._id}')">Notificar</button>`;
      }

      tr.innerHTML = `
        <td>${mat.estudiante.nombre} ${mat.estudiante.apellido}</td>
        <td>${mat.estudiante.cedula}</td>
        <td>${mat.curso.nombre}</td>
        <td class="${fechaClass}">${fechaVenc.toLocaleDateString('es-CO')}<br><small>${diasRestantes} días</small></td>
        <td><span class="badge ${badgeClass}">${estadoText}</span></td>
        <td>${acciones}</td>
      `;
      tbody.appendChild(tr);
    });
  } catch (error) {
    console.error('Error cargando matrículas:', error);
  }
}

async function cargarSelects() {
  try {
    const estResponse = await fetch('/api/estudiantes?limit=100');
    const estData = await estResponse.json();
    const selectEst = document.getElementById('matriculaEstudiante');
    if (selectEst) {
      estData.estudiantes.forEach(est => {
        const option = document.createElement('option');
        option.value = est._id;
        option.textContent = `${est.nombre} ${est.apellido} - ${est.cedula}`;
        selectEst.appendChild(option);
      });
    }

    const cursosResponse = await fetch('/api/cursos');
    const cursos = await cursosResponse.json();
    const selectCurso = document.getElementById('matriculaCurso');
    if (selectCurso) {
      cursos.forEach(curso => {
        const option = document.createElement('option');
        option.value = curso._id;
        option.textContent = `${curso.nombre} - $${curso.precio.toLocaleString()}`;
        selectCurso.appendChild(option);
      });
    }

    const aulasResponse = await fetch('/api/aulas');
    const aulas = await aulasResponse.json();
    const selectAula = document.getElementById('matriculaAula');
    if (selectAula) {
      aulas.forEach(aula => {
        const option = document.createElement('option');
        option.value = aula._id;
        option.textContent = `Aula ${aula.numero} - ${aula.poblacionActual}/${aula.capacidad}`;
        selectAula.appendChild(option);
      });
    }
  } catch (error) {
    console.error('Error cargando selects:', error);
  }
}

async function crearMatricula(e) {
  e.preventDefault();
  const data = {
    estudianteId: document.getElementById('matriculaEstudiante').value,
    cursoId: document.getElementById('matriculaCurso').value,
    aulaId: document.getElementById('matriculaAula').value,
  };

  try {
    const response = await fetch('/api/matriculas', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });

    if (response.ok) {
      alert('Matrícula creada exitosamente');
      location.reload();
    } else {
      const error = await response.json();
      alert(error.error || 'Error al crear matrícula');
    }
  } catch (error) {
    console.error('Error:', error);
    alert('Error de conexión');
  }
}

async function verMatricula(id) {
  const response = await fetch(`/api/matriculas/${id}`);
  const mat = await response.json();
  alert(`Matrícula: ${mat.estudiante.nombre} ${mat.estudiante.apellido}
Curso: ${mat.curso.nombre}
Aula: ${mat.aula.numero}
Estado: ${mat.estado}
Total Pagado: $${mat.totalPagado.toLocaleString()}
Saldo Pendiente: $${mat.saldoPendiente.toLocaleString()}
Pagos: ${mat.pagos.length}`);
}

async function migrarMatricula(id) {
  try {
    const aulasResponse = await fetch('/api/aulas');
    const aulas = await aulasResponse.json();
    const opciones = aulas.map(a => `${a._id}|Aula ${a.numero} (${a.poblacionActual}/${a.capacidad})`).join('\n');
    const seleccion = prompt(`Seleccione el ID del aula destino:\n\n${opciones}`, '');
    if (!seleccion) return;

    const aulaId = seleccion.split('|')[0].trim();
    const response = await fetch('/api/matriculas/migrar', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ matriculaId: id, nuevoAulaId: aulaId }),
    });

    if (response.ok) {
      alert('Estudiante migrado exitosamente');
      cargarMatriculas();
    } else {
      const error = await response.json();
      alert(error.error || 'Error al migrar');
    }
  } catch (error) {
    console.error('Error:', error);
  }
}

async function reactivarMatricula(id) {
  if (!confirm('¿Reactivar esta matrícula?')) return;
  try {
    const response = await fetch(`/api/matriculas/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ estado: 'activa' }),
    });
    if (response.ok) {
      alert('Matrícula reactivada');
      cargarMatriculas();
    } else {
      alert('Error al reactivar');
    }
  } catch (error) {
    console.error('Error:', error);
  }
}

async function cancelarMatricula(id) {
  if (!confirm('¿Cancelar esta matrícula?')) return;
  try {
    const response = await fetch(`/api/matriculas/${id}`, { method: 'DELETE' });
    if (response.ok) {
      alert('Matrícula cancelada');
      cargarMatriculas();
    } else {
      alert('Error al cancelar');
    }
  } catch (error) {
    console.error('Error:', error);
  }
}

async function enviarNotificacion(id) {
  alert('Notificación enviada al estudiante');
}
