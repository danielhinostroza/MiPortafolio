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

// Formularios y lista
const uploadForm = document.getElementById("uploadForm");
const trabajosList = document.getElementById("trabajosList");

let esAdmin = false;

// Abrir/Cerrar modal
adminBtn.onclick = () => loginModal.style.display = "block";
closeBtn.onclick = () => loginModal.style.display = "none";
window.onclick = (e) => { if (e.target === loginModal) loginModal.style.display = "none"; };

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


// 📂 SUBIR ARCHIVO (MODIFICADO 🚨 para incluir user_id)
uploadForm.addEventListener("submit", async (e) => {
  e.preventDefault();

  // 1) Obtener usuario autenticado
  const { data: sessionData } = await supabase.auth.getSession();
  const user = sessionData?.session?.user;
  if (!user) {
    alert("Debes iniciar sesión antes de subir archivos ❌");
    return;
  }

  // 2) Obtener campos
  const titulo = document.getElementById("titulo").value.trim();
  const curso = document.getElementById("cursoSelect").value;
  const archivoInput = document.getElementById("archivo");

  if (!titulo) {
    alert("Escribe un título para el trabajo");
    return;
  }
  if (archivoInput.files.length === 0) {
    alert("Selecciona un archivo");
    return;
  }

  const archivo = archivoInput.files[0];

  // 3) Limpiar nombre y hacerlo único
  let nombreLimpio = archivo.name.normalize("NFD").replace(/[\u0300-\u036f]/g, "");
  nombreLimpio = nombreLimpio.replace(/\s+/g, "_").replace(/[^a-zA-Z0-9._-]/g, "");
  const nombreArchivo = Date.now() + "_" + nombreLimpio;

  // 4) Subir a bucket "trabajos"
  const { error: uploadError } = await supabase.storage
    .from("trabajos")
    .upload(nombreArchivo, archivo);

  if (uploadError) {
    alert("Error al subir archivo: " + uploadError.message);
    console.error(uploadError);
    return;
  }

  // 5) Obtener URL pública
  const { data: urlData } = supabase.storage.from("trabajos").getPublicUrl(nombreArchivo);
  const publicUrl = urlData?.publicUrl || nombreArchivo;

  // 6) Insertar en la tabla incluyendo user_id 🔑
  const { error: insertError } = await supabase.from("trabajos").insert([
    {
      nombre: titulo,
      curso: curso,
      archivo: publicUrl,
      user_id: user.id, // 👈 aquí la magia
    },
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


// 📥 CARGAR TRABAJOS
async function cargarTrabajos(curso = null) {
  const { data: trabajos, error } = await supabase.from("trabajos").select("*");
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
      <h3>${t.nombre}</h3>
      <p><strong>Curso:</strong> ${t.curso}</p>
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
  if (confirm("¿Seguro que deseas eliminar este trabajo?")) {
    const { error } = await supabase.from("trabajos").delete().eq("id", id);
    if (error) {
      console.error("Error al eliminar:", error);
      alert("Error al eliminar el trabajo ❌");
      return;
    }
    cargarTrabajos();
  }
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


// 📌 Modal Sobre Mí
const sobreMiBtn = document.getElementById("sobreMiBtn");
const sobreMiModal = document.getElementById("sobreMiModal");
const closeSobreMi = document.querySelector(".closeSobreMi");

sobreMiBtn.onclick = () => sobreMiModal.style.display = "block";
closeSobreMi.onclick = () => sobreMiModal.style.display = "none";
window.onclick = (e) => { if (e.target === sobreMiModal) sobreMiModal.style.display = "none"; };
