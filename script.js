// 🚀 Configuración de Supabase
const SUPABASE_URL = "https://unmspywowybnleivempq.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVubXNweXdvd3libmxlaXZlbXBxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTgxNTI0NzYsImV4cCI6MjA3MzcyODQ3Nn0.lVDA_rXPqnYbod8CQjZJJUHsuXs8mmJqzzSPIFfI-eU"; // 👈 Pega tu clave
const supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// DOM
const adminBtn = document.getElementById("adminBtn");
const loginModal = document.getElementById("loginModal");
const closeBtn = document.querySelector(".closeBtn");
const loginForm = document.getElementById("loginForm");
const adminPanel = document.getElementById("adminPanel");
const logoutBtn = document.getElementById("logoutBtn");
const uploadForm = document.getElementById("uploadForm");
const trabajosList = document.getElementById("trabajosList");

let esAdmin = false;

// Abrir/Cerrar modal
adminBtn.onclick = () => loginModal.style.display = "block";
closeBtn.onclick = () => loginModal.style.display = "none";
window.onclick = (e) => { if (e.target === loginModal) loginModal.style.display = "none"; };

// Recuperar sesión al cargar
async function initSession() {
  const { data } = await supabase.auth.getSession();
  const user = data?.session?.user;
  if (user) {
    esAdmin = true;
    adminPanel.classList.remove("hidden");
    cargarTrabajos();
  }
}
initSession();

// LOGIN
loginForm.addEventListener("submit", async (e) => {
  e.preventDefault();
  const email = document.getElementById("email").value;
  const password = document.getElementById("password").value;

  const { data, error } = await supabase.auth.signInWithPassword({ email, password });
  const user = data?.user;

  if (error || !user) {
    alert("Credenciales incorrectas ❌");
    return;
  }

  alert("Bienvenido " + user.email + " ✅");
  loginModal.style.display = "none";
  adminPanel.classList.remove("hidden");
  esAdmin = true;
  cargarTrabajos();
});

// LOGOUT
logoutBtn.addEventListener("click", async () => {
  await supabase.auth.signOut();
  adminPanel.classList.add("hidden");
  esAdmin = false;
  alert("Sesión cerrada");
  cargarTrabajos();
});

// SUBIR ARCHIVO
uploadForm.addEventListener("submit", async (e) => {
  e.preventDefault();

  const { data: sessionData } = await supabase.auth.getSession();
  const user = sessionData?.session?.user;
  if (!user) {
    alert("Debes iniciar sesión antes de subir archivos ❌");
    return;
  }

  const nombre = document.getElementById("nombre").value.trim();
  const curso = document.getElementById("cursoSelect").value;
  const archivoInput = document.getElementById("archivo");

  if (!nombre) {
    alert("Debes poner un título al trabajo");
    return;
  }

  if (archivoInput.files.length === 0) {
    alert("Selecciona un archivo primero ❌");
    return;
  }

  const archivo = archivoInput.files[0];
  const nombreArchivo = Date.now() + "_" + archivo.name.replace(/\s+/g, "_");

  // Subir al bucket "trabajos"
  const { error: uploadError } = await supabase.storage
    .from("trabajos")
    .upload(nombreArchivo, archivo);

  if (uploadError) {
    alert("⚠️ Error al subir archivo: " + uploadError.message);
    return;
  }

  // Obtener URL pública
  const { data: urlData } = supabase.storage.from("trabajos").getPublicUrl(nombreArchivo);

  // Insertar en tabla
  const { error: insertError } = await supabase.from("trabajos").insert([
    { nombre, curso, archivo: urlData.publicUrl }
  ]);

  if (insertError) {
    alert("⚠️ Error al guardar en la base de datos: " + insertError.message);
    return;
  }

  alert("✅ Archivo subido con éxito");
  uploadForm.reset();
  cargarTrabajos();
});

// CARGAR TRABAJOS
async function cargarTrabajos(curso = null) {
  const { data: trabajos, error } = await supabase
    .from("trabajos")
    .select("*")
    .order("id", { ascending: false });

  if (error) { console.error(error); return; }

  let lista = trabajos;
  if (curso) lista = trabajos.filter(t => t.curso === curso);

  trabajosList.innerHTML = "";
  lista.forEach(t => {
    const card = document.createElement("div");
    card.classList.add("trabajo-card");
    card.innerHTML = `
      <h3>${t.nombre}</h3>
      <p><strong>Curso:</strong> ${t.curso}</p>
      <p><strong>Fecha:</strong> ${t.fecha ?? ''}</p>
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
  if (!confirm("¿Seguro que deseas eliminar este trabajo?")) return;
  const { error } = await supabase.from("trabajos").delete().eq("id", id);
  if (error) { alert("Error al eliminar"); return; }
  cargarTrabajos();
}

// Filtros de cursos
document.querySelectorAll(".curso-card").forEach(card => {
  card.addEventListener("click", () => {
    const curso = card.dataset.curso;
    cargarTrabajos(curso);
  });
});

// Inicial
cargarTrabajos();
