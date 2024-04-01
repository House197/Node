# Sección 06. Aplicación de consola - Clean Arquitecture - Primeros Pasos
## Temas
1. Funciones asíncronas auto-invocadas
2. Argumentos de consola
3. Banderas y opciones
4. Yargs
5. Configuración de Yargs
6. Instalación de dependencias
7. Versión específica
8. Versión futura
9. Versión actual
10. Casos de Uso
11. Y más

## 1. Crear package.json 
1. Ejecutar comando 
``` bash
npm init
```

## 2. Inicializar TypeScript y demás paquetes
1. Instalar.

``` bash
npm i -D typescript @types/node ts-node nodemon rimraf
```

2. Inciailziar el archivo de configuracióin de TypeScript (tsconfig.json)

``` bash
npx tsc --init --outDir dist/ --rootDir src
```

3. Crear archivo nodemon.json

``` json
{
    "watch": ["src"],
    "ext": ".ts,.js",
    "ignore": [],
    "exec": "npx ts-node ./src/app.ts"
}
```

4. Excluir módulos de node e incluir la carpeta de src en tsconfig.json 

``` json
{
  "exclude": ["node_modules"],
"include": ["src/**/*"],
  "compilerOptions": {
```

5. Definir scripts en package.json

``` json
  "scripts": {
    "dev": "ts-node src/app.ts",
    "dev:nodemon": "nodemon",
    "build": "rimraf ./dist && tsc",
    "start": "npm run build && node dist/app.js"
  },
```

## 3. Inicio de app
1. Crear app que muestre la tabla del 5 en consola y cree un archivo con el resultado.
    1. src -> app.ts

``` ts
import fs from 'fs';

let outputMessage = '';
const base = 5;
const headerMessage = `
===========================
    Table del ${base}
===========================\n
`

for(let i = 1; i<=10; i++){
    outputMessage += `${base} x ${i} = ${base*i}\n`;
}

outputMessage = headerMessage + outputMessage;
console.log(outputMessage);

const outputPath = 'outputs';

fs.mkdirSync(outputPath, {recursive: true});
fs.writeFileSync(`${outputPath}/tabla-${base}.txt`, outputMessage);
```

## 4. Argument Values
- Se puede cambiar el comportamiento de la app por medio de argumentos (banderas).
- Se puede especificar la base de la multiplicación y el archivo que se debe crear.
1. Limpiar app.ts
2. Imprimir process.argv
3. Probar comandos como node dist_app.js banderas
    - P/E: node dist_app.js --base 10
4. Revisar resultado.
    - Se aprecia que se recibe el nombre de la bandera.
    - Cada espacio representa un nuevo elemento en el arreglo de argumento.

``` bash
[
  'C:\\Program Files\\nodejs\\node.exe',
  'C:\\Users\\Usuario\\Documents\\Github Desktop\\Node\\Node\\06-multiplication\\dist\\app.js',
  '--cui',
  'Quemso'
]
```

### yargs
1. Instalar paquete, el cual no es de desarrollo. https://www.npmjs.com/package/yargs
    - Se requiere la versión arriba de la 16.
    - Se puede especificr la versión de un paquete con @

``` bash
npm i yargs@17.1.1 
npm i yargs@latest
npm i yargs@next
```

2. Instalar archivo de definición para yargs.

``` bash
npm i -D @types/yargs
```


2. Aplicar patrón adaptador.
    1. src -> config -> plugins -> args.plugin.ts
    - El hideBin se asegura de ocultar los bins en la consola (serían los paths de los archivos)

``` ts
import yargs from 'yargs';
import { hideBin } from 'yargs/helpers';

export const yarg = yargs(hideBin(process.argv)).parseSync();
```

3. Importar en app.ts

``` ts
import { yarg } from "./config/plugins/args.plugin";

console.log(yarg);
```

4. Cambiar script y correrlo

``` json
"dev": "ts-node src/app.ts -b 2",
```

``` bash
{ _: [], b: 2, '$0': 'node_modules\\ts-node\\dist\\bin.js' }
```
### Función anónima auto invocada
- Todo lo que se ejecuta en el archivo principal es síncrono.
- Puede que en algún momento se desee ocupar yargs asíncrono.
- Todo esto se resuelve con una función anónima auto invocada.

``` ts
(async() => {
    await main();
    console.log('Fin del programa');
})();

async function main() {
    console.log('Main ejecutado')
}
```

### Opciones de yargs
- Se definen las opciones que se deben pasar o que son posibles por medio de option.
- Se agregan validaciones con check.

``` ts
import yargs from 'yargs';
import { hideBin } from 'yargs/helpers';

export const yarg = yargs(hideBin(process.argv))
    .option('b', {
        alias: 'base',
        type: 'number',
        demandOption: true,
        describe: 'Multiplication table base'
    })    
    .option('l', {
        alias: 'limit',
        type: 'number',
        default: 10,
        describe: 'Multiplication table limit'
    })
    .option('v', {
        alias: 'show',
        type: 'boolean',
        default: false,
        describe: 'Show multiplication table'      
    })
    .check((argv, options) => {
        if(argv.b < 1) throw 'Error: base must be a number';
        return true;
    })
    .parseSync();
```

- Se puede probar con npx ts-node src/app --base 10 -s

### Aplicación de yarg con lógica de multiplicación

``` ts
import fs from 'fs';
import { yarg } from './config/plugins/args.plugin';


const {b:base, l:limit, s:show} = yarg;


let outputMessage = '';
const headerMessage = `
===========================
    Table del ${base}
===========================\n
`

for(let i = 1; i<=limit; i++){
    outputMessage += `${base} x ${i} = ${base*i}\n`;
}

outputMessage = headerMessage + outputMessage;

if(show){
    console.log(outputMessage);
}

const outputPath = 'outputs';

fs.mkdirSync(outputPath, {recursive: true});
fs.writeFileSync(`${outputPath}/tabla-${base}.txt`, outputMessage);
```

1. Probar con 
``` bash
npx ts-node src/app.old --base 3 --limit 4 -s
```

## 5. Refactorizar - Organizar lógicamente el código
- Actualmente el código está acoplado, lo cual lo haría difícil de testear.
- La capa de presentation se refiere a lo que consume la aplicación.

1. src -> presentation -> server-app.ts
    - Se define que pueda recibir la dependencia de yargs, la cual solo se ocupará desde app para poder pasarla a esta clase.
``` ts
interface RunOptions {
    base: number;
    limit: number;
    showTable: boolean;
}

export class ServerApp {
    static run(options: RunOptions) {
        console.log('Server running...')
    }
}
```
2. Llamar server-app en app.ts

``` ts
import { yarg } from "./config/plugins/args.plugin";
import { ServerApp } from "./presentation/server-app";

//console.log(process.argv);


(async() => {
    await main();
})();

async function main() {
    const {b:base, l:limit, s:showTable} = yarg;
    ServerApp.run({base, limit, showTable});
}
```

### Casos de uso
- El software de capas de los casos de uso contiene las reglas de negocio específicas de la aplicación. Condensa e implementa todos los casos de uso del sistema. Estos casos de uso orquestan el flujo dentro y hacia las entidades.

<img src='Imagenes\06.CleanArq.png'></img>

- Los casos de uso en la aplicación serían:
    1. Poder construir la tabla. Es decir, construir el resultado de la tabla.
    2. Grabar en el file system, en donde fácilmente se puede cambiar cuál es el destino de ese archivo.

#### 1. Caso de usp - CreateTable
- En domain se tienen las reglas que van a regir las otras capas exteriores.
1. src -> domain -> use-cases -> create-table.use-case.ts
    - El contructor no tiene uso en este ejemplo, pero su existencia permite aplicar DI (inyección de dependencia), el cual permite flexibilidad del códig y su reutilización.
    - Con el constructor se le va a poder inyectar al caso de uso cómo se desea se cree la data del archivo o lo que se desee que haga basado en dependencias externas.

``` ts
export interface CreateTableUseCase {
    execute: (options: CreateTableOptions) => string;
}

export interface CreateTableOptions {
    base: number;
    limit?: number;
}

export class CreateTable implements CreateTableUseCase {
    constructor(

    ){}

    execute({base, limit = 10}: CreateTableOptions){
        let outputMessage = ';'
        for(let i = 1; i<=limit; i++){
            outputMessage += `${base} x ${i} = ${base*i}\n`;
        }
        return outputMessage;
    }
}
```

2. Colocar caso de uso en server-app.ts

``` ts
import { CreateTable } from '../domain/use-cases/create-table.use-case';
interface RunOptions {
    base: number;
    limit: number;
    showTable: boolean;
}

export class ServerApp {
    static run({base, limit, showTable}: RunOptions) {
        console.log('Server running...')

        const table = new CreateTable().execute({base, limit});

        if(showTable) console.log(table);
    }
}
```

#### 2. SaveFiel - UseCase
- Por el momento se llama a la dependencia fs en el método, pero eso no debe hacerse ya que va en contra de arquitectura limpia.
    - Esa dependencia de fs debería venir de un repositorio.

``` ts
import fs from 'fs';
export interface SaveFileUseCase {
    execute: (options: Options) => boolean;
}

export interface Options {
    fileContent: string;
    destination?: string;
    fileName?: string;
}

export class SaveFile implements SaveFileUseCase {
    constructor(
        /** repository: StorageRepository */
    ){ }

    execute({fileContent, fileName = 'table', destination = 'outputs'}: Options): boolean {
        try {
            fs.mkdirSync(destination, {recursive: true});
            fs.writeFileSync(`${destination}/tabla-${fileName}.txt`, fileContent);
            return true;
        } catch (error) {
            console.log(error);
            return false;
        }
    };
}
```

- Invocar en server-app

``` ts
import { CreateTable } from '../domain/use-cases/create-table.use-case';
import { SaveFile } from '../domain/use-cases/save-file.use-case';
interface RunOptions {
    base: number;
    limit: number;
    showTable: boolean;
}

export class ServerApp {
    static run({base, limit, showTable}: RunOptions) {
        console.log('Server running...')

        const table = new CreateTable().execute({base, limit});
        const wasCreated = new SaveFile().execute({fileContent: table})

        if(showTable) console.log(table);

        (wasCreated) 
        ? console.log('File created')
        : console.error('File not created')
    }
}
```

# Sección 07. Testing
- Para este proceso de testing ahora se colocarán los archivos de test en el mismo directorio en donde se encuentra el archivo a hacer test.

## Temas
1. Pruebas sobre comandos de consola
2. Cambiar dinámicamente los argumentos de consola
3. Mocks
4. Spies
5. Mocks y Spies con retornos personalizados
6. Pruebas cuando se esperan errores
7. Pruebas de Casos de Uso
8. Pruebas de integración
9. Pruebas con funciones asíncronas anónimas auto-invocadas
10. Pruebas con yargs
11. Pruebas con creación de archivos y directorios
12. Y más

## 1. Configurar Jest + TS
https://gist.github.com/Klerith/98d7b1bc0f1525e892f260813cad1007
1. Instalar jest, sus types, ts-jest y supertest

``` bash
npm i -D jest @types/jest ts-jest supertest
```

2. Crear archivo de configuración de Jest
    - De igual manera que con la sección anterior se dice que no a la limpieza de mocks, pero más adelante en otras secciones se ocupa debido a su gran utilidad.

``` bash
npx jest --init
```

<img src='Imagenes\07-TestingConfig.png'></img>

3. Agregar siguiente configuración en jest.config.js
    - Los campos ya se encuentran en el archivo, solo es buscarlos, descomentarlos y colocar el valor deseado.

``` js
preset: 'ts-jest',
testEnvironment: "jest-environment-node",

// Opcional - The paths to modules that run some code to configure or set up the testing environment before each test
// setupFiles: ['dotenv/config'],
```

4. Crear Scripts de test en package.json

``` json
 "scripts": {
    "test": "jest",
    "test:watch": "jest --watch",
    "test:coverage": "jest --coverage",
```

5. Excluir en tsconfig.json los archivos de testing.

``` json
  "exclude": ["node_modules", "dist", "src/**/*.test.ts"],
```

## 2. Pruebas CreateTable UseCase
1. src- > domain -> use-cases -> create-table.use-case.test.ts

``` ts
import { CreateTable } from './create-table.use-case';
import { expect, describe, it  } from '@jest/globals';

describe("CreateTableUseCase", ()=>{
    it('Sould create table with default values', () =>{
        const createTable = new CreateTable();

        const table = createTable.execute({base: 2});
        const rows = table.split('\n');

        expect(createTable).toBeInstanceOf(CreateTable);
        expect(table).toContain('2 x 1 = 2');
        expect(table).toContain('2 x 10 = 20');
        expect(rows.length).toBe(10);
    });

    it('Should create table with custom values', () => {
        const createTable = new CreateTable();
        const options = {
            base: 3,
            limit: 5,
        }

        const table = createTable.execute(options);
        const rows = table.split('\n').length;

        expect(table).toContain('3 x 1 = 3');
        expect(table).toContain('3 x 5 = 15');
        expect(rows).toBe(options.limit);
    });
});
```

## 3. Pruebas - SaveFile UseCase
1. src- > domain -> use-cases -> save-file.use-case.test.ts
    - Para este caso se utiliza el ciclo de vida de las pruebas, ya que se desean borrar los archivos creados por la prueba una vez que hayan concluido.

``` ts
import { expect, describe, it  } from '@jest/globals';
import { SaveFile } from './save-file.use-case';
import fs from 'fs';
import { afterEach } from 'node:test';

describe("SaveFileUseCase", () => {

    const customOptions = {
        fileContent: 'custom content',
        destination: 'custom-outputs',
        fileName: 'custom-table-name',
    };

    const customFilePath = `${customOptions.destination}/${customOptions.fileName}.txt`

    afterEach(() => {
        const outputFolderExists = fs.existsSync('outputs');
        if(outputFolderExists) fs.rmSync('outputs', {recursive:true});

        const customOutputFolderExists = fs.existsSync(customOptions.destination);
        if(customOutputFolderExists) fs.rmSync(customOptions.destination, {recursive:true});
    });

    it("Should save file with default values", () => {
        const saveFile = new SaveFile();
        const filePath = 'outputs/table.txt'
        const options = {
            fileContent: 'test content'
        }

        const result = saveFile.execute(options);
        const fileExists = fs.existsSync(filePath);
        const fileContent = fs.readFileSync(filePath, {encoding: 'utf-8'});

        expect(result).toBe(true);
        expect(fileExists).toBe(true);
        expect(fileContent).toBe(options.fileContent);

    });

    it("Should save file with custom values", () => {
        const saveFile = new SaveFile();

        const result = saveFile.execute(customOptions);
        const fileExists = fs.existsSync(customFilePath);
        const fileContent = fs.readFileSync(customFilePath, {encoding: 'utf-8'});

        expect(result).toBe(true);
        expect(fileExists).toBe(true);
        expect(fileContent).toBe(customOptions.fileContent);



    });
});
```

### SpyOn + Mock Implementation
- Se realiza el test de fallo de SaveFile.
- Se tienen que simular fallos, los cuales vendrán de fs y los métodos que se ocupan como creación de archivo.
    - Método mdkirSync.
    - Método writeFileSync.
- Se usan método coom mockImplementation al crear el espía, ya que de lo contrario solo que queda espiando al método, lo que permite saber si la función fue llamada y con qué parámetros.
- Al definir un espía todos los tests que continúan a partir de su declaración en el mismo archivo van a manejar la implementación del espía. En otras palabras, el espía se persiste entre tests.
    - Se limpia el espía después de cada prueba usndo mockRestore.

``` ts
    it("Should return false if directory could not be created", () => {
        const saveFile = new SaveFile();
        const mkdirSpy = jest.spyOn(fs, 'mkdirSync').mockImplementation(
            () => {throw new Error('Custom error from testing');}
        );

        const result = saveFile.execute(customOptions);

        expect(result).toBe(false);

        mkdirSpy.mockRestore();
    });

    it("Should return false if file could not be written", () => {
        const saveFile = new SaveFile();
        const writeFileSpy = jest.spyOn(fs, 'writeFileSync').mockImplementation(
            () => {throw new Error('Custom file writing error from testing');}
        );

        const result = saveFile.execute(customOptions);

        expect(result).toBe(false);

        writeFileSpy.mockRestore();
    });
```

## 4. Pruebas - Argv
- Para este caso se debe preparar un ambiente para las pruebas, ya que se deben pasar parámetros a yargs los cuales vienen desde consola.
1. src -> config -> plugins -> args.plugin.test.ts
2. Crear función runCommand, la cual va a permitir modificar argv.
    - Una vez que se ha modificado argv se debe importar yarg.

``` ts
import { expect, describe, it, jest  } from '@jest/globals';
import { yarg } from './args.plugin';

const runCommand = async(args: string[]) => {
    process.argv = [...process.argv, ...args]

    const { yarg } = await import('./args.plugin');
    return yarg;
}

describe("Test args.plugin.ts", () => {
    it("Should return default values", async () => {
        const argv = await runCommand(['-b', '5']);

        expect(argv).toEqual( expect.objectContaining({
            b: 5,
            l: 10,
            s: false,
            n: 'multiplication-table',
            d: './outputs',
        }));
    })
});

```

### Valores personalizados Argv
- Se limpia process.argv con beforeEach.
- beforeEach debe venir de @jest/globals.
- Se corre solo este test con:

``` bash
 npm run test -- args.plugin.test.ts
```

``` ts
import { expect, describe, it, jest, beforeEach  } from '@jest/globals';

const runCommand = async(args: string[]) => {
    process.argv = [...process.argv, ...args]

    const { yarg } = await import('./args.plugin');
    return yarg;
}

describe("Test args.plugin.ts", () => {

    const originalArgv = process.argv;

    beforeEach(() => {
        process.argv = originalArgv;
        jest.resetModules();
    });

    it("Should return default values", async () => {
        const argv = await runCommand(['-b', '5']);

        expect(argv).toEqual( expect.objectContaining({
            b: 5,
            l: 10,
            s: false,
            n: 'multiplication-table',
            d: './outputs',
        }));
    });

    it("Should return configuration with custom values", async () => {
        const argv = await runCommand(['-b', '10', '-l', '5', '-s', 'true', '-n', 'testing table', '-d', 'test-output']);
        expect(argv).toEqual( expect.objectContaining({
            b: 10,
            l: 5,
            s: true,
            n: 'testing table',
            d: 'test-output',
        }));
    });
});

```

## 5. Pruebas ServerApp
### Prueba de integración
- En estas pruebas se pueden hacer mocks de los casos de uso para no tener que llamarlos, pero igualmente se pueden llamar si así se desea.
- Se hace una prueba de integración para asegurarse de que todos los pasos se ejecuten como se desea.
    - Esto seria revisar que los console.log se ejecuten.
- Por otro lado se hacen espías de los casos de uso, ya que éstos han sido probados ya.

``` ts
    it("Should run ServerApp with options", () => {

        const options = {
            base: 3,
            limit: 10,
            showTable: false,
            destination: 'test-desination',
            name: 'test-filename'
        };


        const logSpy = jest.spyOn(console, 'log');
        const createTableSpy = jest.spyOn(CreateTable.prototype, 'execute');
        const saveFileSpy = jest.spyOn(SaveFile.prototype, 'execute');

        ServerApp.run(options);

        expect(logSpy).toHaveBeenCalledTimes(2);
        expect(logSpy).toHaveBeenCalledWith('Server running...');
        expect(logSpy).toHaveBeenLastCalledWith('File created');

        expect(createTableSpy).toHaveBeenCalledTimes(1);
        expect(createTableSpy).toHaveBeenCalledWith({
            base: options.base, limit: options.limit
        });

        expect(saveFileSpy).toHaveBeenCalledTimes(1);
        expect(saveFileSpy).toHaveBeenCalledWith({
            fileContent: expect.any(String), fileName: options.name, destination: options.destination
        });

    });
```

### Pruebas unitarias
- Se crean mocks en lugar de hacer mock a la implementación directamente del método deseados.
    - Se usa jest.fn().
    - Estos mocks se limpian con un método de ciclo de vida y con jest.clearAllMocks()

- TS indica error debido a la singature de métodos que usan mock, lo cual se debe de importar difrectamente a jest de @jest/globals.
    - jest ya se puede usar directamente, pero para que no indique error se debe tener los archivos de test en el include de tsconfig.
    - Como se menciona en el curso es posible tener dos archivos de tsconfig, uno para desarrollo y otro para producción.

``` ts
import { expect, describe, it } from '@jest/globals';
import { ServerApp } from './server-app';
import { CreateTable } from '../domain/use-cases/create-table.use-case';
import { SaveFile } from '../domain/use-cases/save-file.use-case';
import { beforeEach } from 'node:test';

describe("Server App", () => {

    const options = {
        base: 3,
        limit: 3,
        showTable: false,
        destination: 'test-destination',
        name: 'test-filename'
    };

    beforeEach(() => {
        jest.clearAllMocks();
    });

    it("Should create ServerApp instance", () => {
        const serverApp = new ServerApp();

        expect(serverApp).toBeInstanceOf(ServerApp);
        expect(typeof ServerApp.run).toBe('function')
    });

    it("Should run ServerApp with options", () => {

        const logSpy = jest.spyOn(console, 'log');
        const createTableSpy = jest.spyOn(CreateTable.prototype, 'execute');
        const saveFileSpy = jest.spyOn(SaveFile.prototype, 'execute');

        ServerApp.run(options);

        expect(logSpy).toHaveBeenCalledTimes(2);
        expect(logSpy).toHaveBeenCalledWith('Server running...');
        expect(logSpy).toHaveBeenLastCalledWith('File created');

        expect(createTableSpy).toHaveBeenCalledTimes(1);
        expect(createTableSpy).toHaveBeenCalledWith({
            base: options.base, limit: options.limit
        });

        expect(saveFileSpy).toHaveBeenCalledTimes(1);
        expect(saveFileSpy).toHaveBeenCalledWith({
            fileContent: expect.any(String), fileName: options.name, destination: options.destination
        });

    });

    it("Should run ServerApp with custom values mocks", () => {

        const logMock = jest.fn();
        const logErrorMock = jest.fn();
        const createMock   = jest.fn().mockReturnValue('3 x 1 = 3');
        const saveFileMock = jest.fn().mockReturnValue(false);
    
        console.log = logMock;
        console.error = logErrorMock;
        CreateTable.prototype.execute = createMock;
        SaveFile.prototype.execute = saveFileMock;
    
    
        ServerApp.run(options);
    
        expect( logMock ).toHaveBeenCalledWith('Server running...');
        expect( createMock ).toHaveBeenCalledWith({"base": options.base, "limit": options.limit });
        expect( saveFileMock ).toHaveBeenCalledWith({
          fileContent: '3 x 1 = 3',
          destination: options.destination,
          fileName: options.name,
        });
        // expect( logMock ).toHaveBeenCalledWith('File created!');
        expect( logErrorMock ).not.toBeCalledWith();
    
    });
});
```

## 6. Pruebas App.ts
- El App.ts solo debe asegurarse que sea llamado con los argumentos de argv.