// 🚀 Conexión con Supabase
const SUPABASE_URL = "https://unmspywowybnleivempq.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVubXNweXdvd3libmxlaXZlbXBxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTgxNTI0NzYsImV4cCI6MjA3MzcyODQ3Nn0.lVDA_rXPqnYbod8CQjZJJUHsuXs8mmJqzzSPIFfI-eU";
const supabase = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// Botón admin abre modal
document.getElementById("adminBtn").addEventListener("click", abrirLogin);

// --- LOGIN ---
const loginModal = document.getElementById("loginModal");
function abrirLogin() {
  loginModal.style.display = "flex";
}
function cerrarLogin() {
  loginModal.style.display = "none";
}

const loginForm = document.getElementById("loginForm");
const loginMessage = document.getElementById("loginMessage");
const adminPanel = document.getElementById("adminPanel");

loginForm.addEventListener("submit", async (e) => {
  e.preventDefault();
  const email = document.getElementById("username").value;
  const password = document.getElementById("password").value;

  const { data, error } = await supabase.auth.signInWithPassword({
    email: email,
    password: password
  });

  if (error) {
    loginMessage.textContent = "❌ " + error.message;
    loginMessage.style.color = "red";
    return;
  }

  loginMessage.textContent = "✅ Login exitoso";
  loginMessage.style.color = "green";

  setTimeout(() => {
    cerrarLogin();
    adminPanel.style.display = "block";
  }, 1000);
});

// --- SUBIR ARCHIVOS ---
const uploadForm = document.getElementById("uploadForm");
const uploadMessage = document.getElementById("uploadMessage");

uploadForm.addEventListener("submit", async (e) => {
  e.preventDefault();
  const file = document.getElementById("fileInput").files[0];
  const titulo = document.getElementById("titulo").value;

  if (!file) return alert("Selecciona un archivo");

  const filePath = `${Date.now()}-${file.name}`;

  let { error } = await supabase.storage.from("trabajos").upload(filePath, file);
  if (error) {
    uploadMessage.textContent = "❌ Error al subir: " + error.message;
    uploadMessage.style.color = "red";
    return;
  }

  const { data: publicUrlData } = supabase.storage.from("trabajos").getPublicUrl(filePath);

  // Guardar referencia en la BD
  await supabase.from("trabajos").insert([
    { titulo: titulo, archivo_url: publicUrlData.publicUrl }
  ]);

  uploadMessage.textContent = "✅ Archivo subido con éxito";
  uploadMessage.style.color = "green";

  mostrarTrabajos();
});

// --- MOSTRAR TRABAJOS ---
async function mostrarTrabajos() {
  const { data, error } = await supabase.from("trabajos").select("*");
  const lista = document.getElementById("trabajosList");
  lista.innerHTML = "";

  if (error) {
    lista.innerHTML = "<p>Error al cargar trabajos</p>";
    return;
  }

  data.forEach(t => {
    lista.innerHTML += `
      <div class="trabajo-card">
        <h3>${t.titulo}</h3>
        <a href="${t.archivo_url}" target="_blank">📂 Ver archivo</a>
      </div>
    `;
  });
}

mostrarTrabajos();
