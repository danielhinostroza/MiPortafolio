// 🚀 script.js (REEMPLAZA tu script.js por este)
// Usa tu URL y ANON KEY exactamente como las tienes en tu proyecto
const SUPABASE_URL = "https://unmspywowybnleivempq.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVubXNweXdvd3libmxlaXZlbXBxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTgxNTI0NzYsImV4cCI6MjA3MzcyODQ3Nn0.lVDA_rXPqnYbod8CQjZJJUHsuXs8mmJqzzSPIFfI-eU";
const supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

document.addEventListener("DOMContentLoaded", () => {
  // DOM Elements
  const adminBtn = document.getElementById("adminBtn");
  const loginModal = document.getElementById("loginModal");
  const closeBtn = document.querySelector(".closeBtn");
  const loginForm = document.getElementById("loginForm");
  const adminPanel = document.getElementById("adminPanel");
  const logoutBtn = document.getElementById("logoutBtn");
  const uploadForm = document.getElementById("uploadForm");
  const trabajosList = document.getElementById("trabajosList");

  if (!uploadForm) console.error("No se encontró #uploadForm en el DOM");
  if (!trabajosList) console.error("No se encontró #trabajosList en el DOM");

  let esAdmin = false;

  // Modal handlers (si existen)
  if (adminBtn) adminBtn.onclick = () => loginModal && (loginModal.style.display = "block");
  if (closeBtn) closeBtn.onclick = () => loginModal && (loginModal.style.display = "none");
  window.onclick = (e) => { if (e.target === loginModal) loginModal.style.display = "none"; };

  // Recuperar sesión al iniciar
  (async function initSession() {
    try {
      const { data } = await supabase.auth.getSession();
      const user = data?.session?.user;
      if (user) {
        console.log("Sesión activa al cargar:", user.email);
        esAdmin = true;
        adminPanel && adminPanel.classList.remove("hidden");
      } else {
        console.log("No hay sesión activa al cargar.");
      }
      // Cargar trabajos (aunque no haya sesión, SELECT es público)
      cargarTrabajos();
    } catch (err) {
      console.error("initSession error:", err);
    }
  })();

  // LOGIN
  if (loginForm) {
    loginForm.addEventListener("submit", async (e) => {
      e.preventDefault();
      try {
        const email = document.getElementById("email").value;
        const password = document.getElementById("password").value;
        console.log("Intentando login con", email);
        const { data, error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) {
          console.error("Login error:", error);
          alert("Credenciales incorrectas ❌\n" + error.message);
          return;
        }
        const user = data?.user;
        if (!user) {
          alert("No se pudo iniciar sesión.");
          return;
        }
        console.log("Login OK:", user.email);
        alert("Bienvenido " + user.email + " ✅");
        loginModal && (loginModal.style.display = "none");
        adminPanel && adminPanel.classList.remove("hidden");
        esAdmin = true;
        cargarTrabajos();
      } catch (err) {
        console.error("Login exception:", err);
        alert("Error al iniciar sesión. Revisa la consola.");
      }
    });
  }

  // LOGOUT
  if (logoutBtn) {
    logoutBtn.addEventListener("click", async () => {
      try {
        await supabase.auth.signOut();
        adminPanel && adminPanel.classList.add("hidden");
        esAdmin = false;
        alert("Sesión cerrada");
        cargarTrabajos();
      } catch (err) {
        console.error("Logout error:", err);
        alert("Error al cerrar sesión");
      }
    });
  }

  // SUBIDA: event listener robusto con logs
  if (uploadForm) {
    uploadForm.addEventListener("submit", async (e) => {
      e.preventDefault();
      console.log("Evento submit disparado: uploadForm");

      try {
        // Verificar sesión
        const { data: sessionData } = await supabase.auth.getSession();
        const user = sessionData?.session?.user;
        console.log("Usuario en sesión:", user?.email ?? "no hay sesión");
        if (!user) {
          alert("Debes iniciar sesión antes de subir archivos ❌");
          return;
        }

        const nombre = document.getElementById("nombre")?.value?.trim();
        const curso = document.getElementById("cursoSelect")?.value;
        const archivoInput = document.getElementById("archivo");

        if (!nombre) {
          alert("Escribe un título para el trabajo");
          return;
        }
        if (!archivoInput || archivoInput.files.length === 0) {
          alert("Selecciona un archivo primero");
          return;
        }

        const archivo = archivoInput.files[0];
        console.log("Archivo seleccionado:", archivo.name, archivo.type, archivo.size);

        // Generar nombre único
        const safeName = archivo.name.normalize("NFD").replace(/[\u0300-\u036f]/g, "");
        const nombreArchivo = `${Date.now()}_${safeName.replace(/\s+/g, "_").replace(/[^a-zA-Z0-9._-]/g, "")}`;
        console.log("Nombre en storage:", nombreArchivo);

        // Intento de subir (primero upsert: false). Si falla por conflicto, reintentar con upsert true.
        let uploadResp = null;
        let uploadError = null;

        uploadResp = await supabase.storage.from("trabajos").upload(nombreArchivo, archivo, { cacheControl: "3600", upsert: false });
        uploadError = uploadResp.error;
        console.log("Respuesta upload (primer intento):", uploadResp);

        if (uploadError) {
          console.warn("Upload error (primer intento):", uploadError);
          // Si es conflicto (archivo existe), reintentar con upsert: true
          if (uploadError?.status === 409 || /already exists/i.test(uploadError?.message || "")) {
            console.log("Archivo existe. Reintentando con upsert:true");
            const second = await supabase.storage.from("trabajos").upload(nombreArchivo, archivo, { cacheControl: "3600", upsert: true });
            uploadError = second.error;
            uploadResp = second;
            console.log("Respuesta upload (segundo intento):", second);
          }
        }

        if (uploadError) {
          console.error("Error final al subir archivo:", uploadError);
          alert("Error al subir archivo: " + (uploadError.message || JSON.stringify(uploadError)));
          return;
        }

        // Obtener URL pública (getPublicUrl es síncrono)
        const { data: publicData, error: publicError } = supabase.storage.from("trabajos").getPublicUrl(nombreArchivo);
        if (publicError) {
          console.error("getPublicUrl error:", publicError);
          alert("No se pudo obtener la URL pública del archivo");
          return;
        }
        const publicUrl = publicData?.publicUrl ?? publicData?.public_url ?? null;
        console.log("publicUrl:", publicUrl);
        if (!publicUrl) {
          alert("No se obtuvo URL pública. Revisa consola.");
          return;
        }

        // Insertar metadata en la tabla
        const { data: insertData, error: insertError } = await supabase
          .from("trabajos")
          .insert([{ nombre, curso, archivo: publicUrl }]);

        if (insertError) {
          console.error("Error insert en tabla:", insertError);
          alert("Error al guardar en la base de datos: " + insertError.message);
          return;
        }

        console.log("Insert OK:", insertData);
        alert("Archivo subido con éxito ✅");
        uploadForm.reset();
        cargarTrabajos();
      } catch (err) {
        console.error("Exception en submit upload:", err);
        alert("Error inesperado. Revisa la consola del navegador.");
      }
    });
  } else {
    console.warn("#uploadForm no encontrado — revisa tu HTML");
  }

  // CARGAR TRABAJOS
  async function cargarTrabajos(curso = null) {
    try {
      console.log("Cargando trabajos desde la tabla...");
      const { data: trabajos, error } = await supabase
        .from("trabajos")
        .select("*")
        .order("id", { ascending: false });

      if (error) {
        console.error("Error cargando trabajos:", error);
        trabajosList.innerHTML = "<p>Error cargando trabajos (ver consola)</p>";
        return;
      }

      let lista = trabajos ?? [];
      if (curso) lista = lista.filter(t => t.curso === curso);

      trabajosList.innerHTML = "";
      lista.forEach(t => {
        const card = document.createElement("div");
        card.classList.add("trabajo-card");
        card.innerHTML = `
          <h3>${escapeHtml(t.nombre)}</h3>
          <p><strong>Curso:</strong> ${escapeHtml(t.curso)}</p>
          <p><strong>Fecha:</strong> ${t.fecha ?? ''}</p>
          <div class="media-wrap">
            <a href="${t.archivo}" target="_blank">Abrir / Descargar</a>
          </div>
          ${esAdmin ? `<button onclick="eliminarTrabajo(${t.id})">Eliminar</button>` : ""}
        `;
        trabajosList.appendChild(card);
      });
    } catch (err) {
      console.error("Exception cargarTrabajos:", err);
    }
  }

  // ELIMINAR
  window.eliminarTrabajo = async (id) => {
    if (!confirm("¿Seguro que deseas eliminar este trabajo?")) return;
    try {
      const { error } = await supabase.from("trabajos").delete().eq("id", id);
      if (error) {
        console.error("Error eliminando:", error);
        alert("Error al eliminar (ver consola)");
        return;
      }
      cargarTrabajos();
    } catch (err) {
      console.error("Exception eliminarTrabajo:", err);
    }
  };

  // Util
  function escapeHtml(str = "") {
    return String(str).replace(/[&<>"']/g, s => ({ '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;' }[s]));
  }

  // Filtro por curso
  document.querySelectorAll(".curso-card").forEach(card => {
    card.addEventListener("click", () => {
      const curso = card.dataset.curso;
      cargarTrabajos(curso);
    });
  });

  // catch promises uncaught
  window.addEventListener("unhandledrejection", (ev) => {
    console.error("Unhandled rejection:", ev.reason);
  });
});
