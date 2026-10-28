"use strict";

const LETRAS = ["A", "B", "C", "D", "E", "F"];
const LS_KEY = "poo_historial_v1";
const ASIGNATURAS = [
  {
    id: "poo",
    nombre: "POO",
    descripcion: "Programación Orientada a Objetos",
    tests: [
      {
        id: "temas-1-3",
        nombre: "Test Tema 1-3",
        descripcion: "POO, Java, herencia y polimorfismo",
        archivo: "preguntas.json",
      },
    ],
  },
  {
    id: 'aic',
    nombre: 'AIC',
    descripcion: 'Arquitectura e Ingenieria de Computadores',
    tests: [
      {
        id: 'tema-1',
        nombre: 'Test Tema 1',
        descripcion: 'Cuestionario de AIC - Tema 1',
        archivo: 'preguntas_aic_tema1.json',
      },
    ],
  },
  {
    id: 'fundamentos-web',
    nombre: 'Fundamentos web',
    descripcion: 'Fundamentos web, JavaScript y Node.js',
    tests: [
      {
        id: 'javascript-node',
        nombre: 'JavaScript y Node.js',
        descripcion: 'Cuestionario de Fundamentos web',
        archivo: 'preguntas_fw_js_node.json',
      },
    ],
  },
];
const TIPOS = {
  test: "Concepto",
  codigo: "Código",
  diseno: "Diseño / UML",
  estructura: "Estructura de Java",
  sintaxis: "Sintaxis y operadores",
};
const TEMAS = { 1: "Tema 1 · POO", 2: "Tema 2 · Java", 3: "Tema 3 · Herencia y polimorfismo" };

let modoInvitado = false;
let banco = [];
let preguntas = [];
let asignaturaActual = null;
let testActual = null;
let totalPreguntas = 30;
let indice = 0;
let respuestas = []; // letra elegida (o null) por pregunta
let respondida = false;

const $ = (id) => document.getElementById(id);

/* ---------- utilidades ---------- */

function barajar(lista) {
  const r = lista.slice();
  for (let i = r.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [r[i], r[j]] = [r[j], r[i]];
  }
  return r;
}

// Mezcla las opciones, las reetiqueta A–D y recalcula cuál es la correcta.
function prepararPregunta(q) {
  const correctas = new Set(q.respuestas_correctas);
  const mezcladas = barajar(q.opciones);
  const opciones = mezcladas.map((o, i) => ({
    letra: LETRAS[i],
    texto: o.texto,
    correcta: correctas.has(o.letra),
  }));
  return {
    ...q,
    opciones,
    respuestas_correctas: opciones.filter((o) => o.correcta).map((o) => o.letra),
  };
}

function mostrar(id) {
  ["pantalla-login", "pantalla-asignaturas", "pantalla-tests", "pantalla-test", "pantalla-resultados"].forEach((p) => {
    $(p).hidden = p !== id;
  });
  window.scrollTo({ top: 0 });
}

function claveHistorial() {
  if (!asignaturaActual || (asignaturaActual.id === "poo" && (!testActual || testActual.id === "temas-1-3"))) return LS_KEY;
  return `${LS_KEY}_${asignaturaActual.id}_${testActual ? testActual.id : "general"}`;
}

function formatoNota(n) {
  return n.toLocaleString("es-ES", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

/* ---------- historial (localStorage, con try/catch) ---------- */

function leerHistorial() {
  try {
    const crudo = localStorage.getItem(claveHistorial());
    const h = crudo ? JSON.parse(crudo) : [];
    return Array.isArray(h) ? h.filter((x) => x && typeof x.nota === "number") : [];
  } catch (e) {
    return [];
  }
}

function guardarHistorial(h) {
  try {
    localStorage.setItem(claveHistorial(), JSON.stringify(h.slice(-200)));
    return true;
  } catch (e) {
    return false;
  }
}

function borrarHistorial() {
  try {
    localStorage.removeItem(claveHistorial());
  } catch (e) {
    /* sin almacenamiento disponible */
  }
}

function media(lista) {
  return lista.length ? lista.reduce((a, x) => a + x.nota, 0) / lista.length : 0;
}

function pintarHistorial() {
  const h = leerHistorial();
  const caja = $("resumen-historial");
  $("btn-borrar-historial").hidden = h.length === 0;
  if (!h.length) {
    caja.hidden = true;
    return;
  }
  const mejor = Math.max(...h.map((x) => x.nota));
  const ultimas = h.slice(-5);
  caja.innerHTML = "";
  [
    [String(h.length), "tests realizados"],
    [formatoNota(media(h)), "nota media"],
    [formatoNota(mejor), "mejor nota"],
    [formatoNota(media(ultimas)), `media de los últimos ${ultimas.length}`],
  ].forEach(([valor, etiqueta]) => {
    const d = document.createElement("div");
    d.className = "dato";
    const v = document.createElement("span");
    v.className = "valor";
    v.textContent = valor;
    const e = document.createElement("span");
    e.className = "etiqueta";
    e.textContent = etiqueta;
    d.append(v, e);
    caja.append(d);
  });
  caja.hidden = false;
}

/* ---------- carga ---------- */

async function cargarBanco(test) {
  try {
    const resp = await fetch(test.archivo, { cache: "no-cache" });
    if (!resp.ok) throw new Error("HTTP " + resp.status);
    const datos = await resp.json();
    if (testActual !== test) return false;
    if (!Array.isArray(datos) || !datos.length) throw new Error("El banco de preguntas está vacío o no es válido");
    banco = datos;
    document.querySelectorAll(".modo-cantidad").forEach((btn) => {
      const total = Number(btn.dataset.total);
      btn.disabled = banco.length < total;
    });
    $("estado-banco").textContent = banco.length < 30
      ? `Banco cargado: ${banco.length} preguntas. Los modos superiores a esa cantidad no están disponibles.`
      : `Banco cargado: ${banco.length} preguntas. Elige un modo.`;
    return true;
  } catch (e) {
    if (testActual !== test) return false;
    $("estado-banco").textContent = `No se pudo cargar ${test.archivo} (${e.message}). Abre la página desde un servidor local.`;
    document.querySelectorAll(".modo-cantidad").forEach((btn) => { btn.disabled = true; });
    return false;
  }
}

function renderizarAsignaturas() {
  const lista = $("lista-asignaturas");
  lista.innerHTML = "";
  ASIGNATURAS.forEach((asignatura) => {
    const boton = document.createElement("button");
    boton.type = "button";
    boton.className = "tarjeta-seleccion tema-disponible";
    const estado = document.createElement("span");
    estado.className = "tema-estado";
    estado.textContent = "Disponible";
    const nombre = document.createElement("strong");
    nombre.textContent = asignatura.nombre;
    const descripcion = document.createElement("span");
    descripcion.textContent = asignatura.descripcion;
    boton.append(estado, nombre, descripcion);
    boton.addEventListener("click", () => {
      asignaturaActual = asignatura;
      testActual = null;
      $("nombre-asignatura-tests").textContent = asignatura.nombre;
      pintarTests();
      pintarHistorial();
      mostrar("pantalla-tests");
    });
    lista.append(boton);
  });
}

function pintarTests() {
  const lista = $("lista-tests");
  lista.innerHTML = "";
  $("selector-modo").hidden = true;
  lista.hidden = false;
  (asignaturaActual ? asignaturaActual.tests : []).forEach((test) => {
    const boton = document.createElement("button");
    boton.type = "button";
    boton.className = "tarjeta-seleccion tema-disponible";
    const estado = document.createElement("span");
    estado.className = "tema-estado";
    estado.textContent = "Elegir test";
    const nombre = document.createElement("strong");
    nombre.textContent = test.nombre;
    const descripcion = document.createElement("span");
    descripcion.textContent = test.descripcion;
    boton.append(estado, nombre, descripcion);
    boton.addEventListener("click", async () => {
      testActual = test;
      banco = [];
      $("nombre-test-modo").textContent = test.nombre;
      lista.hidden = true;
      $("selector-modo").hidden = false;
      document.querySelectorAll(".modo-cantidad").forEach((opcion) => { opcion.disabled = true; });
      $("estado-banco").textContent = "Cargando preguntas…";
      await cargarBanco(test);
      pintarHistorial();
    });
    lista.append(boton);
  });
}

/* ---------- test ---------- */

function empezar() {
  preguntas = barajar(banco).slice(0, totalPreguntas).map(prepararPregunta);
  respuestas = new Array(totalPreguntas).fill(null);
  indice = 0;
  mostrar("pantalla-test");
  pintarPregunta();
}

function aciertosHastaAhora() {
  return preguntas.reduce((n, q, i) => n + (respuestas[i] && q.respuestas_correctas.includes(respuestas[i]) ? 1 : 0), 0);
}

function pintarPregunta() {
  const q = preguntas[indice];
  const seleccionGuardada = respuestas[indice];
  respondida = seleccionGuardada !== null;

  $("contador").textContent = `Pregunta ${indice + 1} de ${totalPreguntas}`;
  $("marcador").textContent = `Aciertos: ${aciertosHastaAhora()}`;
  $("progreso-barra").style.width = `${(indice / totalPreguntas) * 100}%`;
  $("progreso").setAttribute("aria-valuemax", String(totalPreguntas));
  $("progreso").setAttribute("aria-valuenow", String(indice));
  $("btn-anterior").disabled = indice === 0;

  const et = $("etiquetas");
  et.innerHTML = "";
  const bTema = document.createElement("span");
  bTema.className = "badge badge-tema";
  bTema.textContent = TEMAS[q.tema] || `Tema ${q.tema}`;
  const bTipo = document.createElement("span");
  bTipo.className = "badge badge-tipo";
  bTipo.textContent = TIPOS[q.tipo] || q.tipo;
  et.append(bTema, bTipo);

  $("enunciado").textContent = q.pregunta;

  const bloque = $("bloque-codigo");
  if (q.codigo) {
    $("codigo").textContent = q.codigo;
    bloque.hidden = false;
  } else {
    bloque.hidden = true;
  }

  const caja = $("opciones");
  caja.innerHTML = "";
  q.opciones.forEach((o) => {
    const b = document.createElement("button");
    b.type = "button";
    b.className = "opcion";
    b.dataset.letra = o.letra;
    const l = document.createElement("span");
    l.className = "letra";
    l.textContent = o.letra;
    const t = document.createElement("span");
    t.className = "texto";
    t.textContent = o.texto;
    b.append(l, t);
    if (respondida) {
      b.disabled = true;
      if (q.respuestas_correctas.includes(o.letra)) b.classList.add("correcta");
      else if (o.letra === seleccionGuardada) b.classList.add("incorrecta");
      else b.classList.add("apagada");
    }
    b.addEventListener("click", () => responder(o.letra));
    caja.append(b);
  });

  const explicacion = $("explicacion");
  const siguiente = $("btn-siguiente");
  if (respondida) {
    const acierto = q.respuestas_correctas.includes(seleccionGuardada);
    explicacion.className = "explicacion " + (acierto ? "ok" : "ko");
    $("veredicto").textContent = acierto ? "✔ Correcto" : `✘ Incorrecto · la respuesta correcta era la ${q.respuestas_correctas.join(", ")}`;
    $("texto-explicacion").textContent = q.explicacion || "";
    explicacion.hidden = false;
    siguiente.textContent = indice === totalPreguntas - 1 ? "Ver resultado" : "Siguiente";
    siguiente.hidden = false;
  } else {
    explicacion.hidden = true;
    siguiente.hidden = true;
  }
}

function responder(letra) {
  if (respondida) return;
  respondida = true;
  const q = preguntas[indice];
  respuestas[indice] = letra;
  const acierto = q.respuestas_correctas.includes(letra);

  document.querySelectorAll("#opciones .opcion").forEach((b) => {
    b.disabled = true;
    const l = b.dataset.letra;
    if (q.respuestas_correctas.includes(l)) b.classList.add("correcta");
    else if (l === letra) b.classList.add("incorrecta");
    else b.classList.add("apagada");
  });

  const ex = $("explicacion");
  ex.className = "explicacion " + (acierto ? "ok" : "ko");
  $("veredicto").textContent = acierto ? "✔ Correcto" : `✘ Incorrecto · la respuesta correcta era la ${q.respuestas_correctas.join(", ")}`;
  $("texto-explicacion").textContent = q.explicacion || "";
  ex.hidden = false;

  $("marcador").textContent = `Aciertos: ${aciertosHastaAhora()}`;
  const sig = $("btn-siguiente");
  sig.textContent = indice === totalPreguntas - 1 ? "Ver resultado" : "Siguiente";
  sig.hidden = false;
  sig.focus({ preventScroll: true });
}

function siguiente() {
  if (!respondida) return;
  if (indice < totalPreguntas - 1) {
    indice++;
    pintarPregunta();
  } else {
    terminar();
  }
}

function abandonar() {
  if (confirm("¿Abandonar el test? No se guardará ninguna nota.")) {
    pintarHistorial();
    pintarTests();
    mostrar("pantalla-tests");
  }
}

/* ---------- resultados ---------- */

function filaDesglose(nombre, ok, total) {
  const f = document.createElement("div");
  f.className = "fila-desglose";
  const n = document.createElement("span");
  n.textContent = nombre;
  const barra = document.createElement("div");
  barra.className = "barra";
  const relleno = document.createElement("span");
  relleno.style.width = total ? `${(ok / total) * 100}%` : "0%";
  barra.append(relleno);
  const c = document.createElement("span");
  c.className = "cifras";
  c.textContent = `${ok}/${total}`;
  f.append(n, barra, c);
  return f;
}

function desglosar(destino, clave, etiquetas) {
  const acum = {};
  preguntas.forEach((q, i) => {
    const k = q[clave];
    acum[k] = acum[k] || { ok: 0, total: 0 };
    acum[k].total++;
    if (respuestas[i] && q.respuestas_correctas.includes(respuestas[i])) acum[k].ok++;
  });
  destino.innerHTML = "";
  Object.keys(acum)
    .sort()
    .forEach((k) => destino.append(filaDesglose(etiquetas[k] || String(k), acum[k].ok, acum[k].total)));
}

function textoOpcion(q, letra) {
  const o = q.opciones.find((x) => x.letra === letra);
  return o ? `${o.letra}) ${o.texto}` : "(sin responder)";
}

function terminar() {
  const aciertos = aciertosHastaAhora();
  const nota = (aciertos / totalPreguntas) * 10;

  const historial = leerHistorial();
  const previa = media(historial);
  const tenia = historial.length;
  historial.push({ fecha: new Date().toISOString(), nota: Math.round(nota * 100) / 100, aciertos, total: totalPreguntas });
  const guardado = guardarHistorial(historial);

  $("progreso-barra").style.width = "100%";
  $("nota-numero").textContent = formatoNota(nota);
  $("nota-detalle").textContent = `${aciertos} aciertos, ${totalPreguntas - aciertos} fallos de ${totalPreguntas} preguntas.`;

  let hist;
  if (!guardado) {
    hist = "No se ha podido guardar el historial en este navegador.";
  } else if (tenia === 0) {
    hist = "Es tu primer test registrado: a partir de ahora se calculará tu media histórica.";
  } else {
    const nueva = media(historial);
    const dif = nueva - previa;
    const signo = dif > 0 ? "+" : dif < 0 ? "−" : "±";
    hist = `Media histórica: ${formatoNota(nueva)} sobre ${historial.length} tests (${signo}${formatoNota(Math.abs(dif))} respecto a la anterior).`;
  }
  $("nota-historica").textContent = hist;

  desglosar($("desglose-tipo"), "tipo", TIPOS);
  desglosar($("desglose-tema"), "tema", TEMAS);

  const lista = $("lista-falladas");
  lista.innerHTML = "";
  const falladas = preguntas.map((q, i) => ({ q, i })).filter(({ q, i }) => !(respuestas[i] && q.respuestas_correctas.includes(respuestas[i])));
  $("titulo-falladas").textContent = falladas.length ? `Preguntas falladas (${falladas.length})` : "Preguntas falladas";
  if (!falladas.length) {
    const p = document.createElement("p");
    p.textContent = "¡Ninguna! Has acertado todas.";
    lista.append(p);
  }
  falladas.forEach(({ q, i }) => {
    const d = document.createElement("details");
    const s = document.createElement("summary");
    s.textContent = `${i + 1}. ${q.pregunta}`;
    d.append(s);
    const cont = document.createElement("div");
    cont.className = "detalle";
    if (q.codigo) {
      const pre = document.createElement("pre");
      pre.className = "codigo";
      const code = document.createElement("code");
      code.textContent = q.codigo;
      pre.append(code);
      cont.append(pre);
    }
    const tu = document.createElement("p");
    tu.className = "tu";
    tu.textContent = "Tu respuesta: " + textoOpcion(q, respuestas[i]);
    const ok = document.createElement("p");
    ok.className = "ok";
    ok.textContent = "Correcta: " + q.respuestas_correctas.map((l) => textoOpcion(q, l)).join(" · ");
    const ex = document.createElement("p");
    ex.textContent = q.explicacion || "";
    cont.append(tu, ok, ex);
    d.append(cont);
    lista.append(d);
  });

  // Guardado en la cuenta (Supabase). Si no hay sesión o falla la red,
  // la app sigue funcionando igual con el historial local.
  if (typeof guardarIntentoRemoto === "function") {
    const idsFalladas = falladas.map(({ q }) => q.id);
    guardarIntentoRemoto({ asignatura: asignaturaActual.id, testId: testActual.id, aciertos, total: totalPreguntas, nota, falladas: idsFalladas }).then((r) => {
      const extra = r.ok
        ? " Guardado en tu cuenta."
        : r.motivo === "sin-sesion"
        ? " Inicia sesión para guardar tus notas en tu cuenta."
        : " No se pudo guardar en tu cuenta.";
      $("nota-historica").textContent += extra;
      if (r.ok && typeof pintarHistorialCuenta === "function") pintarHistorialCuenta();
    });
  }

  mostrar("pantalla-resultados");
}

/* ---------- eventos ---------- */

document.addEventListener("keydown", (e) => {
  if ($("pantalla-test").hidden) return;
  if (e.ctrlKey || e.metaKey || e.altKey) return;
  const k = e.key.toUpperCase();
  if (!respondida) {
    let letra = null;
    if (/^[A-D]$/.test(k)) letra = k;
    else if (/^[1-4]$/.test(k)) letra = LETRAS[Number(k) - 1];
    if (letra && preguntas[indice].opciones.some((o) => o.letra === letra)) responder(letra);
  } else if (e.key === "Enter" || e.key === "ArrowRight") {
    e.preventDefault();
    siguiente();
  }
});

document.querySelectorAll(".modo-cantidad").forEach((btn) => btn.addEventListener("click", () => {
  totalPreguntas = Number(btn.dataset.total);
  empezar();
}));
$("btn-siguiente").addEventListener("click", siguiente);
$("btn-anterior").addEventListener("click", () => {
  if (indice > 0) {
    indice--;
    pintarPregunta();
  }
});
$("btn-abandonar").addEventListener("click", abandonar);
$("btn-repetir").addEventListener("click", empezar);
$("btn-inicio").addEventListener("click", () => {
  pintarHistorial();
  pintarTests();
  mostrar("pantalla-tests");
});

$("btn-invitado").addEventListener("click", () => {
  modoInvitado = true;
  mostrar("pantalla-asignaturas");
  pintarHistorial();
});
$("btn-volver-asignaturas").addEventListener("click", () => mostrar("pantalla-asignaturas"));
$("btn-volver-lista-tests").addEventListener("click", () => pintarTests());
document.querySelectorAll(".btn-cerrar-sesion").forEach((btn) => btn.addEventListener("click", () => {
  if (modoInvitado) {
    modoInvitado = false;
    mostrar("pantalla-login");
  } else if (typeof cerrarSesion === "function") {
    cerrarSesion();
  }
}));
$("btn-borrar-historial").addEventListener("click", () => {
  if (confirm("¿Borrar todo el historial local de notas?")) {
    borrarHistorial();
    pintarHistorial();
  }
});
document.addEventListener("sesion-actualizada", (e) => {
  const user = e.detail && e.detail.user;
  if (user) {
    modoInvitado = false;
    mostrar("pantalla-asignaturas");
    pintarHistorial();
  } else if (!modoInvitado) {
    mostrar("pantalla-login");
  }
});

renderizarAsignaturas();
pintarHistorial();
