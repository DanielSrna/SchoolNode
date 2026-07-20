// auth-manager.js - Manejo automático de tokens JWT
// Este script se encarga de:
// 1. Refrescar el access token automáticamente antes de que expire
// 2. Manejar errores 401 reintentando una vez después de un refresh
// 3. No cerrar la sesión a menos que el refresh token también expire

(function() {
  'use strict';

  const ACCESS_TOKEN_LIFETIME = 15 * 60; // 15 minutos en segundos
  const REFRESH_BEFORE_EXPIRY = 2 * 60; // Refrescar 2 minutos antes de expirar
  const CHECK_INTERVAL = 30 * 1000; // Verificar cada 30 segundos

  let refreshTimer = null;
  let isRefreshing = false;
  let refreshPromise = null;

  // Refresca el access token usando el refresh token (vía cookie)
  async function refreshAccessToken() {
    if (isRefreshing) return refreshPromise;

    isRefreshing = true;
    refreshPromise = (async () => {
      try {
        const response = await fetch('/api/auth/refresh', {
          method: 'POST',
          credentials: 'same-origin',
          headers: { 'Content-Type': 'application/json' },
        });

        if (response.ok) {
          const data = await response.json();
          console.log('[Auth] Token refrescado correctamente');
          return true;
        } else {
          console.warn('[Auth] No se pudo refrescar el token');
          return false;
        }
      } catch (error) {
        console.error('[Auth] Error al refrescar token:', error);
        return false;
      } finally {
        isRefreshing = false;
      }
    })();

    return refreshPromise;
  }

  // Verifica si el access token está próximo a expirar
  // Como el token está en cookie httpOnly, no podemos leerlo desde JS
  // En su lugar, hacemos refresh preventivo cada cierto tiempo si el usuario está activo
  function scheduleRefresh() {
    if (refreshTimer) clearTimeout(refreshTimer);

    // Refrescar cada 13 minutos (antes de que expiren los 15)
    // Pero solo si el usuario ha interactuado recientemente
    const REFRESH_INTERVAL = 13 * 60 * 1000; // 13 minutos

    refreshTimer = setTimeout(async () => {
      console.log('[Auth] Refrescando token preventivamente...');
      const success = await refreshAccessToken();
      if (success) {
        scheduleRefresh();
      }
    }, REFRESH_INTERVAL);
  }

  // Intercepta fetch para manejar 401 con un reintento tras refresh
  const originalFetch = window.fetch;
  window.fetch = async function(...args) {
    let response = await originalFetch.apply(this, args);

    // Si recibimos 401, intentar refresh y reintentar la petición una vez
    if (response.status === 401) {
      const refreshed = await refreshAccessToken();
      if (refreshed) {
        response = await originalFetch.apply(this, args);
      }
    }

    return response;
  };

  // Solo inicializar si no estamos en la página de login
  function init() {
    const isLoginPage = window.location.pathname === '/login' || window.location.pathname === '/';
    if (isLoginPage) return;

    // Verificar si hay sesión activa haciendo una petición a /api/auth/me
    fetch('/api/auth/me', { credentials: 'same-origin' })
      .then(response => {
        if (response.ok) {
          // Sesión activa, programar refresh
          console.log('[Auth] Sesión activa detectada, programando auto-refresh');
          scheduleRefresh();
        }
      })
      .catch(err => {
        console.warn('[Auth] No se pudo verificar la sesión:', err);
      });
  }

  // Detectar actividad del usuario para reiniciar el timer
  let activityTimeout = null;
  function resetActivityTimer() {
    if (activityTimeout) clearTimeout(activityTimeout);
    activityTimeout = setTimeout(() => {
      // Si pasan 15 minutos sin actividad, refrescar igual (para mantener sesión)
      console.log('[Auth] Sin actividad por 15 min, verificando token...');
      refreshAccessToken().then(success => {
        if (success) scheduleRefresh();
      });
    }, 15 * 60 * 1000);
  }

  // Escuchar actividad del usuario
  ['mousedown', 'keydown', 'scroll', 'touchstart'].forEach(event => {
    document.addEventListener(event, resetActivityTimer, { passive: true });
  });

  // Inicializar cuando el DOM esté listo
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
