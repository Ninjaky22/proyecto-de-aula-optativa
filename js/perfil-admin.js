// ==========================================
// LÓGICA DEL PERFIL DE ADMINISTRADOR
// ==========================================

let usuarioActual = null;
let base64FotoNueva = null;

document.addEventListener('DOMContentLoaded', async () => {
    // 1. SEGURIDAD Y CARGA DE DATOS DE SESIÓN
    const usuarioGuardado = sessionStorage.getItem('usuarioActivo');
    if (!usuarioGuardado) { window.location.href = 'login.html'; return; }

    usuarioActual = JSON.parse(usuarioGuardado);
    if (usuarioActual.superUser !== true) { window.location.href = 'user-catalog.html'; return; }

    pintarDatosPerfil();
    cargarTickets();
});

// --- RENDERIZAR DATOS EN PANTALLA ---
function pintarDatosPerfil() {
    document.getElementById('perfil-nombre').innerText = usuarioActual.nombreCompleto;
    document.getElementById('perfil-email').innerText = usuarioActual.email;
    document.getElementById('perfil-tel').innerText = usuarioActual.telefono || 'No registrado';

    // Manejo del Avatar (Si tiene foto en Base64 o iniciales)
    const spanIniciales = document.getElementById('avatar-iniciales');
    const imgAvatar = document.getElementById('avatar-img');

    if (usuarioActual.fotoUrl && usuarioActual.fotoUrl.trim() !== '') {
        // Tiene foto
        spanIniciales.style.display = 'none';
        imgAvatar.style.display = 'block';
        imgAvatar.src = usuarioActual.fotoUrl;
    } else {
        // No tiene foto, calculamos iniciales
        spanIniciales.style.display = 'block';
        imgAvatar.style.display = 'none';
        
        let iniciales = "AD";
        const partesNombre = usuarioActual.nombreCompleto.split(" ");
        if (partesNombre.length >= 2) {
            iniciales = partesNombre[0].charAt(0) + partesNombre[1].charAt(0);
        } else {
            iniciales = usuarioActual.nombreCompleto.substring(0, 2);
        }
        spanIniciales.innerText = iniciales.toUpperCase();
    }
}

async function cargarTickets() {
    try {
        const respuesta = await fetch('http://localhost:8080/api/rentas');
        if (respuesta.ok) {
            const rentas = await respuesta.json();
            document.getElementById('perfil-total-tickets').innerText = rentas.length;
        } else {
            document.getElementById('perfil-total-tickets').innerText = "--";
        }
    } catch (error) {
        console.error("Error al obtener los tickets:", error);
        document.getElementById('perfil-total-tickets').innerText = "Error";
    }
}

// ==========================================
// CONTROL DE MODALES
// ==========================================

function abrirModalDatos() {
    document.getElementById('edit-nombre').value = usuarioActual.nombreCompleto;
    document.getElementById('edit-tel').value = usuarioActual.telefono || '';
    document.getElementById('modalDatos').style.display = 'flex';
}

function abrirModalPass() {
    document.getElementById('edit-pass').value = '';
    document.getElementById('edit-pass-confirm').value = '';
    document.getElementById('modalPass').style.display = 'flex';
}

function abrirModalFoto() {
    base64FotoNueva = null;
    document.getElementById('input-foto').value = '';
    document.getElementById('preview-foto').style.display = 'none';
    document.getElementById('modalFoto').style.display = 'flex';
}

function cerrarModal(id) {
    document.getElementById(id).style.display = 'none';
}

// ==========================================
// FUNCIONES DE GUARDADO (PUT a la API)
// ==========================================

async function actualizarUsuarioEnBD(datosActualizados) {
    try {
        const respuesta = await fetch(`http://localhost:8080/api/usuarios/${usuarioActual.id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(datosActualizados)
        });

        if (respuesta.ok) {
            const usuarioModificado = await respuesta.json();
            // Actualizamos la sesión para que no se pierdan los cambios al recargar
            sessionStorage.setItem('usuarioActivo', JSON.stringify(usuarioModificado));
            usuarioActual = usuarioModificado;
            pintarDatosPerfil();
            return true;
        }
        return false;
    } catch (error) {
        console.error("Error al actualizar:", error);
        return false;
    }
}

async function guardarDatos() {
    const nuevoNombre = document.getElementById('edit-nombre').value.trim();
    const nuevoTel = document.getElementById('edit-tel').value.trim();

    if (!nuevoNombre) {
        Swal.fire({ icon: 'error', title: 'Error', text: 'El nombre no puede estar vacío', background: '#111', color: '#fff' });
        return;
    }

    const nuevosDatos = { ...usuarioActual, nombreCompleto: nuevoNombre, telefono: nuevoTel };
    
    const exito = await actualizarUsuarioEnBD(nuevosDatos);
    if (exito) {
        cerrarModal('modalDatos');
        Swal.fire({ icon: 'success', title: 'Actualizado', text: 'Tus datos han sido guardados.', background: '#111', color: '#fff', timer: 1500, showConfirmButton: false });
    } else {
        Swal.fire({ icon: 'error', title: 'Error de servidor', text: 'No se pudo actualizar.', background: '#111', color: '#fff' });
    }
}

async function guardarPassword() {
    const p1 = document.getElementById('edit-pass').value;
    const p2 = document.getElementById('edit-pass-confirm').value;

    if (p1.length < 6) {
        Swal.fire({ icon: 'warning', title: 'Contraseña débil', text: 'Debe tener al menos 6 caracteres.', background: '#111', color: '#fff' });
        return;
    }
    if (p1 !== p2) {
        Swal.fire({ icon: 'error', title: 'No coinciden', text: 'Las contraseñas no son iguales.', background: '#111', color: '#fff' });
        return;
    }

    const nuevosDatos = { ...usuarioActual, password: p1 };
    
    const exito = await actualizarUsuarioEnBD(nuevosDatos);
    if (exito) {
        cerrarModal('modalPass');
        Swal.fire({ icon: 'success', title: 'Seguridad Actualizada', text: 'Contraseña cambiada exitosamente.', background: '#111', color: '#fff', timer: 1500, showConfirmButton: false });
    } else {
        Swal.fire({ icon: 'error', title: 'Error', text: 'No se pudo actualizar la contraseña.', background: '#111', color: '#fff' });
    }
}

// --- FOTO DE PERFIL A BASE64 ---
function previsualizarFoto(event) {
    const file = event.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = function(e) {
        base64FotoNueva = e.target.result;
        const preview = document.getElementById('preview-foto');
        preview.src = base64FotoNueva;
        preview.style.display = 'block';
    }
    reader.readAsDataURL(file);
}

async function guardarFoto() {
    if (!base64FotoNueva) {
        Swal.fire({ icon: 'info', title: 'Sin foto', text: 'Selecciona una imagen primero.', background: '#111', color: '#fff' });
        return;
    }

    const nuevosDatos = { ...usuarioActual, fotoUrl: base64FotoNueva };
    
    const exito = await actualizarUsuarioEnBD(nuevosDatos);
    if (exito) {
        cerrarModal('modalFoto');
        Swal.fire({ icon: 'success', title: 'Foto Actualizada', text: 'Te ves genial.', background: '#111', color: '#fff', timer: 1500, showConfirmButton: false });
    } else {
        Swal.fire({ icon: 'error', title: 'Error de servidor', text: 'La imagen es demasiado pesada o falló la conexión.', background: '#111', color: '#fff' });
    }
}