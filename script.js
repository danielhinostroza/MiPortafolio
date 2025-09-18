// 🚀 Configuración de Supabase
const SUPABASE_URL = "https://unmspywowybnleivempq.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVubXNweXdvd3libmxlaXZlbXBxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTgxNTI0NzYsImV4cCI6MjA3MzcyODQ3Nn0.lVDA_rXPqnYbod8CQjZJJUHsuXs8mmJqzzSPIFfI-eU"; // 👈 Revisa en Supabase → Settings → API → anon key
const supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// Modal login
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
    cargarTrabajos();
  } else {
    alert("Credenciales incorrectas");
  }
});

logoutBtn.addEventListener("click", () => {
  adminPanel.classList.add("hidden");
  alert("Sesión cerrada");
  esAdmin = false;
  cargarTrabajos();
});

// Formularios y lista
const uploadForm = document.getElementById("uploadForm");
const trabajosList = document.getElementById("trabajosList");

// SUBIR ARCHIVO A SUPABASE
uploadForm.addEventListener("submit", async (e) => {
  e.preventDefault();
  const titulo = document.getElementById("titulo").value;
  const curso = document.getElementById("cursoSelect").value;
  const archivoInput = document.getElementById("archivo");

  if (archivoInput.files.length > 0) {
    const archivo = archivoInput.files[0];
    const nombreArchivo = Date.now() + "_" + archivo.name;

    // Subir archivo al bucket "trabajos"
    const { data, error } = await supabase.storage
      .from("trabajos") // 👈 Asegúrate que tu bucket se llame así
      .upload(nombreArchivo, archivo, {
        cacheControl: "3600",
        upsert: false
      });

    if (error) {
      alert("Error al subir archivo: " + error.message);
      console.error(error);
      return;
    }

    const { data: urlData } = supabase.storage
      .from("trabajos")
      .getPublicUrl(nombreArchivo);

    // Guardar metadata en la tabla "trabajos"
    const { error: insertError } = await supabase.from("trabajos").insert([
      { titulo, curso, archivo: urlData.publicUrl, fecha: new Date().toLocaleDateString() }
    ]);

    if (insertError) {
      alert("Error al guardar en base de datos: " + insertError.message);
      console.error(insertError);
      return;
    }

    alert("Trabajo subido con éxito ✅");
    uploadForm.reset();
    cargarTrabajos();
  }
});

// CARGAR TRABAJOS DESDE SUPABASE
async function cargarTrabajos(curso = null) {
  const { data: trabajos, error } = await supabase.from("trabajos").select("*");

  if (error) {
    console.error("Error al cargar trabajos:", error);
    return;
  }

  let lista = trabajos;
  if (curso) {
    lista = trabajos.filter(t => t.curso === curso);
  }

  trabajosList.innerHTML = "";
  lista.forEach((t) => {
    const card = document.createElement("div");
    card.classList.add("trabajo-card");
    card.innerHTML = `
      <h3>${t.titulo}</h3>
      <p><strong>Curso:</strong> ${t.curso}</p>
      <p><strong>Fecha:</strong> ${t.fecha}</p>
      <embed src="${t.archivo}" width="100%" height="150px" type="application/pdf"/>
      <a href="${t.archivo}" download>Descargar</a>
      <button onclick="window.open('${t.archivo}','_blank')">Ver</button>
      ${esAdmin ? `<button onclick="eliminarTrabajo(${t.id})">Eliminar</button>` : ""}
    `;
    trabajosList.appendChild(card);
  });
}

// ELIMINAR TRABAJO
async function eliminarTrabajo(id) {
  if (confirm("¿Seguro que deseas eliminar este trabajo?")) {
    const { error } = await supabase.from("trabajos").delete().eq("id", id);
    if (error) {
      console.error("Error al eliminar:", error);
      alert("Error al eliminar el trabajo");
      return;
    }
    cargarTrabajos();
  }
}

// FILTRO POR CURSO
document.querySelectorAll(".curso-card").forEach(card => {
  card.addEventListener("click", () => {
    const curso = card.dataset.curso;
    cargarTrabajos(curso);
  });
});

// Mostrar todos al inicio
cargarTrabajos();
