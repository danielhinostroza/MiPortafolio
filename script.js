// Modal login
const adminBtn = document.getElementById("adminBtn");
const loginModal = document.getElementById("loginModal");
const closeBtn = document.querySelector(".closeBtn");
const loginForm = document.getElementById("loginForm");
const adminPanel = document.getElementById("adminPanel");
const logoutBtn = document.getElementById("logoutBtn");

let esAdmin = false; // <<-- Nueva variable de control

adminBtn.onclick = () => loginModal.style.display = "block";
closeBtn.onclick = () => loginModal.style.display = "none";
window.onclick = (e) => { if (e.target === loginModal) loginModal.style.display = "none"; };

loginForm.addEventListener("submit", (e) => {
  e.preventDefault();
  const email = document.getElementById("email").value;
  const password = document.getElementById("password").value;
  if (email === "admin@portafolio.com" && password === "1234") {
    alert("Bienvenido Administrador");
    loginModal.style.display = "none";
    adminPanel.classList.remove("hidden");
    esAdmin = true; // <<-- habilita el modo admin
    mostrarTrabajos(); // refrescar con botón eliminar visible
  } else {
    alert("Credenciales incorrectas");
  }
});

logoutBtn.addEventListener("click", () => {
  adminPanel.classList.add("hidden");
  alert("Sesión cerrada");
  esAdmin = false; // <<-- se desactiva el modo admin
  mostrarTrabajos(); // refrescar para ocultar botón eliminar
});

// Guardar trabajos en localStorage
const uploadForm = document.getElementById("uploadForm");
const trabajosList = document.getElementById("trabajosList");
let trabajos = JSON.parse(localStorage.getItem("trabajos")) || [];

function mostrarTrabajos(filtroCurso = null) {
  trabajosList.innerHTML = "";
  trabajos
    .filter(t => !filtroCurso || t.curso === filtroCurso)
    .forEach((t, index) => {
      const card = document.createElement("div");
      card.classList.add("trabajo-card");
      card.innerHTML = `
        <h3>${t.titulo}</h3>
        <p><strong>Curso:</strong> ${t.curso}</p>
        <p><strong>Fecha:</strong> ${t.fecha}</p>
        <embed src="${t.archivo}" width="100%" height="150px" type="application/pdf"/>
        <a href="${t.archivo}" download="${t.titulo}">Descargar</a>
        ${esAdmin ? `<button class="deleteBtn" data-index="${index}">Eliminar</button>` : ""}
      `;
      trabajosList.appendChild(card);
    });

  // Activar botón eliminar solo si es admin
  if (esAdmin) {
    document.querySelectorAll(".deleteBtn").forEach(btn => {
      btn.addEventListener("click", (e) => {
        const idx = e.target.dataset.index;
        trabajos.splice(idx, 1);
        localStorage.setItem("trabajos", JSON.stringify(trabajos));
        mostrarTrabajos(filtroCurso);
      });
    });
  }
}

uploadForm.addEventListener("submit", (e) => {
  e.preventDefault();
  const titulo = document.getElementById("titulo").value;
  const curso = document.getElementById("cursoSelect").value;
  const archivoInput = document.getElementById("archivo");

  if (archivoInput.files.length > 0) {
    const archivo = archivoInput.files[0];
    const reader = new FileReader();

    reader.onload = function(e) {
      const archivoBase64 = e.target.result; // archivo convertido a Base64
      const nuevoTrabajo = {
        titulo,
        curso,
        archivo: archivoBase64, // guardamos el archivo en base64
        fecha: new Date().toLocaleDateString()
      };
      trabajos.push(nuevoTrabajo);
      localStorage.setItem("trabajos", JSON.stringify(trabajos));
      mostrarTrabajos(curso);
      uploadForm.reset();
    };

    reader.readAsDataURL(archivo); // convierte el archivo a base64
  }
});

// Filtro por curso
document.querySelectorAll(".curso-card").forEach(card => {
  card.addEventListener("click", () => {
    const curso = card.dataset.curso;
    mostrarTrabajos(curso);
  });
});

// Mostrar todos al inicio
mostrarTrabajos();
