// ==========================================
// LÓGICA DE PERFIL (CON COMPRESIÓN DE IMÁGENES)
// ==========================================

let usuarioActual = null;

async function cargarPerfil() {
    const usuarioGuardado = sessionStorage.getItem('usuarioActivo');
    if (!usuarioGuardado) return;
    
    usuarioActual = JSON.parse(usuarioGuardado);

    document.getElementById('perfil-nombre').innerText = usuarioActual.nombreCompleto || 'Desconocido';
    document.getElementById('perfil-email').innerText = usuarioActual.email || 'Desconocido';
    document.getElementById('perfil-telefono').innerText = usuarioActual.telefono || 'No registrado';
    
    if (usuarioActual.fotoUrl) {
        document.getElementById('perfil-foto').src = usuarioActual.fotoUrl;
    }

    try {
        const res = await fetch(`http://localhost:8080/api/rentas/usuario/${usuarioActual.email}`);
        if (res.ok) {
            const rentas = await res.json();
            document.getElementById('perfil-rentas-total').innerText = rentas.length;
        }
    } catch (e) { console.error("Error cargando rentas:", e); }
}

// ==========================================
// MOTOR DE COMPRESIÓN DE IMÁGENES (NUEVO)
// ==========================================
function subirImagenLocal(event) {
    const archivo = event.target.files[0];
    if (!archivo) return;

    // 1. Validamos que el archivo sea realmente una imagen
    if (!archivo.type.startsWith('image/')) {
        alert("Por favor, selecciona un archivo de imagen válido.");
        return;
    }

    const reader = new FileReader();
    reader.onload = function(e) {
        // 2. Creamos un objeto de imagen en la memoria
        const img = new Image();
        img.onload = function() {
            // 3. Creamos un lienzo (canvas) invisible
            const canvas = document.createElement('canvas');
            const MAX_SIZE = 400; // Tamaño máximo ideal para perfil
            let width = img.width;
            let height = img.height;

            // 4. Calculamos las nuevas medidas manteniendo la proporción
            if (width > height) {
                if (width > MAX_SIZE) {
                    height *= MAX_SIZE / width;
                    width = MAX_SIZE;
                }
            } else {
                if (height > MAX_SIZE) {
                    width *= MAX_SIZE / height;
                    height = MAX_SIZE;
                }
            }

            // 5. Dibujamos la imagen encogida en el lienzo
            canvas.width = width;
            canvas.height = height;
            const ctx = canvas.getContext('2d');
            ctx.drawImage(img, 0, 0, width, height);

            // 6. La comprimimos a formato JPEG con 70% de calidad
            // Esto reduce el peso drásticamente sin perder calidad visual
            const base64Comprimido = canvas.toDataURL('image/jpeg', 0.7);

            // 7. Actualizamos la foto en la pantalla
            document.getElementById('perfil-foto').src = base64Comprimido;

            // 8. Enviamos la foto "liviana" a Java
            const datosActualizados = {
                ...usuarioActual,
                fotoUrl: base64Comprimido
            };
            enviarAJava(datosActualizados);
        };
        img.src = e.target.result;
    };
    reader.readAsDataURL(archivo);
}

// ==========================================
// CONTROL DE MODALES Y ACTUALIZACIÓN
// ==========================================
function openModal(id) {
    document.getElementById(id).style.display = 'flex';
    if (id === 'modalEdit') {
        document.getElementById('edit-nombre').value = usuarioActual.nombreCompleto || '';
        document.getElementById('edit-email').value = usuarioActual.email || ''; 
        document.getElementById('edit-tel').value = usuarioActual.telefono || '';
    }
}

function closeModal(id) {
    document.getElementById(id).style.display = 'none';
}

async function actualizarDatos() {
    const datos = {
        ...usuarioActual,
        nombreCompleto: document.getElementById('edit-nombre').value,
        email: document.getElementById('edit-email').value, 
        telefono: document.getElementById('edit-tel').value
    };
    await enviarAJava(datos);
    closeModal('modalEdit');
}

async function actualizarPassword() {
    const oldP = document.getElementById('pass-old').value;
    const newP = document.getElementById('pass-new').value;

    if (oldP !== usuarioActual.password) {
        alert("Contraseña actual incorrecta");
        return;
    }
    
    await enviarAJava({ ...usuarioActual, password: newP });
    closeModal('modalPass');
}

async function enviarAJava(datos) {
    try {
        const res = await fetch('http://localhost:8080/api/usuarios/actualizar', {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(datos)
        });

        if (!res.ok) throw new Error(`Error en el servidor (${res.status})`);

        const textoRespuesta = await res.text();
        if (!textoRespuesta) throw new Error("Respuesta vacía del servidor.");

        const user = JSON.parse(textoRespuesta);
        
        if (user && user.id) {
            sessionStorage.setItem('usuarioActivo', JSON.stringify(user));
            usuarioActual = user; 
            cargarPerfil(); 
        } else {
            throw new Error("Datos corruptos desde el servidor.");
        }

    } catch (e) { 
        console.error("Detalle técnico:", e);
        alert("Error al actualizar: " + e.message); 
    }
}

document.addEventListener('DOMContentLoaded', cargarPerfil);