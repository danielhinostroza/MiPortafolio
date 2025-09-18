// 🚀 Configuración de Supabase
const SUPABASE_URL = "https://unmspywowybnleivempq.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVubXNweXdvd3libmxlaXZlbXBxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTgxNTI0NzYsImV4cCI6MjA3MzcyODQ3Nn0.lVDA_rXPqnYbod8CQjZJJUHsuXs8mmJqzzSPIFfI-eU"; 
const supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// Modal login
const adminBtn = document.getElementById("adminBtn");
const loginModal = document.getElementById("loginModal");
const closeBtn = document.querySelector(".closeBtn");
const loginForm = document.getElementById("loginForm");
const adminPanel = document.getElementById("adminPanel");
const logoutBtn = document.getElementById("logoutBtn");

let esAdmin = false;

// Abrir/Cerrar modal
adminBtn.onclick = () => loginModal.style.display = "block";
closeBtn.onclick = () => loginModal.style.display = "none";
window.onclick = (e) => { if (e.target === loginModal) loginModal.style.display = "none"; };

// 📌 Recuperar sesión al cargar la página
async function verificarSesion() {
  const { data } = await supabase.auth.getSession();
  const user = data?.session?.user;
  if (user) {
    console.log("Sesión activa:", user.email);
    esAdmin = true;
    adminPanel.classList.remove("hidden");
  } else {
    esAdmin = false;
    adminPanel.classList.add("hidden");
  }
  cargarTrabajos();
}

verificarSesion();

// 🔑 LOGIN CON SUPABASE AUTH
loginForm.addEventListener("submit", async (e) => {
  e.preventDefault();
  const email = document.getElementById("email").value;
  const password = document.getElementById("password").value;

  const { data, error } = await supabase.auth.signInWithPassword({ email, password });
  const user = data?.user;

  if (error || !user) {
    alert("Credenciales incorrectas ❌");
    console.error(error);
    return;
  }

  alert("Bienvenido " + user.email + " ✅");
  loginModal.style.display = "none";
  esAdmin = true;
  adminPanel.classList.remove("hidden");
  cargarTrabajos();
});

// 🔒 CERRAR SESIÓN
logoutBtn.addEventListener("click", async () => {
  await supabase.auth.signOut();
  esAdmin = false;
  adminPanel.classList.add("hidden");
  alert("Sesión cerrada");
  cargarTrabajos();
});

// Formularios y lista
const uploadForm = document.getElementById("uploadForm");
const trabajosList = document.getElementById("trabajosList");

// 📂 SUBIR ARCHIVO A SUPABASE STORAGE
uploadForm.addEventListener("submit", async (e) => {
  e.preventDefault();

  // 🔒 Verificar sesión antes de subir archivo
  const { data: sessionData } = await supabase.auth.getSession();
  const user = sessionData?.session?.user;
  if (!user) {
    alert("Debes iniciar sesión antes de subir archivos ❌");
    return;
  }

  const titulo = document.getElementById("titulo").value.trim();
  const curso = document.getElementById("cursoSelect").value;
  const archivoInput = document.getElementById("archivo");

  if (!titulo || !curso || archivoInput.files.length === 0) {
    alert("Debes completar todos los campos y seleccionar un archivo ❌");
    return;
  }

  const archivo = archivoInput.files[0];

  // 🔧 Limpiar nombre del archivo
  let nombreLimpio = archivo.name.normalize("NFD").replace(/[\u0300-\u036f]/g, "");
  nombreLimpio = nombreLimpio.replace(/\s+/g, "_");
  nombreLimpio = nombreLimpio.replace(/[^a-zA-Z0-9._-]/g, "");
  const nombreArchivo = Date.now() + "_" + nombreLimpio;

  // Subir archivo al bucket "trabajos"
  const { data: uploadData, error: uploadError } = await supabase.storage
    .from("trabajos")
    .upload(nombreArchivo, archivo, { cacheControl: "3600", upsert: false });

  if (uploadError) {
    alert("Error al subir archivo: " + uploadError.message);
    console.error(uploadError);
    return;
  }

  // Obtener URL pública
  const { data: urlData } = supabase.storage
    .from("trabajos")
    .getPublicUrl(nombreArchivo);

  // Guardar metadata en tabla "trabajos" SIN enviar fecha
  const { error: insertError } = await supabase.from("trabajos").insert([
    { titulo, curso, archivo: urlData.publicUrl }
  ]);

  if (insertError) {
    alert("Error al guardar en base de datos: " + insertError.message);
    console.error(insertError);
    return;
  }

  alert("Trabajo subido con éxito ✅");
  uploadForm.reset();
  cargarTrabajos();
});

// 📥 CARGAR TRABAJOS DESDE SUPABASE
async function cargarTrabajos(curso = null) {
  const { data: trabajos, error } = await supabase.from("trabajos").select("*").order("fecha", { ascending: false });

  if (error) {
    console.error("Error al cargar trabajos:", error);
    return;
  }

  let lista = trabajos;
  if (curso) lista = trabajos.filter(t => t.curso === curso);

  trabajosList.innerHTML = "";
  lista.forEach((t) => {
    const card = document.createElement("div");
    card.classList.add("trabajo-card");
    card.innerHTML = `
      <h3>${t.titulo}</h3>
      <p><strong>Curso:</strong> ${t.curso}</p>
      <p><strong>Fecha:</strong> ${new Date(t.fecha).toLocaleString()}</p>
      <embed src="${t.archivo}" width="100%" height="150px" type="application/pdf"/>
      <a href="${t.archivo}" download>Descargar</a>
      <button onclick="window.open('${t.archivo}','_blank')">Ver</button>
      ${esAdmin ? `<button onclick="eliminarTrabajo(${t.id})">Eliminar</button>` : ""}
    `;
    trabajosList.appendChild(card);
  });
}

// 🗑️ ELIMINAR TRABAJO
async function eliminarTrabajo(id) {
  if (!confirm("¿Seguro que deseas eliminar este trabajo?")) return;

  const { error } = await supabase.from("trabajos").delete().eq("id", id);

  if (error) {
    alert("Error al eliminar el trabajo ❌");
    console.error(error);
    return;
  }

  cargarTrabajos();
}

// 🎓 FILTRO POR CURSO
document.querySelectorAll(".curso-card").forEach(card => {
  card.addEventListener("click", () => {
    const curso = card.dataset.curso;
    cargarTrabajos(curso);
  });
});

// Mostrar todos al inicio
cargarTrabajos();
