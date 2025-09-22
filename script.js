// 🚀 Configuración de Supabase
const SUPABASE_URL = "https://unmspywowybnleivempq.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVubXNweXdvd3libmxlaXZlbXBxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTgxNTI0NzYsImV4cCI6MjA3MzcyODQ3Nn0.lVDA_rXPqnYbod8CQjZJJUHsuXs8mmJqzzSPIFfI-eU";
const supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// Modal login
const adminBtn = document.getElementById("adminBtn");
const loginModal = document.getElementById("loginModal");
const closeBtn = document.querySelector(".closeBtn");
const loginForm = document.getElementById("loginForm");
const registerForm = document.getElementById("registerForm");
const adminPanel = document.getElementById("adminPanel");
const logoutBtn = document.getElementById("logoutBtn");

// Modal Sobre mí
const aboutBtn = document.getElementById("aboutBtn");
const aboutModal = document.getElementById("aboutModal");
const closeAbout = document.querySelector(".closeAbout");

// Formularios y lista
const uploadForm = document.getElementById("uploadForm");
const trabajosList = document.getElementById("trabajosList");
let esAdmin = false;

// Abrir/Cerrar modal admin
adminBtn.onclick = () => loginModal.style.display = "block";
closeBtn.onclick = () => loginModal.style.display = "none";
window.onclick = (e) => {
  if (e.target === loginModal) loginModal.style.display = "none";
  if (e.target === aboutModal) aboutModal.style.display = "none";
};

// Abrir/Cerrar modal sobre mí
aboutBtn.onclick = () => aboutModal.style.display = "block";
closeAbout.onclick = () => aboutModal.style.display = "none";

// 📌 Recuperar sesión al cargar la página
supabase.auth.getSession().then(({ data }) => {
  const user = data?.session?.user;
  if (user) {
    esAdmin = true;
    adminPanel.classList.remove("hidden");
    cargarTrabajos();
  }
});

// 🔑 LOGIN
loginForm.addEventListener("submit", async (e) => {
  e.preventDefault();
  const email = document.getElementById("login-email").value;
  const password = document.getElementById("login-password").value;
  const { data, error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) {
    alert("Credenciales incorrectas ❌");
    console.error(error);
    return;
  }
  alert("Bienvenido " + data.user.email + " ✅");
  loginModal.style.display = "none";
  adminPanel.classList.remove("hidden");
  esAdmin = true;
  cargarTrabajos();
});

// 🆕 REGISTRO
registerForm.addEventListener("submit", async (e) => {
  e.preventDefault();
  const email = document.getElementById("register-email").value;
  const password = document.getElementById("register-password").value;
  const { data, error } = await supabase.auth.signUp({ email, password });
  if (error) {
    alert("Error al registrar: " + error.message);
    console.error(error);
    return;
  }
  alert("Administrador registrado ✅ Revisa tu correo para confirmar.");
  registerForm.reset();
});

// 🔒 CERRAR SESIÓN
logoutBtn.addEventListener("click", async () => {
  await supabase.auth.signOut();
  adminPanel.classList.add("hidden");
  alert("Sesión cerrada");
  esAdmin = false;
  cargarTrabajos();
});

// 📂 SUBIR ARCHIVO
uploadForm.addEventListener("submit", async (e) => {
  e.preventDefault();
  const { data: sessionData } = await supabase.auth.getSession();
  const user = sessionData?.session?.user;
  if (!user) {
    alert("Debes iniciar sesión antes de subir archivos ❌");
    return;
  }

  const titulo = document.getElementById("titulo").value.trim();
  const curso = document.getElementById("cursoSelect").value;
  const archivoInput = document.getElementById("archivo");

  if (!titulo) {
    alert("Escribe un título para el trabajo");
    return;
  }
  if (archivoIn
