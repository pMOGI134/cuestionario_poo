"use strict";


const SUPABASE_URL = "https://lcusxdimfjjdycqvkpeo.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxjdXN4ZGltZmpqZHljcXZrcGVvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTI1NzIxMDIsImV4cCI6MjEwODE0ODEwMn0.mmWwkUGvt_eoEjAzcifLdVLKQ-LfvRV0nq9oJTFK09w";

const sb =
  window.supabase && SUPABASE_URL.startsWith("https://")
    ? window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
        auth: {
          persistSession: true,
          autoRefreshToken: true,
          detectSessionInUrl: true,
        },
      })
    : null;

const $$ = (id) => document.getElementById(id);

async function usuarioActual() {
  if (!sb) return null;
  try {
    const { data } = await sb.auth.getSession();
    return data.session ? data.session.user : null;
  } catch (e) {
    return null;
  }
}

/* Guarda un intento. Devuelve {ok, motivo}. Nunca lanza:
   la app sigue funcionando aunque no haya red o Supabase esté pausado. */
async function guardarIntentoRemoto({ asignatura, testId, aciertos, total, nota, falladas }) {
  try {
    const user = await usuarioActual();
    if (!user) return { ok: false, motivo: "sin-sesion" };
    const { error } = await sb.from("intentos").insert({
      usuario_id: user.id,
      asignatura,
      test_id: testId,
      aciertos,
      total,
      nota: Math.round(nota * 100) / 100,
      preguntas_falladas: falladas,
    });
    return error ? { ok: false, motivo: "error" } : { ok: true };
  } catch (e) {
    return { ok: false, motivo: "error" };
  }
}

/* Datos y resultados del usuario en su perfil */
async function pintarDatosPerfilCuenta(user) {
  const estado = $$("estado-perfil-cuenta");
  const resumen = $$("resumen-perfil");
  const recientes = $$("tests-recientes");
  const tituloRecientes = $$("titulo-tests-recientes");
  if (!user) {
    estado.textContent = "Inicia sesión para consultar tus datos guardados.";
    return;
  }
  const intentos = [];
  const tamanoPagina = 1000;
  try {
    for (let desde = 0; ; desde += tamanoPagina) {
      const { data, error } = await sb
        .from("intentos")
        .select("asignatura, test_id, nota, aciertos, total, creado_en")
        .eq("usuario_id", user.id)
        .order("creado_en", { ascending: false })
        .range(desde, desde + tamanoPagina - 1);
      if (error) throw error;
      if (!Array.isArray(data)) throw new Error("La respuesta de intentos no es válida.");
      intentos.push(...data);
      if (data.length < tamanoPagina) break;
    }

    estado.textContent = "";
    if (!intentos.length) {
      estado.textContent = "Todavía no tienes tests guardados en tu cuenta.";
      return;
    }

    const notas = intentos.map((intento) => Number(intento.nota));
    if (notas.some((nota) => !Number.isFinite(nota))) {
      throw new Error("Hay notas guardadas con un formato no válido.");
    }
    const media = notas.reduce((suma, nota) => suma + nota, 0) / notas.length;
    const mejor = Math.max(...notas);
    resumen.innerHTML = "";
    [
      [String(intentos.length), "tests realizados"],
      [media.toLocaleString("es-ES", { minimumFractionDigits: 2, maximumFractionDigits: 2 }), "nota media"],
      [mejor.toLocaleString("es-ES", { minimumFractionDigits: 2, maximumFractionDigits: 2 }), "mejor nota"],
    ].forEach(([valor, etiqueta]) => {
      const dato = document.createElement("div");
      dato.className = "dato";
      const numero = document.createElement("span");
      numero.className = "valor";
      numero.textContent = valor;
      const nombre = document.createElement("span");
      nombre.className = "etiqueta";
      nombre.textContent = etiqueta;
      dato.append(numero, nombre);
      resumen.append(dato);
    });
    resumen.hidden = false;

    const nombresAsignatura = {
      poo: "POO",
      aic: "AIC",
      "bases-datos": "Bases de datos",
      "fundamentos-web": "Fundamentos web",
    };
    const nombresTest = {
      "temas-1-3": "Test Tema 1-3",
      "temas-4-6": "TEMAS 4,5,6",
      "tema-1": "Test Tema 1",
      relacional: "Bases de datos relacionales",
      "javascript-node": "JavaScript y Node.js",
      "bases-datos-mongodb": "Bases de datos y MongoDB",
    };
    recientes.innerHTML = "";
    intentos.forEach((intento) => {
      const fila = document.createElement("article");
      fila.className = "intento-reciente";
      const descripcion = document.createElement("div");
      const nombre = document.createElement("strong");
      nombre.textContent = `${nombresAsignatura[intento.asignatura] || intento.asignatura} · ${nombresTest[intento.test_id] || intento.test_id}`;
      const detalle = document.createElement("span");
      detalle.className = "etiquetas-intento";
      const fecha = intento.creado_en && !Number.isNaN(new Date(intento.creado_en).getTime())
        ? new Date(intento.creado_en).toLocaleString("es-ES")
        : "Fecha no disponible";
      detalle.textContent = `${intento.aciertos}/${intento.total} aciertos · ${fecha}`;
      descripcion.append(nombre, detalle);
      const nota = document.createElement("span");
      nota.className = "nota-intento";
      nota.textContent = `${Number(intento.nota).toLocaleString("es-ES", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}/10`;
      fila.append(descripcion, nota);
      recientes.append(fila);
    });
    tituloRecientes.hidden = false;
  } catch (error) {
    console.error("No se pudieron cargar los datos del perfil.", error);
    estado.textContent = "No se pudieron cargar tus datos. Inténtalo de nuevo más tarde.";
  }
}

/* Estado de sesión y formulario */
async function pintarSesion() {
  const user = await usuarioActual();
  $$("auth-formulario").hidden = !!user || !sb;
  $$("btn-invitado").hidden = !!user;
  $$("auth-sesion").hidden = !user;
  $$("auth-aviso").hidden = !!sb;
  if (!sb) $$("auth-aviso").textContent = "El inicio de sesion no esta configurado. Puedes acceder como invitado.";
  if (user) {
    $$("auth-nombre").textContent = (user.user_metadata && user.user_metadata.nombre) || user.email;
  }
  document.dispatchEvent(new CustomEvent("sesion-actualizada", { detail: { user } }));
}

async function cerrarSesion() {
  if (!sb) return;
  await sb.auth.signOut();
  await pintarSesion();
}

function mensajeAuth(texto) {
  $$("auth-mensaje").textContent = texto;
}

function traducirError(error) {
  const m = (error.message || "").toLowerCase();
  if (m.includes("invalid login")) return "Email o contraseña incorrectos.";
  if (m.includes("already registered")) return "Ese email ya tiene cuenta.";
  if (m.includes("email not confirmed")) return "Confirma tu email desde el enlace que te hemos enviado.";
  if (m.includes("password")) return "La contraseña debe tener al menos 8 caracteres.";
  return "No se pudo completar la operación. Inténtalo de nuevo.";
}

async function accionAuth(registrar) {
  const email = $$("auth-email").value.trim();
  const password = $$("auth-password").value;
  const nombre = $$("auth-usuario").value.trim();
  if (!email || password.length < 8) {
    return mensajeAuth("Escribe un email y una contraseña de 8 caracteres o más.");
  }
  if (registrar && !nombre) {
    return mensajeAuth("Escribe un nombre de usuario.");
  }
  mensajeAuth("Un momento…");
  try {
    const { data, error } = registrar
      ? await sb.auth.signUp({ email, password, options: { data: { nombre } } })
      : await sb.auth.signInWithPassword({ email, password });
    if (error) return mensajeAuth(traducirError(error));
    if (registrar && !data.session) {
      return mensajeAuth("Cuenta creada. Revisa tu email para confirmarla y luego entra.");
    }
    mensajeAuth("");
    $$("auth-password").value = "";
    pintarSesion();
  } catch (e) {
    mensajeAuth("No hay conexión con el servidor. Inténtalo más tarde.");
  }
}

if (sb) {
  $$("btn-entrar").addEventListener("click", () => accionAuth(false));
  $$("btn-registrar").addEventListener("click", () => accionAuth(true));
  $$("btn-salir").addEventListener("click", cerrarSesion);
  sb.auth.onAuthStateChange((evento) => {
    if (["INITIAL_SESSION", "SIGNED_IN", "SIGNED_OUT", "TOKEN_REFRESHED"].includes(evento)) {
      window.setTimeout(() => pintarSesion(), 0);
    }
  });
}

function iniciarPintadoSesion() {
  pintarSesion();
}

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", iniciarPintadoSesion, { once: true });
} else {
  iniciarPintadoSesion();
}
