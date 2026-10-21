#!/usr/bin/env python3
"""Aplica correcciones de longitud y recategorización a preguntas_borrador.json -> preguntas_v2.json."""
import json, sys, collections

SRC = sys.argv[1]
DST = sys.argv[2]

# id -> {letra: nuevo texto}. Se reequilibra la longitud sin tocar cuál es la correcta.
TXT = {
 166: {"B": "No, salvo que el método acelerate de Car se declare private, en cuyo caso SportsCar tampoco podría sobrescribirlo",
       "C": "Sí, escribiendo super.acelerate() directamente desde el código del cliente que usa el objeto SportsCar",
       "D": "No: ni con una referencia de tipo Car, porque se ejecuta la versión del objeto real; solo SportsCar puede invocarla con super"},
 38: {"A": "Un objeto tiene identidad propia que lo distingue de otros y un estado interno que puede cambiar con el tiempo",
      "B": "Un objeto puede recibir mensajes de otros objetos y responder a ellos ejecutando sus métodos",
      "C": "Un objeto tiene un comportamiento bien definido, determinado por los métodos de su interfaz"},
 41: {"A": "En la orientada a objetos la pila se pasa por valor y en la funcional siempre por referencia al programa principal",
      "B": "En la funcional la pila no puede tener estado interno, mientras que en la orientada a objetos sí puede tenerlo",
      "C": "En la orientada a objetos el método forma parte de la interfaz de la abstracción; en la funcional es una función independiente",
      "D": "En la orientada a objetos push solo puede definirse una vez en todo el programa, aunque haya varias pilas"},
 199: {"A": "El compilador, que genera una implementación vacía por defecto para que el programa pueda compilar sin errores",
       "B": "El cliente que crea los objetos, que lo pasa como parámetro al constructor de cada objeto derivado",
       "C": "Las clases derivadas; cada una define su comportamiento y se invoca por polimorfismo desde una referencia a Car",
       "D": "La propia clase Car, que lo define una sola vez y todas las derivadas lo reutilizan sin cambios"},
 121: {"A": "jar, que empaqueta las clases compiladas en un único fichero comprimido",
       "B": "javac, que compila el código fuente a bytecode",
       "C": "javadoc, que lee los comentarios /** ... */",
       "D": "javap, que desensambla ficheros .class para mostrar su contenido"},
 49: {"A": "Fijarse en los nombres que aparecen en la descripción del problema para localizar posibles clases",
      "B": "Modelar fielmente la realidad completa, incluidos detalles que el programa no usará",
      "C": "Pensar en los elementos que almacenan los datos del problema, ya sean persistentes o transitorios",
      "D": "Pensar en las partes en que se divide el programa y en las responsabilidades de cada una"},
 112: {"A": "Asignar a la propiedad length el valor 30 para ampliar el array a la nueva capacidad",
       "B": "Llamar al método resize(30) de la clase array para ampliar su capacidad",
       "C": "Escribir en la posición 29 del array, que se amplía automáticamente al superar su tamaño",
       "D": "Crear un array nuevo mayor y copiar el contenido; un array no se puede redimensionar"},
 108: {"A": "Por valor: se copia la referencia, así que el método modifica el objeto pero no a qué objeto apunta la variable del cliente",
       "B": "Por referencia: el método puede hacer que la variable del cliente apunte a otro objeto distinto del original",
       "C": "Por valor: se copia el objeto entero, y los cambios del método no afectan al objeto original del cliente",
       "D": "Depende de si el objeto es mutable: los mutables por referencia y los inmutables por valor, como String"},
 193: {"A": "Clase final, que no admite subclases",
       "B": "Clase interna, definida dentro de otra clase",
       "C": "Clase abstracta pura",
       "D": "Clase concreta, con todos sus métodos implementados"},
 53: {"A": "Declarar los precios como constantes estáticas en la clase SiemensAPI que proporciona el fabricante de la báscula",
      "B": "Usar un switch en el programa principal con un caso por cada posición devuelta por getProduct de la báscula",
      "C": "Escribir una subclase por cada producto con su precio fijado directamente en el código fuente de cada clase",
      "D": "Cargar al arrancar nombres, precios por kilo e imágenes desde ficheros, creando un objeto por producto"},
 198: {"A": "Elige la implementación de la última interfaz de la lista, que sobrescribe a las anteriores sin avisar",
       "B": "Detecta el problema del diamante y obliga a implementar el método conflictivo en la clase derivada",
       "C": "Elige la implementación de la primera interfaz de la lista de implements y descarta las demás",
       "D": "Ejecuta ambas implementaciones, una detrás de otra, siguiendo el orden alfabético de las interfaces"},
 179: {"A": "El método acelerate, porque modifica la propiedad privada speed que no es visible desde SportsCar",
       "B": "Ningún miembro de Car, porque todo lo heredado debe redeclararse en la clase derivada antes de usarse",
       "C": "La propiedad speed directamente, aunque sí puede usar los métodos públicos que la modifican",
       "D": "El método getSpeed, porque devuelve el valor de una propiedad privada de la clase base"},
 165: {"A": "Para que el método se pueda invocar sin crear ningún objeto de la clase que lo contiene",
       "B": "Para permitir que el método tenga distinto nombre del método que sobrescribe en la clase base",
       "C": "Para eliminar el método de la clase base, de modo que deje de existir en toda la jerarquía",
       "D": "Para indicar que sobrescribe un método de la clase base: el compilador comprueba que exista"},
 181: {"A": "Provoca un error de compilación, porque en Java las propiedades de una clase no pueden ser públicas",
       "B": "Rompe la encapsulación: cualquier cliente puede modificarla sin respetar los invariantes",
       "C": "Provoca que speed se comparta entre todos los objetos de la clase, como si fuera estática",
       "D": "Impide que las subclases de Car puedan acceder a speed aunque estén en el mismo paquete"},
 105: {"A": "Compila, pero Rueda solo es visible desde el mismo paquete en el que se encuentra Coche",
       "B": "Compila: cada clase pública genera su propio fichero .class con el nombre de la clase correspondiente",
       "C": "No compila: un fichero no puede contener más de una clase, sea o no pública, ni siquiera internas",
       "D": "No compila: solo puede haber una clase pública por fichero, con el nombre del fichero"},
 127: {"A": "Se vuelve inmutable una vez inicializada en el constructor, igual que si se declarase final",
       "B": "Se excluye de la serialización cuando el objeto se guarda en un fichero o base de datos",
       "C": "Se mantiene en memoria principal y no en la caché del procesador, evitando problemas con hilos",
       "D": "Se comparte entre todos los objetos de la clase, igual que ocurre con una propiedad estática"},
 172: {"A": "Cuando la base solo fija la operación y cada clase derivada debe aportar su comportamiento",
       "B": "Cuando se quiere que el método pueda invocarse sin crear ningún objeto de la clase que lo declara",
       "C": "Cuando el método debe ejecutarse en un hilo independiente del resto de métodos de la clase",
       "D": "Cuando se quiere impedir que las clases derivadas sobrescriban la operación de la clase base"},
 130: {"A": "Para interrumpir el switch y continuar con la sentencia que haya justo después de él, igual que break",
       "B": "Para devolver un valor desde un bloque de un caso como resultado del switch",
       "C": "Para saltar al siguiente caso sin comprobar su condición, como hace un caso sin break",
       "D": "Para ceder la ejecución a otro hilo mientras se evalúa el caso, devolviendo luego el control"},
 186: {"A": "El polimorfismo: la referencia a Car apunta a objetos derivados y cada uno ejecuta su brake",
       "B": "La sobrecarga: Java crea automáticamente una versión de stopCar por cada subclase de Car existente",
       "C": "La herencia múltiple: todas las subclases comparten el mismo método brake heredado de Object",
       "D": "La encapsulación: stopCar accede directamente a la propiedad speed de cada clase derivada"},
 110: {"A": "Compila, pero lanza una excepción en ejecución por falta de argumentos al crear el objeto",
       "B": "Compila y velInicial vale 0, que es el valor por defecto de los enteros en Java",
       "C": "Compila: Java siempre añade además el constructor por defecto sin parámetros a la clase",
       "D": "No compila: al definir un constructor, Java ya no añade el constructor por defecto"},
 171: {"A": "Porque en ejecución el objeto apuntado por c no es de tipo SportsCar sino de otro tipo derivado",
       "B": "Porque solo se pueden invocar los métodos del tipo de la referencia, y Car no tiene turbo",
       "C": "Porque c no se ha inicializado con un objeto creado con new y vale null",
       "D": "Porque turbo() es un método sobrescrito y no puede invocarse desde una referencia de la clase base"},
 97: {"A": "Primero se define la clase (interfaz e implementación) y luego se crean tantos objetos como se desee",
      "B": "Cada clase puede crear como máximo un objeto, que representa a todas las instancias de ella",
      "C": "Los objetos se definen primero y de ellos se deduce la clase a la que pertenecen todos",
      "D": "Una clase solo existe en memoria mientras existan objetos creados a partir de ella en el programa"},
 200: {"A": "Compila, porque SportsCar hereda todos los miembros de Car, privados incluidos, aunque no los vea",
       "B": "Error de compilación: los miembros privados de la base no son visibles en la derivada",
       "C": "Compila, pero lanza una excepción cuando se ejecuta el método turbo por acceso indebido",
       "D": "Compila si SportsCar y Car están en el mismo paquete, al ser accesibles los miembros privados"},
 197: {"A": "Para que las interfaces puedan heredar de varias clases a la vez sin problemas de ambigüedad",
       "B": "Para añadir un método a una interfaz sin modificar las clases que ya la implementan",
       "C": "Para impedir que las clases que implementan la interfaz sobrescriban sus métodos",
       "D": "Para permitir que las interfaces tengan propiedades de instancia con valor inicial propio"},
 114: {"A": "Los paquetes contienen lógicamente a los ficheros y se corresponden con los directorios físicos",
       "B": "Cada paquete se corresponde con un único fichero que contiene todas las clases del mismo",
       "C": "Los paquetes son independientes de los directorios y se definen en un fichero de configuración aparte",
       "D": "Cada directorio es un paquete, pero un paquete no puede contener a otros paquetes dentro"},
 168: {"A": "No son visibles al cliente: SportsCar declara los suyos y puede llamar a Car(int) con super",
       "B": "Se heredan únicamente cuando Car y SportsCar están en el mismo paquete de la aplicación",
       "C": "Se heredan, pero solo si SportsCar los redeclara usando la palabra reservada extends",
       "D": "Se heredan, y el cliente puede escribir new SportsCar(120) directamente sin definir ningún constructor"},
 129: {"A": "Para indicar los directorios desde los que la JVM localiza los paquetes de clases",
       "B": "Para indicar en qué paquete se encuentra la clase que contiene el método main del programa",
       "C": "Para indicar el directorio donde se guarda el compilador javac y el resto de herramientas",
       "D": "Para indicar la versión del JDK con la que se compiló cada uno de los paquetes"},
 188: {"A": "Comparten métodos comunes sin duplicar código y los usuarios aprenden una sola interfaz",
       "B": "Obliga a que todos los algoritmos tengan la misma complejidad computacional en el caso medio",
       "C": "Impide que un algoritmo concreto pueda modificar el orden de los elementos del array",
       "D": "Permite que dos algoritmos se ejecuten a la vez sobre el mismo array sin interferirse"},
 91: {"A": "a++ solo puede usarse como sentencia independiente y ++a únicamente dentro de expresiones",
      "B": "No hay ninguna diferencia: la variable acaba con el mismo valor y la expresión también lo toma",
      "C": "a++ aporta el valor anterior y luego incrementa; ++a incrementa y aporta el nuevo valor",
      "D": "a++ incrementa antes de evaluar la expresión y ++a la incrementa después de evaluarla"},
 51: {"A": "Ponerlo siempre como público, porque es el significado que menos errores provoca en la práctica",
      "B": "Ponerlo, porque un adorno incorrecto siempre es mejor que un diagrama sin ningún adorno",
      "C": "Ponerlo y corregirlo después en la implementación, que prevalece sobre lo indicado en el diagrama",
      "D": "No ponerlo, aunque la ausencia de adornos denote un diseño pobre: no da instrucciones equivocadas"},
 182: {"A": "Para que sus métodos se ejecuten en un hilo independiente del resto del programa",
       "B": "Para que nadie derive de una clase inmutable y la haga mutable, reforzando una decisión de diseño",
       "C": "Para que sus objetos se almacenen en la pila en lugar de en el montón de memoria",
       "D": "Para que los objetos String no puedan ser asignados a variables de tipo Object"},
 160: {"A": "Porque una subclase no podría sobrescribir métodos que heredase de dos padres a la vez sin conflicto",
       "B": "Para evitar el problema del diamante: la ambigüedad al invocar un método definido en dos puntos",
       "C": "Porque la clase Object ya es padre de todas y no puede haber dos raíces en un mismo árbol de herencia",
       "D": "Porque obligaría a que todas las clases con varios padres fueran abstractas para poder compilar"},
 37: {"A": "Clonando un objeto modelo (prototipo) sobre el que ya se definió el comportamiento",
      "B": "Heredando de Object y copiando solo sus propiedades privadas al nuevo objeto",
      "C": "Importando una interfaz que declare los métodos del nuevo objeto en un fichero aparte",
      "D": "Instanciando una clase abstracta mediante la palabra new y una lista de métodos"},
 119: {"C": "atomic"},
 125: {"A": "Solo funciona con clases que implementan la interfaz Serializable y que están en un paquete",
       "B": "No se sabe cuándo se ejecutará, porque depende del recolector de basura",
       "C": "Impide que el recolector de basura libere nunca la memoria del objeto que lo declara",
       "D": "Se ejecuta siempre tras cada llamada a método, ralentizando de forma notable el programa"},
 116: {"A": "Permite usar sin nombre completo todos los tipos del paquete vehiculos, incluidos los de camiones",
       "B": "Permite usar sin nombre completo los tipos de vehiculos.camiones, pero no los de sus subpaquetes",
       "C": "Permite usar solo la clase Camion, que es la que da nombre al paquete importado",
       "D": "Permite usar sin nombre completo los tipos de vehiculos.camiones y de todos sus subpaquetes"},
 52: {"A": "No se puede limitar la capacidad máxima de la pila, que crece de forma indefinida al hacer Push",
      "B": "El procedimiento Init impide que se creen varias pilas en el mismo programa principal",
      "C": "Las funciones Size y Empty no pueden consultarse sin haber llamado antes a Pop sobre la pila",
      "D": "Cualquier cliente puede modificar s.top o s.content y romper el invariante de la pila"},
 8: {"C": "Distingue las características esenciales de un objeto y fija límites conceptuales relativos a quien lo observa"},
 175: {"A": "Es una clase abstracta pura sin propiedades de instancia; sus métodos son públicos por defecto",
       "B": "Puede declarar propiedades de instancia con valor inicial, y sus métodos son protegidos por defecto",
       "C": "Debe implementar al menos un método con cuerpo para poder ser implementada por una clase",
       "D": "Puede heredar de varias clases abstractas con la palabra reservada extends a la vez"},
 157: {"A": "Hace que los cambios futuros de Stack no afecten nunca a la clase derivada que se añade",
       "B": "Permite acceder a la implementación privada de Stack para optimizar el método toArray",
       "C": "Obliga al compilador a verificar que toArray no modifica el estado de la clase Stack"},
 96: {"A": "Que las variables declaradas en el cuerpo siguen siendo visibles tras el bucle, fuera de su ámbito",
      "B": "Que el bucle termina siempre, porque la condición se comprueba al final de cada vuelta",
      "C": "Que la condición se evalúa antes de cada iteración, incluida la primera, como en un while",
      "D": "Que el cuerpo se ejecuta al menos una vez, aunque la condición sea falsa desde el inicio"},
 161: {"A": "Solo desde las clases del mismo paquete, aunque no hereden de la clase que lo declara",
       "B": "Solo desde la propia clase y las que heredan de ella, sin importar el paquete en que estén",
       "C": "Desde la propia clase, sus clases derivadas y las clases del mismo paquete",
       "D": "Desde cualquier clase del programa, igual que un miembro public, sin ninguna restricción"},
 118: {"A": "Ninguna: todos los arrays deben dimensionarse por completo en el momento de crearse con new",
       "B": "Ambas: new int[][] es válido y se dimensiona después al asignar los valores a las filas",
       "C": "La segunda: new int[2][] es válido, y cada fila se crea después con su propio tamaño",
       "D": "La primera: new int[][3] es válido, y el número de filas se deduce después al rellenarlo"},
 102: {"A": "Para referirse a la clase padre y poder invocar sus métodos sobrescritos desde la clase hija",
       "B": "Para referirse a la clase en lugar de al objeto y acceder a sus miembros estáticos",
       "C": "Para crear una copia del objeto actual y devolverla al cliente que invocó el método",
       "D": "Para referirse al propio objeto, por ejemplo para pasárselo a otro como parámetro"},
 190: {"A": "Puede ejecutar a la vez la operación de todos los botones con una sola llamada a doOperation",
       "B": "No necesita conocer qué hace cada botón: solo invoca doOperation cuando se pulsa",
       "C": "Evita tener que crear una subclase de Button por cada operación distinta de la aplicación",
       "D": "Impide que dos botones tengan el mismo icono dentro de la barra de herramientas"},
 187: {"A": "Que CorrectText modifique las propiedades privadas de Text para ajustar su comportamiento interno",
       "B": "Que un cliente que use objetos Text use objetos CorrectText sin saberlo",
       "C": "Que Text deje de poder usarse porque queda sustituida por su clase derivada en el programa",
       "D": "Que insertWord se ejecute en un hilo independiente del resto del programa para ir más rápido"},
 45: {"A": "Con una llamada al sistema operativo llamada fork que divide la línea de ejecución",
      "B": "Con la herencia de una clase base llamada Thread que aporta el propio lenguaje",
      "C": "Con constructores especiales que crean un hilo de ejecución por cada objeto que se instancia",
      "D": "Con la palabra reservada synchronized que el propio lenguaje proporciona desde su primera versión"},
 28: {"A": "Megane solo hereda la declaración de los métodos de Renault y debe implementarlos todos de nuevo",
      "B": "Megane tiene todos los métodos y propiedades de Renault y puede modificar el comportamiento de alguno",
      "C": "Megane hereda los métodos de Renault pero no sus propiedades, que quedan ocultas al heredar",
      "D": "Megane no puede añadir métodos nuevos, porque la herencia fija la interfaz completa de Renault"},
}

# Recategorización (categorías: test=conceptos, codigo, diseno=UML/diseño, estructura=Java: estructura y herramientas, sintaxis=tipos, operadores y control)
ESTRUCTURA = [82, 85, 86, 87, 99, 101, 105, 109, 110, 111, 112, 113, 114, 115, 116, 129, 117, 118, 119, 121]
SINTAXIS = [88, 89, 90, 91, 92, 93, 94, 95, 96, 100, 130]
DISENO = [18, 19, 23, 24, 27, 35, 55, 173, 177, 51]

qs = json.load(open(SRC, encoding="utf-8"))
byid = {q["id"]: q for q in qs}

for qid, cambios in TXT.items():
    q = byid[qid]
    for o in q["opciones"]:
        if o["letra"] in cambios:
            o["texto"] = cambios[o["letra"]]

for qid in ESTRUCTURA:
    if byid[qid]["tipo"] != "codigo":
        byid[qid]["tipo"] = "estructura"
for qid in SINTAXIS:
    if byid[qid]["tipo"] != "codigo":
        byid[qid]["tipo"] = "sintaxis"
for qid in DISENO:
    if byid[qid]["tipo"] != "codigo":
        byid[qid]["tipo"] = "diseno"

json.dump(qs, open(DST, "w", encoding="utf-8"), ensure_ascii=False, indent=2)

# Informe
def corr(q): return next(o for o in q["opciones"] if o["letra"] == q["respuestas_correctas"][0])
nc = [q for q in qs if q["tipo"] != "codigo"]
strict = [q for q in nc if all(len(corr(q)["texto"]) > len(o["texto"]) for o in q["opciones"] if o["letra"] != q["respuestas_correctas"][0])]
print("tipos:", dict(collections.Counter(q["tipo"] for q in qs)))
print(f"no-código: {len(nc)}; correcta estrictamente más larga: {len(strict)} ({round(100*len(strict)/len(nc))}%)")
mal = []
for q in strict:
    c = len(corr(q)["texto"]); ds = [len(o["texto"]) for o in q["opciones"] if o is not corr(q)]
    r = c / (sum(ds) / 3)
    if r >= 1.2: mal.append((round(r, 2), q["id"]))
print("aún descompensadas (>=1.2):", sorted(mal, reverse=True))
