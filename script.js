// 🚀 Configuración de Supabase
const SUPABASE_URL = "https://TU-PROPIO-PROJECT.supabase.co"; 
const SUPABASE_ANON_KEY = "TU-CLAVE-ANON";
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
  const fileInput = document.getElementById("file-input");
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
    fileList.innerHTML = "";

    data.forEach((file) => {
      const li = document.createElement("li");
      li.textContent = file.name;
      fileList.appendChild(li);
    });
  }
}
