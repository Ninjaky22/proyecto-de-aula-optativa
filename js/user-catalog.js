// ==========================================
// CONFIGURACIÓN Y CARGA DEL CATÁLOGO
// ==========================================

let todosLosActivos = []; 
let activosFiltrados = [];
let rentasActivasGlobales = []; 

// Variables Paginación
let paginaActualCatalogo = 1;
const itemsPorPaginaCatalogo = 8;

async function cargarCatalogo() {
    try {
        const [resActivos, resRentas] = await Promise.all([
            fetch('http://localhost:8080/api/activos'),
            fetch('http://localhost:8080/api/rentas')
        ]);
        
        todosLosActivos = await resActivos.json(); 
        activosFiltrados = [...todosLosActivos]; // Copia inicial para filtros
        
        const todasLasRentas = resRentas.ok ? await resRentas.json() : [];
        rentasActivasGlobales = todasLasRentas.filter(r => r.estado === 'Aceptado');
        
        paginaActualCatalogo = 1;
        renderizarPaginacionCatalogo(); 
    } catch (error) {
        console.error("Error al cargar los activos:", error);
        document.getElementById('catalogo').innerHTML = '<p style="color: #ef4444; grid-column: 1 / -1; text-align: center;">Error al conectar con el servidor.</p>';
    }
}

function filtrarCatalogo(categoria, botonClickeado) {
    const botones = document.querySelectorAll('.filter-btn');
    botones.forEach(btn => btn.classList.remove('active'));
    botonClickeado.classList.add('active');

    if (categoria === 'Todos') {
        activosFiltrados = [...todosLosActivos];
    } else {
        activosFiltrados = todosLosActivos.filter(activo => 
            activo.categoria && activo.categoria.toLowerCase() === categoria.toLowerCase()
        );
    }
    
    paginaActualCatalogo = 1;
    renderizarPaginacionCatalogo();
}

function renderizarPaginacionCatalogo() {
    const inicio = (paginaActualCatalogo - 1) * itemsPorPaginaCatalogo;
    const fin = inicio + itemsPorPaginaCatalogo;
    const catalogoPagina = activosFiltrados.slice(inicio, fin);
    
    renderizarCatalogo(catalogoPagina);
    actualizarControlesCatalogo();
}

function cambiarPaginaCatalogo(direccion) {
    const totalPaginas = Math.ceil(activosFiltrados.length / itemsPorPaginaCatalogo);
    paginaActualCatalogo += direccion;
    
    if (paginaActualCatalogo < 1) paginaActualCatalogo = 1;
    if (paginaActualCatalogo > totalPaginas) paginaActualCatalogo = totalPaginas;
    
    renderizarPaginacionCatalogo();
}

function actualizarControlesCatalogo() {
    const totalPaginas = Math.ceil(activosFiltrados.length / itemsPorPaginaCatalogo) || 1;
    
    document.getElementById('indicador-pagina-cat').innerText = `Pág. ${paginaActualCatalogo} de ${totalPaginas}`;
    document.getElementById('cat-info-mostrando').innerText = `Mostrando ${activosFiltrados.length > 0 ? (paginaActualCatalogo - 1) * itemsPorPaginaCatalogo + 1 : 0} - ${Math.min(paginaActualCatalogo * itemsPorPaginaCatalogo, activosFiltrados.length)} de ${activosFiltrados.length} productos`;

    document.getElementById('btn-prev-cat').disabled = paginaActualCatalogo === 1;
    document.getElementById('btn-prev-cat').style.opacity = paginaActualCatalogo === 1 ? "0.3" : "1";
    document.getElementById('btn-next-cat').disabled = paginaActualCatalogo === totalPaginas;
    document.getElementById('btn-next-cat').style.opacity = paginaActualCatalogo === totalPaginas ? "0.3" : "1";
}

function renderizarCatalogo(listaActivos) {
    const contenedor = document.getElementById('catalogo');
    contenedor.innerHTML = ''; 

    if (listaActivos.length === 0) {
        contenedor.innerHTML = '<p style="color: var(--muted); text-align: center; grid-column: 1 / -1; margin-top: 40px; font-size: 1.1rem;">No hay artículos disponibles en esta categoría.</p>';
        return;
    }

    listaActivos.forEach(activo => {
        let rutaImagen = activo.imagenUrl ? activo.imagenUrl : 'https://via.placeholder.com/150/111111/58FF0A?text=Sin+Imagen';
        
        const cantidadRentada = rentasActivasGlobales.filter(r => r.articuloNombre === activo.nombre).length;
        const stockTotal = activo.cantidadTotal || 1;
        const disponibles = stockTotal - cantidadRentada;

        let botonHtml = '';
        if (disponibles <= 0) {
            botonHtml = `<button class="btn" style="width: 100%; border-radius: 8px; padding: 10px; background: rgba(239, 68, 68, 0.1); color: #ef4444; border: 1px solid rgba(239, 68, 68, 0.5); font-weight: 600; cursor: not-allowed;" disabled>Agotado</button>`;
        } else {
            botonHtml = `<button class="btn btn-action-catalog" style="width: 100%; border-radius: 8px; padding: 10px; background: var(--primary); color: #000; border: none; font-weight: 600; cursor: pointer; transition: 0.2s;" onmouseover="this.style.opacity='0.8'" onmouseout="this.style.opacity='1'" onclick="openRentModal('${activo.nombre}')">Rentar por día</button>`;
        }

        contenedor.innerHTML += `
            <div class="product-card" style="background: #0a0a0a; border: 1px solid var(--border); border-radius: 12px; overflow: hidden; transition: 0.3s;">
                <div class="product-image" style="padding: 0; overflow: hidden; display: flex; justify-content: center; align-items: center; background: #111; height: 180px;">
                    <img src="${rutaImagen}" alt="${activo.nombre}" style="width: 100%; height: 100%; object-fit: cover;">
                </div>
                
                <div class="product-info" style="padding: 20px;">
                    <h3 style="margin: 0 0 5px 0; color: #fff; font-size: 1.1rem; text-align: center;">${activo.nombre}</h3>
                    <p style="color: var(--muted); font-size: 0.8rem; margin: 0; text-align: center;">Disponibles: <strong style="color: ${disponibles <= 0 ? '#ef4444' : '#fff'}">${disponibles}</strong></p>
                    <div class="price" style="font-size: 1.5rem; font-weight: bold; color: var(--primary); margin: 15px 0; text-align: center;">
                        $${activo.precioDia.toLocaleString('es-CO')} <span style="font-size: 0.8rem; color: var(--muted);">COP/día</span>
                    </div>
                    ${botonHtml}
                </div>
            </div>
        `;
    });
}

// ==========================================
// LÓGICA DEL MODAL DE RENTA Y CARRITO (Flatpickr)
// ==========================================

const modal = document.getElementById('rentModal');
let articuloSeleccionado = null;
let diasSeleccionados = 0; 
let flatpickrInstance = null; // Instancia del calendario

function openRentModal(itemName) {
    articuloSeleccionado = todosLosActivos.find(activo => activo.nombre === itemName);
    document.getElementById('modalTitle').innerText = itemName;
    
    // Muestra fecha de inicio (Hoy)
    const hoy = new Date();
    document.getElementById('modalFechaInicio').innerText = hoy.toLocaleDateString('es-ES'); 
    
    // Configurar Flatpickr (Calendario Elegante)
    hoy.setDate(hoy.getDate() + 1); // La fecha mínima es mañana
    
    const inputFecha = document.getElementById('rentEndDate');
    
    // Si ya había un calendario antes, lo destruimos para crear uno nuevo limpio
    if(flatpickrInstance) {
        flatpickrInstance.destroy();
    }
    
    flatpickrInstance = flatpickr(inputFecha, {
        minDate: hoy,
        dateFormat: "Y-m-d", // Formato interno para los cálculos matemáticos
        altInput: true,
        altFormat: "d/m/Y", // Formato visible para el usuario (estilo latino)
        locale: "es", // En español
        onChange: function(selectedDates, dateStr, instance) {
            calcularDiasCalendario(dateStr);
        }
    });
    
    document.getElementById('modalDiasCalculados').innerText = "0 días";
    
    const btnAdd = document.getElementById('btn-add-cart');
    if (btnAdd) {
        btnAdd.style.opacity = "0.5";
        btnAdd.style.pointerEvents = "none";
    }

    modal.style.display = 'flex';
}

function closeRentModal() {
    modal.style.display = 'none';
    articuloSeleccionado = null;
    diasSeleccionados = 0;
    if(flatpickrInstance) { flatpickrInstance.clear(); }
}

function calcularDiasCalendario(fechaElegidaString) {
    if (!fechaElegidaString) return;

    const fechaHoy = new Date();
    fechaHoy.setHours(0,0,0,0); 

    const partesFecha = fechaElegidaString.split('-');
    const fechaElegida = new Date(partesFecha[0], partesFecha[1] - 1, partesFecha[2]);

    const diferenciaMs = fechaElegida - fechaHoy;
    diasSeleccionados = Math.ceil(diferenciaMs / (1000 * 60 * 60 * 24));

    const btnAdd = document.getElementById('btn-add-cart');

    if (diasSeleccionados > 0) {
        document.getElementById('modalDiasCalculados').innerText = `${diasSeleccionados} día(s)`;
        if (btnAdd) {
            btnAdd.style.opacity = "1";
            btnAdd.style.pointerEvents = "auto";
        }
    } else {
        document.getElementById('modalDiasCalculados').innerText = "Inválido";
        diasSeleccionados = 0;
        if (btnAdd) {
            btnAdd.style.opacity = "0.5";
            btnAdd.style.pointerEvents = "none";
        }
    }
}

function addToCart() {
    if (!articuloSeleccionado) return;

    if (diasSeleccionados <= 0) {
        Swal.fire({ icon: 'warning', title: 'Atención', text: 'Debes seleccionar una fecha válida.', background: '#111', color: '#fff' });
        return;
    }

    const total = articuloSeleccionado.precioDia * diasSeleccionados;

    const itemCarrito = {
        articuloNombre: articuloSeleccionado.nombre,
        imagenUrl: articuloSeleccionado.imagenUrl,
        precioDia: articuloSeleccionado.precioDia,
        dias: diasSeleccionados,
        totalPagado: total
    };

    let carrito = JSON.parse(sessionStorage.getItem('carritoSportTicket')) || [];
    
    const indexExistente = carrito.findIndex(item => item.articuloNombre === articuloSeleccionado.nombre);
    
    if (indexExistente !== -1) {
        carrito[indexExistente].dias = diasSeleccionados;
        carrito[indexExistente].totalPagado = total;
    } else {
        carrito.push(itemCarrito);
    }
    
    sessionStorage.setItem('carritoSportTicket', JSON.stringify(carrito));

    Swal.fire({
        icon: 'success',
        title: '¡Añadido al carrito!',
        text: `${articuloSeleccionado.nombre} por ${diasSeleccionados} día(s).`,
        showConfirmButton: false,
        timer: 1500, 
        background: '#111',
        color: '#fff'
    });

    closeRentModal();
}

window.onclick = function(event) {
    if (event.target == modal) { closeRentModal(); }
}

document.addEventListener('DOMContentLoaded', cargarCatalogo);