// ==========================================
// LÓGICA DEL DASHBOARD DE ADMINISTRADOR
// ==========================================

document.addEventListener('DOMContentLoaded', async () => {
    // 1. SEGURIDAD
    const usuarioGuardado = sessionStorage.getItem('usuarioActivo');
    if (!usuarioGuardado) { window.location.href = 'login.html'; return; }

    const usuarioActual = JSON.parse(usuarioGuardado);
    if (usuarioActual.superUser !== true) { window.location.href = 'user-catalog.html'; return; }

    // 2. ACTUALIZAR INTERFAZ DEL HEADER
    document.getElementById('admin-name').innerText = usuarioActual.nombreCompleto;
    
    let iniciales = "AD";
    const partesNombre = usuarioActual.nombreCompleto.split(" ");
    if (partesNombre.length >= 2) {
        iniciales = partesNombre[0].charAt(0) + partesNombre[1].charAt(0);
    } else {
        iniciales = usuarioActual.nombreCompleto.substring(0, 2);
    }
    document.getElementById('admin-initials').innerText = iniciales.toUpperCase();

    // 3. CARGAR TODAS LAS BASES DE DATOS
    try {
        const [resActivos, resRentas, resUsuarios] = await Promise.all([
            fetch('http://localhost:8080/api/activos'),
            fetch('http://localhost:8080/api/rentas'),
            fetch('http://localhost:8080/api/usuarios') // Agregamos la llamada a usuarios
        ]);

        let activos = resActivos.ok ? await resActivos.json() : [];
        let rentas = resRentas.ok ? await resRentas.json() : [];
        let usuarios = resUsuarios.ok ? await resUsuarios.json() : [];

        // --- CÁLCULO DE MÉTRICAS SUPERIORES ---
        const pendientes = rentas.filter(r => r.estado === 'Pendiente').length;
        const denegados = rentas.filter(r => r.estado === 'Denegado').length;
        const resueltos = rentas.filter(r => r.estado === 'Aceptado' || r.estado === 'Devuelto').length;

        document.getElementById('dash-total-activos').innerText = activos.length;
        document.getElementById('dash-tickets-pendientes').innerText = pendientes;
        document.getElementById('dash-tickets-denegados').innerText = denegados;
        document.getElementById('dash-tickets-resueltos').innerText = resueltos;
        document.getElementById('badge-rentas-recientes').innerText = `${rentas.length} totales`;

        // --- CÁLCULO FINANCIERO (Ganancias) ---
        let gananciasSemanales = 0;
        let gananciasTotales = 0;
        
        const fechaHoy = new Date();
        const fechaHaceUnaSemana = new Date();
        fechaHaceUnaSemana.setDate(fechaHoy.getDate() - 7);

        rentas.forEach(r => {
            // Solo sumamos dinero si el ticket fue Aceptado o Devuelto (nunca si fue denegado)
            if (r.estado === 'Aceptado' || r.estado === 'Devuelto') {
                const pagado = parseFloat(r.totalPagado) || 0;
                gananciasTotales += pagado;

                // Verificamos si la fecha de renta entra en los últimos 7 días
                const fechaRenta = new Date(r.fechaRenta);
                if (fechaRenta >= fechaHaceUnaSemana && fechaRenta <= fechaHoy) {
                    gananciasSemanales += pagado;
                }
            }
        });

        // Formatear a pesos colombianos
        document.getElementById('dash-ganancias-semanales').innerText = "$" + gananciasSemanales.toLocaleString('es-CO');
        document.getElementById('dash-ganancias-totales').innerText = "$" + gananciasTotales.toLocaleString('es-CO');
        document.getElementById('dash-usuarios-reg').innerText = usuarios.length;


        // --- RENDERIZAR RENTAS RECIENTES ---
        const contenedorRentas = document.getElementById('contenedor-rentas-recientes');
        contenedorRentas.innerHTML = ''; 

        if (rentas.length === 0) {
            contenedorRentas.innerHTML = '<p style="color: var(--muted); padding: 15px; text-align: center;">No hay rentas registradas.</p>';
        } else {
            const ultimasRentas = [...rentas].reverse().slice(0, 4); // Mostramos las últimas 4
            ultimasRentas.forEach(renta => {
                let badgeColor = '';
                if (renta.estado === 'Aceptado' || renta.estado === 'Devuelto') badgeColor = 'badge-soft-success';
                else if (renta.estado === 'Pendiente') badgeColor = 'badge-soft-warning';
                else if (renta.estado === 'Denegado') badgeColor = 'badge-soft-danger';
                else badgeColor = 'badge-soft-info';

                contenedorRentas.innerHTML += `
                    <div class="list-item border-hover-primary">
                        <div class="item-header">
                            <div>
                                <div class="item-meta"><span class="item-id">${renta.usuarioEmail}</span></div>
                                <h4 class="item-title">${renta.articuloNombre}</h4>
                                <p class="item-subtitle">${renta.dias} días alquilados</p>
                            </div>
                            <span class="badge ${badgeColor}">${renta.estado}</span>
                        </div>
                        <div class="item-footer">
                            <i class="fa-regular fa-calendar"></i> ${renta.fechaRenta}
                            <span style="float: right; color: var(--primary); font-weight: bold;">$${renta.totalPagado.toLocaleString('es-CO')}</span>
                        </div>
                    </div>
                `;
            });
        }

        // --- MOTOR DE CÁLCULO: ACTIVOS CRÍTICOS (Stock <= 5) ---
        const contenedorCriticos = document.getElementById('contenedor-activos-criticos');
        contenedorCriticos.innerHTML = '';
        let hayCriticos = false;

        // Solo restamos del inventario físico los que están actualmente en manos del usuario
        const rentasActivas = rentas.filter(r => r.estado === 'Aceptado');

        activos.forEach(activo => {
            const cantidadRentada = rentasActivas.filter(r => r.articuloNombre === activo.nombre).length;
            const stockTotal = activo.cantidadTotal || 1; 
            const disponibles = stockTotal - cantidadRentada;
            
            // LÓGICA DE ALARMA: Si quedan 5 o menos
            if (disponibles <= 5) {
                hayCriticos = true;
                
                const porcentajeDisponible = (disponibles / stockTotal) * 100;
                let colorBarra = 'bg-warning';
                let colorBadge = 'badge-soft-warning';
                let textoBadge = 'Poco Stock';

                if (disponibles <= 0) {
                    colorBarra = 'bg-danger';
                    colorBadge = 'badge-soft-danger';
                    textoBadge = 'Agotado';
                }

                contenedorCriticos.innerHTML += `
                    <div class="list-item border-hover-primary">
                        <div class="item-header">
                            <h4 class="item-title">${activo.nombre}</h4>
                            <span class="badge ${colorBadge}">${textoBadge}</span>
                        </div>
                        <div class="progress-info">
                            <span class="progress-label">Disponibles</span>
                            <span class="progress-value">${disponibles} / ${stockTotal}</span>
                        </div>
                        <div class="progress-track">
                            <div class="progress-fill ${colorBarra}" style="width: ${porcentajeDisponible}%"></div>
                        </div>
                    </div>
                `;
            }
        });

        if (!hayCriticos) {
            contenedorCriticos.innerHTML = '<p style="color: #4ade80; padding: 15px; text-align: center;"><i class="fa-solid fa-check-circle"></i> Todos los artículos tienen más de 5 unidades en stock.</p>';
        }

    } catch (error) {
        console.error("Error al cargar las métricas:", error);
    }
});