// ==========================================
// CONFIGURACIÓN Y CARGA DEL CATÁLOGO
// ==========================================

// 1. Creamos una "memoria" para guardar los datos sin tener que volver a llamar a Java
let todosLosActivos = []; 

async function cargarCatalogo() {
    try {
        const respuesta = await fetch('http://localhost:8080/api/activos');
        todosLosActivos = await respuesta.json(); // Guardamos los datos en nuestra memoria
        
        renderizarCatalogo(todosLosActivos); // Dibujamos todos por primera vez
    } catch (error) {
        console.error("Error al cargar los activos:", error);
        const contenedor = document.getElementById('catalogo');
        if(contenedor) {
            contenedor.innerHTML = '<p style="color: white; text-align: center;">Error al conectar con el servidor.</p>';
        }
    }
}

// 2. Función dedicada SOLO a dibujar las tarjetas
function renderizarCatalogo(listaActivos) {
    const contenedor = document.getElementById('catalogo');
    contenedor.innerHTML = ''; 

    // Si la lista está vacía (ej. filtramos "Boxeo" y no hay nada), mostramos un mensaje
    if (listaActivos.length === 0) {
        contenedor.innerHTML = '<p style="color: var(--muted); text-align: center; grid-column: 1 / -1; margin-top: 20px;">No hay artículos disponibles en esta categoría.</p>';
        return;
    }

    // Dibujamos las tarjetas
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

// 3. Función que se activa al hacer clic en los botones de filtro
function filtrarCatalogo(categoria, botonClickeado) {
    // A) Le quitamos la clase "active" a todos los botones
    const botones = document.querySelectorAll('.filter-btn');
    botones.forEach(btn => btn.classList.remove('active'));
    
    // B) Le ponemos la clase "active" solo al botón que presionamos (para que se pinte)
    botonClickeado.classList.add('active');

    // C) Filtramos la lista de la memoria
    if (categoria === 'Todos') {
        renderizarCatalogo(todosLosActivos); // Mostrar todo
    } else {
        // Filtrar solo los que coincidan con la categoría (ignorando mayúsculas/minúsculas)
        const filtrados = todosLosActivos.filter(activo => 
            activo.categoria && activo.categoria.toLowerCase() === categoria.toLowerCase()
        );
        renderizarCatalogo(filtrados); // Dibujar solo los filtrados
    }
}

// ==========================================
// LÓGICA DEL MODAL DE RENTA
// ==========================================

const modal = document.getElementById('rentModal');
const daysInput = document.getElementById('rentDays');
const modalTitle = document.getElementById('modalTitle');

function openRentModal(itemName) {
    modalTitle.innerText = itemName;
    daysInput.value = 1;
    modal.style.display = 'flex';
}

function closeRentModal() {
    modal.style.display = 'none';
}

function changeDays(amt) {
    let current = parseInt(daysInput.value);
    if (current + amt >= 1) {
        daysInput.value = current + amt;
    }
}

function addToCart() {
    alert(`Añadido al carrito por ${daysInput.value} día(s).`);
    closeRentModal();
}

// Cerrar al hacer clic fuera del contenido
window.onclick = function(event) {
    if (event.target == modal) {
        closeRentModal();
    }
}

// Iniciar la carga al abrir la página
document.addEventListener('DOMContentLoaded', cargarCatalogo);