"use strict";

const LETRAS = ["A", "B", "C", "D", "E", "F"];
const SIMBOLOS_ALGEBRA = ["π", "σ", "ρ", "⋈", "∪", "∩", "−", "÷", "∧", "→", "(", ")", "=", "∈"];
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
    id: 'bases-datos',
    nombre: 'Bases de datos',
    descripcion: 'Bases de datos relacionales',
    tests: [
      {
        id: 'relacional',
        nombre: 'Bases de datos relacionales',
        descripcion: 'Cuestionario de bases de datos relacionales',
        archivo: 'preguntas_bd_relacional.json',
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
      {
        id: 'bases-datos-mongodb',
        nombre: 'Bases de datos y MongoDB',
        descripcion: 'Cuestionario de Fundamentos web - Temas 6 y 7',
        archivo: 'preguntas_fw_bd_mongodb.json',
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
  algebra: "Álgebra relacional",
  algebra_abierta: "Álgebra relacional · respuesta abierta",
};
const TEMAS = { 1: "Tema 1 · POO", 2: "Tema 2 · Java", 3: "Tema 3 · Herencia y polimorfismo" };

let modoInvitado = false;
let banco = [];
let preguntas = [];
let asignaturaActual = null;
let testActual = null;
let modoTest = "estudio";
let totalPreguntas = 30;
let indice = 0;
let respuestas = []; // Letra elegida o texto escrito, o null si está sin responder.
let evaluacionesManuales = [];
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
  const correctas = new Set(q.respuestas_correctas || []);
  const mezcladas = barajar(q.opciones || []);
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
  ["pantalla-login", "pantalla-asignaturas", "pantalla-tests", "pantalla-perfil", "pantalla-test", "pantalla-revision-examen", "pantalla-autoevaluacion-examen", "pantalla-resultados"].forEach((p) => {
    $(p).hidden = p !== id;
  });
  $("btn-menu").hidden = id === "pantalla-login";
  actualizarBotonModo();
  window.scrollTo({ top: 0 });
}

function claveHistorialPara(asignatura, test) {
  if (asignatura.id === "poo" && test.id === "temas-1-3") return LS_KEY;
  return `${LS_KEY}_${asignatura.id}_${test.id}`;
}

function claveHistorialBase() {
  if (!asignaturaActual) return LS_KEY;
  if (!testActual) return `${LS_KEY}_${asignaturaActual.id}_general`;
  return claveHistorialPara(asignaturaActual, testActual);
}

function claveHistorial() {
  const clave = claveHistorialBase();
  return modoTest === "examen" ? `${clave}_examen` : clave;
}

function actualizarBotonModo() {
  const boton = $("btn-modo-test");
  if (!boton) return;
  const examen = modoTest === "examen";
  const nombre = examen ? "Examen" : "Estudio";
  const descripcion = examen
    ? "−⅓ por fallo · respuestas al final"
    : "Sin penalización · corrección inmediata";
  $("nombre-modo-test").textContent = `Modo: ${nombre}`;
  $("descripcion-modo-test").textContent = descripcion;
  boton.setAttribute("aria-label", `Modo actual: ${nombre}. ${descripcion}. Cambiar a modo ${examen ? "estudio" : "examen"}.`);
  boton.title = `Modo ${nombre}: ${descripcion}. Pulsa para cambiar.`;
  const duranteTest = !$("pantalla-test").hidden || !$("pantalla-revision-examen").hidden || !$("pantalla-autoevaluacion-examen").hidden;
  boton.disabled = duranteTest;
  $("btn-menu").disabled = duranteTest;
}

function nombreTema(tema) {
  if (asignaturaActual && asignaturaActual.id === "poo") return TEMAS[tema] || `Tema ${tema} · POO`;
  return `Tema ${tema} · ${asignaturaActual ? asignaturaActual.nombre : ""}`;
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
    const asignaturas = asignaturaActual ? [asignaturaActual] : ASIGNATURAS;
    asignaturas.forEach((asignatura) => {
      const tests = testActual ? [testActual] : asignatura.tests;
      tests.forEach((test) => {
        const clave = claveHistorialPara(asignatura, test);
        localStorage.removeItem(clave);
        localStorage.removeItem(`${clave}_examen`);
      });
    });
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

function leerTodosLosIntentos() {
  const intentos = [];
  let historialInvalido = false;
  try {
    ASIGNATURAS.forEach((asignatura) => {
      asignatura.tests.forEach((test) => {
        const base = claveHistorialPara(asignatura, test);
        ["estudio", "examen"].forEach((modo) => {
          const clave = modo === "examen" ? `${base}_examen` : base;
          const crudo = localStorage.getItem(clave);
          if (!crudo) return;
          let historial;
          try {
            historial = JSON.parse(crudo);
          } catch (e) {
            historialInvalido = true;
            return;
          }
          if (!Array.isArray(historial)) {
            historialInvalido = true;
            return;
          }
          historial.forEach((intento) => {
            if (!intento || typeof intento.nota !== "number") return;
            intentos.push({
              ...intento,
              modo: intento.modo === "examen" || intento.modo === "estudio" ? intento.modo : modo,
              asignatura: intento.asignatura || asignatura.nombre,
              test: intento.test || test.nombre,
            });
          });
        });
      });
    });
  } catch (e) {
    return null;
  }
  intentos.sort((a, b) => new Date(b.fecha).getTime() - new Date(a.fecha).getTime());
  return { intentos, historialInvalido };
}

function pintarPerfil() {
  pintarNombrePerfil();
  const resultado = leerTodosLosIntentos();
  const resumen = $("resumen-perfil");
  const recientes = $("tests-recientes");
  resumen.innerHTML = "";
  recientes.innerHTML = "";
  if (!resultado) {
    const aviso = document.createElement("p");
    aviso.className = "nota-pequena";
    aviso.textContent = "No se pudo leer el historial guardado en este navegador.";
    recientes.append(aviso);
    return;
  }
  const { intentos, historialInvalido } = resultado;
  if (historialInvalido) {
    const aviso = document.createElement("p");
    aviso.className = "nota-pequena";
    aviso.textContent = "Algunos registros del historial no se pudieron leer; se muestran los demás.";
    recientes.append(aviso);
  }
  const mejor = intentos.length ? Math.max(...intentos.map((x) => x.nota)) : 0;
  [
    [String(intentos.length), "tests realizados"],
    [intentos.length ? formatoNota(media(intentos)) : "—", "nota media"],
    [intentos.length ? formatoNota(mejor) : "—", "mejor nota"],
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
  if (!intentos.length) {
    const aviso = document.createElement("p");
    aviso.className = "nota-pequena";
    aviso.textContent = "Todavía no hay tests guardados. Tu actividad aparecerá aquí.";
    recientes.append(aviso);
    return;
  }
  intentos.slice(0, 20).forEach((intento) => {
    const fila = document.createElement("article");
    fila.className = "intento-reciente";
    const descripcion = document.createElement("div");
    const nombre = document.createElement("strong");
    nombre.textContent = `${intento.asignatura} · ${intento.test}`;
    const detalle = document.createElement("span");
    const fecha = intento.fecha && !Number.isNaN(new Date(intento.fecha).getTime())
      ? new Date(intento.fecha).toLocaleString("es-ES")
      : "Fecha no disponible";
    detalle.className = "etiquetas-intento";
    detalle.textContent = `${intento.modo === "examen" ? "Modo examen" : "Modo práctica"} · ${intento.aciertos}/${intento.total} aciertos · ${fecha}`;
    descripcion.append(nombre, detalle);
    const nota = document.createElement("span");
    nota.className = "nota-intento";
    nota.textContent = `${formatoNota(intento.nota)}/10`;
    fila.append(descripcion, nota);
    recientes.append(fila);
  });
}

function pintarNombrePerfil(user) {
  const nombre = user && ((user.user_metadata && user.user_metadata.nombre) || user.email);
  $("nombre-perfil").textContent = nombre || "Invitado";
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
    boton.addEventListener("click", () => abrirAsignatura(asignatura));
    lista.append(boton);
  });
}

function abrirAsignatura(asignatura) {
  asignaturaActual = asignatura;
  testActual = null;
  $("nombre-asignatura-tests").textContent = asignatura.nombre;
  pintarTests();
  pintarHistorial();
  mostrar("pantalla-tests");
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
    boton.addEventListener("click", () => abrirTest(test));
    lista.append(boton);
  });
}

async function abrirTest(test) {
  testActual = test;
  $("modos-dificultad").hidden = false;
  $("estado-banco").hidden = false;
  $("intro-aic").hidden = true;
  $("texto-modo-ayuda").hidden = false;
  banco = [];
  $("nombre-test-modo").textContent = test.nombre;
  $("lista-tests").hidden = true;
  $("selector-modo").hidden = false;
  document.querySelectorAll(".modo-cantidad").forEach((opcion) => { opcion.disabled = true; });
  $("estado-banco").textContent = "Cargando preguntas…";
  const bancoCargado = await cargarBanco(test);
  if (bancoCargado && asignaturaActual && asignaturaActual.id === "aic") {
    totalPreguntas = Math.min(30, banco.length);
    $("modos-dificultad").hidden = true;
    $("estado-banco").hidden = true;
    $("intro-aic").hidden = false;
    $("texto-modo-ayuda").hidden = true;
  }
  pintarHistorial();
}

function renderizarMenu() {
  const lista = $("menu-asignaturas");
  lista.innerHTML = "";
  ASIGNATURAS.forEach((asignatura) => {
    const grupo = document.createElement("details");
    grupo.className = "menu-asignatura";
    const titulo = document.createElement("summary");
    titulo.textContent = asignatura.nombre;
    grupo.append(titulo);
    asignatura.tests.forEach((test) => {
      const boton = document.createElement("button");
      boton.type = "button";
      boton.className = "enlace-menu-test";
      boton.textContent = test.nombre;
      boton.addEventListener("click", async () => {
        cerrarMenu();
        abrirAsignatura(asignatura);
        await abrirTest(test);
      });
      grupo.append(boton);
    });
    lista.append(grupo);
  });
}

function cerrarMenu() {
  $("fondo-menu").hidden = true;
  $("menu-navegacion").setAttribute("aria-hidden", "true");
  $("btn-menu").setAttribute("aria-expanded", "false");
}

function abrirMenu() {
  $("fondo-menu").hidden = false;
  $("menu-navegacion").setAttribute("aria-hidden", "false");
  $("btn-menu").setAttribute("aria-expanded", "true");
  $("btn-cerrar-menu").focus();
}

/* ---------- test ---------- */

function empezar() {
  const abiertas = banco.filter((q) => q.formato === "abierta");
  const cerradas = banco.filter((q) => q.formato !== "abierta");
  const totalAbiertas = Math.min(abiertas.length, Math.ceil(totalPreguntas * 0.2));
  preguntas = [
    ...barajar(abiertas).slice(0, totalAbiertas),
    ...barajar(cerradas).slice(0, totalPreguntas - totalAbiertas),
  ].map(prepararPregunta);
  preguntas = barajar(preguntas);
  respuestas = new Array(totalPreguntas).fill(null);
  evaluacionesManuales = new Array(totalPreguntas).fill(null);
  indice = 0;
  actualizarBotonModo();
  mostrar("pantalla-test");
  pintarPregunta();
}

function aciertosHastaAhora() {
  return preguntas.reduce((n, q, i) => n + (esAbierta(q)
    ? evaluacionesManuales[i] === true ? 1 : 0
    : respuestas[i] && q.respuestas_correctas.includes(respuestas[i]) ? 1 : 0), 0);
}

function fallosHastaAhora() {
  return preguntas.reduce((n, q, i) => n + (esAbierta(q)
    ? evaluacionesManuales[i] === false ? 1 : 0
    : respuestas[i] && !q.respuestas_correctas.includes(respuestas[i]) ? 1 : 0), 0);
}

function esAbierta(q) {
  return q.formato === "abierta";
}

function esCorrecta(i, q) {
  return esAbierta(q)
    ? evaluacionesManuales[i] === true
    : respuestas[i] !== null && q.respuestas_correctas.includes(respuestas[i]);
}

function respondidasHastaAhora() {
  return respuestas.filter((respuesta) => respuesta !== null).length;
}

function pintarPregunta() {
  const q = preguntas[indice];
  const seleccionGuardada = respuestas[indice];
  respondida = seleccionGuardada !== null;
  const abierta = esAbierta(q);

  $("contador").textContent = `Pregunta ${indice + 1} de ${totalPreguntas}`;
  $("marcador").textContent = modoTest === "examen"
    ? `Respondidas: ${respondidasHastaAhora()} de ${totalPreguntas}`
    : `Aciertos: ${aciertosHastaAhora()}`;
  $("progreso-barra").style.width = `${(indice / totalPreguntas) * 100}%`;
  $("progreso").setAttribute("aria-valuemax", String(totalPreguntas));
  $("progreso").setAttribute("aria-valuenow", String(indice));
  $("btn-anterior").disabled = indice === 0;

  const et = $("etiquetas");
  et.innerHTML = "";
  const bTema = document.createElement("span");
  bTema.className = "badge badge-tema";
  bTema.textContent = nombreTema(q.tema);
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
  caja.hidden = abierta;
  $("respuesta-abierta").hidden = !abierta;
  if (abierta) {
    $("texto-respuesta-abierta").value = seleccionGuardada || "";
    $("texto-respuesta-abierta").disabled = respondida && modoTest === "estudio";
    $("btn-enviar-abierta").hidden = respondida && modoTest === "estudio";
    $("btn-enviar-abierta").textContent = respondida ? "Actualizar respuesta" : "Guardar respuesta";
    $("btn-enviar-abierta").disabled = false;
  } else {
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
        b.disabled = modoTest === "estudio";
        if (modoTest === "examen") {
          if (o.letra === seleccionGuardada) b.classList.add("seleccionada");
        } else if (q.respuestas_correctas.includes(o.letra)) b.classList.add("correcta");
        else if (o.letra === seleccionGuardada) b.classList.add("incorrecta");
        else b.classList.add("apagada");
      }
      b.addEventListener("click", () => responder(o.letra));
      caja.append(b);
    });
  }

  const explicacion = $("explicacion");
  const revisionAbierta = $("revision-abierta");
  const siguiente = $("btn-siguiente");
  const saltar = $("btn-saltar");
  revisionAbierta.hidden = true;
  if (respondida) {
    saltar.hidden = true;
    if (abierta && modoTest === "estudio") {
      $("veredicto").textContent = evaluacionesManuales[indice] === null
        ? "Compara tu respuesta con la solución modelo"
        : evaluacionesManuales[indice] ? "✔ Marcada como correcta" : "✘ Marcada para repasar";
      $("texto-explicacion").textContent = q.explicacion || "";
      $("respuesta-modelo").textContent = q.respuesta_modelo;
      revisionAbierta.hidden = false;
      $("btn-autoevaluar-ok").hidden = evaluacionesManuales[indice] !== null;
      $("btn-autoevaluar-ko").hidden = evaluacionesManuales[indice] !== null;
      $("btn-autoevaluar-ok").onclick = () => autoevaluarRespuesta(true);
      $("btn-autoevaluar-ko").onclick = () => autoevaluarRespuesta(false);
      explicacion.className = "explicacion " + (evaluacionesManuales[indice] === false ? "ko" : evaluacionesManuales[indice] === true ? "ok" : "");
      explicacion.hidden = false;
    } else if (modoTest === "examen") {
      $("veredicto").textContent = "Respuesta guardada";
      $("texto-explicacion").textContent = "La corrección se mostrará al terminar el examen.";
      explicacion.className = "explicacion";
      explicacion.hidden = false;
    } else {
      const acierto = q.respuestas_correctas.includes(seleccionGuardada);
      explicacion.className = "explicacion " + (acierto ? "ok" : "ko");
      $("veredicto").textContent = acierto ? "✔ Correcto" : `✘ Incorrecto · la respuesta correcta era la ${q.respuestas_correctas.join(", ")}`;
      $("texto-explicacion").textContent = q.explicacion || "";
      explicacion.hidden = false;
    }
    siguiente.textContent = indice === totalPreguntas - 1
      ? modoTest === "examen" ? "Terminar y revisar" : "Ver resultado"
      : "Siguiente";
    siguiente.hidden = abierta && modoTest === "estudio" && evaluacionesManuales[indice] === null;
  } else {
    explicacion.hidden = true;
    siguiente.hidden = true;
    saltar.hidden = false;
    saltar.textContent = indice === totalPreguntas - 1
      ? modoTest === "examen" ? "Saltar y revisar examen" : "Saltar y ver resultado"
      : "Saltar pregunta";
  }
}

function responder(letra) {
  if (respondida && modoTest === "estudio") return;
  respondida = true;
  const q = preguntas[indice];
  respuestas[indice] = letra;
  const acierto = q.respuestas_correctas.includes(letra);

  document.querySelectorAll("#opciones .opcion").forEach((b) => {
    b.classList.remove("correcta", "incorrecta", "apagada", "seleccionada");
    b.disabled = modoTest === "estudio";
    const l = b.dataset.letra;
    if (modoTest === "examen") {
      if (l === letra) b.classList.add("seleccionada");
    } else if (q.respuestas_correctas.includes(l)) b.classList.add("correcta");
    else if (l === letra) b.classList.add("incorrecta");
    else b.classList.add("apagada");
  });

  const ex = $("explicacion");
  if (modoTest === "examen") {
    ex.className = "explicacion";
    $("veredicto").textContent = "Respuesta guardada";
    $("texto-explicacion").textContent = "La corrección se mostrará al terminar el examen.";
  } else {
    ex.className = "explicacion " + (acierto ? "ok" : "ko");
    $("veredicto").textContent = acierto ? "✔ Correcto" : `✘ Incorrecto · la respuesta correcta era la ${q.respuestas_correctas.join(", ")}`;
    $("texto-explicacion").textContent = q.explicacion || "";
  }
  ex.hidden = false;

  $("marcador").textContent = modoTest === "examen"
    ? `Respondidas: ${respondidasHastaAhora()} de ${totalPreguntas}`
    : `Aciertos: ${aciertosHastaAhora()}`;
  const sig = $("btn-siguiente");
  sig.textContent = indice === totalPreguntas - 1
    ? modoTest === "examen" ? "Terminar y revisar" : "Ver resultado"
    : "Siguiente";
  sig.hidden = false;
  sig.focus({ preventScroll: true });
}

function guardarRespuestaAbierta() {
  if (respondida && modoTest === "estudio") return;
  const respuesta = $("texto-respuesta-abierta").value.trim();
  if (!respuesta) {
    $("texto-respuesta-abierta").setCustomValidity("Escribe una respuesta antes de continuar.");
    $("texto-respuesta-abierta").reportValidity();
    return;
  }
  $("texto-respuesta-abierta").setCustomValidity("");
  if (respuesta === respuestas[indice]) return;
  respuestas[indice] = respuesta;
  evaluacionesManuales[indice] = null;
  respondida = true;
  pintarPregunta();
  if (modoTest === "estudio") $("revision-abierta").scrollIntoView({ block: "nearest" });
}

function autoevaluarRespuesta(correcta) {
  if (!esAbierta(preguntas[indice]) || respuestas[indice] === null) return;
  evaluacionesManuales[indice] = correcta;
  pintarPregunta();
  $("marcador").textContent = `Aciertos: ${aciertosHastaAhora()}`;
}

function iniciarRevisionExamen() {
  const lista = $("lista-preguntas-examen");
  lista.innerHTML = "";
  preguntas.forEach((q, i) => {
    const tarjeta = document.createElement("article");
    tarjeta.className = "tarjeta-revision-abierta";
    const enunciado = document.createElement("h3");
    enunciado.textContent = `Pregunta ${i + 1}: ${q.pregunta}`;
    const respuesta = document.createElement("p");
    respuesta.textContent = respuestas[i] === null
      ? "Estado: sin responder (no suma ni resta)."
      : `Tu respuesta: ${textoRespuesta(q, respuestas[i])}`;
    const editar = document.createElement("button");
    editar.type = "button";
    editar.className = "btn btn-secundario";
    editar.textContent = respuestas[i] === null ? "Responder ahora" : "Cambiar respuesta";
    editar.addEventListener("click", () => {
      indice = i;
      mostrar("pantalla-test");
      pintarPregunta();
    });
    tarjeta.append(enunciado, respuesta, editar);
    lista.append(tarjeta);
  });
  const sinResponder = respuestas.filter((respuesta) => respuesta === null).length;
  $("estado-revision-examen").textContent = sinResponder
    ? `${sinResponder} pregunta${sinResponder === 1 ? "" : "s"} sin responder; no suman ni restan.`
    : "Todas las preguntas tienen respuesta.";
  mostrar("pantalla-revision-examen");
}

function iniciarAutoevaluacionExamen() {
  const abiertasRespondidas = preguntas
    .map((q, i) => ({ q, i }))
    .filter(({ q, i }) => esAbierta(q) && respuestas[i] !== null);
  if (!abiertasRespondidas.length) {
    terminar();
    return;
  }
  const lista = $("lista-revision-abierta");
  lista.innerHTML = "";
  abiertasRespondidas.forEach(({ q, i }) => {
    const tarjeta = document.createElement("article");
    tarjeta.className = "tarjeta-revision-abierta";
    const enunciado = document.createElement("h3");
    enunciado.textContent = `Pregunta ${i + 1}: ${q.pregunta}`;
    const tuRespuesta = document.createElement("p");
    tuRespuesta.textContent = `Tu respuesta: ${respuestas[i]}`;
    const modeloTitulo = document.createElement("strong");
    modeloTitulo.textContent = "Una posible solución";
    const modelo = document.createElement("pre");
    modelo.textContent = q.respuesta_modelo;
    const explicacion = document.createElement("p");
    explicacion.textContent = q.explicacion || "";
    const acciones = document.createElement("div");
    acciones.className = "acciones";
    [true, false].forEach((correcta) => {
      const boton = document.createElement("button");
      boton.type = "button";
      boton.className = "btn btn-secundario";
      boton.textContent = correcta ? "La considero correcta" : "Necesito repasarla";
      boton.disabled = evaluacionesManuales[i] !== null;
      if (evaluacionesManuales[i] === correcta) boton.classList.add("autoevaluacion-seleccionada");
      boton.addEventListener("click", () => {
        evaluacionesManuales[i] = correcta;
        pintarEstadoRevisionExamen();
        boton.parentElement.querySelectorAll("button").forEach((opcion) => {
          opcion.disabled = true;
          if (opcion === boton) opcion.classList.add("autoevaluacion-seleccionada");
        });
      });
      acciones.append(boton);
    });
    tarjeta.append(enunciado, tuRespuesta, modeloTitulo, modelo, explicacion, acciones);
    lista.append(tarjeta);
  });
  pintarEstadoRevisionExamen();
  mostrar("pantalla-autoevaluacion-examen");
}

function pintarEstadoRevisionExamen() {
  const indicesAbiertos = preguntas
    .map((q, i) => esAbierta(q) && respuestas[i] !== null ? i : -1)
    .filter((i) => i >= 0);
  const evaluadas = indicesAbiertos.filter((i) => evaluacionesManuales[i] !== null).length;
  const completas = evaluadas === indicesAbiertos.length;
  $("estado-revision-abierta").textContent = completas
    ? "Has evaluado todas las respuestas abiertas contestadas."
    : `Evalúa las respuestas abiertas contestadas para continuar (${evaluadas}/${indicesAbiertos.length}).`;
  $("btn-finalizar-revision").disabled = !completas;
  $("btn-finalizar-revision").textContent = completas ? "Finalizar y ver nota" : "Evalúa las respuestas abiertas";
}

function siguiente() {
  if (!respondida) return;
  if (esAbierta(preguntas[indice]) && modoTest === "estudio" && evaluacionesManuales[indice] === null) return;
  if (indice < totalPreguntas - 1) {
    indice++;
    pintarPregunta();
  } else {
    if (modoTest === "examen") iniciarRevisionExamen();
    else terminar();
  }
}

function saltarPregunta() {
  if (respondida) return;
  if (indice < totalPreguntas - 1) {
    indice++;
    pintarPregunta();
  } else if (modoTest === "examen") {
    iniciarRevisionExamen();
  } else {
    terminar();
  }
}

function insertarSimbolo(simbolo) {
  const campo = $("texto-respuesta-abierta");
  if (campo.disabled) return;
  const inicio = campo.selectionStart;
  const fin = campo.selectionEnd;
  campo.setRangeText(simbolo, inicio, fin, "end");
  campo.focus();
}

function renderizarPaletaAlgebra() {
  const paleta = $("paleta-algebra");
  paleta.innerHTML = "";
  SIMBOLOS_ALGEBRA.forEach((simbolo) => {
    const boton = document.createElement("button");
    boton.type = "button";
    boton.className = "simbolo-algebra";
    boton.textContent = simbolo;
    boton.setAttribute("aria-label", `Insertar ${simbolo}`);
    boton.addEventListener("mousedown", (e) => e.preventDefault());
    boton.addEventListener("click", () => insertarSimbolo(simbolo));
    paleta.append(boton);
  });
}

function enviarRespuestaAbierta() {
  guardarRespuestaAbierta();
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
    if (esCorrecta(i, q)) acum[k].ok++;
  });
  destino.innerHTML = "";
  Object.keys(acum)
    .sort()
    .forEach((k) => {
      const etiqueta = clave === "tema" ? nombreTema(k) : etiquetas[k] || String(k);
      destino.append(filaDesglose(etiqueta, acum[k].ok, acum[k].total));
    });
}

function textoOpcion(q, letra) {
  const o = q.opciones.find((x) => x.letra === letra);
  return o ? `${o.letra}) ${o.texto}` : "(sin responder)";
}

function textoRespuesta(q, respuesta) {
  if (esAbierta(q)) return respuesta || "(sin respuesta)";
  return textoOpcion(q, respuesta);
}

function terminar() {
  const aciertos = aciertosHastaAhora();
  const fallos = fallosHastaAhora();
  const sinResponder = respuestas.filter((respuesta) => respuesta === null).length;
  const penalizacion = modoTest === "examen" ? (fallos / 3) : 0;
  const nota = Math.max(0, ((aciertos - penalizacion) / totalPreguntas) * 10);

  const historial = leerHistorial();
  const previa = media(historial);
  const tenia = historial.length;
  historial.push({
    fecha: new Date().toISOString(),
    nota: Math.round(nota * 100) / 100,
    aciertos,
    total: totalPreguntas,
    modo: modoTest,
    asignatura: asignaturaActual.nombre,
    test: testActual.nombre,
  });
  const guardado = guardarHistorial(historial);

  $("titulo-resultado").textContent = `${asignaturaActual.nombre} - ${testActual.nombre}`;
  $("progreso-barra").style.width = "100%";
  $("nota-numero").textContent = formatoNota(nota);
  $("nota-detalle").textContent = modoTest === "examen"
    ? `Modo examen: ${aciertos} aciertos, ${fallos} fallos y ${sinResponder} sin responder. Penalización: ${formatoNota((penalizacion / totalPreguntas) * 10)} puntos.`
    : `${aciertos} aciertos, ${fallos} fallos y ${sinResponder} sin responder de ${totalPreguntas} preguntas.`;

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
  const falladas = preguntas.map((q, i) => ({ q, i })).filter(({ q, i }) => respuestas[i] !== null && !esCorrecta(i, q));
  const pendientes = preguntas.map((q, i) => ({ q, i })).filter(({ i }) => respuestas[i] === null);
  const revision = modoTest === "examen" ? preguntas.map((q, i) => ({ q, i })) : [...falladas, ...pendientes];
  $("titulo-falladas").textContent = modoTest === "examen"
    ? `Revisión del examen (${revision.length} preguntas)`
    : revision.length ? `Falladas o sin responder (${revision.length})` : "Preguntas falladas";
  if (!revision.length) {
    const p = document.createElement("p");
    p.textContent = "¡Has acertado todas las preguntas contestadas!";
    lista.append(p);
  }
  revision.forEach(({ q, i }) => {
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
    tu.textContent = "Tu respuesta: " + textoRespuesta(q, respuestas[i]);
    const ok = document.createElement("p");
    ok.className = "ok";
    ok.textContent = esAbierta(q)
      ? "Una posible solución: " + q.respuesta_modelo
      : "Correcta: " + q.respuestas_correctas.map((l) => textoOpcion(q, l)).join(" · ");
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
  if (e.target instanceof HTMLTextAreaElement || e.target instanceof HTMLInputElement) return;
  const k = e.key.toUpperCase();
  if (!respondida || modoTest === "examen") {
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
  if (asignaturaActual && asignaturaActual.id === "aic") {
    $("modos-dificultad").hidden = true;
    $("estado-banco").hidden = true;
    $("intro-aic").hidden = false;
    $("texto-modo-ayuda").hidden = true;
  } else {
    empezar();
  }
}));
$("btn-comenzar-aic").addEventListener("click", empezar);
$("btn-cambiar-cantidad-aic").addEventListener("click", () => {
  $("intro-aic").hidden = true;
  $("texto-modo-ayuda").hidden = false;
  $("modos-dificultad").hidden = false;
  $("estado-banco").hidden = false;
});
$("btn-siguiente").addEventListener("click", siguiente);
$("btn-saltar").addEventListener("click", saltarPregunta);
$("btn-enviar-abierta").addEventListener("click", enviarRespuestaAbierta);
$("btn-volver-examen").addEventListener("click", () => {
  indice = 0;
  mostrar("pantalla-test");
  pintarPregunta();
});
$("btn-entregar-examen").addEventListener("click", iniciarAutoevaluacionExamen);
$("btn-finalizar-revision").addEventListener("click", terminar);
$("btn-menu").addEventListener("click", abrirMenu);
$("btn-cerrar-menu").addEventListener("click", cerrarMenu);
$("cerrar-menu-fondo").addEventListener("click", cerrarMenu);
$("btn-menu-perfil").addEventListener("click", () => {
  cerrarMenu();
  pintarPerfil();
  mostrar("pantalla-perfil");
});
$("btn-menu-asignaturas").addEventListener("click", () => {
  cerrarMenu();
  mostrar("pantalla-asignaturas");
  pintarHistorial();
});
$("btn-perfil-asignaturas").addEventListener("click", () => {
  mostrar("pantalla-asignaturas");
  pintarHistorial();
});
document.addEventListener("keydown", (e) => {
  if (e.key === "Escape" && !$("fondo-menu").hidden) {
    cerrarMenu();
    $("btn-menu").focus();
  }
});
$("btn-modo-test").addEventListener("click", () => {
  if (!$("pantalla-test").hidden) return;
  modoTest = modoTest === "estudio" ? "examen" : "estudio";
  actualizarBotonModo();
  pintarHistorial();
});
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
  pintarNombrePerfil();
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
    pintarPerfil();
  }
});
document.addEventListener("sesion-actualizada", (e) => {
  const user = e.detail && e.detail.user;
  pintarNombrePerfil(user);
  if (user) {
    modoInvitado = false;
    mostrar("pantalla-asignaturas");
    pintarHistorial();
  } else if (!modoInvitado) {
    mostrar("pantalla-login");
  }
});

renderizarAsignaturas();
renderizarMenu();
renderizarPaletaAlgebra();
pintarHistorial();
