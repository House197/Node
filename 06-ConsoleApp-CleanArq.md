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
