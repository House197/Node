# Sección 03. Desarrollando en Node
## Temas
1. Package.json
2. Node Modules
3. Scripts
4. Importaciones y Exportaciones
5. Módulos
6. Reforzamiento de JS
7. Callbacks
8. Arrow Functions
9. Factory Functions
10. Promises
11. Async Await
12. Peticiones Http básicas
13. Dependencias de Producción y Desarrollo
14. Patrón adaptador para nuestras dependencias
15. Y más

## 1. Inicio de proyecto
- Se debe crear el archivo package.json como se muestra a continuación.
    - Cualquier aplicación que tenga package.json es una aplicación de Node.
    - Permite especificar os comandos que se desean usar para construir la app, para levantarla o el modo desarrollo.

1. Ejecutar comando:

``` bash
npm init
```

2. El versionamiento se recomienda sea de tipo: 0.0.1

### Arquitectura
1. Crear carpeta src para colocar el código.

## 2. Package.json Scripts
- Se coloca el comando la correr la app. node src/app, en donde el nombre del script es start.
    - Start es especial, ya que solo se debe correr npm start. Para otros scripts se debe usar npm run nameScript.

## 3. Importaciones y exportaciones
- Cada archivo en node termina siendo un módulo (paqute encapsulado).
    - En Node se usa module.exports para exportar, en donde se recomienda exportar como objetos.

``` js
const emailTemplate = `
<div>
    <h1>Hi, {{name}}</h1>
    <p>Thank you for your order</p>
</div>`;

module.exports = {
    emailTemplate
}
```

- Se utiliza la palabra reservada require, la cual ya realiza la ejecución de los archivos.
    - Se puede omitir la extensión js.

``` js
const {emailTemplate} = require('path/to/file');

console.log(emailTemplate);
```

## 4. Nodemon - Paquetes de terceros
- Solo se usa en desarrollo.

``` bash
npm i --save-dev nodemon
ó
npm i -D nodemon
```

- Crear script dev para correr nodemon.

``` json
  "scripts": {
    "test": "echo \"Error: no test specified\" && exit 1",
    "start": "node src/app.js",
    "dev": "nodemon src/app.js"
  },
```

## 5. Variables de entorno por defecto
1. process
    - Es un proceso de Node que está corriendo.
    - Contiene información de:
        - Computadora. 
        - Procesos/librerías que se están ejecutando.
        - Versiones de Node.
        - Argumentos que se recibieron desde fuera.
        - Variables de entorno.
    - Se accede a las variables de entorno con process.env.
    - Algunas variables de entorno son:
        - PORT, process.env.PORT

## 6. Depuración de aplicaciones de Node
- En VSCode se pueden colocar breakpoints para generar una pausa en el ejecución del código.
- En Package.json en la sección de scripts se tiene el botón de debug, en donde se debe seleccionar el script deseado.
    - No se puede hacer esto corriendo npm start desde terminal, ya que este es un proceso aparte.

## 7. Callbacks
- Son funciones que se pasan como argumento.
- Se quiere ejecutar una función cuando se encuentre el usuario que cumpla con la condición.
    - El primer argumento es un error si existe, y el segundo es el usuario.

``` js
function getUserById(id, callback){
    const user = users.find(function(user){
        return user.id === id;
    });

    if(!user){
        return callback(`User not fount with id ${id}`);
    }

    return callback(null, user);
}

const id = 1
getUserById(id, function(err, user) {
    if(error){
        throw new Error('User not fount with id', id);
    }

    console.log(user);
})
```

## 8. Arrow Functions
``` js
const getUserById = (id, callback) => {
    const user = users.find((user) => return user.id === id;
    );

    if(!user){
        return callback(`User not fount with id ${id}`);
    }

    return callback(null, user);
}

const id = 1
getUserById(id, (err, user) => {
    if(error) throw new Error('User not fount with id', id);


    console.log(user);
})
```

## 9. Factory Functions
- Es una función que crea una función.
    - Casi siempre se van a usar paquetes de terceros, como uuid.

``` js
const {v4: uuidv4 } = require('uuid');
const getAge = require('get-age');

const obj = {name: 'John', birthdate: '1985-10-21'};

const buildPerson = ({name, birthdate}) => {
    return {
        id: uuidv4(),
        name,
        birthdate,
        age: getAge(birthdate)
    }
}

const john = buildPerson(obj);

console.log(john);
```

- El código anterior genera una deuda técnica, ya que si se quiere cambiar la dependencia va a ser más difícil debido a que está muy acoplado al código. 

## 10. Patrón adaptador
- Permite hacer del código tolerante a cambios.
- Por ejemplo, si en el futuro se desea cambiar uuidv4, en el código anterior se debe ir cambiando todos los lugares en donde se utilizó.
- La capa de protección se llama patrón adaptador.
    - Es crear código que adapta una dependencia de terceros para que el código no dependa del código de terceros.
    - Se puede usar de nomenclatura la extensión plugin.

1. src -> plugins -> get-age.plugin.js
``` js
const getAgePlugin = require('get-age');

const getAge = (birthdate) => {
    if(!birthdate) return new Error('birthdate is required');

    return getAgePlugin(birthdate)
}

module.exports = {
    getAge,
}
```

2. src -> plugins -> get-id.plugin.js

``` js
const {v4: uuidv4 } = require('uuid');

const getUUID = () => {
    return uuidv4();
}

module.exports = {
    getUUID,
}
```

3. Crear archivo de barril src -> plugins -> index.js
    - Al colocarle como nombre index no es necesario especificar ese nombre de archivo en require.

``` js
const { getUUID } = require('../plugins/get-id.plugin');
const { getAge } = require('../plugins/get-age.plugin');

module.exports = {
    getUUID,
    getAge
}
```

4. Implementar en código.

``` js
const { getUUID, getAge } = require('../plugins');

const obj = {name: 'John', birthdate: '1985-10-21'};

const buildPerson = ({name, birthdate}) => {
    return {
        id: getUUID(),
        name,
        birthdate,
        age: getAge(birthdate)
    }
}

module.exports = {
    buildPerson,
}
```

## 11. Factory Functions - Aplicado
- En JS las factory functions son más rápidas en la generación de instancias de clases.
- La idea es utilizar buildPerson en varios lugares, en donde automáticamente se le mande la forma en cómo se genera el uuid y obtención de fecha.
    - Esto permite tener 0 dependencias en los archivos deseados.
    - Se le puede ver como la entidad a esto.
- Se genera la factory function buildMakePerson, la cual retorna la función buildPerson la cual se converite en anónima con una arrow function.
    - La factory function permite mandar como argumento las dependencias

``` js
//const { getUUID, getAge } = require('../plugins');

const buildMakePerson = ({getUUID, getAge}) => {
    return ({name, birthdate}) => {
        return {
            id: getUUID(),
            name,
            birthdate,
            age: getAge(birthdate)
        }
    }
}

module.exports = {
    buildMakePerson,
}
```

- En app.js o en el archivo que se desea usar se tiene lo siguiente.
    - Acá se importan las dependencias para poder indicarle a la factory function cómo tener el uuid y la age. Esto se le conoce como inyección de dependencias.

``` js
const { getUUID, getAge } = require('../plugins');
const { buildMakePerson } = require('./factory.js');

const makePerson = builsMakePerson({getUUID, getAge});

const obj = {name: 'John', birthdate: '1985-10-21'};

const john = makePerson(obj);

```

## 12. Promesas
- Se usa fetch, el cual ya viene en versiones de node superiores a 14 o 16 (investigar versión).
    - Coloca return en un callback está amarrado a la función que lo invoca, por lo que no se retorna el valor directamente hacia fuera.
    - Entonces, para retornar el valor de fetch se le debe colcar return directamente, lo cual va a retornar una promesa.
``` js
const getPokemonById = (id) => {
    const url = `url/${id}`;

    return fetch(url)
        .then( (response) => response.json())
        .then((pokemon) => pokemon.name)
        .catch((err) => console.log(err))
    
}

module.exports = getPokemonById
```

``` js
const { getPokemonById } = require('path');

getPokemonById(1)
    .then(pokemon => console.log({pokemon}));

```

## 13. Async - await
- Una función async retorna una promesa.
    - Async transforma el valor de retorno en una promesa.
- Por así decirlo, await es un código bloqueante.

``` js
const getPokemonById = async(id) => {
    const url = `url/${id}`;

    const resp = await fetch(url);
    const pokemon = await resp.json();
    
    return pokemon.name;
}

module.exports = getPokemonById
```

## 13. Patrón adaptador - FetchAPI.
- Se contempla agregar un adaptador ya que es posible que en un futuro a las peticiones se les quiera agregar algún header, entre otras cosas.
- De esta forma se puede también migrar de fetch a axios u otra librería.
1. src -> plugins -> http-client.plugin.js

``` js
const httpClientPlugin = {
    get: async(url) => {
        const resp = await fetch(url);
        return await resp.json();
    },
    post: async(url, body) => {},
    put: async(url, body) => {},
    delete: async(url) => {},
}

module.exports = {
    httpClient: httpClientPlugin,
}
```

``` js
const { httpClient } = require('path');

const getPokemonById = async(id) => {
    const url =  `path/${id}`;

    const pokemon = await httpClient.get(url);

    return pokemon.name;
}
```

## 14. Axios - cliente para peticiones HTTP
1. Es una librería de terceros.

``` bash
npm i axios
```

``` js
const axios = require('axios');

const httpClientPlugin = {
    get: async(url) => {
        const {data} = await axios.get(url);
        return data;
    },
    post: async(url, body) => {},
    put: async(url, body) => {},
    delete: async(url) => {},
}

module.exports = {
    httpClient: httpClientPlugin,
}
```