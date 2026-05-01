// ==========================================
// LÓGICA DE GESTIÓN DE TICKETS (Paginación + SweetAlert + Fechas)
// ==========================================

let listaRentas = [];
let ticketsFiltrados = [];
let ticketActualId = null;

// Variables Paginación
let paginaActualTickets = 1;
const itemsPorPagina = 5;

document.addEventListener('DOMContentLoaded', () => {
    const usuarioGuardado = sessionStorage.getItem('usuarioActivo');
    if (!usuarioGuardado) { window.location.href = 'login.html'; return; }
    const usuarioActual = JSON.parse(usuarioGuardado);
    if (usuarioActual.superUser !== true) { window.location.href = 'user-catalog.html'; return; }

    cargarTickets();
});

async function cargarTickets() {
    try {
        const respuesta = await fetch('http://localhost:8080/api/rentas');
        if (!respuesta.ok) throw new Error("Error al cargar datos");
        listaRentas = await respuesta.json();
        
        listaRentas.reverse(); // Más nuevos primero
        filtrarTickets('Pendientes', document.querySelector('.tab-btn.active'));
    } catch (error) {
        console.error(error);
        document.getElementById('tabla-tickets').innerHTML = `<tr><td colspan="5" style="text-align: center; color: #ef4444;">Error de conexión con el servidor.</td></tr>`;
    }
}

function filtrarTickets(categoria, botonElemento) {
    if (botonElemento) {
        document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
        botonElemento.classList.add('active');
    } else {
        categoria = document.querySelector('.tab-btn.active').innerText.includes('Pendientes') ? 'Pendientes' : 'Resueltos';
    }

    if (categoria === 'Pendientes') {
        ticketsFiltrados = listaRentas.filter(t => t.estado === 'Pendiente' || t.estado === 'Activo');
    } else {
        ticketsFiltrados = listaRentas.filter(t => t.estado === 'Aceptado' || t.estado === 'Denegado' || t.estado === 'Devuelto');
    }
    
    paginaActualTickets = 1;
    renderizarPaginacionTickets();
}

function renderizarPaginacionTickets() {
    const inicio = (paginaActualTickets - 1) * itemsPorPagina;
    const fin = inicio + itemsPorPagina;
    const ticketsPagina = ticketsFiltrados.slice(inicio, fin);
    
    renderizarTabla(ticketsPagina);
    actualizarControlesPaginacion();
}

function cambiarPaginaTickets(direccion) {
    const totalPaginas = Math.ceil(ticketsFiltrados.length / itemsPorPagina);
    paginaActualTickets += direccion;
    
    if (paginaActualTickets < 1) paginaActualTickets = 1;
    if (paginaActualTickets > totalPaginas) paginaActualTickets = totalPaginas;
    
    renderizarPaginacionTickets();
}

function actualizarControlesPaginacion() {
    const totalPaginas = Math.ceil(ticketsFiltrados.length / itemsPorPagina) || 1;
    
    document.getElementById('indicador-pagina-tk').innerText = `Pág. ${paginaActualTickets} de ${totalPaginas}`;
    document.getElementById('t-info-mostrando').innerText = `Mostrando ${ticketsFiltrados.length > 0 ? (paginaActualTickets - 1) * itemsPorPagina + 1 : 0} - ${Math.min(paginaActualTickets * itemsPorPagina, ticketsFiltrados.length)} de ${ticketsFiltrados.length} tickets`;

    document.getElementById('btn-prev-tk').disabled = paginaActualTickets === 1;
    document.getElementById('btn-prev-tk').style.opacity = paginaActualTickets === 1 ? "0.3" : "1";
    document.getElementById('btn-next-tk').disabled = paginaActualTickets === totalPaginas;
    document.getElementById('btn-next-tk').style.opacity = paginaActualTickets === totalPaginas ? "0.3" : "1";
}

function renderizarTabla(tickets) {
    const tbody = document.getElementById('tabla-tickets');
    tbody.innerHTML = '';

    if (tickets.length === 0) {
        tbody.innerHTML = `<tr><td colspan="5" style="text-align: center; padding: 30px; color: var(--muted);">No hay tickets en esta categoría.</td></tr>`;
        return;
    }

    tickets.forEach(ticket => {
        let badgeColor = '';
        if (ticket.estado === 'Pendiente' || ticket.estado === 'Activo') {
            badgeColor = 'background: rgba(250, 204, 21, 0.1); color: #facc15; border: 1px solid rgba(250, 204, 21, 0.3);'; 
        } else if (ticket.estado === 'Aceptado') {
            badgeColor = 'background: rgba(34, 197, 94, 0.1); color: #4ade80; border: 1px solid rgba(34, 197, 94, 0.3);'; 
        } else if (ticket.estado === 'Denegado') {
            badgeColor = 'background: rgba(239, 68, 68, 0.1); color: #ef4444; border: 1px solid rgba(239, 68, 68, 0.3);'; 
        } else {
            badgeColor = 'background: rgba(156, 163, 175, 0.1); color: #9ca3af; border: 1px solid rgba(156, 163, 175, 0.3);'; 
        }

        tbody.innerHTML += `
            <tr style="border-bottom: 1px solid rgba(255,255,255,0.05); transition: 0.2s;">
                <td style="padding: 15px; font-family: monospace; color: var(--muted);">TK-${ticket.id}</td>
                <td style="padding: 15px; color: #fff;">${ticket.usuarioEmail}</td>
                <td style="padding: 15px; color: #fff; font-weight: 500;">${ticket.articuloNombre}</td>
                <td style="padding: 15px;"><span style="padding: 5px 10px; border-radius: 20px; font-size: 0.8rem; font-weight: bold; ${badgeColor}">${ticket.estado}</span></td>
                <td style="padding: 15px; text-align: right;">
                    <button onclick="abrirModal(${ticket.id})" style="background: rgba(255,255,255,0.05); color: #fff; border: 1px solid var(--border); padding: 8px 12px; border-radius: 6px; cursor: pointer; transition: 0.3s;" onmouseover="this.style.background='var(--primary)'; this.style.color='#000'" onmouseout="this.style.background='rgba(255,255,255,0.05)'; this.style.color='#fff'">Ver Detalle</button>
                </td>
            </tr>
        `;
    });
}

async function abrirModal(id) {
    const ticket = listaRentas.find(t => t.id === id);
    if (!ticket) return;

    ticketActualId = id;
    
    document.getElementById('m-id').innerText = `Ticket #${ticket.id}`;
    document.getElementById('m-item').innerText = ticket.articuloNombre;
    document.getElementById('m-dias').innerText = `${ticket.dias} días`;

    // Calcular Fecha de Inicio exacta (evita bugs de zona horaria)
    let fechaGuardada = ticket.fechaRenta; 
    if (!fechaGuardada) {
        fechaGuardada = new Date().toISOString().split('T')[0]; // Fallback por si acaso
    }
    const partesFecha = fechaGuardada.split('-');
    const fechaInicio = new Date(partesFecha[0], partesFecha[1] - 1, partesFecha[2]);

    // Calcular Fecha de Devolución
    const fechaFin = new Date(fechaInicio);
    fechaFin.setDate(fechaFin.getDate() + ticket.dias);

    // Plasmar en el HTML
    document.getElementById('m-fecha-prestamo').innerText = fechaInicio.toLocaleDateString('es-ES');
    document.getElementById('m-fecha-devolucion').innerText = fechaFin.toLocaleDateString('es-ES');

    // Cargar datos del usuario
    document.getElementById('m-user-email').innerHTML = `<i class="fa-solid fa-envelope" style="width: 25px; color: var(--muted);"></i> ${ticket.usuarioEmail}`;
    document.getElementById('m-user-name').innerHTML = `<i class="fa-solid fa-user" style="width: 25px; color: var(--muted);"></i> Buscando...`;
    document.getElementById('m-user-phone').innerHTML = `<i class="fa-solid fa-phone" style="width: 25px; color: var(--muted);"></i> Buscando...`;

    try {
        const resUsuarios = await fetch('http://localhost:8080/api/usuarios');
        if (resUsuarios.ok) {
            const usuarios = await resUsuarios.json();
            const usuarioSolicitante = usuarios.find(u => u.email === ticket.usuarioEmail);
            
            if (usuarioSolicitante) {
                document.getElementById('m-user-name').innerHTML = `<i class="fa-solid fa-user" style="width: 25px; color: var(--muted);"></i> ${usuarioSolicitante.nombreCompleto}`;
                document.getElementById('m-user-phone').innerHTML = `<i class="fa-solid fa-phone" style="width: 25px; color: var(--muted);"></i> ${usuarioSolicitante.telefono || 'No registrado'}`;
            } else {
                document.getElementById('m-user-name').innerHTML = `<i class="fa-solid fa-user" style="width: 25px; color: var(--muted);"></i> No encontrado`;
                document.getElementById('m-user-phone').innerHTML = `<i class="fa-solid fa-phone" style="width: 25px; color: var(--muted);"></i> No encontrado`;
            }
        }
    } catch (e) {
        console.warn("No se pudo obtener la lista de usuarios", e);
    }

    const actionsDiv = document.getElementById('modal-actions');
    if (ticket.estado === 'Pendiente' || ticket.estado === 'Activo') {
        actionsDiv.style.display = 'flex';
    } else {
        actionsDiv.style.display = 'none';
    }

    document.getElementById('ticketModal').style.display = 'flex';
}

function cerrarModal() {
    document.getElementById('ticketModal').style.display = 'none';
}

async function guardarEstadoTicket(nuevoEstado) {
    const ticketOriginal = listaRentas.find(t => t.id === ticketActualId);
    
    // Configuración dinámica de colores para el contraste del texto
    let configColor = nuevoEstado === 'Aceptado' ? 'var(--primary)' : '#ef4444';
    let textColor = nuevoEstado === 'Aceptado' ? '#000000' : '#ffffff'; // Negro si es verde, Blanco si es rojo
    let iconType = nuevoEstado === 'Aceptado' ? 'success' : 'warning';
    
    const result = await Swal.fire({
        title: `¿Marcar como ${nuevoEstado}?`,
        text: `El ticket TK-${ticketActualId} será actualizado.`,
        icon: iconType,
        showCancelButton: true,
        confirmButtonColor: configColor,
        cancelButtonColor: 'rgba(255,255,255,0.1)',
        // Inyectamos el color directamente en el texto del botón
        confirmButtonText: `<span style="color: ${textColor}; font-weight: bold;">Sí, ${nuevoEstado}</span>`,
        cancelButtonText: 'Cancelar',
        background: '#111',
        color: '#fff'
    });

    if (!result.isConfirmed) return;

    const datosActualizados = {
        ...ticketOriginal,
        estado: nuevoEstado
    };

    try {
        const res = await fetch(`http://localhost:8080/api/rentas/${ticketActualId}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(datosActualizados)
        });

        if (res.ok) {
            cerrarModal();
            Swal.fire({ 
                icon: 'success', 
                title: '¡Éxito!', 
                text: `Ticket ${nuevoEstado}.`, 
                background: '#111', 
                color: '#fff', 
                timer: 1500, 
                showConfirmButton: false 
            });
            cargarTickets(); 
        } else {
            Swal.fire({ icon: 'error', title: 'Error', text: 'Error al actualizar el ticket.', background: '#111', color: '#fff' });
        }
    } catch (e) {
        console.error(e);
        Swal.fire({ icon: 'error', title: 'Error', text: 'Error de conexión con el servidor.', background: '#111', color: '#fff' });
    }
}