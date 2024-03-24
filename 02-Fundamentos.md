# Sección 02. Primeros pasos
## Temas
1. Preguntas comunes sobre Node
2. Hola Mundo en Node
3. Laboratorio con FileSystem
4. Code Execution
5. Event Loop

## 1. Preguntas comúnes sobre Node
### Qué es NodeJs
- Es un ambiente de ejecución para ejecutar JavaScript desligado del navegador web.
    - Runtime environment
- NPM (node package manager) es el gestor de paquetes con ayor ccrecimiento y paquetes desplegados.
- NPX (Node package execute). Node se usa también para crear herramientas y ejecutar paquetes sin tener que instalarlos con NPX.

### Qué lo hace especial
#### Motor
- Código abierto con el motor de V8 de Google y está diseñado para realizar tareas de E/S (Entrada y Salida) junto con el manejo de archivos de la computadora cliente/servidor.
- JavaScript es single-threaded.

#### Características
1. Asincronía.
2. Módulos nativos y de terceros.
3. Gestión de paquetes con NPM.
4. Construcción de servidores.
5. Escalabilidad.
6. Múltiple plataforma.
7. Non-Blocking I/O
    - Casi ninguna función en Node bloquea la lectura, por lo que se puede tener cientos de peticiones sin bloquear el servidor gracias a libuv.
    - I/O se refiere principalmente a la interacción con el disco duro del sistema.
    - Blocking.
        - Se refiere cuando una ejecución del código debe de esperar a que se complete el proceso pero este a su vez impide que se sigan ejecutando otras instrucciones en paralelo. P/E: cuadno se espera que el usuario abra un archivo para su procesamiento.

## 2. Hola mundo en Node.
- Se puede usar JS en la terminar del sistema con solo escribir node y dar enter.
    - Esto habilita JS en la terminal, pudiendo utilizarla como si fuera la consola en el navegador web.
- Se pueden ejecutar archivos de JS con el comando:
    - Se debe estar en el mismo directorio del archivo.
    - Se puede omitir la extensión js del archivo deseado.

``` bash
node <fileName>

node app.js
ó
node app
```

## 3. Laboratorio don FileSystem
### Leer archivos
- Node ya cuenta con varios paquetes pre cargados
1. Crear archivo app.js
    1. Importar paquete de file system (fs).
    2. Leer el archivo.
    3. Crear nuevo archivo con modificaciones del original.

``` js
const fs = require('fs');

const data = fs.readFileSync('README.md', 'utf8');

const newData = data.replace(/React/ig, 'Angular');

fs.writeFileSync('README-Angular.md', newData); // Crear nuevo archivo con modificaciones.
console.log(data); // Leer archivo original.
```

2. Crear archivo README para usarlo como prueba.

### TAREA. Contador de palabras
``` js
const fs = require('fs');

const content = fs.readFileSync('README.md', 'utf8');

const wordCount = content.split(' ').length;
const reactWordCount = content.match(/react/gi ?? []).length;

console.log(wordCount);
console.log(reactWordCount);
```

## 4. Code execution
- En el siguiente archivo se coloca como comentario el orden en el que se ejecuta, en donde para el segundo y tercer timeout con la milésima de segundo que hace la diferencia puede variar entre computadoras.

``` js
console.log('Inicio de programa'); // 1

setTimeout( () => {
    console.log('Primer Timeout'); // 5
}, 3000 );


setTimeout( () => {
    console.log('Segundo Timeout'); // 3
}, 1 );


setTimeout( () => {
    console.log('Tercer Timeout'); // 4
}, 0 );


console.log('Fin de programa'); // 2

```

### Introducción
- Se toma en consideración que JS es Blocking y Single-threaded.
- En Node primero se ejecuta todo el código síncrono, y luego se prosigue con el asíncrono.
- Se tienen 3 componentes principales de Node.
    1. Dependencias externas.
    2. Características de C++.
    3. Librerías de JS que se conectan con C++ desde el código.

<img src='Imagenes\02-Componentes.png' style = 'width:300px; height:300px; justify-self:center;'></img>

- Libuv permite a node trabajar con:   
    - Tareas asíncronas.
    - Callback.
- Ejecución de código síncrono.
    - Cuando se llama a ejecutar node app se tiene:
        1. Node crea función global() // main().
            - Ofrece herramientas como variables de entorno.
        2. Se pasa a ejecutar la primera línea, la cual es colocada en el CallStack
            - Cuando se ha ejecutado se elimina y se prosigue con la siguiente línea del código.
        3. Al ya no haber más líneas de código entonces sale de la función global, en donde el exit code es 0 si no hubo error.

<img src='Imagenes\02-CodigoSincrono.png' style = 'height:300px; justify-self:center;'></img>

- Ejecución de código con timeouts.
    - Cuando se llama a ejecutar node app se tiene:
        1. Node crea función global() // main().
            - Ofrece herramientas como variables de entorno.
        2. Si el siguiente código contiene una callback o es asíncrono entonces se pasa a libuv.
        3. Luego, en el Call Stack se elimina la línea de código y se prosigue con la siguiente.
        4. Cuando se terminan las tareas síncronas se pasan las líneas de código guardadas en libuv y se corren en el Call Stack.

<img src='Imagenes\02-CodigoAsincrono.png' style = 'height:300px; justify-self:center;'></img>
<img src='Imagenes\02-CodigoAsincrono2.png' style = 'height:300px; justify-self:center;'></img>

- Tercer ejemplo, código asíncrono con temporizadores.
    - Los temporizadores se guardan en libuv, en donde el conteo del temporizador empezará cuando las tareas síncronas hayan terminado.
    - Al llegar el momento de libuv se aprecia que los demás temporizadores ya están listos, mientras que el primero que llegó aun requiere de tiempo en el temporizador. Entonces, libuv va a trabajar de la manera de First/First out para los que ya estén completados, por lo que en este caso sería el segundo timeout.
    - Este proceso se sigue aplicando.

<img src='Imagenes\02-ejemplo3.png' style = 'height:300px; justify-self:center;'></img>
<img src='Imagenes\02-ejemplo3-2.png' style = 'height:300px; justify-self:center;'></img>
<img src='Imagenes\02-ejemplo3-3.png' style = 'height:300px; justify-self:center;'></img>


### Event Loop
https://www.builder.io/blog/visual-guide-to-nodejs-event-loop
- El Event Loop decide escenarios como:
    - ¿Qué pasa si dos Timeouts terminan al mismo tiempo?
    - ¿Qué pasa si una primesa termina al mismo tiempo que otro callback?
- Event Loop sigue las siguientes tareas
    1. Callbacks en el microtask se ejecutan primero (todo el código síncrono se ejecuta primero).
    2. Todos los callbacks dentro del timer queue se ejecutan.
    3. Callbacks en el microtask queue (si hay) se ejecutan después de los callbacks timers, primero tareas en el nextTick queue y luego tareas en el promise queue.
    4. Callbacks de I/O se ejecutan.
    5. Callbacks en el microtask queue se ejecutan (si hay), y luego primise queue (si hay).
    6. Todos los callbacks en el check queue se ejecutan.
    7. Callbacks en el microtask se ejecutan depsués de cada callback en el check queue (Siguiendo el mismo orden anterior, nextTick y luego promise).
    8. Todos los callbacks en el close queue son ejecutados.
    9. Por una última vez en el mismo ciclo, los microtask queue son ejecutados de la misma forma, nextTick y luego promise queue.
- Cuando se completa una tarea asíncrona en libuv, ¿ en qué momento decide Node ejecutar la función callback asociada en la pila de llamadas (callstack)?
    - Los Callbacks son ejecutados sólo cuando el callstack está vacio.
- ¿Node espera a que la pila de llamadas esté vacía antes de ejecutar un callback o interrumpe el flujo normal de ejecución para ejecutar el callback?
    - El flujo normal de ejecución no se interrumpe para ejecutar una función de devolución de llamada.
- ¿Qué pasa con otros métodos asíncronos como setTimeout y setInterval que también retrasan la ejecución de un callback?
    - Los callbacks de setTimeouts y setIntervals tienen prioridad, pero no interrumpen el flujo normal
- Si dos tareas asíncronas como setTimeout y readFile se completan al mismo tiempo, ¿Cómo decide Node qué callback ejecutar primero en la pila de llamdas? ¿Uno tiene prioridad sobre el otro?
    - Los callbacks de temporizador se ejecutan antes que las devolucoines de llamada de I/O, incluso si ambas están listas al mismo tiempo.