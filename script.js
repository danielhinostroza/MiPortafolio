// 🚀 Inicializar Supabase
const supabase = window.supabase.createClient(
  "https://fbyjhfzzkkwzvscxuqrf.supabase.co", // tu URL
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..." // tu anon key
);

// === ELEMENTOS ===
const adminBtn = document.getElementById("adminBtn");
const loginModal = document.getElementById("loginModal");
const closeBtn = document.querySelector(".closeBtn");
const loginForm = document.getElementById("loginForm");
const adminPanel = document.getElementById("adminPanel");
const logoutBtn = document.getElementById("logoutBtn");
const uploadForm = document.getElementById("uploadForm");

// === Abrir modal de login ===
adminBtn.addEventListener("click", () => {
  loginModal.style.display = "block";
});

// === Cerrar modal ===
closeBtn.addEventListener("click", () => {
  loginModal.style.display = "none";
});

// === LOGIN ===
loginForm.addEventListener("submit", async (e) => {
  e.preventDefault();

  const email = document.getElementById("login-email").value.trim();
  const password = document.getElementById("login-password").value.trim();

  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error) {
    alert("❌ Credenciales incorrectas. Intenta de nuevo.");
    console.error(error.message);
    return;
  }

  // ✅ Login correcto
  alert("Bienvenido administrador 🎉");
  loginModal.style.display = "none";
  adminPanel.classList.remove("hidden");
});

// === LOGOUT ===
logoutBtn.addEventListener("click", async () => {
  await supabase.auth.signOut();
  adminPanel.classList.add("hidden");
  alert("Sesión cerrada correctamente ✅");
});

// === SUBIR ARCHIVO ===
uploadForm.addEventListener("submit", async (e) => {
  e.preventDefault();

  const titulo = document.getElementById("titulo").value.trim();
  const curso = document.getElementById("cursoSelect").value;
  const archivoInput = document.getElementById("archivo");
  const file = archivoInput.files[0];

  if (!file) {
    alert("Selecciona un archivo");
    return;
  }

  // Subir a bucket "trabajos"
  const { data: uploadData, error: uploadError } = await supabase.storage
    .from("trabajos")
    .upload(`docs/${Date.now()}_${file.name}`, file);

  if (uploadError) {
    alert("❌ Error al subir archivo");
    console.error(uploadError);
    return;
  }

  const urlPublica = `https://fbyjhfzzkkwzvscxuqrf.supabase.co/storage/v1/object/public/trabajos/${uploadData.path}`;

  // Guardar en tabla
  const { error: insertError } = await supabase
    .from("trabajos")
    .insert([{ nombre: titulo, curso, archivo: urlPublica }]);

  if (insertError) {
    alert("❌ Error al guardar en la base de datos");
    console.error(insertError);
    return;
  }

  alert("✅ Archivo subido correctamente");
  uploadForm.reset();
});
