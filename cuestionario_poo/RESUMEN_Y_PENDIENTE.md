# Cuestionario POO – resumen y estado (TERMINADO)

## Petición original
App de test de POO más difícil: ~200 preguntas de los 3 PDFs (Tema 1 POO, Tema 2 Java, Tema 3 Herencia y polimorfismo), icono ABC → test conceptual sin código, cerebro → test o código, sin icono → cualquiera. La app elige 30 al azar y calcula nota/media. Correcta no siempre la más larga. Categorías a elección.

## Estado final
- `preguntas.json`: 200 preguntas (T1=59, T2=72, T3=69). Tipos: 101 concepto (`test`), 49 código, 20 estructura de Java, 19 diseño/UML, 11 sintaxis y operadores.
- Las 49 de código se compilan y ejecutan con Java 21 (`fuentes/verificar_codigo.py`): todas coinciden con la respuesta marcada.
- Sesgo de longitud corregido (`fuentes/patch.py`): la correcta es estrictamente la más larga en el 18 % de las preguntas no-código (antes 44 %). Letra correcta equilibrada 50/50/50/50 en el banco; la app además mezcla las opciones en cada intento.
- Recategorizadas las preguntas ABC de sintaxis/estructura a `estructura`, `sintaxis` y `diseno`.
- App: `index.html`, `estilos.css`, `script.js` (30 al azar, opciones mezcladas y reetiquetadas A–D, explicación tras responder, badge de tema/tipo, nota sobre 10, desglose por tipo y tema, media histórica en `localStorage`, lista de falladas, atajos de teclado, modo oscuro).

## Cómo usarla
`fetch` necesita servidor: desde esta carpeta, `python3 -m http.server` y abrir http://localhost:8000.

## Avisos
- Algunas diapositivas tienen errores (rangos de `short`, tamaño de `float`, "@override", "7 tipos primitivos"); en las preguntas se usó la semántica correcta de Java.
- ABC = preguntas conceptuales sin fragmento de código; el código solo sale de diapositivas cerebro o sin icono.
- Los scripts originales de generación (`build.py`, `q_t*.py`) no estaban en esta sesión; `fuentes/preguntas_borrador.json` es el punto de partida y `patch.py` aplica las correcciones.
- La app se ha probado con un DOM simulado (no en un navegador real).
