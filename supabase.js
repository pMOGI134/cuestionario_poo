"use strict";


const SUPABASE_URL = "https://lcusxdimfjjdycqvkpeo.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxjdXN4ZGltZmpqZHljcXZrcGVvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTI1NzIxMDIsImV4cCI6MjEwODE0ODEwMn0.mmWwkUGvt_eoEjAzcifLdVLKQ-LfvRV0nq9oJTFK09w";

// Cuando añadas más asignaturas/tests, estas dos constantes serán dinámicas.
const ASIGNATURA = "poo";
const TEST_ID = "temas-1-3";

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
async function guardarIntentoRemoto({ aciertos, total, nota, falladas }) {
  try {
    const user = await usuarioActual();
    if (!user) return { ok: false, motivo: "sin-sesion" };
    const { error } = await sb.from("intentos").insert({
      usuario_id: user.id,
      asignatura: ASIGNATURA,
      test_id: TEST_ID,
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

/* Resumen del historial de la cuenta en la pantalla de inicio */
async function pintarHistorialCuenta() {
  const caja = $$("historial-cuenta");
  const user = await usuarioActual();
  if (!user) {
    caja.hidden = true;
    return;
  }
  caja.hidden = false;
  caja.textContent = "";
  const p = document.createElement("p");
  try {
    const { data, error } = await sb
      .from("intentos")
      .select("nota, aciertos, total, creado_en")
      .eq("asignatura", ASIGNATURA)
      .order("creado_en", { ascending: false })
      .limit(200);
    if (error) {
      p.textContent = "No se pudo cargar tu historial.";
    } else if (!data.length) {
      p.textContent = "Aún no tienes tests guardados en tu cuenta.";
    } else {
      const notas = data.map((x) => Number(x.nota));
      const media = notas.reduce((a, n) => a + n, 0) / notas.length;
      const mejor = Math.max(...notas);
      p.textContent = `Tu cuenta: ${data.length} tests · media ${media.toFixed(2)} · mejor ${mejor.toFixed(2)}`;
    }
  } catch (e) {
    p.textContent = "No se pudo cargar tu historial.";
  }
  caja.append(p);
}

/* Estado de sesión y formulario */
async function pintarSesion() {
  const user = await usuarioActual();
  $$("auth-formulario").hidden = !!user || !sb;
  $$("auth-sesion").hidden = !user;
  $$("auth-aviso").hidden = !!sb;
  if (!sb) $$("auth-aviso").textContent = "El inicio de sesión no está configurado. Configura Supabase para acceder a las asignaturas.";
  if (user) {
    $$("auth-nombre").textContent = (user.user_metadata && user.user_metadata.nombre) || user.email;
  }
  document.dispatchEvent(new CustomEvent("sesion-actualizada", { detail: { user } }));
  await pintarHistorialCuenta();
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
