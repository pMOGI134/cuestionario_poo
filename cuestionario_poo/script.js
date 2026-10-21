"use strict";

const NIVELES = { facil: 10, medio: 20, dificil: 30 };
const LETRAS = ["A", "B", "C", "D", "E", "F"];
const LS_KEY = "poo_historial_v1";
const TIPOS = {
  test: "Concepto",
  codigo: "Código",
  diseno: "Diseño / UML",
  estructura: "Estructura de Java",
  sintaxis: "Sintaxis y operadores",
};
const TEMAS = { 1: "Tema 1 · POO", 2: "Tema 2 · Java", 3: "Tema 3 · Herencia y polimorfismo" };

let banco = [];
let preguntas = [];
let totalPreguntas = NIVELES.dificil;
let nivelElegido = "dificil";
const NOMBRES_NIVEL = { facil: "Aitor mode", medio: "medio", dificil: "difícil" };
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
  ["pantalla-inicio", "pantalla-test", "pantalla-resultados"].forEach((p) => {
    $(p).hidden = p !== id;
  });
  window.scrollTo({ top: 0 });
}

function formatoNota(n) {
  return n.toLocaleString("es-ES", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

/* ---------- historial (localStorage, con try/catch) ---------- */

function leerHistorial() {
  try {
    const crudo = localStorage.getItem(LS_KEY);
    const h = crudo ? JSON.parse(crudo) : [];
    return Array.isArray(h) ? h.filter((x) => x && typeof x.nota === "number") : [];
  } catch (e) {
    return [];
  }
}

function guardarHistorial(h) {
  try {
    localStorage.setItem(LS_KEY, JSON.stringify(h.slice(-200)));
    return true;
  } catch (e) {
    return false;
  }
}

function borrarHistorial() {
  try {
    localStorage.removeItem(LS_KEY);
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

async function cargarBanco() {
  const botonesNivel = document.querySelectorAll(".btn-nivel");
  try {
    const resp = await fetch("preguntas.json", { cache: "no-cache" });
    if (!resp.ok) throw new Error("HTTP " + resp.status);
    const datos = await resp.json();
    if (!Array.isArray(datos) || datos.length < NIVELES.dificil) throw new Error("El banco de preguntas es inválido o demasiado pequeño");
    banco = datos;
    botonesNivel.forEach((btn) => { btn.disabled = false; });
  } catch (e) {
    const err = $("error-carga");
    err.hidden = false;
    err.textContent =
      "No se pudo cargar preguntas.json (" + e.message + "). Abre la página desde un servidor local, por ejemplo con «python3 -m http.server», y entra en http://localhost:8000.";
    botonesNivel.forEach((btn) => { btn.disabled = true; });
  }
}

function mostrarDificultades() {
  $("seleccion-tests").hidden = true;
  $("seleccion-dificultad").hidden = false;
}

function mostrarTests() {
  $("seleccion-dificultad").hidden = true;
  $("seleccion-tests").hidden = false;
}

function mostrarAsignaturas() {
  $("seleccion-tests").hidden = true;
  $("seleccion-dificultad").hidden = true;
  $("seleccion-lecturas").hidden = false;
}

/* ---------- test ---------- */

function empezar() {
  totalPreguntas = NIVELES[nivelElegido];
  preguntas = barajar(banco).slice(0, totalPreguntas).map(prepararPregunta);
  respuestas = new Array(totalPreguntas).fill(null);
  indice = 0;
  $("progreso").setAttribute("aria-valuemax", String(totalPreguntas));
  mostrar("pantalla-test");
  pintarPregunta();
}

function aciertosHastaAhora() {
  return preguntas.reduce((n, q, i) => n + (respuestas[i] && q.respuestas_correctas.includes(respuestas[i]) ? 1 : 0), 0);
}

function pintarPregunta() {
  const q = preguntas[indice];
  respondida = false;

  $("contador").textContent = `Pregunta ${indice + 1} de ${totalPreguntas}`;
  $("marcador").textContent = `Aciertos: ${aciertosHastaAhora()}`;
  $("progreso-barra").style.width = `${(indice / totalPreguntas) * 100}%`;
  $("progreso").setAttribute("aria-valuenow", String(indice));

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
    b.addEventListener("click", () => responder(o.letra));
    caja.append(b);
  });

  $("explicacion").hidden = true;
  $("btn-siguiente").hidden = true;
  $("btn-anterior").hidden = indice === 0;
  if (respuestas[indice]) restaurarRespuesta();
}

function restaurarRespuesta() {
  const q = preguntas[indice];
  const letra = respuestas[indice];
  const acierto = q.respuestas_correctas.includes(letra);
  respondida = true;

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

  const sig = $("btn-siguiente");
  sig.textContent = indice === totalPreguntas - 1 ? "Ver resultado" : "Siguiente";
  sig.hidden = false;
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

function anterior() {
  if (indice === 0) return;
  indice--;
  pintarPregunta();
}

function abandonar() {
  if (confirm("¿Abandonar el test? No se guardará ninguna nota.")) {
    pintarHistorial();
    mostrar("pantalla-inicio");
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
  historial.push({ fecha: new Date().toISOString(), nota: Math.round(nota * 100) / 100, aciertos, total: totalPreguntas, nivel: nivelElegido });
  const guardado = guardarHistorial(historial);

  $("progreso-barra").style.width = "100%";
  $("nota-numero").textContent = formatoNota(nota);
  $("nota-detalle").textContent = `${aciertos} aciertos, ${totalPreguntas - aciertos} fallos de ${totalPreguntas} preguntas (nivel ${NOMBRES_NIVEL[nivelElegido]}).`;

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
  } else if (e.key === "ArrowLeft") {
    e.preventDefault();
    anterior();
  }
});

document.querySelectorAll(".btn-nivel").forEach((btn) => btn.addEventListener("click", () => {
  nivelElegido = btn.dataset.nivel;
  empezar();
}));
$("btn-lectura-poo").addEventListener("click", () => {
  $("seleccion-lecturas").hidden = true;
  $("seleccion-tests").hidden = false;
});
$("btn-test-poo-1-3").addEventListener("click", mostrarDificultades);
$("btn-volver-asignaturas").addEventListener("click", mostrarAsignaturas);
$("btn-volver-tests").addEventListener("click", mostrarTests);
$("btn-siguiente").addEventListener("click", siguiente);
$("btn-anterior").addEventListener("click", anterior);
$("btn-abandonar").addEventListener("click", abandonar);
$("btn-repetir").addEventListener("click", empezar);
$("btn-inicio").addEventListener("click", () => {
  pintarHistorial();
  mostrar("pantalla-inicio");
});
$("btn-borrar-historial").addEventListener("click", () => {
  if (confirm("¿Borrar todo el historial de notas?")) {
    borrarHistorial();
    pintarHistorial();
  }
});

pintarHistorial();
cargarBanco();
