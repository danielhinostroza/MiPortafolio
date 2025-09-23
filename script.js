// 🚀 Configuración de Supabase
const SUPABASE_URL = "https://unmspywowybnleivempq.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVubXNweXdvd3libmxlaXZlbXBxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTgxNTI0NzYsImV4cCI6MjA3MzcyODQ3Nn0.lVDA_rXPqnYbod8CQjZJJUHsuXs8mmJqzzSPIFfI-eU";
const supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// Modal login
const adminBtn = document.getElementById("adminBtn");
const loginModal = document.getElementById("loginModal");
const closeBtn = document.querySelector(".closeBtn");
const loginForm = document.getElementById("loginForm");
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

// Recuperar sesión al cargar la página
(async () => {
  try {
    const { data } = await supabase.auth.getSession();
    const user = data?.session?.user;
    console.log("Session on load:", user);
    if (user) {
      esAdmin = true;
      adminPanel.classList.remove("hidden");
      cargarTrabajos();
    } else {
      esAdmin = false;
      adminPanel.classList.add("hidden");
      cargarTrabajos();
    }
  } catch (err) {
    console.error("Error getSession inicial:", err);
    cargarTrabajos();
  }
})();

// LOGIN
loginForm.addEventListener("submit", async (e) => {
  e.preventDefault();
  const email = document.getElementById("login-email").value;
  const password = document.getElementById("login-password").value;

  try {
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) {
      alert("Credenciales incorrectas ❌");
      console.error("login error:", error);
      return;
    }
    alert("Bienvenido " + data.user.email + " ✅");
    loginModal.style.display = "none";
    adminPanel.classList.remove("hidden");
    esAdmin = true;
    cargarTrabajos();
  } catch (err) {
    console.error("Error en login:", err);
    alert("Error al iniciar sesión");
  }
});

// CERRAR SESIÓN
logoutBtn.addEventListener("click", async () => {
  try {
    await supabase.auth.signOut();
    adminPanel.classList.add("hidden");
    alert("Sesión cerrada");
    esAdmin = false;
    cargarTrabajos();
  } catch (err) {
    console.error("Error al cerrar sesión:", err);
  }
});

// SUBIR ARCHIVO (con user_id)
uploadForm.addEventListener("submit", async (e) => {
  e.preventDefault();

  // 1) Obtener usuario autenticado
  const { data: sessionData } = await supabase.auth.getSession();
  const user = sessionData?.session?.user;
  console.log("Sesion upload - user:", user);
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
  try {
    const { error: uploadError } = await supabase.storage
      .from("trabajos")
      .upload(nombreArchivo, archivo);

    if (uploadError) {
      alert("Error al subir archivo: " + uploadError.message);
      console.error("uploadError:", uploadError);
      return;
    }
  } catch (err) {
    console.error("Excepción upload storage:", err);
    alert("Error al subir el archivo (storage)");
    return;
  }

  // 5) Obtener URL pública
  let publicUrl = nombreArchivo;
  try {
    const { data: urlData, error: urlErr } = await supabase.storage.from("trabajos").getPublicUrl(nombreArchivo);
    if (urlErr) {
      console.warn("getPublicUrl error:", urlErr);
    } else {
      publicUrl = urlData?.publicUrl || nombreArchivo;
    }
  } catch (err) {
    console.warn("Excepción getPublicUrl:", err);
  }

  // 6) Insertar en la tabla incluyendo user_id
  const nuevoRegistro = {
    nombre: titulo,
    curso: curso,
    archivo: publicUrl,
    user_id: user.id  // es string (uuid) normalmente
  };

  console.log("Insertando en trabajos:", nuevoRegistro);

  try {
    const { data: insertData, error: insertError } = await supabase.from("trabajos").insert([nuevoRegistro]);

    if (insertError) {
      // NO BORRAR NADA: solo informar y dejar archivo en storage (según tu requisito)
      alert("Error al guardar en base de datos: " + insertError.message);
      console.error("Insert error:", insertError);
      return;
    }

    console.log("Insert success:", insertData);
    alert("Trabajo subido con éxito ✅");
    uploadForm.reset();
    cargarTrabajos();

  } catch (err) {
    console.error("Excepción insert:", err);
    alert("Error inesperado al guardar en la base de datos");
  }
});

// CARGAR TRABAJOS
async function cargarTrabajos(curso = null) {
  try {
    const { data: trabajos, error } = await supabase.from("trabajos").select("*");
    if (error) {
      console.error("Error al cargar trabajos:", error);
      trabajosList.innerHTML = "<p>Error al cargar trabajos</p>";
      return;
    }

    let lista = trabajos || [];
    if (curso) lista = lista.filter(t => t.curso === curso);

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
  } catch (err) {
    console.error("Excepción cargarTrabajos:", err);
    trabajosList.innerHTML = "<p>Error al cargar trabajos (excepción)</p>";
  }
}

// ELIMINAR TRABAJO
async function eliminarTrabajo(id) {
  if (!confirm("¿Seguro que deseas eliminar este trabajo?")) return;
  try {
    const { error } = await supabase.from("trabajos").delete().eq("id", id);
    if (error) {
      console.error("Error al eliminar:", error);
      alert("Error al eliminar el trabajo ❌");
      return;
    }
    cargarTrabajos();
  } catch (err) {
    console.error("Excepción eliminarTrabajo:", err);
    alert("Error al eliminar (excepción)");
  }
}

// FILTRO POR CURSO
document.querySelectorAll(".curso-card").forEach(card => {
  card.addEventListener("click", () => {
    const curso = card.dataset.curso;
    cargarTrabajos(curso);
  });
});

// Mostrar todos al inicio
cargarTrabajos();

// Cartilla "Sobre mí" (mantengo igual)
document.addEventListener("DOMContentLoaded", () => {
  const sobreMiBtn = document.getElementById("sobreMiBtn");
  const sobreMiCartilla = document.getElementById("sobreMiCartilla");
  const cerrarCartilla = document.getElementById("cerrarCartilla");

  if (sobreMiBtn && sobreMiCartilla && cerrarCartilla) {
    sobreMiBtn.addEventListener("click", (e) => {
      e.preventDefault();
      sobreMiCartilla.classList.remove("hidden");
      sobreMiCartilla.classList.add("show");
    });

    cerrarCartilla.addEventListener("click", () => {
      sobreMiCartilla.classList.remove("show");
      setTimeout(() => {
        sobreMiCartilla.classList.add("hidden");
      }, 400);
    });
  } else {
    console.error("⚠️ No se encontró alguno de los elementos (sobreMiBtn, sobreMiCartilla o cerrarCartilla). Revisa los IDs en tu HTML.");
  }
});
