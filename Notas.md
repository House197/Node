# Arquitectura Limpia, Patrón repositorio

<img src='Imagenes\Notas-ArqLimpia.png'></img>

- Con el patrón repositorio se separa en capas la lógica.
    - Va desde círculos internos a externos.
    - La comunicación surge desde los círculos externos hacia los internos.
        - Las entidades no hablan con los casos de uso, ni los casos de uso hablan con los presentadores, ni los presentadores hablan con la base de datos.

- Al trabajar con arquitectura limpia se tienen las consideraciones que no deberían afectar si:
    - Se cambia la DB.
    - Se cambia el motor de correos.
    - Se añade o eliminan tareas.
    - Se desea trabajar con múltiples origenes de datos.

- Lo anterior hace referencia al principio SOLID.
    - El código (clases, etc) no deberpia tener más de una razón por la cual cambiar. 
        - Si un caso de uso cambia entonces no debería afectar a las entidades.
        - Si un presentador cambia, no debería afectar a los casos de uso.
        - Si la db cambia no debería afectar a la aplicación.

## Entidades
- Son una representación.

## Casos de uso
- Use case es una función que se usa.
- Tienen acceso al repositorio.

## Inyección de dependencia 
- Se le conoce así y no solo como pasar un argumento porque la dependencia ya está instanciada.
    - Es pasar un argumento a alguna clase, función, repositorio, etc. 
    - Se pasa una clase como dependencia.
- Normalmente se realiza en un constructor.
    - Entonces, es añadirle dependencias a las clases.

## DTO (Data Transfer Object)
- Son objetos que sirve para trasladarlo a otro lugar.
- Objeto hecho para transferir información.
- Se crean Dtos por cada endpoint que se recibe información.

# Notas
- Todo lo que se ejecuta en el archivo principal es síncrono.
- Todo código de terceros debe ser adaptado (patrón adaptador).
    - Se puede hacer click + alt sobre la dependencia deseada y ver su firma para saber cómo definir sus parámetros en ts.
- En Clean Code cuando se tienen más de 3 argumentos se recomienda mandar un objeto.

## Uso mocks
- TS indica error debido a la singature de métodos que usan mock, lo cual se debe de importar difrectamente a jest de @jest/globals.
    - jest ya se puede usar directamente, pero para que no indique error se debe tener los archivos de test en el include de tsconfig.
    - Como se menciona en el curso es posible tener dos archivos de tsconfig, uno para desarrollo y otro para producción.

## Instancia o métodos estáticos
- Se usa una instancia cuando se desea hacer inyeccción de dependencias, de lo contrario se pueden usar métodos estáticos.

# Notas generales
- En JS los objetos pasan por referencia.

# Rest Server
## Middleware
- Función que se ejecuta cuando una petición pasa por ahí.
- Son funciones que se ejecutan antes de que llegue al controlador la petición.

## Controllers
- Usualmente se aplica inyección de dependencias.
    - Por ejemplo, se inyecta un repositorio y que las rutas usen ese repo. O también, inyectar el repositorio para poder implementar y usarlo mediante casos de uso.

## Status codes
https://developer.mozilla.org/en-US/docs/Web/HTTP/Status

# Creación nuevo proyecto
## 1. Crear package.json
``` bash
npm init -y 
```

## 2. Node con TpyeScript - TS-Node-dev
https://gist.github.com/Klerith/3ba17e86dc4fabd8301a59699b9ffc0b
1. Instalar TS y demás dependencias.

``` bash
npm i -D typescript @types/node ts-node-dev rimraf
```

2. Inicializar el archivo de configuración de TypeScript.
``` bash
npx tsc --init --outDir dist/ --rootDit src
```

3. Crear scripts para dev, build y start.
    - En start se puede omitir npm run build, ya que al alojarlo ya se corre ese código por defecto.
``` json
  "dev": "tsnd --respawn --clear src/app.ts",
  "build": "rimraf ./dist && tsc",
  "start": "npm run build && node dist/app.js"
```

## 3. Configurar tsconfig.json
1. Ignorar:
    - node_modules
    - archivos de testeo.
    - carpeta de dist
2. Incluir
    - src

``` json
  "exclude": ["node_modules", "dist", "src/**/*.test.ts", "src/**/*.spec.ts"],
  "include": ["src/**/*"],
```

## 4. Express (opcional)
- Asegurarse que el archivo de definición de ts y la versión de express estén lo más cerca posible.
- Es común trabajar con un modelo MVC al usar express.
``` bash
npm install express
```

``` bash
npm i -D @types/express
```

## 5. Variables de entorno
``` bash
npm i dotenv env-var
```

## 6. Jest
1. Instalar dependencias
``` bash
npm install -D jest @types/jest ts-jest supertest
npm i -D @types/supertest
```

2. Crear archivo de configuración de jest.
``` bash
npx jest --init
```

3. Configurar en jest.config.ts
    - setupFile se ocupa si se desean ocupar otras variables de entorno específicas para testing.
``` ts
preset: 'ts-jest',
testEnvironment: "jest-environment-node",

// Opcional - The paths to modules that run some code to configure or set up the testing environment before each test
setupFiles: ["<rootDir>/setupTests.ts"],
```

4. Crear scripts en package.json

``` js
"test": "jest",
"test:watch": "jest --watch",
"test:coverage": "jest --coverage",
```

5. Crear setupTests.ts para hacer pruebas en otra DB que sea de testing, así como las variables de entorno para testing.
    - Esto y el campo de setupFiles puede no ser necesario ya que nod permite que se mande la variable env.
``` ts
import { config } from 'dotenv';


config({
  path: '.env.test'
});
```

6. Crear .env.test
7. Aprovisionar Postgres (o db que se desee.)
    - https://neon.tech/
    - Se crea la db y se obtiene la URL de conexión para colocarlo en .env.test
### Aprovisionamiento DB con Prisma.
1. Se usa Postgres.
2. Instalar dotenv-cli
``` bash
npm i -D dotenv-cli
```
2. Especificar a prisma que use la cadena de conexión de testing.
    - Se crea script en package.json, el cual debe llamarase cada que se ejecuta el testing.
``` json
"prisma:migrate:test": "dotenv -e .env.test -- npx prisma migrate deploy",
"test": "npm run prisma:migrate:test && jest",
"test:watch": "npm run prisma:migrate:test && jest --watch",
"test:coverage": "npm run prisma:migrate:test && jest --coverage",
```

## Opcionales
### Levantar base de datos MongoDB
1. Preparar variables de entorno.
2. Preparar docker compose

``` yml
version: '3.8'


services:

  mongo-db:
    image: mongo:6.0.6
    restart: always
    environment:
      MONGO_INITDB_ROOT_USERNAME: mongo-user
      MONGO_INITDB_ROOT_PASSWORD: 123456
    volumes:
      - ./mongo:/data/db
    ports:
      - 27017:27017
```

3. Instalar mongoose.

``` bash
npm i mongoose
```

4. Crear servicio en src -> data -> mongo -> mongo-database.ts

``` ts
import mongoose from "mongoose";

interface Options {
    mongoUrl: string;
    dbName: string;
}

export class MongoDatabase {
    static async connect(options: Options) {
        const { mongoUrl, dbName } = options;

        try {
            await mongoose.connect(mongoUrl, {
                dbName: dbName,
            })

            return true;
            
        } catch (error) {
            console.log("Mongo connection error");
            throw error;
        }
    }
}
```

5. Definir variables de entorno en envs.


``` ts
import 'dotenv/config';
import {get} from 'env-var';

export const envs = {

  PORT: get('PORT').required().asPortNumber(),
  MONGO_URL: get('MONGO_URL').required().asString(),
  MONGO_DB_NAME: get('MONGO_DB_NAME').required().asString(),
}
```

6. Inicializar mongo en app.ts

``` ts
async function main() {

  await MongoDatabase.connect({
    mongoUrl: envs.MONGO_URL,
    dbName: envs.MONGO_DB_NAME,
  })
```

### Levantar base de datos Postgres
https://gist.github.com/Klerith/49bbec66abe6affe3700324d2d3bf440
1. Preparar variables de entorno.
2. Preparar docker compose.

``` yml
version: '3.8'


services:

  postgres-db:
    image: postgres:15.3
    restart: always
    environment:
      POSTGRES_USER: ${POSTGRES_USER}
      POSTGRES_DB: ${POSTGRES_DB}
      POSTGRES_PASSWORD: ${POSTGRES_PASSWORD}
    volumes:
      - ./postgres:/var/lib/postgresql/data
    ports:
      - 5432:5432
```
- Las carpetas de volumen no van en git.

3. Instalar prisma
``` bash
npm install -D prisma
```

``` bash
npx prisma init --datasource-provider postgresql
```

4.  Crear modelo y apuntar a URL propia de .env.
5. Correr migraciones
``` bash
npx prisma migrate dev --name init
```


# Sección 03.
### Package.json Scripts
1. **Start** es especial, ya que solo se debe correr **npm start**. Para otros scripts se debe usar **npm run nameScript**.
    - Start siempre debe ser el que levanta la app en producción.

### Importacione y exportaciones.
1. Se recomienda exportar como objetos.

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

2. Require ya realiza la ejecución del archivo que se importa.
3. Se debe intentar tener la dependencia de terceros al mínimo.

## Patrón adaptador
- Al usar dependencia de paquete de terceros se debe adaptar con código propio.

## Sección 04.
### Correr proyecto clonado
1. Correr npm i para instalar las dependencias.

## Typescript
- Se tiene la opción de VS CODE con CTRL + SHIFT + P de reload window para recargar de nuevo tsconfig.json, ya que a veces se coloca como incorrecto.
- Las dependencias @types siempre son de desarrollo no de producción.

## Sección 05. Testing.
- Se debe ir probando las piezas más pequeñas hasta las más grandes del código.
- Los tests son importantes ya que al primera vista pareciera que las pruebas son obvias y se espera siempre funcionen, pero si en un futuro algún tercero modifica el código entonces se atrapan esos cambios y los errores que se ocasionen. Por ejemplo, que se haya cambiado el números de parámetros que una función espere.
### Coverage
- Al correr npx jest --init hay una sección de coverage, el cual puede proveer de una gráfica qué tan cubiertp está el código con testing.

<img src='Imagenes\05-ConfigTestingConsola.png'></img>

### npm run test:watch
- Es diferente correr el comando en la terminal dada por VS CODE que presionar CTRL + SHIFT + P, buscar deug npm script y buscar el mismo comando.
    - La segunda opción permite correr el test directamente en VS CODE, lo que habilita poder colocar breakpoints.

### Evaluar objetos
- Ya que los objetos apuntan a diferentes espacios en memoria se puede recurrir a toEqual o toStrictEqual.

``` ts
    it('getUserById return John Doe if id is 2', () => {
        const id = 2;
        getUserById(id, (err, user) => {
            expect(err).toBeUndefined();
            expect(user).toStrictEqual(  {
                id: 2,
                name: 'Jane Doe',
              });
        })
    });
```

### Pruebas paquetes de terceros
- Las pruebas que importan en la librería son que funcionen en el código, no el paquete como tal ya que el paquete ya está probada por los desarrolladores.
    - En otras palabras, se debe probar cómo el código de terceros trabaja con el código propio.
- Para librerías como axios no se testea axios, se testea el resultado de funciones y métodos.

## Sección 06. Consola App
- La sola presencia de una bandera de tipo booleana ya la hace true.

### Casos de uso
- El software de capas de los casos de uso contiene las reglas de negocio específicas de la aplicación. Condensa e implementa todos los casos de uso del sistema. Estos casos de uso orquestan el flujo dentro y hacia las entidades.
- En TS es común trabajar con funciones, pero con JS se trabaja con Factory Functions comunmente.

<img src='Imagenes\06.CleanArq.png'></img>

## TS y Jest
- TS es de gran utilidad, ya que se encarga de asegurar ciertos detalles que ayudan a ya no testear en jest, tal como el tipo de dato de argumento.

## Espías
- Los espías permiten sobrescribir el funcionamiento de un méodo.
- Al definir un espía todos los tests que continúan a partir de su declaración en el mismo archivo van a manejar la implementación del espía. En otras palabras, el espía se persiste entre tests.
    - Se puede resolver limpiando el espía cuando acabe la prueba. Revisar sección 07, trest de save file.
- Siempre se deben limpiar los tests cada que acaba una prueba, como lo es el caso con los espías o cuando se cambia process.argv

``` ts
    const originalArgv = process.argv;

    beforeEach(() => {
        process.argv = originalArgv;
        jest.resetModules();
    });

```

## Notas Testing
- Los sujetos de prueba siempre se colocan en el nivel superior.

``` ts
import { describe, it, expect, beforeEach} from "@jest/globals";
import { CheckService } from './check-service';
import { LogEntity } from "../../entities/log-entity";

describe('CheckService UseCase', () => {
    const mockRepository = {
        saveLog: jest.fn(),
        getLogs: jest.fn(),
    }

    const successCallback = jest.fn();
    const errorCallback = jest.fn();

    const checkService = new CheckService(
        mockRepository,
        successCallback,
        errorCallback,
    );

    beforeEach(() => {
        jest.clearAllMocks();
    });

    it("Should call successCallback when fetch returns true", async ()=> {
        const wasOk = await checkService.execute('https://google.com')

        expect(wasOk).toBeTruthy();
        expect(successCallback).toHaveBeenCalled();
        expect(errorCallback).not.toHaveBeenCalled();

        expect(mockRepository.saveLog).toBeCalledWith(expect.any(LogEntity));
    });

    it("Should call errorCallback when fetch returns false", async ()=> {
        const wasOk = await checkService.execute('https://goodasdasdasdsagle')

        expect(wasOk).toBeFalsy();
        expect(successCallback).not.toHaveBeenCalled();
        expect(errorCallback).toHaveBeenCalled();

        expect(mockRepository.saveLog).toBeCalledWith(expect.any(LogEntity));
    });
});
```