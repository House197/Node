# Sección 04. Bases de Node + TypeScript
## Temas
1. Loggers y su necesidad
2. Winston
3. Configuraciones básicas y adaptador
4. TypeScript
5. Configuración de TypeScript con Node
6. Migración de proyecto
7. TSC
8. ts-node + nodemon
9. Entre otras cosas

## package-lock.json
- Se crea automáticamente para cualquier operación en donde npm modifica ya sea el árbol de node_modules o package.json.
- Describe el árbol exacto que fue generado de tal forma que las instalaciones subsecuentes puedan generar árboles idénticos sin imoprtar las actualizaciones de dependencias intermedias.

## 1. Node Logger - Winston
- Paquete de terceros.

``` bash
npm i winston
```

- En lugar de hacer print en la consola se tienen los loggers.
- Un logger permite colocar los logs en un archivo independiente o poder guardarlos en la base de datos.
    - De igual forma permite el filtrado.

1. src -> plugin -> logger.plugin.js
    - Se hace así para que en un futuro se pueda cambiar de winston a otro logger.
2. Exportar una factory function.
    - El objetivo es recibir como argumento el servicio en el que se va a utilizar el logger.
    - De igual forma, el service ayuda a identificar el archivo en dónde surge el problema.

``` js
const winston = require('winston');

const logger = winston.createLogger({
  level: 'info',
  format: winston.format.json(),
  //defaultMeta: { service: 'user-service' },
  transports: [
    //
    // - Write all logs with importance level of `error` or less to `error.log`
    // - Write all logs with importance level of `info` or less to `combined.log`
    //
    new winston.transports.File({ filename: 'error.log', level: 'error' }),
    new winston.transports.File({ filename: 'combined.log' }),
  ],
});

logger.add(new winston.transports.Console({
    format: winston.format.simple(),
}));

module.exports = function buildLogger(service) {
    return {
        log: (message) => {
            logger.log('info', {message, service});
        }
    }
}

```

3. Importar en app.js

``` js
const buildLogger = require('path');

const logger = buildLogger('app.js');

logger.log('Hola mundo');
```

4. Con lo anterior y al correr la app se van a tener dos archivos nuevos, los caules no deben subirse a git ya que son irrelevantes:
    - combined.log
    - error.log


5. Construir método de errores en la función que se exporta.
    - Se aprovecha para introducir la forma en cómo Winston permite mostrar la fecha en el que el logger sucede.
    - Se va a combinar la saslida en formato JSON con la agregación del timestamp.
    - Se usa combine de winston.format para combinar timestamp con el json.

``` js
const winston = require('winston');
const {combine, timestamp, son} = winston.format;

const logger = winston.createLogger({
  level: 'info',
  format: combine(
    timestamp(),
    json(),
  ),
  //defaultMeta: { service: 'user-service' },
  transports: [
    //
    // - Write all logs with importance level of `error` or less to `error.log`
    // - Write all logs with importance level of `info` or less to `combined.log`
    //
    new winston.transports.File({ filename: 'error.log', level: 'error' }),
    new winston.transports.File({ filename: 'combined.log' }),
  ],
});

logger.add(new winston.transports.Console({
    format: winston.format.simple(),
}));

module.exports = function buildLogger(service) {
    return {
        log: (message) => {
            logger.log('info', {message, service});
        },
        error: (message) => {
            logger.error('error', {message, service})
        }
    }
}
```

``` js
const buildLogger = require('path');

const logger = buildLogger('app.js');

logger.log('Hola mundo');
logger.error('Esto es un error.');
```

## 2. Typescript - Proyecto básico
https://gist.github.com/Klerith/47af527da090043f604b972b22dd4c01

1. Instalar TypeScript y tipos de Node, como dependencia de desarrollo
```
npm i -D typescript @types/node
```
2. Inicializar el archivo de configuración de TypeScript ( Se puede configurar al gusto)
```
npx tsc --init --outDir dist/ --rootDir src
```

3. **Opcional** - Para traspilar el código, se puede usar este comando
```
npx tsc
npx tsc --watch
```

4. Configurar Nodemon y Node-TS
```
npm install -D ts-node nodemon
```
5. Crear archivo de configuración de Nodemon - **nodemon.json**
```
{
  "watch": ["src"],
  "ext": ".ts,.js",
  "ignore": [],
  "exec": "npx ts-node ./src/app.ts"
}
```
6. Crear script para correr en desarrollo en el **package.json**
```
  "dev": "nodemon"
  "dev": "npx nodemon" // En caso de no querer instalar nodemon
```

7. Instalar rimraf (Herramienta que funciona similar al rm -f) eliminar directorio
```
npm install -D rimraf
```

8. Crear scripts en el package.json para construir e iniciar en producción
```
   "build": "rimraf ./dist && tsc",
   "start": "npm run build && node dist/app.js"
```

### Comentarios
- ts-node permite correr código de ts en node sin tener que transpilar.
    - Al final se tiene que hacer la transpilación para productivo, pero en desarrollo se puede omitir.
- El archivo de nodemon.json se coloca en el root.
- Se coloca el script de nodemon en package.json

``` json
  "scripts": {
    "test": "echo \"Error: no test specified\" && exit 1",
    "dev": "nodemon",
    "build": "rimraf ./dist && tsc",
    "start": "npm run build && node dist/app.js"
  },
```

- Además se desea tener 2 scripts más
    - build para construcción de proyecto.
        - Se puede ocupar el paquete rimraf en el modo de desarrollo, el cual es similar a los paquetes de eliminación rm -f.
            - El Script va a eliminar la carpeta de .dist y ejecuta tsc para crear nuevamente la carpeta de distribución.
    - start para levantarlo en modo de producción.

## 3. Trabajar con Typescript
- Permitir manejar sintaxis actual de JS que podría no ser válida en node, tal como exportar variables directamente sin tener que usar module.exports.

``` ts
export const heros = [
  {
    data: 'data'
  }
]
```

- De igual manera, se puede importar sin tener que usar require.
- Actualmente se tiene el archivo de hero.service.ts para gurdar la función de buscar heroes y otro archivo para definir al arreglo de heros.
  - Se puede correr con ts-node, pero es lento. Se recomienda más correr el archivo build, el cual se crea con el script de build.
```
npm start

```

## 4. Migrar proyecto a TS
- Se recomienda hacerlo en una nueva rama de git.
- Se siguen los pasos de instalación de TS.
- Colocar scripts.
- Cambiar extensión de archivos a ts.
- Para librerías que no están escritas en TS en su importación se debe usar as al momento de renombrar la propiedad

``` ts
import { v4 as uuidv4 } from 'uuid';

// getUUID is a function that returns a UUID

export const getUUID = () => {

  return uuidv4();
}
```