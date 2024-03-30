# Sección 05. Introducción a testing
## Temas 
1. ¿Qué es el testing automático?
2. ¿Por qué es importante?
3. Jest testing library
4. Configuraciones Node + TS + Jest
5. Pruebas en todos los archivos realizados en la sección anterior
6. Coverage - Cobertura  del testing

## Introdicción
### Pruebas unitarias
- Enfocadas en pequeñas funcionalidades.

### Pruebas de integración
- Enfocadas en cómo reaccionan varias piezas en conjunto.

### Características de las pruebas
1. Fáciles de escribir.
2. Fáciles de leer.
3. Confiables.
4. Rápidas.
5. Principalmente unitarias.

- Se tiene la terminología AAA.
    - Arrange.
        - Se toma el sujeto de prueba.
            - Incializar variables.
            - Importaciones necesarias.
    - Act.
        - Se aplican estímulos.
            - Llamar métodos.
            - Simular clicks.
            - Realizar acciones sobre el paso anterior.
    - Assert.
        - Observar el comportamiento resultante.
            - Son los resultados esperados.
            - Ej. Que algo cambie, algo incremente o bien que nada suceda.

### Mitos
1. Hacen que la aplicación no tenga errores.
2. Las pruebas no pueden fallar.
3. Hacen más lenta la app.

## 1. Configurar ambiente de pruebas (test suite)
- Se trabajará en 03-bases y con jest.

### 1. Pasos para configurar Jest con TypeScript, en Node 

Documentación [oficial sobre Jest](https://jestjs.io/docs/getting-started)


1. Instalaciones de desarrollo (super test es útil para probar Express)
```
npm install -D jest @types/jest ts-jest supertest
```

2. Crear archivo de configuración de Jest
```
npx jest --init
```

3. En el archivo **jest.config.js** configurar
```
preset: 'ts-jest',
testEnvironment: "jest-environment-node",

// Opcional - The paths to modules that run some code to configure or set up the testing environment before each test
// setupFiles: ['dotenv/config'],
```

4. Crear scripts en el **package.json**
```
"test": "jest",
"test:watch": "jest --watch",
"test:coverage": "jest --coverage",
```

- La configuración dada al correr el comando npx jest --init está a continuación, en donde se coloca que no a la limpieza de mocks para aprender a hacerlo manualment.

<img src='Imagenes\05-ConfigTestingConsola.png'></img>

- Se realiza prueba para ver que funciona.
    1. Crear carpeta tests.
    2. Crear archivo tests -> app.test.ts
    3. Definir prueba.
        - Se puede cambiar it por test
    4. Correr comando npm run test

``` ts
import { describe } from "node:test";

describe('App', () => {
    it('should be true', () => {
        expect(true).toBe(true);
    });
});
```

- Agregar siguiente configuración en tsconfig.json para evitar que el archivo marque un error, lo cual no tra inconveniente.
    - Se debe colocar antes de compilerOptions

``` json
{
  "include": ["src/**/*"],

  "exclude": ["node_modules", "**/*.spec.ts","**/*.test.ts"],
  "compilerOptions": {
```

### 2. Arrange, Act y Assert

``` ts
describe('App', () => {
    it('Test in the App file', () => {
        // 1. Arrange
        const num1 = 10;
        const num2 = 20;

        // 2. Act
        const result = num1 + num2;

        // 3. Assert
        expect(result).toBe(30);
    });
});
```

- La parte de expect y toBe se puede ver como un if.

``` ts
describe('App', () => {
    it('Test in the App file', () => {
        // 1. Arrange
        const num1 = 10;
        const num2 = 20;

        // 2. Act
        const result = num1 + num2;

        // 3. Assert
        //expect(result).toBe(30);

        if( result === 35 ) {

        } else {
            throw new Error('The result should be 30');
        }
    });
});
```

## 2. Pruebas
- Se debe replicar la misma estructura (o similar) en la carpeta de testing para que refleje la del código original (file system).
### 01. Pruebas en 01-Template
``` ts
export const emailTemplate = `
<div>
    <h1>Hi, {{name}}</h1>
    <p>Thank you for your order.</p>
    <p>Order ID: {{orderId}}</p>
</div>`;
```

``` ts
import { emailTemplate } from "../../src/js-foundation/01-template";

describe('js-foundation/01-template.ts', () => {
    it('emailTemplate should contain a greeting', () => {
        expect(emailTemplate).toContain('Hi,');
    });

    it('emailTemplate should contain {{name}} and {{forderId}}', () => {
        expect(emailTemplate).toContain('{{name}}');
        expect(emailTemplate).toContain('{{forderId}}');

        expect(emailTemplate).toMatch(/{{name}}/);
        expect(emailTemplate).toMatch(/{{forderId}}/);
    });
});
```

### 02. Pruebas en 02-Destructuring

``` ts
export const characters = ['Flash','Superman', 'Green Lantern', 'Batman'];
```

``` ts
import { characters } from "../../src/js-foundation/02-destructuring";

describe('js-foundation/02-destructuring.ts', ()=>{
    it('Characters should contain Flash, Superman',() => {
        expect(characters).toContain('Flash');
        expect(characters).toContain('Superman');
    });

    it('first character should be Flash, and second should be Superman', () => {
        const [flash, superman] = characters;

        expect(flash).toBe('Flash');
        expect(superman).toBe('Superman');
    });
});
```

### 03. Pruebas en 03-Callbacks
- El test funciona diferente cuando se tienen los tests dentro del callback el cual puede ser asíncrono por medio de un delay como setTimeout, así como si se llamara un throw Error dentro del callback ya que las pruebas serían exitosas a pesar de eso.
    - Si el throw error estuviera fuera del callback entonces ahora sí el test fallaría.
    - Esto sucede por el scope, ya que antes de que se ejecute el código del callack asíncrono todo el test ya terminó.
- Se le debe indicar a jest que debe esperar al callback, ya que si fuera una petición HTTP se debe esperar por el resultado.
- No todos los callbacks son no bloqueantes.
    - En este caso se tiene un callback bloquente, ya que todo lo que ejecuta es código secuencial.
- Por ejemplo, si el código fuera de la siguinet manera en donde el callback se ejecuta dentro de la condicional de user y se coloca un setTimeout entonces el callback va a ser no bloqueante en algunos lados,

``` ts
export function getUserById( id: number, callback: (err?: string, user?:User) => void ) {
  const user = users.find( function(user){
    return user.id === id;  
  });

  if( !user ) {
    setTimeout(() => {
        callback(`User not found with id ${id}`);
    }, 2500)

    return;
  }

  return callback( undefined, user );
}
```

1. Pasar en el argumento del callback del test, el cual es **done**.
2. Mandar a llamar el done cuando ya se tienen los resultados.


``` ts
import { getUserById } from "../../src/js-foundation/03-callbacks";

describe('js-foundation/03-callback.ts', ()=>{
    it('getUserById should return an error if user does not exits', (done) => {
        const id = 10;
        getUserById(id, (err, user) => {
            expect(err).toBe(`User not found with id ${id}`);
            expect(user).toBeUndefined();
            done();
        });
    });
});
```

- Lo anterior sería diferente si el callback no fuese asíncrono:
    - Ya no se requiere usar done.

``` ts
export function getUserById( id: number, callback: (err?: string, user?:User) => void ) {
  const user = users.find( function(user){
    return user.id === id;  
  });

  if( !user ) {
    return callback(`User not found with id ${id}`);
  }

  return callback( undefined, user );
}
```

``` ts
import { getUserById } from "../../src/js-foundation/03-callbacks";

describe('js-foundation/03-callback.ts', ()=>{
    it('getUserById should return an error if user does not exits', (done) => {
        const id = 10;
        getUserById(id, (err, user) => {
            expect(err).toBe(`User not found with id ${id}`);
            expect(user).toBeUndefined();
            done();
        });
    });

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
});
```

### 04. Pruebas en 05-Factory
- En este caso no se debe hacer test de las dependencias que se inyectan, ya que se harán después.
    - Lo importante es hacer pruebas atómicas, más adelante se harán las de integración.
    - Entonces se hacen mocks de las dependencias para poder hacer test de la factory.

``` ts
interface BuildMakerPersonOptions {
  getUUID: () => string;
  getAge: (birthdate: string) => number;
}

interface PersonOptions {
  name: string;
  birthdate: string;
}


export const buildMakePerson = ({ getAge, getUUID }: BuildMakerPersonOptions) => {

  return ({ name, birthdate }: PersonOptions) => {

    return {
      id: getUUID(),
      name: name,
      birthdate: birthdate,
      age: getAge(birthdate),
    }
  }

}
```

``` ts
import { buildMakePerson } from "../../src/js-foundation/05-factory";

describe('js-foundation/05-factory.ts', () => {
    const getUUID = () => '1234';
    const getAge = () => 35;
    it('Should return a function', () => {
        const makePerson = buildMakePerson({getUUID, getAge});

        expect(typeof makePerson).toBe('function');
    });

    it('Should return a person', () => {
        const makePerson = buildMakePerson({getUUID, getAge});
        const john = makePerson({name: 'John', birthdate: '1985-10-21'});
        expect(john).toEqual({ id: '1234', name: 'John', birthdate: '1985-10-21', age: 35 });
    });
});
```

### 05. Pruebas en 06-Promises
- Se tienen varias opciones para la prueba, en donde se puede o no usar la respuesta real de la api.
    - Muchas veces se recomienda usar la respuesta real, pero otras veces es mejor usar un mock. Por otro lado, hay ocasiones con bases de datos que se crean otras ficticias.
- En este test se evalúa también el cath que da el try error, en donde se tiene un throw.
    - De gual manera se usa try catch en la prueba, en donde en try se coloca un expect que nunca puede pasar.
- En otras palabras, se evalúa la exepción de una función.

``` ts
import {httpClientPlugin as http} from '../plugins/http-client.plugin';
//const { http } = require('../plugins');

export const getPokemonById = async( id: string|number ):Promise<string> => {
  try {
    const url = `https://pokeapi.co/api/v2/pokemon/${ id }`;
    const pokemon = await http.get( url );  
    return pokemon.name;
  } catch (error) {
    throw `Pokemon not found with id ${id}`;
  }
}

```

### 06. Pruebas en GetAge Adapter
- La finalidad del testing es asegurar que el código funcione igual conforme pasa el tiempo, sin embargo en este caso la función de fecha irá variando.
- En este caso se toma el código para generar la edad y se igual con el resultado obtenido en la prueba.

``` ts
export const getAge = ( birthdate: string ) => {

  // return getAgePlugin(birthdate);
  return new Date().getFullYear() - new Date(birthdate).getFullYear();
}

```

``` ts
import { getAge } from "../../src/plugins";

describe('js-foundation/get-age.plugin.test.ts', () => {
    it('getAge should return a number', () => {
        const birthdate = '1997-11-11';
        const age = getAge(birthdate);

        expect(typeof age).toBe('number');
    });

    it('getAge should return current age', () => {
        const birthdate = '1997-11-11';
        const age = getAge(birthdate);

        const calculatedAge = new Date().getFullYear() - new Date(birthdate).getFullYear();

        expect(age).toBe(calculatedAge);
    });
});
```

### 07. SpyOn - Métodos de objetos (Continuación de GetAge Adapter)
- Para las dependencias y sus métodos, tal como getFullYear. Este método se puede simular de que cuando se llame en testing regrese el valor que se quiera.
- Es como si se cambiara el ADN del objeto, y se reemplazara su método por otra cosa.
    - En este caso se usa mockReturnValue, el cual es un valor ficticio.
- Por otro lado, también se puede hacer pruebas sobre el espia y usar métodos como: 
    - toHaveBeenCalled().
    - toHaveBeenCalledWith().
- Con spy se pueden sobrescribir métodos para poder hacer prueba robustas y flexibles para que el día de mañana el código pueda ser evaluado de la forma que se espera.

``` ts
    it('getAge should return 0 years', () => {
        const spy = jest.spyOn(Date.prototype, 'getFullYear').mockReturnValue(1997);
        const birthdate = '1997-11-11';
        const age = getAge(birthdate);

        expect(age).toBe(0);
        expect(spy).toHaveBeenCalled();

    });
```

### 08. Pruebas en GetUUID Adapter
- Las pruebas que importan en la librería son que funcionen en el código, no el paquete como tal ya que el paquete ya está probada por los desarrolladores.
    - En otras palabras, se debe probar cómo el código de terceros trabaja con el código propio.

``` ts
import { v4 as uuidv4 } from 'uuid';

export const getUUID = () => {

  return uuidv4();
}
```

``` ts
import { getUUID } from "../../src/plugins";

describe('js-foundation/get-id.plugin.test.ts', () => {
    it('getAge should return a UUID', () => {
        const uuid = getUUID();

        expect(typeof uuid).toBe('string');
        expect(uuid.length).toBe(36);
    });
});
```

### 09. Pruebas en HttpClient Adapter
- Para librerías como axios no se testea axios, se testea el resultado de funciones y métodos.
- Se toma un endpoint cualquiera y se prueba.
    - En caso de que no importa el valor que traiga un campo de la respuesta se puede usar expect.any(dataType)
``` ts
import axios from 'axios';


export const httpClientPlugin = {

  get: async(url: string ) => {
    const { data } = await axios.get( url );
    return data;
    // const resp = await fetch( url );
    // return await resp.json();     
  },

  post: async(url: string, body: any ) => {
    throw new Error('Not implemented');
  },
  put: async(url: string, body: any) => {
    throw new Error('Not implemented');
  },
  delete: async(url: string ) => {
    throw new Error('Not implemented');
  },

};


```

``` ts
import { httpClientPlugin } from '../../src/plugins/http-client.plugin';

describe('js-foundation/http-client.plugin.test.ts', () => {
    it('httpClientPlugin should return a string', async () => {
        const data = await httpClientPlugin.get('https://jsonplaceholder.typicode.com/todos/1');

        expect(data).toEqual({
            "userId": 1,
            "id": 1,
            "title": "delectus aut autem",
            "completed": expect.any(Boolean)
            });
    });

    it('httpClientPlugin should have POST, PUT and Delete methods', async () => {
        expect(typeof httpClientPlugin.post).toBe('function');
        expect(typeof httpClientPlugin.put).toBe('function');
        expect(typeof httpClientPlugin.delete).toBe('function');
    });
});
```

### 10. Pruebas en el Logger Adapter
- De nuevo, solo se deben evaluar los métodos que se esperan. Por ejemplo, que el logger sea llamado con los argumentos o con algun valor. De esta forma se asegura que el logger de winston funcione de la forma esperada.
    - No se evalúa que el logger de winston realmente ejecuta toda la construcción, o que genere los archivos de error o combined.
- Se evalúa que el modulo haya sido llamado con diferentes transpors, con cierta configuración inicial o que al llamar al buildLogger haya sido llamado con el servicio deseado y con los métodos deseados (log y error).
- Se usa objectContaining para especificar lo mínimo que se espera un objeto tenga.

``` ts
import { buildLogger, logger as winstonLogger } from '../../src/plugins/logger.plugin';

describe('js-foundation/logger.plugin.test.ts', () => {
    it('buildLogger should return a function logger', () => {
        const logger = buildLogger("test");

        expect(typeof logger.log).toBe('function');
        expect(typeof logger.error).toBe('function');
    });

    it('logger.log should log a message', () => {
        const winstonLoggerMock = jest.spyOn(winstonLogger, 'log');
        const message = 'test message';
        const service = 'test service';

        const logger = buildLogger(service);

        logger.log(message);

        expect(winstonLoggerMock).toHaveBeenCalledWith(
            'info',
            expect.objectContaining(            {
                level: 'info',
                message,
                service,
            })
        );

    });
});
```

### 11. Testing Coverage
- El nivel de cobertura indica un panorama general de cómo se encuentra el testing a un nivel macro.
    - Es decir, qué tanto código se ha probado.
- Se observa el archivo de cobertura con:

``` bash
npm run test:coverage
```

- Por otro lado, en la carpeta de coverage se tiene el archivo index.html que ofrece el reporte de testing.
    - No es requerido cubrir el 100%, basta con la ruta crítica de la aplicación.

### 12. Conectar Build + Testing
- Solo cuando es testing no falla se puede crear el build.

``` json
    "build": "npm run test && rimraf ./dist && tsc",
    "start": "node dist/app.js"
```