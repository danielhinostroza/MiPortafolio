// Conexión Supabase
const SUPABASE_URL = "https://unmspywowybnleivempq.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVubXNweXdvd3libmxlaXZlbXBxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTgxNTI0NzYsImV4cCI6MjA3MzcyODQ3Nn0.lVDA_rXPqnYbod8CQjZJJUHsuXs8mmJqzzSPIFfI-eU";
const supabase = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// Botón admin
document.getElementById("adminBtn").addEventListener("click", abrirLogin);

const loginModal = document.getElementById("loginModal");
const loginForm = document.getElementById("loginForm");
const loginMessage = document.getElementById("loginMessage");
const adminPanel = document.getElementById("adminPanel");

function abrirLogin() {
  loginModal.style.display = "flex";
}
function cerrarLogin() {
  loginModal.style.display = "none";
}

// Login
loginForm.addEventListener("submit", async (e) => {
  e.preventDefault();
  const email = document.getElementById("username").value;
  const password = document.getElementById("password").value;

  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password
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
  }, 500);
});

// Subir archivos
const uploadForm = document.getElementById("uploadForm");
const uploadMessage = document.getElementById("uploadMessage");

uploadForm.addEventListener("submit", async (e) => {
  e.preventDefault();
  const file = document.getElementById("fileInput").files[0];
  const nombre = document.getElementById("titulo").value;
  const semana = "Semana X"; // Puedes cambiarlo dinámicamente si quieres

  if (!file) return alert("Selecciona un archivo");

  const filePath = `${Date.now()}-${file.name}`;

  const { error } = await supabase.storage.from("archivos").upload(filePath, file);
  if (error) {
    uploadMessage.textContent = "❌ Error al subir: " + error.message;
    uploadMessage.style.color = "red";
    return;
  }

  const { data: publicUrlData } = supabase.storage.from("archivos").getPublicUrl(filePath);

  await supabase.from("archivos").insert([
    { nombre, semana, url: publicUrlData.publicUrl }
  ]);

  uploadMessage.textContent = "✅ Archivo subido con éxito";
  uploadMessage.style.color = "green";

  mostrarArchivos();
});

// Mostrar archivos con semanas
async function mostrarArchivos() {
  const { data, error } = await supabase.from("archivos").select("*").order('fecha', { ascending: false });
  const lista = document.getElementById("trabajosList");
  lista.innerHTML = "";

  if (error) {
    lista.innerHTML = "<p>Error al cargar archivos</p>";
    return;
  }

  data.forEach(t => {
    lista.innerHTML += `
      <div class="trabajo-card">
        <h3>${t.nombre}</h3>
        <p><strong>${t.semana}</strong></p>
        <p>${new Date(t.fecha).toLocaleString()}</p>
        <a href="${t.url}" target="_blank">📂 Ver archivo</a>
      </div>
    `;
  });
}

mostrarArchivos();
