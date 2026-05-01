// ==========================================
// LÓGICA DE GESTIÓN DE ACTIVOS (CRUD + Paginación)
// ==========================================

let listaActivos = [];
let activosFiltrados = []; // Para manejar la búsqueda
let fotoBase64Actual = "";

// Variables de Paginación
let paginaActualActivos = 1;
const itemsPorPagina = 5;

document.addEventListener('DOMContentLoaded', () => {
    const usuarioGuardado = sessionStorage.getItem('usuarioActivo');
    if (!usuarioGuardado) { window.location.href = 'login.html'; return; }
    
    const usuarioActual = JSON.parse(usuarioGuardado);
    if (usuarioActual.superUser !== true) { window.location.href = 'user-catalog.html'; return; }

    cargarActivos();
});

async function cargarActivos() {
    try {
        const respuesta = await fetch('http://localhost:8080/api/activos');
        if (!respuesta.ok) throw new Error("Error al conectar con Java");
        
        listaActivos = await respuesta.json();
        activosFiltrados = [...listaActivos];
        paginaActualActivos = 1; // Reiniciamos a la pág 1 al cargar
        renderizarPaginacionActivos();
    } catch (error) {
        console.error("Error:", error);
        document.getElementById('tabla-activos').innerHTML = `<tr><td colspan="7" style="text-align:center; color:#ef4444;">Error al cargar los activos.</td></tr>`;
    }
}

function filtrarTabla() {
    const texto = document.getElementById('buscador-activos').value.toLowerCase();
    activosFiltrados = listaActivos.filter(a => 
        a.nombre.toLowerCase().includes(texto) || 
        a.categoria.toLowerCase().includes(texto)
    );
    paginaActualActivos = 1; // Volver a pág 1 al buscar
    renderizarPaginacionActivos();
}

function renderizarPaginacionActivos() {
    const inicio = (paginaActualActivos - 1) * itemsPorPagina;
    const fin = inicio + itemsPorPagina;
    const activosPagina = activosFiltrados.slice(inicio, fin);
    
    renderizarTabla(activosPagina);
    actualizarControlesPaginacion();
}

function cambiarPaginaActivos(direccion) {
    const totalPaginas = Math.ceil(activosFiltrados.length / itemsPorPagina);
    paginaActualActivos += direccion;
    
    if (paginaActualActivos < 1) paginaActualActivos = 1;
    if (paginaActualActivos > totalPaginas) paginaActualActivos = totalPaginas;
    
    renderizarPaginacionActivos();
}

function actualizarControlesPaginacion() {
    const totalPaginas = Math.ceil(activosFiltrados.length / itemsPorPagina) || 1;
    
    document.getElementById('indicador-pagina-act').innerText = `Pág. ${paginaActualActivos} de ${totalPaginas}`;
    document.getElementById('info-mostrando').innerText = `Mostrando ${activosFiltrados.length > 0 ? (paginaActualActivos - 1) * itemsPorPagina + 1 : 0} - ${Math.min(paginaActualActivos * itemsPorPagina, activosFiltrados.length)} de ${activosFiltrados.length} resultados`;
    document.getElementById('info-total').innerText = `Total catálogo: ${listaActivos.length}`;

    // Bloquear botones si estamos en los extremos
    document.getElementById('btn-prev-act').disabled = paginaActualActivos === 1;
    document.getElementById('btn-prev-act').style.opacity = paginaActualActivos === 1 ? "0.3" : "1";
    document.getElementById('btn-next-act').disabled = paginaActualActivos === totalPaginas;
    document.getElementById('btn-next-act').style.opacity = paginaActualActivos === totalPaginas ? "0.3" : "1";
}

function renderizarTabla(activos) {
    const tbody = document.getElementById('tabla-activos');
    tbody.innerHTML = '';

    if (activos.length === 0) {
        tbody.innerHTML = `<tr><td colspan="7" style="text-align:center; padding:30px; color:var(--muted);">No hay activos para mostrar.</td></tr>`;
    } else {
        activos.forEach(activo => {
            const imagen = activo.imagenUrl || 'https://ui-avatars.com/api/?name=Item&background=111&color=58FF0A';
            const cantidad = activo.cantidadTotal || 0;
            
            tbody.innerHTML += `
                <tr class="table-row">
                    <td class="id-text">ACT-${activo.id}</td>
                    <td>
                        <div class="td-img-container">
                            <img src="${imagen}" alt="foto">
                        </div>
                    </td>
                    <td class="item-name">${activo.nombre}</td>
                    <td class="item-category">${activo.categoria}</td>
                    <td style="color: var(--primary); font-weight: bold;">$${activo.precioDia.toLocaleString('es-CO')}</td>
                    <td class="item-qty">${cantidad} und.</td>
                    <td>
                        <div class="action-buttons">
                            <button class="btn-icon edit" onclick="abrirModalEditar(${activo.id})" title="Editar"><i class="fa-solid fa-pen"></i></button>
                            <button class="btn-icon delete" onclick="eliminarActivo(${activo.id})" title="Eliminar"><i class="fa-solid fa-trash"></i></button>
                        </div>
                    </td>
                </tr>
            `;
        });
    }
}

function abrirModalCrear() {
    document.getElementById('modal-titulo').innerText = "Nuevo Activo";
    document.getElementById('activo-id').value = "";
    document.getElementById('activo-nombre').value = "";
    document.getElementById('activo-categoria').value = "Fútbol";
    document.getElementById('activo-precio').value = "";
    document.getElementById('activo-cantidad').value = "1";
    
    fotoBase64Actual = "";
    document.getElementById('activo-foto-preview').style.display = "none";
    document.getElementById('activo-foto-icon').style.display = "block";

    document.getElementById('modalActivo').style.display = "flex";
}

function abrirModalEditar(id) {
    const activo = listaActivos.find(a => a.id === id);
    if (!activo) return;

    document.getElementById('modal-titulo').innerText = "Editar Activo";
    document.getElementById('activo-id').value = activo.id;
    document.getElementById('activo-nombre').value = activo.nombre;
    document.getElementById('activo-categoria').value = activo.categoria;
    document.getElementById('activo-precio').value = activo.precioDia;
    document.getElementById('activo-cantidad').value = activo.cantidadTotal || 0;
    
    fotoBase64Actual = activo.imagenUrl || "";
    if (fotoBase64Actual) {
        document.getElementById('activo-foto-preview').src = fotoBase64Actual;
        document.getElementById('activo-foto-preview').style.display = "block";
        document.getElementById('activo-foto-icon').style.display = "none";
    }

    document.getElementById('modalActivo').style.display = "flex";
}

function cerrarModal() {
    document.getElementById('modalActivo').style.display = "none";
}

function procesarImagenActivo(event) {
    const archivo = event.target.files[0];
    if (!archivo) return;

    const reader = new FileReader();
    reader.onload = function(e) {
        const img = new Image();
        img.onload = function() {
            const canvas = document.createElement('canvas');
            const MAX_SIZE = 500; 
            let width = img.width;
            let height = img.height;

            if (width > height) {
                if (width > MAX_SIZE) { height *= MAX_SIZE / width; width = MAX_SIZE; }
            } else {
                if (height > MAX_SIZE) { width *= MAX_SIZE / height; height = MAX_SIZE; }
            }

            canvas.width = width;
            canvas.height = height;
            const ctx = canvas.getContext('2d');
            ctx.drawImage(img, 0, 0, width, height);

            fotoBase64Actual = canvas.toDataURL('image/jpeg', 0.8);
            
            document.getElementById('activo-foto-preview').src = fotoBase64Actual;
            document.getElementById('activo-foto-preview').style.display = "block";
            document.getElementById('activo-foto-icon').style.display = "none";
        };
        img.src = e.target.result;
    };
    reader.readAsDataURL(archivo);
}

async function guardarActivo() {
    const id = document.getElementById('activo-id').value;
    const nombre = document.getElementById('activo-nombre').value;
    const categoria = document.getElementById('activo-categoria').value;
    const precio = document.getElementById('activo-precio').value;
    const cantidad = document.getElementById('activo-cantidad').value;

    if (!nombre || !precio || !cantidad) {
        Swal.fire({ icon: 'warning', title: 'Campos Incompletos', text: 'Nombre, precio y cantidad son obligatorios.', background: '#111', color: '#fff' });
        return;
    }

    const activoData = {
        nombre: nombre,
        categoria: categoria,
        precioDia: parseFloat(precio),
        cantidadTotal: parseInt(cantidad),
        imagenUrl: fotoBase64Actual
    };

    try {
        let url = 'http://localhost:8080/api/activos';
        let method = 'POST';

        if (id) {
            activoData.id = parseInt(id);
            url = `http://localhost:8080/api/activos/${id}`;
            method = 'PUT';
        }

        const respuesta = await fetch(url, {
            method: method,
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(activoData)
        });

        if (respuesta.ok) {
            cerrarModal();
            cargarActivos();
            Swal.fire({ icon: 'success', title: '¡Guardado!', text: 'El activo se guardó correctamente.', background: '#111', color: '#fff', timer: 1500, showConfirmButton: false });
        } else {
            Swal.fire({ icon: 'error', title: 'Error', text: 'Error al guardar en el servidor.', background: '#111', color: '#fff' });
        }
    } catch (error) {
        console.error(error);
        Swal.fire({ icon: 'error', title: 'Error', text: 'Error de conexión con el servidor.', background: '#111', color: '#fff' });
    }
}

async function eliminarActivo(id) {
    const result = await Swal.fire({
        title: '¿Estás seguro?',
        text: "Esta acción eliminará el artículo de forma permanente.",
        icon: 'warning',
        showCancelButton: true,
        confirmButtonColor: '#ef4444',
        cancelButtonColor: 'rgba(255,255,255,0.1)',
        confirmButtonText: '<i class="fa-solid fa-trash"></i> Sí, eliminar',
        cancelButtonText: 'Cancelar',
        background: '#111',
        color: '#fff'
    });

    if (result.isConfirmed) {
        try {
            const respuesta = await fetch(`http://localhost:8080/api/activos/${id}`, { method: 'DELETE' });
            if (respuesta.ok) {
                cargarActivos();
                Swal.fire({ icon: 'success', title: 'Eliminado', text: 'El artículo ha sido borrado.', background: '#111', color: '#fff', timer: 1500, showConfirmButton: false });
            } else {
                Swal.fire({ icon: 'error', title: 'Error', text: 'Error al eliminar el artículo.', background: '#111', color: '#fff' });
            }
        } catch (error) { 
            console.error(error); 
            Swal.fire({ icon: 'error', title: 'Error', text: 'Error de conexión con el servidor.', background: '#111', color: '#fff' });
        }
    }
}