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
async function uploadFile() {
  const fileInput = document.getElementById("archivo");
  const file = fileInput.files[0];
  const curso = document.getElementById("cursoSelect").value; 
  const titulo = document.getElementById("titulo").value;

  if (!file) {
    alert("Selecciona un archivo primero");
    return;
  }

  if (!titulo) {
    alert("Escribe un título para el trabajo");
    return;
  }

  const filePath = `${curso}/${Date.now()}_${file.name}`;

  const { data, error } = await supabaseClient.storage
    .from("archivos")
    .upload(filePath, file);

  if (error) {
    alert("Error al subir archivo: " + error.message);
    console.error(error);
  } else {
    alert("Archivo subido con éxito 🎉");
    console.log("Archivo:", data);
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

  pdfViewer.innerHTML = ""; 
  pdfContainer.style.display = "none";

  for (let file of data) {
    const { data: urlData } = supabaseClient.storage
      .from("archivos")
      .getPublicUrl(`${curso}/${file.name}`);

    // Obtener fecha desde el timestamp en el nombre
    const timestampPart = file.name.split("_")[0];
    const date = new Date(Number(timestampPart));
    const fechaFormateada = date.toLocaleString();

    const li = document.createElement("li");

    li.innerHTML = `
      <span>📄 ${file.name.split("_").slice(1).join("_")} - <small>${fechaFormateada}</small></span>
      <div>
        <a href="#" class="viewPdfBtn">Ver PDF</a>
        <a href="#" class="downloadPdfBtn">Descargar</a>
        ${adminPanel.style.display === "block" ? `<button class="deleteBtn">Eliminar</button>` : ""}
      </div>
    `;

    // Mostrar PDF en visor
    li.querySelector(".viewPdfBtn").addEventListener("click", (e) => {
      e.preventDefault();
      pdfViewer.innerHTML = `<iframe src="${urlData.publicUrl}" width="100%" height="100%" style="border:none;"></iframe>`;
      pdfContainer.style.display = "block";
    });

    // Descargar archivo correctamente usando fetch + Blob
    li.querySelector(".downloadPdfBtn").addEventListener("click", async (e) => {
      e.preventDefault();
      try {
        const res = await fetch(urlData.publicUrl);
        const blob = await res.blob();
        const link = document.createElement("a");
        link.href = URL.createObjectURL(blob);
        link.download = file.name.split("_").slice(1).join("_"); // descargar con nombre limpio
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      } catch (err) {
        console.error("Error al descargar archivo:", err);
        alert("No se pudo descargar el archivo.");
      }
    });

    // Eliminar archivo
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

adminBtn.addEventListener("click", () => {
  loginModal.style.display = "block";
});

closeBtn.addEventListener("click", () => {
  loginModal.style.display = "none";
});

window.addEventListener("click", (event) => {
  if (event.target === loginModal) {
    loginModal.style.display = "none";
  }
});

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

// ==================== ELIMINAR ARCHIVOS ====================
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

function verPDF(url) {
  pdfViewer.innerHTML = `<iframe src="${url}" width="100%" height="100%"></iframe>`;
  pdfContainer.style.display = "block";  // lo muestra
}

closePdfBtn.addEventListener("click", () => {
  pdfViewer.innerHTML = "";
  pdfContainer.style.display = "none";   // lo oculta
});


// ==================== SOBRE MÍ ====================
const sobreMiBtn = document.getElementById("sobreMiBtn");
const sobreMiCartilla = document.getElementById("sobreMiCartilla");
const cerrarCartilla = document.getElementById("cerrarCartilla");

// Abrir cartilla
sobreMiBtn.addEventListener("click", (e) => {
  e.preventDefault();
  sobreMiCartilla.classList.add("show");
});

// Cerrar cartilla
cerrarCartilla.addEventListener("click", () => {
  sobreMiCartilla.classList.remove("show");
});

// Cerrar con clic fuera (opcional)
window.addEventListener("click", (e) => {
  if (e.target === sobreMiCartilla) {
    sobreMiCartilla.classList.remove("show");
  }
});



// Mostrar / ocultar modal
document.getElementById("btn-add-user").addEventListener("click", () => {
  document.getElementById("add-user-modal").style.display = "block";
});

document.getElementById("cancel-user").addEventListener("click", () => {
  document.getElementById("add-user-modal").style.display = "none";
});

// Crear usuario en Supabase (modo admin con Service Role Key ⚠️)
document.getElementById("create-user").addEventListener("click", async () => {
  const email = document.getElementById("new-user-email").value;
  const password = document.getElementById("new-user-password").value;

  if (!email || !password) {
    alert("Completa todos los campos");
    return;
  }

  // IMPORTANTE: para crear usuarios necesitas usar la SERVICE ROLE KEY
  // NO el anon key
  const supabaseAdmin = window.supabase.createClient(
    "https://unmspywowybnleivempq.supabase.co",
    "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVubXNweXdvd3libmxlaXZlbXBxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTgxNTI0NzYsImV4cCI6MjA3MzcyODQ3Nn0.lVDA_rXPqnYbod8CQjZJJUHsuXs8mmJqzzSPIFfI-eU" // ⚠️ esta key no va en frontend, sino en backend seguro
  );

  const { data, error } = await supabaseAdmin.auth.admin.createUser({
    email,
    password,
    email_confirm: true
  });

  if (error) {
    alert("Error: " + error.message);
  } else {
    alert("Usuario creado con éxito");
    document.getElementById("add-user-modal").style.display = "none";
  }
});
