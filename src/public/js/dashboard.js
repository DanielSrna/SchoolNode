// Dashboard initialization
document.addEventListener('DOMContentLoaded', async function() {
  await loadDashboardStats();
});

async function loadDashboardStats() {
  try {
    // Cargar estadísticas desde la API
    const [estudiantesRes, matriculasRes] = await Promise.all([
      fetch('/api/estudiantes'),
      fetch('/api/matriculas'),
    ]);
    
    const estudiantesData = await estudiantesRes.json();
    const matriculasData = await matriculasRes.json();
    
    // Actualizar contadores
    document.getElementById('totalEstudiantes').textContent = estudiantesData.total || 0;
    
    const matriculasActivas = matriculasData.filter(m => m.estado === 'activa').length;
    document.getElementById('matriculasActivas').textContent = matriculasActivas;
    
    const ingresosTotales = matriculasData.reduce((sum, m) => sum + (m.totalPagado || 0), 0);
    document.getElementById('ingresosTotales').textContent = `$${ingresosTotales.toLocaleString()}`;
    
    const totalMorosos = matriculasData.filter(m => m.estado === 'moroso').length;
    document.getElementById('totalMorosos').textContent = totalMorosos;
    
  } catch (error) {
    console.error('Error cargando estadísticas:', error);
  }
}
