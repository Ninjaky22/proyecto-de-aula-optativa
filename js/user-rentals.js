// ==========================================
// CARGA DE RENTAS DEL USUARIO (Paginado)
// ==========================================

let listaRentasUsuario = [];
let paginaActualRentas = 1;
const itemsPorPaginaRentas = 5;

async function cargarRentas() {
    const usuarioGuardado = sessionStorage.getItem('usuarioActivo');
    const contenedor = document.getElementById('rentas-container');

    if (!usuarioGuardado) {
        contenedor.innerHTML = '<p style="color: white; text-align: center;">Error: No se encontró la sesión.</p>';
        return;
    }

    const usuario = JSON.parse(usuarioGuardado);
    const emailUsuario = usuario.email;

    try {
        const respuesta = await fetch(`http://localhost:8080/api/rentas/usuario/${emailUsuario}`);
        listaRentasUsuario = await respuesta.json();

        // Invertir para mostrar las más nuevas arriba
        listaRentasUsuario.reverse();
        
        paginaActualRentas = 1;
        renderizarPaginacionRentas();

    } catch (error) {
        console.error("Error crítico al cargar las rentas:", error);
        contenedor.innerHTML = '<p style="color: #ef4444; text-align: center;">Error al conectar con el servidor.</p>';
    }
}

function renderizarPaginacionRentas() {
    const inicio = (paginaActualRentas - 1) * itemsPorPaginaRentas;
    const fin = inicio + itemsPorPaginaRentas;
    const rentasPagina = listaRentasUsuario.slice(inicio, fin);
    
    renderizarRentas(rentasPagina);
    actualizarControlesRentas();
}

function cambiarPaginaRentas(direccion) {
    const totalPaginas = Math.ceil(listaRentasUsuario.length / itemsPorPaginaRentas);
    paginaActualRentas += direccion;
    
    if (paginaActualRentas < 1) paginaActualRentas = 1;
    if (paginaActualRentas > totalPaginas) paginaActualRentas = totalPaginas;
    
    renderizarPaginacionRentas();
}

function actualizarControlesRentas() {
    const totalPaginas = Math.ceil(listaRentasUsuario.length / itemsPorPaginaRentas) || 1;
    
    document.getElementById('indicador-pagina-ren').innerText = `Pág. ${paginaActualRentas} de ${totalPaginas}`;
    document.getElementById('ren-info-mostrando').innerText = `Mostrando ${listaRentasUsuario.length > 0 ? (paginaActualRentas - 1) * itemsPorPaginaRentas + 1 : 0} - ${Math.min(paginaActualRentas * itemsPorPaginaRentas, listaRentasUsuario.length)} de ${listaRentasUsuario.length} tickets`;

    document.getElementById('btn-prev-ren').disabled = paginaActualRentas === 1;
    document.getElementById('btn-prev-ren').style.opacity = paginaActualRentas === 1 ? "0.3" : "1";
    document.getElementById('btn-next-ren').disabled = paginaActualRentas === totalPaginas;
    document.getElementById('btn-next-ren').style.opacity = paginaActualRentas === totalPaginas ? "0.3" : "1";
}

function renderizarRentas(rentas) {
    const contenedor = document.getElementById('rentas-container');
    contenedor.innerHTML = ''; 

    if (rentas.length === 0) {
        contenedor.innerHTML = '<p style="color: var(--muted); text-align: center; margin-top: 40px; font-size: 1.1rem;">No tienes rentas en tu historial.</p>';
        return;
    }

    rentas.forEach(renta => {
        let rutaImagen = renta.imagenUrl ? renta.imagenUrl : 'https://via.placeholder.com/150/111111/58FF0A?text=Sin+Imagen';
        
        let colorFondo, colorTexto, iconoEstado;
        
        if (renta.estado === 'Aceptado' || renta.estado === 'Devuelto') {
            colorFondo = 'rgba(34, 197, 94, 0.1)'; colorTexto = '#4ade80'; iconoEstado = 'fa-check-circle';
        } else if (renta.estado === 'Pendiente' || renta.estado === 'Activo') {
            colorFondo = 'rgba(250, 204, 21, 0.1)'; colorTexto = '#facc15'; iconoEstado = 'fa-clock';
        } else if (renta.estado === 'Denegado') {
            colorFondo = 'rgba(239, 68, 68, 0.1)'; colorTexto = '#ef4444'; iconoEstado = 'fa-xmark-circle';
        } else {
            colorFondo = 'rgba(156, 163, 175, 0.1)'; colorTexto = '#9ca3af'; iconoEstado = 'fa-circle-info';
        }

        // Calcular Fecha de Devolución
        let fechaGuardada = renta.fechaRenta || new Date().toISOString().split('T')[0];
        const partesFecha = fechaGuardada.split('-');
        const fechaFin = new Date(partesFecha[0], partesFecha[1] - 1, partesFecha[2]);
        fechaFin.setDate(fechaFin.getDate() + renta.dias);

        contenedor.innerHTML += `
            <div class="card rental-card border-active" style="margin-bottom: 20px; background: #0a0a0a; border: 1px solid var(--border); border-radius: 12px; overflow: hidden;">
                <div class="rental-main-info" style="display: flex; justify-content: space-between; align-items: center; padding: 25px;">
                    <div style="display: flex; gap: 20px; align-items: center;">
                        <div class="item-visual" style="width: 80px; height: 80px; border-radius: 8px; overflow: hidden; background: #111; padding: 0; display: flex; justify-content: center; align-items: center;">
                            <img src="${rutaImagen}" alt="${renta.articuloNombre}" style="width: 100%; height: 100%; object-fit: cover;">
                        </div>
                        
                        <div>
                            <h3 style="color: #fff; margin-bottom: 5px;">${renta.articuloNombre} <span style="font-size: 0.8rem; color: var(--muted); font-weight: normal;">(TK-${renta.id})</span></h3>
                            <p style="color: var(--muted); font-size: 0.85rem;">Inicio: ${fechaGuardada} | Devolución: ${fechaFin.toLocaleDateString('es-ES')}</p>
                            <p style="color: #facc15; font-size: 0.9rem; font-weight: 600; margin-top: 5px;">
                                <i class="fa-regular fa-calendar-check"></i> ${renta.dias} días de préstamo
                            </p>
                            <span style="display: inline-block; margin-top: 8px; padding: 4px 10px; background: ${colorFondo}; color: ${colorTexto}; border: 1px solid ${colorTexto}40; border-radius: 4px; font-size: 0.75rem; font-weight: bold;">
                                <i class="fa-solid ${iconoEstado}"></i> Estado: ${renta.estado}
                            </span>
                        </div>
                    </div>
                    <div style="text-align: right;">
                        <div style="font-size: 1.6rem; font-weight: bold; color: var(--primary);">$${renta.totalPagado.toLocaleString('es-CO')}</div>
                        <div style="font-size: 0.8rem; color: var(--muted);">COP Total</div>
                    </div>
                </div>
            </div>
        `;
    });
}

document.addEventListener('DOMContentLoaded', cargarRentas);