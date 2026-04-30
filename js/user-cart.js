// ==========================================
// LÓGICA DEL CARRITO DE COMPRAS CON SWEETALERT2
// ==========================================

const VALOR_SEGURO = 2500; 

function cargarCarrito() {
    let carrito = JSON.parse(sessionStorage.getItem('carritoSportTicket')) || [];
    const container = document.getElementById('cart-items-container');
    const subtotalSpan = document.getElementById('cart-subtotal');
    const seguroSpan = document.getElementById('cart-seguro');
    const totalSpan = document.getElementById('cart-total');
    const btnPagar = document.getElementById('checkout-btn');

    if (carrito.length === 0) {
        container.innerHTML = `
            <div class="card" style="padding: 40px; text-align: center;">
                <i class="fa-solid fa-cart-shopping" style="font-size: 3rem; color: var(--muted); margin-bottom: 15px;"></i>
                <h3 style="color: #fff;">Tu carrito está vacío</h3>
                <p style="color: var(--muted); margin-top: 10px;">¡Ve al catálogo para añadir implementos deportivos!</p>
            </div>
        `;
        subtotalSpan.innerText = '$0 COP';
        seguroSpan.innerText = '$0 COP';
        totalSpan.innerText = '$0 COP';
        
        btnPagar.disabled = true;
        btnPagar.style.opacity = '0.5';
        btnPagar.style.cursor = 'not-allowed';
        return;
    }

    btnPagar.disabled = false;
    btnPagar.style.opacity = '1';
    btnPagar.style.cursor = 'pointer';
    
    container.innerHTML = '';
    let subtotal = 0;

    carrito.forEach((item, index) => {
        subtotal += item.totalPagado;
        let rutaImagen = item.imagenUrl ? item.imagenUrl : 'https://via.placeholder.com/150/111111/58FF0A?text=img';

        container.innerHTML += `
            <div class="card" style="display: flex; justify-content: space-between; align-items: center; padding: 20px; margin-bottom: 15px;">
                <div style="display: flex; gap: 15px; align-items: center;">
                    <div style="width: 60px; height: 60px; background: #111; border-radius: 8px; overflow: hidden; display: flex; justify-content: center; align-items: center;">
                        <img src="${rutaImagen}" style="width: 100%; height: 100%; object-fit: cover;">
                    </div>
                    <div>
                        <h3 style="color: #fff; font-size: 1.1rem; margin-bottom: 5px;">${item.articuloNombre}</h3>
                        <p style="color: var(--muted); font-size: 0.85rem;">$${item.precioDia} COP / día</p>
                    </div>
                </div>
                <div style="display: flex; align-items: center; gap: 20px;">
                    <div style="display: flex; align-items: center; gap: 10px; background: #111; padding: 5px 12px; border-radius: 8px; border: 1px solid var(--border);">
                        <button onclick="cambiarDias(${index}, -1)" style="background: none; border: none; color: var(--primary); cursor: pointer;"><i class="fa-solid fa-minus"></i></button>
                        <span style="color: #fff; font-weight: bold;">${item.dias} <span style="font-size: 0.7rem; font-weight: normal; color: var(--muted);">días</span></span>
                        <button onclick="cambiarDias(${index}, 1)" style="background: none; border: none; color: var(--primary); cursor: pointer;"><i class="fa-solid fa-plus"></i></button>
                    </div>
                    <div style="color: var(--primary); font-weight: bold; width: 100px; text-align: right;">$${item.totalPagado}</div>
                    <button onclick="eliminarDelCarrito(${index})" style="background: none; border: none; color: #ef4444; cursor: pointer; font-size: 1.2rem; transition: 0.2s;"><i class="fa-solid fa-trash-can"></i></button>
                </div>
            </div>
        `;
    });

    subtotalSpan.innerText = `$${subtotal} COP`;
    seguroSpan.innerText = `$${VALOR_SEGURO} COP`;
    totalSpan.innerText = `$${subtotal + VALOR_SEGURO} COP`;
}

function cambiarDias(index, cantidad) {
    let carrito = JSON.parse(sessionStorage.getItem('carritoSportTicket')) || [];
    let item = carrito[index];
    
    if (item.dias + cantidad >= 1) {
        item.dias += cantidad;
        item.totalPagado = item.dias * item.precioDia; 
        sessionStorage.setItem('carritoSportTicket', JSON.stringify(carrito));
        cargarCarrito(); 
    }
}

function eliminarDelCarrito(index) {
    let carrito = JSON.parse(sessionStorage.getItem('carritoSportTicket')) || [];
    carrito.splice(index, 1); 
    sessionStorage.setItem('carritoSportTicket', JSON.stringify(carrito));
    cargarCarrito();
}

async function procesarPago() {
    let carrito = JSON.parse(sessionStorage.getItem('carritoSportTicket')) || [];
    if (carrito.length === 0) return;

    const usuarioGuardado = sessionStorage.getItem('usuarioActivo');
    const emailUsuario = JSON.parse(usuarioGuardado).email;

    const btnPagar = document.getElementById('checkout-btn');
    btnPagar.innerText = "Procesando pago...";
    btnPagar.disabled = true;

    try {
        for (const item of carrito) {
            const nuevaRenta = {
                usuarioEmail: emailUsuario,
                articuloNombre: item.articuloNombre,
                imagenUrl: item.imagenUrl,
                dias: item.dias,
                totalPagado: item.totalPagado
            };

            await fetch('http://localhost:8080/api/rentas', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(nuevaRenta)
            });
        }

        // ALERTA DE ÉXITO CON REDIRECCIÓN
        Swal.fire({
            icon: 'success',
            title: '¡Pago exitoso!',
            text: 'Tus artículos ya están listos en tu panel de rentas.',
            confirmButtonColor: '#4ade80',
            background: '#111',
            color: '#fff'
        }).then(() => {
            sessionStorage.removeItem('carritoSportTicket'); 
            window.location.href = "user-rentals.html"; 
        });

    } catch (error) {
        console.error("Error al procesar el pago:", error);
        Swal.fire({
            icon: 'error',
            title: 'Ocurrió un problema',
            text: 'Hubo un error con el servidor al procesar tu pago.',
            confirmButtonColor: '#ef4444',
            background: '#111',
            color: '#fff'
        });
        btnPagar.innerText = "Confirmar y Pagar";
        btnPagar.disabled = false;
    }
}

document.addEventListener('DOMContentLoaded', cargarCarrito);