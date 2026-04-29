// ==========================================
// MOSTRAR / OCULTAR CONTRASEÑA
// ==========================================
function togglePassword(inputId, iconId) {
    const input = document.getElementById(inputId);
    const icon = document.getElementById(iconId);

    if (input.type === "password") {
        input.type = "text";
        icon.classList.remove("fa-eye");
        icon.classList.add("fa-eye-slash");
    } else {
        input.type = "password";
        icon.classList.remove("fa-eye-slash"); 
        icon.classList.add("fa-eye");
    }
}

// ==========================================
// LÓGICA DE REGISTRO
// ==========================================
async function registrarUsuario(event) {
    event.preventDefault(); 

    const nombre = document.getElementById('reg-nombre').value;
    const email = document.getElementById('reg-email').value;
    const password = document.getElementById('reg-password').value;
    const confirmPassword = document.getElementById('reg-confirm').value;

    if (password !== confirmPassword) {
        alert("Las contraseñas no coinciden. Inténtalo de nuevo.");
        return;
    }

    const nuevoUsuario = {
        nombreCompleto: nombre,
        email: email,
        password: password
    };

    try {
        const respuesta = await fetch('http://localhost:8080/api/usuarios/registro', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(nuevoUsuario)
        });

        const textoRespuesta = await respuesta.text();

        if (textoRespuesta === "Registro exitoso") {
            alert("¡Cuenta creada con éxito! Ahora inicia sesión.");
            window.location.href = "login.html"; 
        } else {
            alert(textoRespuesta); 
        }
    } catch (error) {
        console.error("Error:", error);
        alert("Error al conectar con el servidor Java.");
    }
}

// ==========================================
// LÓGICA DE INICIO DE SESIÓN (LOGIN)
// ==========================================
async function iniciarSesion(event) {
    event.preventDefault(); 

    const email = document.getElementById('login-email').value;
    const password = document.getElementById('login-password').value;
    const mensajeBox = document.getElementById('login-mensaje'); 

    const intentoLogin = {
        email: email,
        password: password
    };

    try {
        const respuesta = await fetch('http://localhost:8080/api/usuarios/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(intentoLogin)
        });

        const textoRespuesta = await respuesta.text();

        if (textoRespuesta) {
            const usuarioLogueado = JSON.parse(textoRespuesta);
            
            // Guardamos la sesión en sessionStorage (se destruye al cerrar la pestaña)
            sessionStorage.setItem('usuarioActivo', JSON.stringify(usuarioLogueado));
            
            mensajeBox.style.display = 'block';
            mensajeBox.style.backgroundColor = 'rgba(34, 197, 94, 0.15)';
            mensajeBox.style.color = '#4ade80'; 
            mensajeBox.style.border = '1px solid #4ade80';
            mensajeBox.innerText = "¡Bienvenido, " + usuarioLogueado.nombreCompleto + "!";
            
            // Redirigimos validando el rol de superUser
            setTimeout(() => {
                if (usuarioLogueado.superUser === true) {
                    window.location.href = "dashboard.html"; 
                } else {
                    window.location.href = "user-catalog.html"; 
                }
            }, 1500);

        } else {
            mensajeBox.style.display = 'block';
            mensajeBox.style.backgroundColor = 'rgba(239, 68, 68, 0.15)';
            mensajeBox.style.color = '#f87171';
            mensajeBox.style.border = '1px solid #f87171';
            mensajeBox.innerText = "Correo o contraseña incorrectos. Inténtalo de nuevo.";
        }
    } catch (error) {
        console.error("Error:", error);
        mensajeBox.style.display = 'block';
        mensajeBox.style.backgroundColor = 'rgba(239, 68, 68, 0.15)';
        mensajeBox.style.color = '#f87171';
        mensajeBox.innerText = "Error al conectar con el servidor.";
    }
}