// ==========================================
// LÓGICA DE REPORTES Y GRÁFICAS (CHART.JS THEMED)
// ==========================================

document.addEventListener('DOMContentLoaded', async () => {
    const usuarioGuardado = sessionStorage.getItem('usuarioActivo');
    if (!usuarioGuardado) { window.location.href = 'login.html'; return; }

    const usuarioActual = JSON.parse(usuarioGuardado);
    if (usuarioActual.superUser !== true) { window.location.href = 'user-catalog.html'; return; }

    try {
        // 1. OBTENER TODOS LOS DATOS
        const [resRentas, resActivos, resUsuarios] = await Promise.all([
            fetch('http://localhost:8080/api/rentas'),
            fetch('http://localhost:8080/api/activos'),
            fetch('http://localhost:8080/api/usuarios')
        ]);

        const rentas = resRentas.ok ? await resRentas.json() : [];
        const activos = resActivos.ok ? await resActivos.json() : [];
        const usuarios = resUsuarios.ok ? await resUsuarios.json() : [];

        // ==========================================
        // 2. LLENAR LAS 4 TARJETAS SUPERIORES (KPIs)
        // ==========================================
        let ingresosTotales = 0;
        let articulosPrestados = 0;

        rentas.forEach(r => {
            if (r.estado === 'Aceptado' || r.estado === 'Devuelto') {
                ingresosTotales += parseFloat(r.totalPagado) || 0;
            }
            if (r.estado === 'Aceptado') {
                articulosPrestados++;
            }
        });

        document.getElementById('rep-total-tickets').innerText = rentas.length;
        document.getElementById('rep-ingresos').innerText = "$" + ingresosTotales.toLocaleString('es-CO');
        document.getElementById('rep-prestados').innerText = articulosPrestados;
        document.getElementById('rep-usuarios').innerText = usuarios.length;


        // ==========================================
        // 3. GRÁFICA 1: TICKETS POR ESTADO (Theme Colors)
        // ==========================================
        let pendientes = 0;
        let aceptados = 0;
        let denegados = 0;

        rentas.forEach(r => {
            if (r.estado === 'Pendiente') pendientes++;
            else if (r.estado === 'Aceptado' || r.estado === 'Devuelto') aceptados++;
            else if (r.estado === 'Denegado') denegados++;
        });

        const ctxEstados = document.getElementById('chartEstados').getContext('2d');
        new Chart(ctxEstados, {
            type: 'bar',
            data: {
                labels: ['Pendientes', 'Aprobados', 'Denegados'],
                datasets: [{
                    label: 'Tickets',
                    data: [pendientes, aceptados, denegados],
                    // Colores translúcidos con bordes sólidos para un look Premium
                    backgroundColor: [
                        'rgba(250, 204, 21, 0.2)', // Amarillo
                        'rgba(74, 222, 128, 0.2)', // Verde Tema
                        'rgba(239, 68, 68, 0.2)'   // Rojo
                    ],
                    borderColor: [
                        'rgba(250, 204, 21, 1)',
                        'rgba(74, 222, 128, 1)',
                        'rgba(239, 68, 68, 1)'
                    ],
                    borderWidth: 2,
                    borderRadius: 6,
                    barThickness: 50 // Grosor máximo de la barra
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: { display: false },
                    tooltip: { theme: 'dark', backgroundColor: '#111', titleColor: '#fff', bodyColor: '#ccc', borderColor: '#333', borderWidth: 1 }
                },
                scales: {
                    y: { 
                        beginAtZero: true, 
                        grid: { color: 'rgba(255,255,255,0.05)', drawBorder: false }, 
                        ticks: { color: '#9ca3af', stepSize: 1 } 
                    },
                    x: { 
                        grid: { display: false }, 
                        ticks: { color: '#e5e7eb', font: { weight: '600' } } 
                    }
                }
            }
        });


        // ==========================================
        // 4. GRÁFICA 2: VENTAS POR CATEGORÍA (Theme Colors)
        // ==========================================
        const categoriasPorActivo = {};
        activos.forEach(activo => {
            categoriasPorActivo[activo.nombre] = activo.categoria || 'Otros';
        });

        const ventasPorCategoria = {};
        rentas.forEach(renta => {
            if (renta.estado === 'Aceptado' || renta.estado === 'Devuelto') {
                const categoriaDelArticulo = categoriasPorActivo[renta.articuloNombre] || 'Otros';
                const pagado = parseFloat(renta.totalPagado) || 0;
                ventasPorCategoria[categoriaDelArticulo] = (ventasPorCategoria[categoriaDelArticulo] || 0) + pagado;
            }
        });

        const topCategorias = Object.entries(ventasPorCategoria).sort((a, b) => b[1] - a[1]).slice(0, 4);
        const labelsCategorias = topCategorias.map(item => item[0]);
        const dataCategorias = topCategorias.map(item => item[1]);

        const ctxCategorias = document.getElementById('chartCategorias').getContext('2d');
        new Chart(ctxCategorias, {
            type: 'bar',
            data: {
                labels: labelsCategorias.length > 0 ? labelsCategorias : ['Sin Datos'],
                datasets: [{
                    label: 'Ingresos',
                    data: dataCategorias.length > 0 ? dataCategorias : [0],
                    // Usamos el color principal de tu marca (Verde Neón/Primary)
                    backgroundColor: 'rgba(88, 255, 10, 0.2)', 
                    borderColor: 'rgba(88, 255, 10, 1)',
                    borderWidth: 2,
                    borderRadius: 6,
                    barThickness: 40
                }]
            },
            options: {
                indexAxis: 'y', // Gráfica horizontal
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: { display: false },
                    tooltip: { 
                        theme: 'dark',
                        backgroundColor: '#111', borderColor: '#333', borderWidth: 1,
                        callbacks: {
                            label: function(context) {
                                return ' $' + context.raw.toLocaleString('es-CO');
                            }
                        }
                    }
                },
                scales: {
                    x: { 
                        beginAtZero: true, 
                        grid: { color: 'rgba(255,255,255,0.05)', drawBorder: false }, 
                        ticks: { color: '#9ca3af' } 
                    },
                    y: { 
                        grid: { display: false }, 
                        ticks: { color: '#e5e7eb', font: { weight: '600' } } 
                    }
                }
            }
        });

    } catch (error) {
        console.error("Error al generar los reportes:", error);
    }
});