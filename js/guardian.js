// ==========================================
// GUARDIÁN DE RUTAS Y ROLES
// ==========================================

const usuarioGuardado = sessionStorage.getItem('usuarioActivo');

if (!usuarioGuardado) {
    // Si no hay sesión, al login directo
    window.location.href = "login.html";
} else {
    const usuario = JSON.parse(usuarioGuardado);
    const urlActual = window.location.pathname;

    // REGLA 1: Usuario normal (false) intentando entrar al panel de admin
    if (usuario.superUser === false && (urlActual.includes('dashboard') || urlActual.includes('assets'))) {
        window.location.href = "user-catalog.html";
    }

    // REGLA 2: Administrador (true) intentando entrar al portal de clientes
    if (usuario.superUser === true && urlActual.includes('user-')) {
        window.location.href = "dashboard.html";
    }
}

// Función global para cerrar sesión desde cualquier página
function cerrarSesion() {
    sessionStorage.removeItem('usuarioActivo');
    window.location.href = "login.html";
}