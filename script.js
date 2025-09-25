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
  const fileInput = document.getElementById("archivo");
  const file = fileInput.files[0];
  const curso = document.getElementById("cursoSelect").value; // 🔥 semana/carpeta
  const titulo = document.getElementById("titulo").value;

  if (!file) {
    alert("Selecciona un archivo primero");
    return;
  }

  if (!titulo) {
    alert("Escribe un título para el trabajo");
    return;
  }

  // 🚨 Nombre único: curso + timestamp + nombre
  const filePath = `${curso}/${Date.now()}_${file.name}`;

  // Subida al bucket "archivos"
  const { data, error } = await supabaseClient.storage
    .from("archivos")
    .upload(filePath, file);

  if (error) {
    alert("Error al subir archivo: " + error.message);
    console.error(error);
  } else {
    alert("Archivo subido con éxito 🎉");
    console.log("Archivo:", data);

    // 🚀 Refrescar la lista en la web automáticamente
    await listFiles(curso);
  }
}

// ==================== LISTAR ARCHIVOS ====================
async function listFiles(curso) {
  const { data, error } = await supabaseClient.storage
    .from("archivos")
    .list(curso, { limit: 50 });

  const fileList = document.getElementById("file-list");
  fileList.innerHTML = "";

  if (error) {
    fileList.innerHTML = "<li>Error al listar archivos</li>";
    console.error(error);
    return;
  }

  if (!data || data.length === 0) {
    fileList.innerHTML = "<li>No hay archivos en esta semana</li>";
    return;
  }

  const pdfContainer = document.getElementById("pdf-container");
  const pdfViewer = document.getElementById("pdf-viewer");
  pdfViewer.innerHTML = ""; 
  pdfContainer.style.display = "none"; // Oculto si no hay PDF abierto

  for (let file of data) {
    // ✅ Obtener URL pública
    const { data: urlData } = supabaseClient.storage
      .from("archivos")
      .getPublicUrl(`${curso}/${file.name}`);

    const li = document.createElement("li");

    li.innerHTML = `
      <span>📄 ${file.name}</span>
      <div>
        <a href="#" class="viewPdfBtn">Ver PDF</a>
        <a href="${urlData.publicUrl}" download>Descargar</a>
        ${adminPanel.style.display === "block" ? `<button class="deleteBtn">Eliminar</button>` : ""}
      </div>
    `;

    // Evento para mostrar PDF en el contenedor
    li.querySelector(".viewPdfBtn").addEventListener("click", (e) => {
      e.preventDefault();
      pdfViewer.innerHTML = `<iframe src="${urlData.publicUrl}" width="100%" height="100%" style="border:none;"></iframe>`;
      pdfContainer.style.display = "block";
    });

    // Evento para eliminar archivo
    if (adminPanel.style.display === "block") {
      li.querySelector(".deleteBtn").addEventListener("click", () => {
        deleteFile(`${curso}/${file.name}`);
      });
    }

    fileList.appendChild(li);
  }
}

// ==================== CLIC EN TARJETAS DE SEMANA ====================
const cursoCards = document.querySelectorAll(".curso-card");
cursoCards.forEach(card => {
  card.addEventListener("click", async () => {
    const curso = card.dataset.curso;
    await listFiles(curso);
  });
});

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
    loginModal.style.display = "none";
    adminPanel.style.display = "block";
  }
});

// ==================== FORMULARIO DE SUBIDA ====================
const uploadForm = document.getElementById("uploadForm");
if (uploadForm) {
  uploadForm.addEventListener("submit", async (e) => {
    e.preventDefault();
    await uploadFile();
  });
}

// ==================== ELIMINAR ARCHIVOS CORRECTO ====================
async function deleteFile(filePath) {
  const confirmDelete = confirm(`¿Seguro quieres eliminar "${filePath}"?`);
  if (!confirmDelete) return;

  try {
    const { error: storageError } = await supabaseClient.storage
      .from("archivos")
      .remove([filePath]);

    if (storageError) {
      alert("Error al eliminar el archivo del storage: " + storageError.message);
      console.error(storageError);
      return;
    }

    const { error: dbError } = await supabaseClient
      .from("trabajos")
      .delete()
      .eq("archivo_url", filePath);

    if (dbError) {
      alert("Error al eliminar el registro en la base de datos: " + dbError.message);
      console.error(dbError);
      return;
    }

    alert("Archivo eliminado con éxito ✅");
    const semana = filePath.split("/")[0];
    await listFiles(semana);

  } catch (err) {
    console.error(err);
    alert("Ocurrió un error al eliminar el archivo");
  }
}

// ==================== VISTA PREVIA PDF ====================
const pdfContainer = document.getElementById("pdf-container");
const pdfViewer = document.getElementById("pdf-viewer");
const closePdfBtn = document.getElementById("closePdfBtn");

closePdfBtn.addEventListener("click", () => {
  pdfViewer.innerHTML = "";
  pdfContainer.style.display = "none";
});
