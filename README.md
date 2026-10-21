# Banco de Tests Universitarios

Aplicación web para practicar con **tests tipo examen**, organizada por asignaturas. Eliges una asignatura, accedes a sus tests y la app genera un cuestionario aleatorio, lo corrige al momento y calcula tu nota.

---

##  Funciones

### Selección de asignatura
- Pantalla inicial con las asignaturas disponibles.
- Al elegir una asignatura se accede a la lista de **tests** de esa asignatura.
- Actualmente disponible: **POO (Programación Orientada a Objetos)**.

### Tests
- Cada test tiene su propio banco de preguntas en un archivo `.json`.
- En cada intento la app **selecciona 30 preguntas al azar** del banco, así que cada intento es distinto.
- Las **opciones se mezclan** en cada pregunta.
- Barra de progreso y contador (`Pregunta X de 30`).
- **Corrección inmediata**: la respuesta correcta se marca en verde y la incorrecta en rojo.
- Preguntas con **fragmentos de código** para analizar, y compatibilidad con imágenes.
- **Nota final sobre 10** y número de aciertos al terminar.
- Botón para **repetir el test** con una nueva selección de preguntas.
- Diseño adaptable a móvil.

### Test disponible: POO (Temas 1–3)
Banco de **200 preguntas** de dificultad media-alta basadas en los temas de la asignatura:

| Tema | Contenido |
|------|-----------|
| 1 | Introducción a la POO (abstracción, encapsulación, jerarquías, modularidad, tipado, UML…) |
| 2 | Introducción al lenguaje Java (tipos, control de flujo, clases, arrays, paquetes…) |
| 3 | Herencia y polimorfismo (herencia, sobrescritura, clases abstractas, interfaces…) |

Tipos de pregunta:
- **Test conceptual**: teoría y definiciones.
- **Análisis de código**: ¿qué imprime?, ¿compila?, ¿qué excepción se lanza? Las preguntas de código se han comprobado compilándolas y ejecutándolas con Java 21.
- **Estructura de Java**: sintaxis, modificadores, paquetes, arrays.
- **Diseño y UML**.

---

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


