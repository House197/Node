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

4. Con lo anterior y al correr la app se van a tener dos archivos nuevos:
    - combined.log
    - error.log