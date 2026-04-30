// ==========================================
// CONFIGURACIÓN Y CARGA DEL CATÁLOGO
// ==========================================

let todosLosActivos = []; 

async function cargarCatalogo() {
    try {
        const respuesta = await fetch('http://localhost:8080/api/activos');
        todosLosActivos = await respuesta.json(); 
        
        renderizarCatalogo(todosLosActivos); 
    } catch (error) {
        console.error("Error al cargar los activos:", error);
        const contenedor = document.getElementById('catalogo');
        if(contenedor) {
            contenedor.innerHTML = '<p style="color: white; text-align: center;">Error al conectar con el servidor.</p>';
        }
    }
}

function renderizarCatalogo(listaActivos) {
    const contenedor = document.getElementById('catalogo');
    contenedor.innerHTML = ''; 

    if (listaActivos.length === 0) {
        contenedor.innerHTML = '<p style="color: var(--muted); text-align: center; grid-column: 1 / -1; margin-top: 20px;">No hay artículos disponibles en esta categoría.</p>';
        return;
    }

    listaActivos.forEach(activo => {
        let rutaImagen = activo.imagenUrl ? activo.imagenUrl : 'https://via.placeholder.com/150/111111/58FF0A?text=Sin+Imagen';

        contenedor.innerHTML += `
            <div class="product-card">
                <div class="product-image" style="padding: 0; overflow: hidden; display: flex; justify-content: center; align-items: center; background: #111; border-radius: 12px; height: 180px;">
                    <img src="${rutaImagen}" alt="${activo.nombre}" style="width: 100%; height: 100%; object-fit: cover;">
                </div>
                
                <div class="product-info">
                    <h3 style="margin-top: 15px;">${activo.nombre}</h3>
                    <div class="price" style="font-size: 1.5rem; font-weight: bold; color: var(--primary); margin: 15px 0;">
                        $${activo.precioDia} <span style="font-size: 0.8rem; color: var(--muted);">COP / día</span>
                    </div>
                    <button class="btn btn-action-catalog" style="width: 100%; border-radius: 8px; padding: 10px; background: var(--primary); color: #000; border: none; font-weight: 600; cursor: pointer;" 
                        onclick="openRentModal('${activo.nombre}')">Opciones de renta</button>
                </div>
            </div>
        `;
    });
}

function filtrarCatalogo(categoria, botonClickeado) {
    const botones = document.querySelectorAll('.filter-btn');
    botones.forEach(btn => btn.classList.remove('active'));
    
    botonClickeado.classList.add('active');

    if (categoria === 'Todos') {
        renderizarCatalogo(todosLosActivos); 
    } else {
        const filtrados = todosLosActivos.filter(activo => 
            activo.categoria && activo.categoria.toLowerCase() === categoria.toLowerCase()
        );
        renderizarCatalogo(filtrados); 
    }
}

// ==========================================
// LÓGICA DEL MODAL DE RENTA Y CARRITO
// ==========================================

const modal = document.getElementById('rentModal');
const daysInput = document.getElementById('rentDays');
const modalTitle = document.getElementById('modalTitle');

let articuloSeleccionado = null;

function openRentModal(itemName) {
    articuloSeleccionado = todosLosActivos.find(activo => activo.nombre === itemName);
    
    modalTitle.innerText = itemName;
    daysInput.value = 1;
    modal.style.display = 'flex';
}

function closeRentModal() {
    modal.style.display = 'none';
    articuloSeleccionado = null;
}

function changeDays(amt) {
    let current = parseInt(daysInput.value);
    if (current + amt >= 1) {
        daysInput.value = current + amt;
    }
}

function addToCart() {
    if (!articuloSeleccionado) return;

    const dias = parseInt(daysInput.value);
    const total = articuloSeleccionado.precioDia * dias;

    const itemCarrito = {
        articuloNombre: articuloSeleccionado.nombre,
        imagenUrl: articuloSeleccionado.imagenUrl,
        precioDia: articuloSeleccionado.precioDia,
        dias: dias,
        totalPagado: total
    };

    let carrito = JSON.parse(sessionStorage.getItem('carritoSportTicket')) || [];
    carrito.push(itemCarrito);
    sessionStorage.setItem('carritoSportTicket', JSON.stringify(carrito));

    // ALERTA FLOTANTE CON SWEETALERT2
    Swal.fire({
        icon: 'success',
        title: '¡Añadido al carrito!',
        text: `${articuloSeleccionado.nombre} por ${dias} día(s).`,
        showConfirmButton: false,
        timer: 1500, // Se cierra solo en 1.5 segundos
        background: '#111',
        color: '#fff',
        iconColor: '#4ade80'
    });

    closeRentModal();
}

window.onclick = function(event) {
    if (event.target == modal) {
        closeRentModal();
    }
}

document.addEventListener('DOMContentLoaded', cargarCatalogo);