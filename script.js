// --- CONFIGURACIÓN SUPABASE ---
const SUPABASE_URL = "https://unmspywowybnleivempq.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...";
const supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// --- FUNCIONES DE UI ---
function mostrarSeccion(id) {
  document.querySelectorAll('.seccion').forEach(sec => sec.style.display = "none");
  document.getElementById(id).style.display = "block";
}

// Abrir panel de una semana
async function abrirSemana(semana) {
  document.getElementById("mainView").style.display = "none";
  document.getElementById("semanaPanel").style.display = "block";

  document.getElementById("tituloSemana").textContent = "📂 " + semana.toUpperCase();
  await mostrarArchivos(semana);
  document.getElementById("semanaPanel").setAttribute("data-semana", semana);
}

// Volver al menú principal
function volverMain() {
  document.getElementById("semanaPanel").style.display = "none";
  document.getElementById("mainView").style.display = "block";
}

// Mostrar archivos en panel de semana
async function mostrarArchivos(semana) {
  const cont = document.getElementById("archivosSemana");
  cont.innerHTML = "<p>Cargando archivos...</p>";

  let { data, error } = await supabase
    .from("archivos")
    .select("*")
    .eq("semana", semana)
    .order("fecha", { ascending: false });

  if (error) {
    cont.innerHTML = `<p style="color:red;">Error cargando archivos</p>`;
    console.error(error);
    return;
  }

  cont.innerHTML = "";
  data.forEach(fileObj => {
    const fileDiv = document.createElement("div");
    fileDiv.classList.add("archivo");
    fileDiv.innerHTML = `
      <p><strong>${fileObj.nombre}</strong></p>
      <p>📅 ${new Date(fileObj.fecha).toLocaleString()}</p>
      <button onclick="verArchivo('${fileObj.url}')">Ver</button>
    `;
    cont.appendChild(fileDiv);
  });
}

// Modal para vista previa
function verArchivo(url) {
  document.getElementById("modal").style.display = "flex";
  document.getElementById("vistaArchivo").src = url;
}

function cerrarModal() {
  document.getElementById("modal").style.display = "none";
  document.getElementById("vistaArchivo").src = "";
}

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

loginForm.addEventListener("submit", (e) => {
  e.preventDefault();
  const user = document.getElementById("username").value;
  const pass = document.getElementById("password").value;

  if (user === "admin" && pass === "1234") {
    loginMessage.textContent = "✅ Login exitoso";
    loginMessage.style.color = "green";
    cerrarLogin();
    adminPanel.style.display = "block";
  } else {
    loginMessage.textContent = "❌ Usuario o contraseña incorrectos";
    loginMessage.style.color = "red";
  }
});

// --- SUBIDA DE ARCHIVOS A SUPABASE ---
const uploadForm = document.getElementById("uploadForm");
uploadForm.addEventListener("submit", async (e) => {
  e.preventDefault();

  const fileInput = document.getElementById("fileInput");
  const semana = document.getElementById("semanaSelect").value;
  const file = fileInput.files[0];

  if (!file) return;

  const filePath = `${semana}/${Date.now()}_${file.name}`;

  // Subir a Supabase Storage
  let { error: uploadError } = await supabase.storage
    .from("archivos") // nombre del bucket
    .upload(filePath, file);

  if (uploadError) {
    alert("❌ Error al subir archivo");
    console.error(uploadError);
    return;
  }

  // Obtener URL pública
  const { data: publicUrl } = supabase.storage
    .from("archivos")
    .getPublicUrl(filePath);

  // Guardar en tabla
  let { error: insertError } = await supabase
    .from("archivos")
    .insert([{
      nombre: file.name,
      semana: semana,
      fecha: new Date().toISOString(),
      url: publicUrl.publicUrl
    }]);

  if (insertError) {
    alert("❌ Error al registrar archivo");
    console.error(insertError);
    return;
  }

  fileInput.value = "";
  alert("✅ Archivo subido a " + semana);
  await mostrarArchivos(semana);
});
