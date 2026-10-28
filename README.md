# Banco de Tests Universitarios

Aplicación web para practicar con **tests tipo examen**, organizada por asignaturas. Eliges una asignatura, accedes a sus tests y la app genera un cuestionario aleatorio, lo corrige al momento y calcula tu nota.

---

##  Funciones

### Selección de asignatura
- Pantalla inicial con las asignaturas disponibles.
- Al elegir una asignatura se accede a la lista de **tests** de esa asignatura.
- Actualmente disponible:
-  **POO (Programación Orientada a Objetos)**.
-  **AIC (Arquitectura e Ingeniería de Computadores)**
-  **F.WEB (Fundamentos de la WEB)**

### Tests
- Cada test tiene su propio banco de preguntas en un archivo `.json`.
- En cada intento puedes elegir **10 preguntas (fácil), 20 (medio) o 30 (completo)**; las preguntas se seleccionan al azar del banco.
- Las **opciones se mezclan** en cada pregunta.
- Barra de progreso y contador ajustados al modo elegido (`Pregunta X de N`).
- **Corrección inmediata**: la respuesta correcta se marca en verde y la incorrecta en rojo.
- Preguntas con **fragmentos de código** para analizar, y compatibilidad con imágenes.
- **Nota final sobre 10** y número de aciertos al terminar.
- Botón para **repetir el test** con una nueva selección de preguntas.
- Diseño adaptable a móvil.

# Bancos de preguntas disponibles

Cada asignatura tiene su propio archivo JSON, con el mismo formato 

| Asignatura | Archivo | Preguntas |
|---|---|---:|
| POO (Temas 1–3) | `preguntas.json` | 200 |
| FW · JavaScript y Node (Temas 1–5) | `preguntas_fw_js_node.json` | 261 |
| AIC · Arquitectura e Ingeniería de Computadores (Tema 1) | `preguntas_aic_tema1.json` | 50 |

---

## POO (Temas 1–3)

Banco de 200 preguntas de dificultad media-alta basadas en los temas de la asignatura.

| Tema | Contenido |
|---|---|
| 1 | Introducción a la POO (abstracción, encapsulación, jerarquías, modularidad, tipado, UML…) |
| 2 | Introducción al lenguaje Java (tipos, control de flujo, clases, arrays, paquetes…) |
| 3 | Herencia y polimorfismo (herencia, sobrescritura, clases abstractas, interfaces…) |

### Tipos de pregunta

- **Test conceptual:** teoría y definiciones.
- **Análisis de código:** ¿qué imprime?, ¿compila?, ¿qué excepción se lanza? Las preguntas de código se han comprobado compilándolas y ejecutándolas con Java 21.
- **Estructura de Java:** sintaxis, modificadores, paquetes y arrays.
- **Diseño y UML.**

---

## FW · Fundamentos de la Web: JavaScript y Node (Temas 1–5)

Banco de 261 preguntas basadas en el Bloque III de la asignatura (tecnologías de servidor web), con un reparto de 72 fáciles, 142 medias y 47 difíciles.

| Tema | Contenido | Preguntas |
|---|---|---:|
| 1 | Introducción a JavaScript y Node.js (ECMAScript, navegador frente a runtime, V8, NPM, LTS, modelo no bloqueante…) | 27 |
| 2 | Lenguaje JavaScript (tipado dinámico, arrays, valores falsos, funciones, closures, arrow functions, objetos, clases, excepciones…) | 106 |
| 3 | Estructuras de datos (`Array`, `Set` y `Map`, recorridos, ordenación, búsqueda, eficiencia…) | 65 |
| 4 | Módulos ESM (`export`, `import`, `export default`, `import * as`, módulos en navegador y en Node…) | 31 |
| 5 | Módulos en Node (módulos incluidos, `fs`, NPM, `package.json`, CommonJS frente a ESM, lodash…) | 32 |

### Tipos de pregunta

- **Teoría (158):** definiciones y características del lenguaje y de Node.
- **Análisis de código (51):** ¿qué muestra por consola? Incluye programas de varios archivos con módulos.
- **Encontrar el error (52):** qué falla en un fragmento de código y por qué.

Todas las preguntas de análisis de código y de errores se han comprobado ejecutándolas con Node.js 22.

---

## AIC · Arquitectura e Ingeniería de Computadores (Tema 1)

Banco de 50 preguntas del Tema 1 de la asignatura, con 18 fáciles, 19 medias y 13 difíciles.

| Tema | Contenido |
|---|---|
| 1 | Introducción a la arquitectura e ingeniería de computadores (arquitectura frente a organización, repertorio de instrucciones, von Neumann y Harvard, RISC y CISC, rendimiento, jerarquía de memoria, ley de Moore…) |

### Tipos de pregunta

- **Test conceptual:** clasificar decisiones de diseño como cuestiones de arquitectura o de organización, y teoría del tema.
- **Cálculo:** tiempo de CPU (`T = N · CPI / f`) y ley de Amdahl.

---

## Cómo añadir un banco nuevo

1. Crea un archivo JSON con el formato anterior (4 opciones por pregunta y una sola respuesta correcta).
2. Usa un `asignatura` propio y numera los temas desde 1.
3. Para las preguntas con código, rellena el campo `codigo` y, si es posible, ejecútalas antes para comprobar la respuesta.
4. Reparte las respuestas correctas entre A, B, C y D y evita que la correcta sea siempre la opción más larga.
##  Estructura del proyecto

Esto es secreto

## Cómo usarla

La app carga las preguntas con `fetch`, por lo que **no funciona abriendo `index.html` con doble clic** (`file://`). Hay que servirla con un servidor local:

```bash
# Con Python
python3 -m http.server 8000

# o con Node
npx serve .
```

Después abre `http://localhost:8000` en el navegador.

También puede publicarse tal cual en **GitHub Pages**.

---

##  Formato de las preguntas

Cada pregunta del archivo JSON sigue esta estructura:

```json
{
  "id": 1,
  "tema": 3,
  "tipo": "codigo",
  "diapositiva": "T3-S27",
  "pregunta": "¿Qué imprime el siguiente programa?",
  "imagen": "",
  "codigo": "public class Main { ... }",
  "opciones": [
    { "letra": "A", "texto": "..." },
    { "letra": "B", "texto": "..." },
    { "letra": "C", "texto": "..." },
    { "letra": "D", "texto": "..." }
  ],
  "respuestas_correctas": ["B"],
  "explicacion": "Por qué esta es la respuesta correcta."
}
```

| Campo | Descripción |
|-------|-------------|
| `pregunta` | Enunciado. |
| `codigo` | Fragmento de código opcional (cadena vacía si no hay). |
| `imagen` | Ruta de imagen opcional. |
| `opciones` | Lista de opciones con `letra` y `texto`. |
| `respuestas_correctas` | Letra(s) de la opción correcta. |
| `tema`, `tipo`, `diapositiva`, `explicacion` | Metadatos para clasificar y revisar. |

---

##  Cómo añadir un nuevo test o asignatura

Te jodes, las creo yo, no me toquéis la base de datos. 

## Próximas actualizaciones

- [ ] Nuevos tests de **POO** (por temas o por bloques).
- [ ] Más **asignaturas** en la pantalla de selección.
- [ ] Mostrar la **explicación** de cada respuesta tras contestar.
- [ ] **Resumen final** con desglose por tema y tipo de pregunta.
- [ ] Lista de **preguntas falladas** para repasarlas.
- [ ] **Media histórica** de tus notas guardada en el navegador.
- [ ] Elegir el **número de preguntas** y filtrar por tema o tipo.
- [ ] Modo **examen** con temporizador.
- [ ] Modo **repaso** sin nota.
- [ ] Modo Aitor donde todas las preguntas vienen ya con la respuesta
- [ ] Modo Nuzlocke: Pues eliges a tu inicial (Preferiblemente mudkid) y te aventuras a la 3 gen. Los primeros gym caen fácil pero un puto Azumarill mata a la mitad de tu equipo antes del 3 gym.
- [ ] Añadiremos un emulador de consolas de nintendo por que no
- [ ] Función tinder.



## Tecnologías

HTML5 · CSS3 · JavaScript (vanilla) · JSON

## Licencia
Me da igual lo que hagáis con esto la verdad solo es un proyecto personal.


