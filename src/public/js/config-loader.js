// config-loader.js - Carga la configuración institucional en toda la app
(function() {
  'use strict';

  function aplicarConfig(config) {
    if (!config) return;

    // Header
    const headerNombre = document.getElementById('headerNombreInstitucion');
    if (headerNombre) headerNombre.textContent = config.nombreInstitucion || 'SchoolNode';

    const headerUbicacion = document.getElementById('headerUbicacion');
    if (headerUbicacion) headerUbicacion.textContent = config.ubicacion || '';

    // Sidebar
    const sidebarNombre = document.getElementById('sidebarNombre');
    if (sidebarNombre) sidebarNombre.textContent = config.nombreInstitucion || 'SchoolNode';

    // Color primario
    if (config.colorPrimario) {
      document.documentElement.style.setProperty('--color-primario', config.colorPrimario);

      // Actualizar logo del sidebar
      const logo = document.getElementById('sidebarLogo');
      if (logo) logo.style.backgroundColor = config.colorPrimario;

      // Actualizar botones primary
      document.querySelectorAll('.btn-primary').forEach(btn => {
        if (!btn.classList.contains('btn-outline-primary')) {
          btn.style.backgroundColor = config.colorPrimario;
          btn.style.borderColor = config.colorPrimario;
        }
      });
    }

    // Título de la página
    const titulo = document.title.split(' - ')[0];
    const nombreInst = config.nombreInstitucion || 'SchoolNode';
    document.title = `${titulo} - ${nombreInst}`;
  }

  // Cargar configuración
  fetch('/api/configuracion', { credentials: 'same-origin' })
    .then(r => r.ok ? r.json() : null)
    .then(aplicarConfig)
    .catch(err => console.warn('No se pudo cargar configuración:', err));
})();
