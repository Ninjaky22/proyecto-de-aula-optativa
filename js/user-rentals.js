// ==========================================
// CARGA DE RENTAS DEL USUARIO
// ==========================================

async function cargarRentas() {
    console.log("Iniciando la búsqueda de rentas..."); // Chivato 1

    const usuarioGuardado = sessionStorage.getItem('usuarioActivo');
    const contenedor = document.getElementById('rentas-container');

    if (!usuarioGuardado) {
        contenedor.innerHTML = '<p style="color: white; text-align: center;">Error: No se encontró la sesión.</p>';
        return;
    }

    const usuario = JSON.parse(usuarioGuardado);
    const emailUsuario = usuario.email;
    console.log("Buscando rentas para el correo:", emailUsuario); // Chivato 2

    try {
        const respuesta = await fetch(`http://localhost:8080/api/rentas/usuario/${emailUsuario}`);
        const rentas = await respuesta.json();

        console.log("Datos recibidos de Java:", rentas); // Chivato 3 (¡El más importante!)

        contenedor.innerHTML = ''; // Borramos el texto de "Cargando..."

        if (rentas.length === 0) {
            contenedor.innerHTML = '<p style="color: var(--muted); text-align: center; margin-top: 40px; font-size: 1.1rem;">No tienes rentas activas en este momento.</p>';
            return;
        }

        // Dibujamos las tarjetas
        rentas.forEach(renta => {
            let rutaImagen = renta.imagenUrl ? renta.imagenUrl : 'https://via.placeholder.com/150/111111/58FF0A?text=Sin+Imagen';

            contenedor.innerHTML += `
                <div class="card rental-card border-active" style="margin-bottom: 20px;">
                    <div class="rental-main-info" style="display: flex; justify-content: space-between; align-items: center; padding: 25px;">
                        <div style="display: flex; gap: 20px; align-items: center;">
                            <div class="item-visual" style="width: 80px; height: 80px; border-radius: 8px; overflow: hidden; background: #111; padding: 0; display: flex; justify-content: center; align-items: center;">
                                <img src="${rutaImagen}" alt="${renta.articuloNombre}" style="width: 100%; height: 100%; object-fit: cover;">
                            </div>
                            
                            <div>
                                <h3 style="color: #fff; margin-bottom: 5px;">${renta.articuloNombre}</h3>
                                <p style="color: var(--muted); font-size: 0.85rem;">Alquilado el: ${renta.fechaRenta}</p>
                                <p style="color: #facc15; font-size: 0.9rem; font-weight: 600; margin-top: 5px;">
                                    <i class="fa-regular fa-calendar-check"></i> Días de renta: ${renta.dias}
                                </p>
                                <span style="display: inline-block; margin-top: 8px; padding: 4px 10px; background: rgba(34, 197, 94, 0.2); color: #4ade80; border-radius: 4px; font-size: 0.75rem; font-weight: bold;">
                                    Estado: ${renta.estado}
                                </span>
                            </div>
                        </div>
                        <div style="text-align: right;">
                            <div style="font-size: 1.6rem; font-weight: bold; color: var(--primary);">$${renta.totalPagado}</div>
                            <div style="font-size: 0.8rem; color: var(--muted);">COP Total</div>
                        </div>
                    </div>
                </div>
            `;
        });

    } catch (error) {
        console.error("Error crítico al cargar las rentas:", error);
        contenedor.innerHTML = '<p style="color: white; text-align: center;">Error al conectar con el servidor.</p>';
    }
}

// Iniciar la carga al abrir la página
document.addEventListener('DOMContentLoaded', cargarRentas);