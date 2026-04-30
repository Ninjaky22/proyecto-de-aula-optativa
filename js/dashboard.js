// ==========================================
// LÓGICA DEL DASHBOARD DE ADMINISTRADOR
// ==========================================

document.addEventListener('DOMContentLoaded', async () => {
    // 1. SEGURIDAD: Verificar sesión y permisos
    const usuarioGuardado = sessionStorage.getItem('usuarioActivo');
    
    if (!usuarioGuardado) {
        window.location.href = 'login.html';
        return;
    }

    const usuarioActual = JSON.parse(usuarioGuardado);

    // Si el usuario no es Super Usuario (Admin), lo pateamos de vuelta al catálogo
    if (usuarioActual.superUser !== true) {
        window.location.href = 'user-catalog.html';
        return;
    }

    // 2. ACTUALIZAR INTERFAZ DEL HEADER
    document.getElementById('admin-name').innerText = usuarioActual.nombreCompleto;
    
    // Generar iniciales (ej: "Juan Perez" -> "JP" o "Juan" -> "JU")
    let iniciales = "AD";
    const partesNombre = usuarioActual.nombreCompleto.split(" ");
    if (partesNombre.length >= 2) {
        iniciales = partesNombre[0].charAt(0) + partesNombre[1].charAt(0);
    } else {
        iniciales = usuarioActual.nombreCompleto.substring(0, 2);
    }
    document.getElementById('admin-initials').innerText = iniciales.toUpperCase();

    // 3. CARGAR ESTADÍSTICAS GLOBALES DESDE JAVA
    try {
        // Cargar total de Activos
        const resActivos = await fetch('http://localhost:8080/api/activos');
        if (resActivos.ok) {
            const activos = await resActivos.json();
            document.getElementById('dash-total-activos').innerText = activos.length;
        }

        // Cargar total de Rentas (Asumiendo que tienes un Endpoint GET en /api/rentas para ver TODAS)
        const resRentas = await fetch('http://localhost:8080/api/rentas');
        if (resRentas.ok) {
            const rentas = await resRentas.json();
            document.getElementById('dash-total-rentas').innerText = rentas.length;
            document.getElementById('badge-rentas-recientes').innerText = `${rentas.length} totales`;

            // Dibujar las últimas 3 rentas en la lista
            const contenedorRentas = document.getElementById('contenedor-rentas-recientes');
            contenedorRentas.innerHTML = ''; // Limpiamos

            if (rentas.length === 0) {
                contenedorRentas.innerHTML = '<p style="color: var(--muted); padding: 15px;">No hay rentas registradas.</p>';
            } else {
                // Tomamos solo las últimas 3 (invirtiendo el array para ver las más nuevas)
                const ultimasRentas = rentas.reverse().slice(0, 3);
                
                ultimasRentas.forEach(renta => {
                    contenedorRentas.innerHTML += `
                        <div class="list-item border-hover-primary">
                            <div class="item-header">
                                <div>
                                    <div class="item-meta">
                                        <span class="item-id">${renta.usuarioEmail}</span>
                                    </div>
                                    <h4 class="item-title">${renta.articuloNombre}</h4>
                                    <p class="item-subtitle">${renta.dias} días alquilados</p>
                                </div>
                                <span class="badge badge-soft-info">${renta.estado}</span>
                            </div>
                            <div class="item-footer">
                                <i class="fa-regular fa-calendar"></i> ${renta.fechaRenta}
                                <span style="float: right; color: var(--primary); font-weight: bold;">$${renta.totalPagado}</span>
                            </div>
                        </div>
                    `;
                });
            }
        }
    } catch (error) {
        console.error("Error al cargar las métricas del dashboard:", error);
    }
});