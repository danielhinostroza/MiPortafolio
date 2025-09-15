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

// Modal para ver archivo
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
  <div style="position:relative; margin:50px auto; background:#fff; padding:10px; width:80%; height:80%;">
    <span id="cerrarVerModal" style="position:absolute; top:10px; right:20px; font-size:24px; cursor:pointer;">&times;</span>
    <embed id="archivoVista" src="" type="application/pdf" width="100%" height="100%" />
  </div>
`;
document.body.appendChild(verModal);

const archivoVista = document.getElementById("archivoVista");
const cerrarVerModal = document.getElementById("cerrarVerModal");
cerrarVerModal.onclick = () => verModal.style.display = "none";
window.onclick = (e) => { if (e.target === verModal) verModal.style.display = "none"; };

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
        <a href="${t.archivo}" download>Descargar</a>
        <button class="verBtn" data-archivo="${t.archivo}">Ver</button>
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

  // Activar botón ver (para todos los usuarios)
  document.querySelectorAll(".verBtn").forEach(btn => {
    btn.addEventListener("click", (e) => {
      const archivo = e.target.dataset.archivo;
      archivoVista.src = archivo;
      verModal.style.display = "block";
    });
  });
}

uploadForm.addEventListener("submit", (e) => {
  e.preventDefault();
  const titulo = document.getElementById("titulo").value;
  const curso = document.getElementById("cursoSelect").value;
  const archivoInput = document.getElementById("archivo");

  if (archivoInput.files.length > 0) {
    const archivoURL = URL.createObjectURL(archivoInput.files[0]);
    const nuevoTrabajo = {
      titulo,
      curso,
      archivo: archivoURL,
      fecha: new Date().toLocaleDateString()
    };
    trabajos.push(nuevoTrabajo);
    localStorage.setItem("trabajos", JSON.stringify(trabajos));
    mostrarTrabajos(curso);
    uploadForm.reset();
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



function mostrarTrabajos(curso) {
  const lista = document.getElementById("trabajosList");
  lista.innerHTML = ""; // limpia lo anterior

  if (curso === "investigacion") {
    lista.innerHTML = `
      <div class="trabajo-card">
        <h3>Constancia de Matrícula</h3>
        <p><strong>Curso:</strong> Investigación</p>
        <p><strong>Fecha:</strong> 14/9/2025</p>

        <!-- Visor del PDF -->
        <embed src="archivos/mapa de procesos.pdf" width="100%" height="400px" type="application/pdf"/>

        <!-- Botones -->
        <a href="archivos/mapa de procesos.pdf" download style="color: yellow; font-weight: bold;">Descargar</a>
        <button onclick="window.open('archivos/mapa de procesos.pdf','_blank')">Ver</button>
      </div>
    `;
  } else {
    lista.innerHTML = `
      <div class="trabajo-card">
        <h3>No hay trabajos disponibles para este curso.</h3>
      </div>
    `;
  }
}

// 👉 Vincula cada curso con la función
document.querySelectorAll(".curso-card").forEach(card => {
  card.addEventListener("click", () => {
    mostrarTrabajos(card.dataset.curso);
  });
});
