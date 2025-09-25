// 🚀 Configuración de Supabase
const SUPABASE_URL = "https://unmspywowybnleivempq.supabase.co"; 
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVubXNweXdvd3libmxlaXZlbXBxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTgxNTI0NzYsImV4cCI6MjA3MzcyODQ3Nn0.lVDA_rXPqnYbod8CQjZJJUHsuXs8mmJqzzSPIFfI-eU";
const supabaseClient = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// ==================== AUTENTICACIÓN ====================
// Login
async function login() {
  const email = document.getElementById("login-email").value;
  const password = document.getElementById("login-password").value;

  const { data, error } = await supabaseClient.auth.signInWithPassword({
    email,
    password,
  });

  if (error) {
    alert("Error al iniciar sesión: " + error.message);
  } else {
    alert("Login correcto");
    console.log("Usuario:", data.user);
  }
}

// Logout
async function logout() {
  const { error } = await supabaseClient.auth.signOut();
  if (error) {
    alert("Error al cerrar sesión: " + error.message);
  } else {
    alert("Sesión cerrada");
  }
}

// ==================== SUBIDA DE ARCHIVOS ====================
// Subir archivo al bucket
async function uploadFile() {
  const fileInput = document.getElementById("archivo"); // 🔥 corregido: antes estaba "file-input"
  const file = fileInput.files[0];

  if (!file) {
    alert("Selecciona un archivo primero");
    return;
  }

  // 🚨 Nombre único para evitar sobreescrituras
  const fileName = `${Date.now()}_${file.name}`;

  // Subida al bucket "archivos"
  const { data, error } = await supabaseClient.storage
    .from("archivos")
    .upload(fileName, file);

  if (error) {
    alert("Error al subir archivo: " + error.message);
    console.error(error);
  } else {
    alert("Archivo subido con éxito 🎉");
    console.log("Archivo:", data);
  }
}

// ==================== LISTAR ARCHIVOS ====================
async function listFiles() {
  const { data, error } = await supabaseClient.storage
    .from("archivos")
    .list("", { limit: 50 });

  if (error) {
    alert("Error al listar archivos: " + error.message);
  } else {
    const fileList = document.getElementById("file-list");
    if (fileList) {
      fileList.innerHTML = "";

      data.forEach((file) => {
        const li = document.createElement("li");
        li.textContent = file.name;
        fileList.appendChild(li);
      });
    }
  }
}

// ==================== MODAL ADMIN ====================
const adminBtn = document.getElementById("adminBtn");
const loginModal = document.getElementById("loginModal");
const closeBtn = document.querySelector(".closeBtn");
const adminPanel = document.getElementById("adminPanel");

// Abrir modal al hacer click en "Administrador"
adminBtn.addEventListener("click", () => {
  loginModal.style.display = "block";
});

// Cerrar modal con la X
closeBtn.addEventListener("click", () => {
  loginModal.style.display = "none";
});

// Cerrar modal si el usuario hace click fuera del contenido
window.addEventListener("click", (event) => {
  if (event.target === loginModal) {
    loginModal.style.display = "none";
  }
});

// Manejar formulario de login
document.getElementById("loginForm").addEventListener("submit", async (e) => {
  e.preventDefault();
  const email = document.getElementById("login-email").value;
  const password = document.getElementById("login-password").value;

  const { data, error } = await supabaseClient.auth.signInWithPassword({
    email,
    password,
  });

  if (error) {
    alert("Error al iniciar sesión: " + error.message);
  } else {
    alert("Login correcto ✅");

    // 🚀 Mostrar panel de admin y ocultar modal
    loginModal.style.display = "none";
    adminPanel.style.display = "block";
  }
});

// ==================== FORMULARIO DE SUBIDA ====================
// 🚀 IMPORTANTE: prevenir que el submit recargue la página
const uploadForm = document.getElementById("uploadForm");
if (uploadForm) {
  uploadForm.addEventListener("submit", async (e) => {
    e.preventDefault();
    await uploadFile();
  });
}
