// ==========================
// LOGIN ADMIN
// ==========================
const adminBtn = document.getElementById("adminBtn");
const loginModal = document.getElementById("loginModal");
const closeBtn = document.querySelector(".closeBtn");
const loginForm = document.getElementById("loginForm");
const adminPanel = document.getElementById("adminPanel");
const logoutBtn = document.getElementById("logoutBtn");

let esAdmin = false;

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
    esAdmin = true;
    mostrarTrabajos(); 
  } else {
    alert("Credenciales incorrectas");
  }
});

logoutBtn.addEventListener("click", () => {
  adminPanel.classList.add("hidden");
  alert("Sesión cerrada");
  esAdmin = false;
  mostrarTrabajos(); 
});

// ==========================
// ELEMENTOS
// ==========================
const uploadForm = document.getElementById("uploadForm");
const trabajosList = document.getElementById("trabajosList");

// Modal para ver archivos
const verModal = document.createElement("div");
verModal.id = "verModal";
verModal.style.display = "none";
verModal.style.position = "fixed";
verModal.style.top = "0";
verModal.style.left = "0";
verModal.style.width = "100%";
verModal.style.height = "100%";
verModal.style.backgroundColor = "rgba(0,0,0,0.7)";
verModal.style.zIndex = "9999";
verModal.innerHTML = `
  <div style="position:relative; margin:50px auto; background:#fff; padding:10px; width:80%; height:80%; border-radius:8px;">
    <span id="cerrarVerModal" style="position:absolute; top:10px; right:20px; font-size:24px; cursor:pointer;">&times;</span>
    <embed id="archivoVista" src="" type="application/pdf" width="100%" height="100%" />
  </div>
`;
document.body.appendChild(verModal);

const archivoVista = document.getElementById("archivoVista");
const cerrarVerModal = document.getElementById("cerrarVerModal");
cerrarVerModal.onclick = () => verModal.style.display = "none";
window.onclick = (e) => { if (e.target === verModal) verModal.style.display = "none"; };

// ==========================
// TRABAJOS LOCALSTORAGE
// ==========================
let trabajos = JSON.parse(localStorage.getItem("trabajos")) || [];

function mostrarTrabajos(filtroCurso = null) {
  trabajosList.innerHTML = "";

  trabajos
    .filter(t => !filtroCurso || t.curso === filtroCurso)
    .forEach((t, index) => {
      const card = document.createElement("div");
      card.classList.add("trabajo-card");

      // Convertir nombre de archivo a URL correcta (codificando espacios y tildes)
      const archivoURL = `archivos/${encodeURIComponent(t.archivo)}`;

      card.innerHTML = `
        <h3>${t.titulo}</h3>
        <p><strong>Curso:</strong> ${t.curso}</p>
        <p><strong>Fecha:</strong> ${t.fecha}</p>
        <embed src="${archivoURL}" width="100%" height="150px" type="application/pdf"/>
        <a href="${archivoURL}" target="_blank" download>Descargar</a>
        <button class="verBtn" data-archivo="${archivoURL}">Ver</button>
        ${esAdmin ? `<button class="deleteBtn" data-index="${index}">Eliminar</button>` : ""}
      `;
      trabajosList.appendChild(card);
    });

  // Botón eliminar
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

  // Botón ver
  document.querySelectorAll(".verBtn").forEach(btn => {
    btn.addEventListener("click", (e) => {
      const archivo = e.target.dataset.archivo;
      archivoVista.src = archivo;
      verModal.style.display = "block";
    });
  });
}

// ==========================
// SUBIR TRABAJOS
// ==========================
uploadForm.addEventListener("submit", (e) => {
  e.preventDefault();
  const titulo = document.getElementById("titulo").value;
  const curso = document.getElementById("cursoSelect").value;
  const archivoInput = document.getElementById("archivo");

  if (archivoInput.files.length > 0) {
    const archivo = archivoInput.files[0];

    // Guardar solo el nombre del archivo, ya que está en /archivos/
    const nuevoTrabajo = {
      titulo,
      curso,
      archivo: archivo.name,
      fecha: new Date().toLocaleDateString()
    };

    trabajos.push(nuevoTrabajo);
    localStorage.setItem("trabajos", JSON.stringify(trabajos));
    mostrarTrabajos(curso);
    uploadForm.reset();
  }
});

// ==========================
// FILTRO POR CURSO
// ==========================
document.querySelectorAll(".curso-card").forEach(card => {
  card.addEventListener("click", () => {
    const curso = card.dataset.curso;
    mostrarTrabajos(curso);
  });
});

// ==========================
// MOSTRAR TODOS AL INICIO
// ==========================
mostrarTrabajos();
git 