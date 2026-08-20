// Main JavaScript file

// Muestra una fila de "sin registros" cuando una tabla queda vacía
function mostrarVacio(tbody, colspan, mensaje = 'No hay registros') {
  tbody.innerHTML = `
    <tr>
      <td colspan="${colspan}" class="text-center text-muted py-4">
        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="currentColor" class="mb-1 opacity-50" viewBox="0 0 16 16" aria-hidden="true"><path d="M8 1a2.5 2.5 0 0 1 2.5 2.5V4h-5v-.5A2.5 2.5 0 0 1 8 1zm3.5 3v-.5a3.5 3.5 0 1 0-7 0V4H1v10a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V4h-3.5zM2 5h12v9a1 1 0 0 1-1 1H3a1 1 0 0 1-1-1V5z"/></svg>
        <div>${mensaje}</div>
      </td>
    </tr>
  `;
}
