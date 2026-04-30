// ==========================================
// LÓGICA DE GESTIÓN DE ACTIVOS (CRUD)
// ==========================================

let listaActivos = [];
let fotoBase64Actual = "";

document.addEventListener('DOMContentLoaded', () => {
    // 1. Validar Seguridad
    const usuarioGuardado = sessionStorage.getItem('usuarioActivo');
    if (!usuarioGuardado) { window.location.href = 'login.html'; return; }
    
    const usuarioActual = JSON.parse(usuarioGuardado);
    if (usuarioActual.superUser !== true) { window.location.href = 'user-catalog.html'; return; }

    // 2. Cargar datos
    cargarActivos();
});

// --- LEER (READ) ---
async function cargarActivos() {
    try {
        const respuesta = await fetch('http://localhost:8080/api/activos');
        if (!respuesta.ok) throw new Error("Error al conectar con Java");
        
        listaActivos = await respuesta.json();
        renderizarTabla(listaActivos);
    } catch (error) {
        console.error("Error:", error);
        document.getElementById('tabla-activos').innerHTML = `<tr><td colspan="6" style="text-align:center; color:#ef4444;">Error al cargar los activos.</td></tr>`;
    }
}

function renderizarTabla(activos) {
    const tbody = document.getElementById('tabla-activos');
    tbody.innerHTML = '';

    if (activos.length === 0) {
        tbody.innerHTML = `<tr><td colspan="6" style="text-align:center; padding:30px; color:var(--muted);">No hay activos registrados.</td></tr>`;
    } else {
        activos.forEach(activo => {
            const imagen = activo.imagenUrl || 'https://ui-avatars.com/api/?name=Item&background=111&color=58FF0A';
            
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
                    <td style="color: var(--primary); font-weight: bold;">$${activo.precioDia}</td>
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

    document.getElementById('info-mostrando').innerText = `Mostrando ${activos.length} activos`;
    document.getElementById('info-total').innerText = `Total catálogo: ${activos.length}`;
}

// --- BUSCADOR ---
function filtrarTabla() {
    const texto = document.getElementById('buscador-activos').value.toLowerCase();
    const filtrados = listaActivos.filter(a => 
        a.nombre.toLowerCase().includes(texto) || 
        a.categoria.toLowerCase().includes(texto)
    );
    renderizarTabla(filtrados);
}

// --- CONTROL DE MODALES ---
function abrirModalCrear() {
    document.getElementById('modal-titulo').innerText = "Nuevo Activo";
    document.getElementById('activo-id').value = "";
    document.getElementById('activo-nombre').value = "";
    document.getElementById('activo-categoria').value = "Fútbol";
    document.getElementById('activo-precio').value = "";
    
    // Resetear imagen
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
    
    // Cargar imagen
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

// --- PROCESAR IMAGEN (Comprimir) ---
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

// --- CREAR / ACTUALIZAR (POST / PUT) ---
async function guardarActivo() {
    const id = document.getElementById('activo-id').value;
    const nombre = document.getElementById('activo-nombre').value;
    const categoria = document.getElementById('activo-categoria').value;
    const precio = document.getElementById('activo-precio').value;

    if (!nombre || !precio) {
        alert("El nombre y el precio son obligatorios.");
        return;
    }

    const activoData = {
        nombre: nombre,
        categoria: categoria,
        precioDia: parseFloat(precio),
        imagenUrl: fotoBase64Actual
    };

    try {
        let url = 'http://localhost:8080/api/activos';
        let method = 'POST'; // Por defecto es crear

        // Si hay ID, es una actualización
        if (id) {
            activoData.id = parseInt(id);
            // Asumiendo que tu Java tiene un PUT /api/activos/{id} o similar. 
            // Usaremos POST si tu backend no distingue, pero lo correcto es PUT:
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
            cargarActivos(); // Recargar la tabla
        } else {
            alert("Error al guardar en el servidor.");
        }
    } catch (error) {
        console.error(error);
        alert("Error de conexión.");
    }
}

// --- ELIMINAR (DELETE) ---
async function eliminarActivo(id) {
    if (!confirm("¿Estás seguro de que deseas eliminar este artículo de forma permanente?")) {
        return; 
    }

    try {
        const respuesta = await fetch(`http://localhost:8080/api/activos/${id}`, {
            method: 'DELETE'
        });

        if (respuesta.ok) {
            cargarActivos(); // Recargar la tabla
        } else {
            alert("Error al eliminar el artículo.");
        }
    } catch (error) {
        console.error(error);
        alert("Error de conexión.");
    }
}