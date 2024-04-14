# Sección 13. Webserver - Http/Http2
## Temas
1. Crear un WebServer
2. Manual
3. Con express
4. Variables de entorno
5. Single Page Application + Router de Frontend
6. Servir diferentes archivos
7. Desplegar servidor en la nube
8. GitHub
9. Railway
10. Mucho más

## 1. Inicio de proyecto
- Revisar notas.

## 2. Webserver http/1
- Un WebServer se da cuando se carga una pantalla y se trae la pantalla inicial, mientras que un REST server se da cuando se realiza un tipo de interacción que llega solo a cargar cuerta parte de la información.
- Un servidor es un dispositivo virtual que le brinda espacio y estructura a los sitios web para que almacenen sus datos y manejen sus páginas.

1. src -> app.ts
    - Se coloca la forma más básico para construir un servidor.
    - Se aprecia en la consola que solicita el favicon, el cual lo utiliza el browsaer para colocarle un icono.

``` ts
import http from 'http';

const server = http.createServer((req, res) => {
    console.log(req.url);
    res.write('Hola mundo');
    res.end();
});

server.listen(8081, () => {
    console.log('Server running on port 8081');
});
```

### Diferentes respuestas
- En función de qué petición se recibió se reacciona a qué devolver.

#### Server side rendering
- El siguiente código hace referencia al concpecto Server Side Rendering, ya que cuando se hace una solicitud a la página (/home, /about, etc), lo que se devuelve está creado del lado del servidor.

``` ts
import http from 'http';

const server = http.createServer((req, res) => {
    console.log(req.url);

    res.writeHead(200, {'Content-Type': 'text/html'});
    res.write(`<h1>${res.url}</h1>`);
    res.end();
});

server.listen(8081, () => {
    console.log('Server running on port 8081');
});
```

#### Regresar JSON
``` ts
import http from 'http';

const server = http.createServer((req, res) => {
    console.log(req.url);

    const data = {'name': 'cui', 'age': 2};
    res.writeHead(200, {'Content-Type': 'application/json'});
    res.end(JSON.stringify(data));

});

server.listen(8081, () => {
    console.log('Server running on port 8081');
});
```

#### Regresar páginas
1. public -> index.html
2. Retornar archivo html según la ruta que se pide.

``` ts
import http from 'http';
import fs from 'fs';

const server = http.createServer((req, res) => {
    console.log(req.url);

    if(req.url == '/'){
        const htmlFile = fs.readFileSync('./public/index.html', 'utf-8');
        res.writeHead(200, {'Content-Type': 'text/html'});
        res.end(htmlFile); 
    } else {
        res.writeHead(404, {'Content-Type': 'text/html'});
        res.end();
    }

});

server.listen(8081, () => {
    console.log('Server running on port 8081');
});
```
##### Responder demás archivos (CSS, JS)
1. public -> css -> style.css
2. public -> js -> index.js
3. Vincular archivos en el html.

``` html
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Document</title>
    <link href="./css/style.css" rel="stylesheet"></link>
    <script src="./js/index.js" defer></script>
</head>
<body>
    <h1>Cui cui</h1>
</body>
</html>
```

``` ts
import http from 'http';
import fs from 'fs';

const server = http.createServer((req, res) => {
    console.log(req.url);

    if(req.url == '/'){
        const htmlFile = fs.readFileSync('./public/index.html', 'utf-8');
        res.writeHead(200, {'Content-Type': 'text/html'});
        res.end(htmlFile); 
        return;
    }

    if(req.url?.endsWith('.js')){
        res.writeHead(200, {'Content-Type': 'application/javascript'});
    } else if(req.url?.endsWith('.css')){
        res.writeHead(200, {'Content-Type': 'text/css'});
    }

    const responseContent = fs.readFileSync(`./public${req.url}`, 'utf-8');
    res.end(responseContent);

});

server.listen(8081, () => {
    console.log('Server running on port 8081');
});
```

- Esto es un web server, ya que a partir de la petición se regresa contenido estático.

## 3. Http2 - OpenSSL
- Http2 pide crear un secure server, el cual pide opciones.
    - Se debe usar createSecureServer ya que no hay browsers que soporten HTTP/2 sin encriptar, por lo que el uso de createSecureServer es necesario par comunicarse con clientes browser.
    - En las opciones se colocan los campos de key y cert.
- https://cursos.devtalles.com/courses/take/nodejs-de-cero-a-experto/lessons/48244967-http2-openssl
    - Para Linux y Mac basta con copiar la línea de código y ponerla en la terminal.
    - En Windows al tener instalado git y el git bash entonces ya se tiene OpenSSl.
        1. Encontrar path de openssl en equipo.
            1. C:\Program Files\Git\usr\bin
        2. Actualizar variables de entorno.
            1. Escribir env en la sección de búsqueda al persionar la tecla de windows.
            2. Opciones avanzadas.
            3. Editar Path.
            4. Colocar path de openssl.
        3. Cerrar powershell si se tenía abierta.
        4. Escribir openssl.
        5. Navegar al directorio del proyecto de node en el que se trabaja.
        5. Copiar comando del curso y ejecutarlo en terminal.
1. Colocar llaves generadas en keys.
    - De ignoran en git.
2. Leer archivos en la configuración de options de createSecureServer.
3. Acceder al sitio localhost usando https.
4. Se usa try catch para evitar error que no encuentra favicon.

``` ts
import http2 from 'http2';
import fs from 'fs';

const server = http2.createSecureServer({
    key: fs.readFileSync('./keys/server.key'),
    cert: fs.readFileSync('./keys/server.crt'),
} ,(req, res) => {
    console.log(req.url);

    if(req.url == '/'){
        const htmlFile = fs.readFileSync('./public/index.html', 'utf-8');
        res.writeHead(200, {'Content-Type': 'text/html'});
        res.end(htmlFile); 
        return;
    }

    if(req.url?.endsWith('.js')){
        res.writeHead(200, {'Content-Type': 'application/javascript'});
    } else if(req.url?.endsWith('.css')){
        res.writeHead(200, {'Content-Type': 'text/css'});
    }

    try {
      
        const responseContent = fs.readFileSync(`./public${req.url}`, 'utf-8');
        res.end(responseContent);
    
    } catch (error) {
        res.writeHead(404, {'Content-Type': 'text/html'});
        res.end(); 
    }
});

server.listen(8081, () => {
    console.log('Server running on port 8081');
});
```

## 4. Express
- Lo relacionado a express va a en la capa de presentation.

1. Instalación
    - Asegurarse que las versiones de ambos paquetes sean lo más cercanas posibles para evitar problemas de incompatibilidad.
``` bash
npm install express
npm i -D @types/express
```

2. presentation -> server.ts
    - Aunque se tiene a express como dependencia oculta no hay problema, ya que solo se usará acá.

``` ts
import express from 'express';

export class Server {
    private app = express();

    async start() {
        console.log('server running');
    }
}
```

3. Configurar middleware en server para servir archivos.

``` ts
import express from 'express';

export class Server {
    private app = express();

    async start() {

        this.app.use(express.static('./public'));

        this.app.listen(3000, () => {
            console.log(`Server running on Port: ${process.env.PORT}`)
        })
    }
}
```

4. Configurar app.ts para ser el punto de salida de la app.

``` ts
import { Server } from "./presentation/server";

(async () => {
    main();
})();

function main() {
    const server = new Server();
    server.start();
}
```

## 5. Servir SPA con Router
- Se sabe que una aplicación hecha con un framework como react se rompe si se refresca la ventana al momento de estar en una ruta, ya que la aplicación gestiona las rutas pero se debe cargar primero la principal.
    - En otras palabras, react se encarga del enrutamiento del lado del cliente.
- Esto se resuelve si la aplicación se sirve con un servidor, en donde el contenido se coloca en public.
- Usar comodín para atrapar todas las requests.

``` ts
import express from 'express';
import path from 'path';

export class Server {
    private app = express();

    async start() {

        this.app.use(express.static('./public'));

        this.app.get('*', (req, res) => {
            const indexPath = path.join(__dirname + '../../../public/index.html');
            res.sendFile(indexPath);
        });

        this.app.listen(3000, () => {
            console.log(`Server running on Port: ${process.env.PORT}`)
        })
    }
}
```

## 6. Variables de entorno
1. Crear archivo .env y su copia para subirla al repo y saber qué variables se necesitan.

``` env
PORT=3000
PUBLIC_PATH=public
```

2. src -> config -> envs.ts

``` ts
import 'dotenv/config';
import {get} from 'env-var';

export const envs = {
    PORT: get('PORT').required().asPortNumber(),
    PUBLIC_PATH: get('PUBLIC_PATH').default('public').asString(),
}
```

3. Definir argumentos de la clase SERVER para usar PORT y definir public path.

``` ts
import express from 'express';
import path from 'path';

interface Options {
    port: number;
    public_path?: string;
}

export class Server {
    private app = express();
    private readonly port: number;
    private readonly publicPath: string;

    constructor(options: Options){
        const {port, public_path = 'public'} = options;
        this.port = port;
        this.publicPath = public_path;
    }

    async start() {

        this.app.use(express.static(this.publicPath));

        this.app.get('*', (req, res) => {
            const indexPath = path.join(__dirname + `../../../${this.publicPath}/index.html`);
            res.sendFile(indexPath);
        });

        this.app.listen(this.port, () => {
            console.log(`Server running on Port: ${process.env.PORT}`)
        })
    }
}
```

4. Pasar argumento a Server.

``` ts
import { envs } from "./config/envs";
import { Server } from "./presentation/server";

(async () => {
    main();
})();

function main() {
    const server = new Server({
        port: envs.PORT,
        public_path: envs.PUBLIC_PATH
    });
    server.start();
}
```

## 7. Desplegar en Railway
1. Se debe tener el proyecto en git.
https://cursos.devtalles.com/courses/take/nodejs-de-cero-a-experto/lessons/48245010-desplegar-en-railway

# Sección 14. RestServer
- Una particularidad de peticiones REST en una API tradicional es que no tiene estado.
    - Es decir, no se conoce si el endpoint se llama desde un celular, de la web u otro servidor.
- Uno de sus fuertes de RESTful API es que tiene una autenticación pasiva.
    - Es decir, cualquier persona puede mandarlo a llamar, y es en ese momento en que se hace la solicitud en el cual el servidor valida todo lo demás.

## Temas
1. CRUD
    1. Create
    2. Read
    3. Updtate
    4. Delete
2. Desplegar Restful server a la web
3. Configurar las rutas y los controladores

## 1. Rutas
1. src -> presentation -> routes.ts

``` ts
import { Router } from "express";

export class AppRoutes {
    static get routes(): Router {
        const router = Router();
        
        router.get('/api/todos', (req, res) => {
            res.json([
                {id:1, text: 'Cui'}, 
                {id:2, text: 'Houser'}, 
                {id:3, text: 'Bethoveen'}
            ]);
        });
        
        return router;        
    }
}
```

2. Implementar rutas en server.

``` ts
import express, { Router } from 'express';
import path from 'path';

interface Options {
    port: number;
    routes: Router;
    public_path?: string;
}

export class Server {
    private app = express();
    private readonly port: number;
    private readonly publicPath: string;
    private readonly routes: Router;

    constructor(options: Options){
        const {port, routes, public_path = 'public'} = options;
        this.port = port;
        this.publicPath = public_path;
        this.routes = routes;
    }

    async start() {

        this.app.use(express.static(this.publicPath));

        // Routes
        this.app.use(this.routes);

```

3. Pasar routes desde app.ts

``` ts
import { envs } from "./config/envs";
import { AppRoutes } from "./presentation/routes";
import { Server } from "./presentation/server";

(async () => {
    main();
})();

function main() {
    const server = new Server({
        port: envs.PORT,
        public_path: envs.PUBLIC_PATH,
        routes: AppRoutes.routes
    });
    server.start();
}
```

## 2. Controladores
- Usualmente se aplica inyección de dependencias.
    - Por ejemplo, se inyecta un repositorio y que las rutas usen ese repo. O también, inyectar el repositorio para poder implementar y usarlo mediante casos de uso.

1. \src\presentation\todos\controller.ts
``` ts
import { Request, Response } from "express";

export class TodosController {
    constructor(){}

    public getTodos = (req: Request, res: Response) => {
        res.json([
            {id:1, text: 'Cui'}, 
            {id:2, text: 'Houser'}, 
            {id:3, text: 'Bethoveen'}
        ]);
    }
}
```
2. Delegar rutas que va a tener el controlador.
    1. \src\presentation\todos\routes.ts
    2. Va a tener lo mismo que el enrutador de la app, solo que con nombre diferente.

``` ts
import { Router } from "express";
import { TodosController } from "./controller";


export class TodoRoutes {
    static get routes(): Router {
        const router = Router();
        const todoController = new TodosController();

        router.get('/', todoController.getTodos);
        
        return router;        
    }
}
```

3. En las rutas globales se cambia get por use y se manda a llamar TodoRoutes.
``` ts
import { Router } from "express";
import { TodoRoutes } from "./todos/routes";

export class AppRoutes {
    static get routes(): Router {
        const router = Router();

        router.use('/api/todos', TodoRoutes.routes);
        
        return router;        
    }
}
```

## 3. CRUD
### 1. READ
- Se quiere traer todo por id.
1. Se define el método del controlador todo.
``` ts
    public getTodoById = (req: Request, res: Response) => {
        const id = +req.params.id;
        if(isNaN(id)) return res.status(400).json({error: 'ID argument is not a number'});
        const todo = todos.find(todo => todo.id === id);
        (todo)
          ? res.json(todo)
          : res.status(404).json({error: `TODO with id ${id} not found`});
    }
```

2. Definir rutas en TodoRoutes.

``` ts
export class TodoRoutes {
    static get routes(): Router {
        const router = Router();
        const todoController = new TodosController();

        router.get('/', todoController.getTodos);
        router.get('/:id', todoController.getTodoById);
        
        return router;        
    }
}
```

### 2. CREATE
1. Definir en express cómo se desea manejar la serialización de peticiones de post. Se especifica en el server.ts
    - Se crean dos middlewares.

``` ts
        //* Middlewares
        this.app.use(express.json()); // raw
        this.app.use(express.urlencoded({extended:true})) // x-www-form-urlencoded
```

1. Crear método en todos/controller.ts

``` ts
    public createTodo = (req: Request, res: Response) => {
        const {text} = req.body;
        if( !text ) res.status(400).json({error: 'Text property is required'});

        const newTodo = {
            id: todos.length + 1,
            text: text,
        };

        todos.push(newTodo);

        res.json(newTodo);
    }

```

2. Crear ruta en todos/routes.ts

``` ts

export class TodoRoutes {
    static get routes(): Router {
        const router = Router();
        const todoController = new TodosController();

        router.get('/', todoController.getTodos);
        router.get('/:id', todoController.getTodoById);
        router.post('/', todoController.createTodo);
        
        return router;        
    }
}
```

### 3. UPDATE
- Se usa el método Put o Patch.
``` ts
router.put('/:id', todoController.createTodo);
``` 

### 4. DELETE
- Se usa el método Delete.
``` ts
router.delete('/:id', todoController.createTodo);
``` 

# Sección 15. RestServer + PostgreSQL
## Temas
1. Conectar Postgres a nuestros endpoints
2. DTOs Pattern (Data Transfer Objects)
3. Aprovisionar Postgres en la nube
4. Desplegar aplicación

## 1. Base de datos Postgres
https://gist.github.com/Klerith/49bbec66abe6affe3700324d2d3bf440
1. Se prepara el .env
2. Se crea el archivo docker-compose

## 2. Prisma Postgres
1. Instalar
``` bash
npm install -D prisma
```

``` bash
npx prisma init --datasource-provider postgresql
```

2. Crear modelo y apuntar a URL propia de .env.

``` ts
// This is your Prisma schema file,
// learn more about it in the docs: https://pris.ly/d/prisma-schema

// Looking for ways to speed up your queries, or scale easily with your serverless or edge functions?
// Try Prisma Accelerate: https://pris.ly/cli/accelerate-init

generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("POSTGRES_URL")
}

model todo {
  id          Int       @id @default(autoincrement())
  text        String    @db.VarChar
  completedAt DateTime? @db.Timestamp()
}

```

3. Correr migración.
    - Son procedimientos para hacer las modificaciones directamente hacia la db. Se pueden revertir o aplicarlas al hacer deployments a bases de datos ya en producción. 
    - Cada que se hagan cambios a partir de este punto al esquema, se vuelve a hacer una migración.
``` bash
npx prisma migrate dev --name init
```

## 3. Crear TODO
1. Node\13-RestWeb\src\data\postgres\index.ts

``` ts
import { PrismaClient } from "@prisma/client";

export const prisma = new PrismaClient();
```

2. Implementar métodos en todos/controller.ts

``` ts
    public createTodo = async (req: Request, res: Response) => {
        const {text} = req.body;
        if( !text ) res.status(400).json({error: 'Text property is required'});

        const todo = await prisma.todo.create({
            data: {text}
        })
        
        res.json(todo);
    }
```

## 4. CRUD completo
``` ts
import { Request, Response } from "express";
import { prisma } from "../../data/postgres";

export class TodosController {
    constructor(){}

    public getTodos = async (req: Request, res: Response) => {
        const todos = await prisma.todo.findMany();
        return res.json(todos);
    }

    public getTodoById = async (req: Request, res: Response) => {
        const id = +req.params.id;
        if(isNaN(id)) return res.status(400).json({error: 'ID argument is not a number'});
        const todo = await prisma.todo.findFirst({where: {id}});
        (todo)
          ? res.json(todo)
          : res.status(404).json({error: `TODO with id ${id} not found`});
    }

    public createTodo = async (req: Request, res: Response) => {
        const {text} = req.body;
        if( !text ) res.status(400).json({error: 'Text property is required'});

        const todo = await prisma.todo.create({
            data: {text}
        })
        
        res.json(todo);
    }

    public updateTodo = async (req: Request, res: Response) => {
        const id = +req.params.id;
        if(isNaN(id)) return res.status(400).json({error: 'ID argument is not a number'});

        const todo = await prisma.todo.findFirst({where: {id}});
        if(!todo) return res.status(404).json({error: `Todo with id ${id} not found`})

        const { text, completedAt } = req.body;
        todo.text = text || todo.text;
        const updatedTodo = await prisma.todo.update({where: {id}, data: {text, completedAt: (completedAt) ? new Date(completedAt) : null}});
        res.json(updatedTodo)
    }

    public deleteTodo = async (req: Request, res: Response) => {
        const id = +req.params.id;
        const todo = await prisma.todo.findFirst({where: {id}});
        if(!todo) return res.status(404).json({error: `Todo with id ${id} not found`})

        const deletedTodo = await prisma.todo.delete({where: {id}})
        return res.json(deletedTodo);
    }

}
```

## 5. DTO - CreateTodoDTO
- Objeto hecho para transferir información.
1. Node\13-RestWeb\src\domain\dtos\todos\create-todo.dto.ts
    - Se tiene la obligación de enviar los prámetros en cierto orden, por lo que se decide usar private constructor.
    - Se aplica el concepto de private constructor.
        - Solo se va a poder llamar dentro de un métoo estático de la clase.

``` ts
export class CreateTodoDto {
    constructor(
        public readonly text: string,
    ){}

    static create(props: {[key:string]: any}): [string?, CreateTodoDto?] {
        const { text } = props;
        if(!text) return ['Text property is required', undefined]; 
        return [undefined, new CreateTodoDto(text)];
    };
}
```

2. Aplicarlo en el todos/controller.ts

``` ts
    public createTodo = async (req: Request, res: Response) => {
        const [error, createTodoDto] = CreateTodoDto.create(req.body);
        if(error) return res.status(400).json({error});


        const todo = await prisma.todo.create({
            data: createTodoDto!
        })
        
        res.json(todo);
    }
```

## 6. UpdateTodoDTO
1. Node\13-RestWeb\src\domain\dtos\todos\update-todo.dto.ts

``` ts
export class UpdateTodoDto {
    constructor(
        public readonly id: number,
        public readonly text?: string,
        public readonly completedAt?: string,
    ){}

    get values() {
        const returnObj: {[key: string]: any} = {};
        if(this.text) returnObj.text = this.text;
        if(this.completedAt) returnObj.completedAt = this.completedAt

        return returnObj;
    }

    static create(props: {[key:string]: any}): [string?, UpdateTodoDto?] {
        const {id, text, completedAt } = props;
        let newCompletedAt = completedAt;

        if(!id || isNaN(Number(id))) return ['id must be a valid number'];

        if(completedAt) {
            newCompletedAt = new Date(completedAt)
            if( newCompletedAt.toString() === 'Invalid Date' ) {
                return ['CompletedAt must be a valid date', undefined];
            } 
        }

        
        return [undefined, new UpdateTodoDto(id, text, newCompletedAt)];
    };
}
```

## 9. Aprovisionar db en la nube
https://neon.tech/
https://cursos.devtalles.com/courses/take/nodejs-de-cero-a-experto/lessons/48249188-aprovisionar-base-de-datos-en-la-nube/discussions/9019936
1. Se crea script de prisma para sincronizar la db con las últimas migraciones.
    - De igual manera se debe agregar este nuevo script en el de build.

``` json
    "build": "rimraf ./dist && tsc && npm run prisma:migrate:prod",
    "prisma:migrate:prod": "prisma migrate deploy"
```

2. Se obtiene el url de conexión de la db y se actualiza la variable de entorno.

# Sección 16. Rest - Clean Architecture - Domain Driven Design
## 1. TodoEntity
1. domain -> entities -> todo.entity.ts
- La clase va a tener su metodo que hace el mapper.

``` ts
export class TodoEntity {
    constructor(
        public id: number,
        public text: string,
        public completedAt?: Date|null
    ){}

    get isCompleted(){
        return !!this.completedAt;
    }

    public static fromObject(object: {[key: string]: any}): TodoEntity {
        const {id, text, completedAt} = object;
        if(!id) throw 'Id is required';
        if(!text) throw 'Text is required';
        let newCompletedAt;
        if(completedAt) {
            newCompletedAt = new Date(completedAt);
            if(isNaN(newCompletedAt.getTime())){
                throw 'CompletedAt is not a valid date'
            }
        }

        return new TodoEntity(
            id, text, completedAt
        )
    }
}
```

## 2. Datasources y Repositories
1. Node\13-RestWeb\src\domain\datasources\todo.datasource.ts

``` ts
import { CreateTodoDto } from '../dtos/todos/create-todo.dto';
import { UpdateTodoDto } from '../dtos/todos/update-todo.dto';
import { TodoEntity } from '../entities/todo.entity';

export abstract class TodoDatasource {
    abstract create(createTodoDto: CreateTodoDto): Promise<TodoEntity>;
    abstract getAll(): Promise<TodoEntity[]>;
    abstract findById(id:number): Promise<TodoEntity>;
    abstract updateById(updateTodoDto: UpdateTodoDto): Promise<TodoEntity>;
    abstract deleteById(id:number): Promise<TodoEntity>;
}
```

## 3. TodoDatasource Implementation
- La implementación luce así:

``` ts
import { prisma } from '../../data/postgres';
import { TodoDatasource } from '../../domain/datasources/todo.datasource';
import { CreateTodoDto } from '../../domain/dtos/todos/create-todo.dto';
import { UpdateTodoDto } from '../../domain/dtos/todos/update-todo.dto';
import { TodoEntity } from '../../domain/entities/todo.entity';

export class TodoDatasourceImpl implements TodoDatasource {
    async create(createTodoDto: CreateTodoDto): Promise<TodoEntity> {
        const todo = await prisma.todo.create({
            data: createTodoDto!
        })

        return TodoEntity.fromObject(todo);
    }
    async getAll(): Promise<TodoEntity[]> {
        const todos = await prisma.todo.findMany();
        return todos.map(todo => TodoEntity.fromObject(todo));
    }
    async findById(id: number): Promise<TodoEntity> {
        const todo = await prisma.todo.findFirst({where: {id}})

        if(!todo) throw `TODO with id ${id} not found`;
        return TodoEntity.fromObject(todo);
    }
    async updateById(updateTodoDto: UpdateTodoDto): Promise<TodoEntity> {
        const id = updateTodoDto.id;
        await this.findById(id);
        const updatedTodo = await prisma.todo.update({
            where: {id}, 
            data: updateTodoDto!.values
        });
        return TodoEntity.fromObject(updatedTodo);
    }
    async deleteById(id: number): Promise<TodoEntity> {
        await this.findById(id);
        const deletedTodo = await prisma.todo.delete({where: {id}})
        return TodoEntity.fromObject(deletedTodo);
    }

}
```

## 4. TodoRepository Implementation
1. Se inyecta el datasource.

``` ts
import { TodoDatasource } from "../../domain/datasources/todo.datasource";
import { CreateTodoDto } from "../../domain/dtos/todos/create-todo.dto";
import { UpdateTodoDto } from "../../domain/dtos/todos/update-todo.dto";
import { TodoEntity } from "../../domain/entities/todo.entity";
import { TodoRepository } from "../../domain/repositories/todo.repository";

export class TodoRepositoryImpl implements TodoRepository {

    constructor(
        private readonly datasource: TodoDatasource
    ){}

    create(createTodoDto: CreateTodoDto): Promise<TodoEntity> {
        return this.datasource.create(createTodoDto);
    }
    getAll(): Promise<TodoEntity[]> {
        return this.datasource.getAll();
    }
    findById(id: number): Promise<TodoEntity> {
        return this.datasource.findById(id);
    }
    updateById(updateTodoDto: UpdateTodoDto): Promise<TodoEntity> {
        return this.datasource.updateById(updateTodoDto);
    }
    deleteById(id: number): Promise<TodoEntity> {
        return this.datasource.deleteById(id);
    }

}
```

## 5. Uso del repositorio en los controladores
1. Crear instancias de implementaciones de datasource y repository en TodoRoutes. Node\13-RestWeb\src\presentation\todos\routes.ts
2. Se inyecta el repositorio al controller.

``` ts
export class TodoRoutes {
    static get routes(): Router {
        const router = Router();

        const datasource = new TodoDatasourceImpl()
        const todoRepository = new TodoRepositoryImpl(datasource);

        const todoController = new TodosController(todoRepository);

```

``` ts
import { Request, Response } from "express";
import { prisma } from "../../data/postgres";
import { CreateTodoDto } from "../../domain/dtos/todos/create-todo.dto";
import { UpdateTodoDto } from "../../domain/dtos/todos/update-todo.dto";
import { TodoRepository } from "../../domain/repositories/todo.repository";

export class TodosController {
    constructor(
        private readonly todoRepository: TodoRepository
    ){}

    public getTodos = async (req: Request, res: Response) => {
        const todos = await this.todoRepository.getAll();
        return res.json(todos);
    }

    public getTodoById = async (req: Request, res: Response) => {
        const id = +req.params.id;

        try {
            const todo = await this.todoRepository.findById(id);
            res.json(todo);
        } catch (error) {
           res.status(400).json(error); 
        }
    }

    public createTodo = async (req: Request, res: Response) => {
        const [error, createTodoDto] = CreateTodoDto.create(req.body);
        if(error) return res.status(400).json({error});

        const todo = await this.todoRepository.create(createTodoDto!);
        res.json(todo);
    }

    public updateTodo = async (req: Request, res: Response) => {
        const id = +req.params.id;
        const [error, updateTodoDto] = UpdateTodoDto.create({
            ...req.body, id
        })

        if(error) return res.status(400).json(error);

        const updatedTodo = await this.todoRepository.updateById(updateTodoDto!);
        res.json(updatedTodo);
    }

    public deleteTodo = async (req: Request, res: Response) => {
        const id = +req.params.id;
        const deletedTodo = await this.todoRepository.deleteById(id);
        res.json(deletedTodo);
    }

}
```

## 6. Casos de uso
- La idea es mandar a llamar los casos de uso desde cualquier punto.
- Se se requiere que se les inyecte el repositorio.
1. Se crean en la carpeta domain -> use-cases -> todos -> 
    - Se crean para cada método que se tiene en el datasource.
    - Siguen la misma estructura

``` ts
import { TodoEntity } from "../../entities/todo.entity";
import { TodoRepository } from "../../repositories/todo.repository";

export interface DeleteTodoUseCase {
    execute(id: number): Promise<TodoEntity>
}

export class GetTodo implements DeleteTodoUseCase {

    constructor(
        private readonly repository: TodoRepository
    ){}

    execute(id: number): Promise<TodoEntity> {
        return this.repository.deleteById(id);
    }
}
```

## 7. Consumir los casos de uso
- Los casos de uso ayudan a no usar async en los controladores, lo cual se recomienda por express.

``` ts
import { Request, Response } from "express";
import { prisma } from "../../data/postgres";
import { CreateTodoDto } from "../../domain/dtos/todos/create-todo.dto";
import { UpdateTodoDto } from "../../domain/dtos/todos/update-todo.dto";
import { TodoRepository } from "../../domain/repositories/todo.repository";
import { GetTodos } from "../../domain/use-cases/todos/get-todos";
import { GetTodo } from "../../domain/use-cases/todos/get-todo";
import { CreateTodo } from "../../domain/use-cases/todos/create-todo";
import { UpdateTodo } from "../../domain/use-cases/todos/update-todo";
import { DeleteTodo } from "../../domain/use-cases/todos/delete-todo";

export class TodosController {
    constructor(
        private readonly todoRepository: TodoRepository
    ){}

    public getTodos = (req: Request, res: Response) => {
        new GetTodos(this.todoRepository)
            .execute()
            .then(todos => res.json(todos))
            .catch(error => res.json(400).json({error}));
    }

    public getTodoById = (req: Request, res: Response) => {
        const id = +req.params.id;

        new GetTodo(this.todoRepository)
        .execute(id)
        .then(todo => res.json(todo))
        .catch(error => res.json(400).json({error}));
    }

    public createTodo = (req: Request, res: Response) => {
        const [error, createTodoDto] = CreateTodoDto.create(req.body);
        if(error) return res.status(400).json({error});

        new CreateTodo(this.todoRepository)
        .execute(createTodoDto!)
        .then(todo => res.json(todo))
        .catch(error => res.json(400).json({error}));
    }

    public updateTodo = (req: Request, res: Response) => {
        const id = +req.params.id;
        const [error, updateTodoDto] = UpdateTodoDto.create({
            ...req.body, id
        })

        if(error) return res.status(400).json(error);

        new UpdateTodo(this.todoRepository)
        .execute(updateTodoDto!)
        .then(todo => res.json(todo))
        .catch(error => res.json(400).json({error}));
    }

    public deleteTodo =  (req: Request, res: Response) => {
        const id = +req.params.id;
        new DeleteTodo(this.todoRepository)
        .execute(id)
        .then(todo => res.json(todo))
        .catch(error => res.json(400).json({error}));
    }

}
```

## Sección 17. Rest Testing
- En esta sección se enfoca más en las pruebas de integración.
- En este caso ahora se decide crear una carpeta de test en lugar de colocar los archivos a lado del que se prueba.
La idea es que al llamar un endpoint, obtengamos la información deseada y esperada, si llamamos un método de creación, estamos esperando que se cree el elemento, y realizaremos posteriormente las limpiezas respectivas.

Sólo vamos a probar aquí, lo que no hemos evaluado antes, por lo que la sección no es tan extensa.

## 1. Configuraciones
- Leer Notas.md.

## 2. Pruebas en App.ts
- Solo se desea evaluar que main haya sido llamado con los métodos que se esperan.
1. Se hace mock de todo el servidor con solo pasarle el path de donde está la clase.

``` ts
import {describe, it, jest, expect} from '@jest/globals';
import { Server } from "./presentation/server";
import { envs } from './config/envs';

jest.mock('./presentation/server');

describe("App.ts",  ()=>{
    it("Should call server start with arguments", async () => {
        await import('./app');
        expect(Server).toHaveBeenCalledTimes(1);
        expect(Server).toHaveBeenCalledWith({
            port: envs.PORT,
            public_path: envs.PUBLIC_PATH,
            routes: expect.any(Function)
        });

        expect(Server.prototype.start).toHaveBeenCalledWith();
    });
})
```

## 3. Supertest - Pruebas sobre Restful endpoints
1. Crear servidor de testing.
    1. tests -> test-server.ts

``` ts
import { envs } from "../src/config/envs";
import { AppRoutes } from "../src/presentation/routes";
import { Server } from "../src/presentation/server";

export const testServer = new Server({
    port: envs.PORT,
    routes: AppRoutes.routes,
})
```

2. Hacer público la propiedad de app de Server para poder hacer pruebas.

``` ts
export class Server {
    public readonly app = express();
```

3. Usar TestServer en pruebas de routes.test.ts
4. Crear método close en Server.
    - La finalidad es que se llame este método cuando la prueba termina a modo de apagar el servidor y no forzar su ejecución a la fuerza. Este método se llama con afterAll en las pruebas.

``` ts
    public close() {
        this.serverListener?.close();
    }
```

## 4. Prueba GET - api/todos
``` ts
import {describe, it, jest, expect, beforeAll, afterAll} from '@jest/globals';
import request from 'supertest';
import { testServer } from '../../test-server';
import { prisma } from '../../../src/data/postgres';

describe('Todo route testing', () => {
    beforeAll(async () => {
        await testServer.start();
    });

    afterAll(() => {
        testServer.close();
    });

    const todo1 = {text: 'Hola mundo 1'};
    const todo2 = {text: 'Hola mundo 2'};

    it('Should return TODOs api/todos', async () => {
        await prisma.todo.deleteMany();
        await prisma.todo.createMany({
            data: [todo1, todo2]
        })

        const {body} = await request(testServer.app)
            .get('/api/todos')
            .expect(200);
        expect(body).toBeInstanceOf(Array);
        expect(body.length).toBe(2);
        expect(body[0].text).toBe(todo1.text);
        expect(body[1].text).toBe(todo2.text);
    });
});
```

## 5. Prueba - GET - api/todos/:id

``` ts
import {describe, it, jest, expect, beforeAll, afterAll, beforeEach} from '@jest/globals';
import request from 'supertest';
import { testServer } from '../../test-server';
import { prisma } from '../../../src/data/postgres';

describe('Todo route testing', () => {
    beforeAll(async () => {
        await testServer.start();
    });

    beforeEach(async () => {
        await prisma.todo.deleteMany();
    })

    afterAll(() => {
        testServer.close();
    });

    const todo1 = {text: 'Hola mundo 1'};
    const todo2 = {text: 'Hola mundo 2'};

    it('Should return TODOs api/todos', async () => {
        await prisma.todo.createMany({
            data: [todo1, todo2]
        })

        const {body} = await request(testServer.app)
            .get('/api/todos')
            .expect(200);
        expect(body).toBeInstanceOf(Array);
        expect(body.length).toBe(2);
        expect(body[0].text).toBe(todo1.text);
        expect(body[1].text).toBe(todo2.text);
    });

    it('Should return a TODO api/todos/:id', async () => {
        const todo = await prisma.todo.create({data: todo1});
        const { body } = await request(testServer.app)
            .get(`/api/todos/${todo.id}`)
            .expect(200);

        expect(body).toEqual({
            id: todo.id,
            text: todo.text,
            completedAt: todo.completedAt,
        })
    });
});
```

## 6. Prueba GET -api/todos/:id -Not Found
``` ts

    it('Should return a 404 NotFound api/todos/:id', async () => {
        const { body } = await request(testServer.app)
        .get(`/api/todos/9999`)
        .expect(400);

        console.log('cui test beginning')
        console.log(body)
        console.log('cui test end')

        expect(body).toEqual({
            error: 'TODO with id 9999 not found'
        });
    });
```

## 7. Prueba Create api/todos
- Cuando se hace inserción a DB se debe regresar estatus 201. Esto se hace en el controller.

``` ts
    public createTodo = (req: Request, res: Response) => {
        const [error, createTodoDto] = CreateTodoDto.create(req.body);
        if(error) return res.status(400).json({error});

        new CreateTodo(this.todoRepository)
        .execute(createTodoDto!)
        .then(todo => res.status(201).json(todo))
        .catch(error => res.status(400).json({error}));
    }
```

``` ts
    it('Should return a new Todo api/todos', async () => {
        const { body } = await request(testServer.app)
        .post(`/api/todos`)
        .send(todo1)
        .expect(201);

        expect(body).toEqual({
            id: expect.any(Number),
            text: todo1.text,
            completedAt: null
        });
    });

    it('Should return an error if text is present Todo api/todos', async () => {
        const { body } = await request(testServer.app)
        .post(`/api/todos`)
        .send({})
        .expect(400);

        expect(body).toEqual({
            error: 'Text property is required'
        });
    });

    it('Should return an error if text is empty Todo api/todos', async () => {
        const { body } = await request(testServer.app)
        .post(`/api/todos`)
        .send({text: ''})
        .expect(400);

        expect(body).toEqual({
            error: 'Text property is required'
        });
    });
```

## 8. Prueba Update api/todos/:id
- Queda pendiente hacer errores personalizados

``` ts
import {describe, it, jest, expect, beforeAll, afterAll, beforeEach} from '@jest/globals';
import request from 'supertest';
import { testServer } from '../../test-server';
import { prisma } from '../../../src/data/postgres';

describe('Todo route testing', () => {
    beforeAll(async () => {
        await testServer.start();
    });

    beforeEach(async () => {
        await prisma.todo.deleteMany();
    })

    afterAll(() => {
        testServer.close();
    });

    const todo1 = {text: 'Hola mundo 1'};
    const todo2 = {text: 'Hola mundo 2'};

    it('Should return TODOs api/todos', async () => {
        await prisma.todo.createMany({
            data: [todo1, todo2]
        })

        const {body} = await request(testServer.app)
            .get('/api/todos')
            .expect(200);
        expect(body).toBeInstanceOf(Array);
        expect(body.length).toBe(2);
        expect(body[0].text).toBe(todo1.text);
        expect(body[1].text).toBe(todo2.text);
    });

    it('Should return a TODO api/todos/:id', async () => {
        const todo = await prisma.todo.create({data: todo1});
        const { body } = await request(testServer.app)
            .get(`/api/todos/${todo.id}`)
            .expect(200);

        expect(body).toEqual({
            id: todo.id,
            text: todo.text,
            completedAt: todo.completedAt,
        })
    });

    it('Should return a 404 NotFound api/todos/:id', async () => {
        const { body } = await request(testServer.app)
        .get(`/api/todos/9999`)
        .expect(400);

        expect(body).toEqual({
            error: 'TODO with id 9999 not found'
        });
    });

    it('Should return a new Todo api/todos', async () => {
        const { body } = await request(testServer.app)
        .post(`/api/todos`)
        .send(todo1)
        .expect(201);

        expect(body).toEqual({
            id: expect.any(Number),
            text: todo1.text,
            completedAt: null
        });
    });

    it('Should return an error if text is present Todo api/todos', async () => {
        const { body } = await request(testServer.app)
        .post(`/api/todos`)
        .send({})
        .expect(400);

        expect(body).toEqual({
            error: 'Text property is required'
        });
    });

    it('Should return an error if text is empty Todo api/todos', async () => {
        const { body } = await request(testServer.app)
        .post(`/api/todos`)
        .send({text: ''})
        .expect(400);

        expect(body).toEqual({
            error: 'Text property is required'
        });
    });

    it('Should return an updated Todo api/todos/:id', async () => {
        const todo = await prisma.todo.create({data: todo1});

        const { body } = await request(testServer.app)
        .put(`/api/todos/${todo.id}`)
        .send({text: 'Hola mundo updated', completedAt: '2024-04-04'})
        .expect(200);

        console.log(body)

        expect(body).toEqual({
            id: expect.any(Number),
            text: 'Hola mundo updated',
            completedAt: '2024-04-04T00:00:00.000Z'
        });
    });
    // TODO: Realizar la operación con errores personalizados
    it('Should return 404 if TODO not found api/todos/:id', async () => {
        const todoId = 9999;
        const { body } = await request(testServer.app)
        .put(`/api/todos/${todoId}`)
        .send({text: 'Hola mundo updated', completedAt: '2024-04-04'})
        .expect(400);
        console.log(body)
        expect(body).toEqual({
            error: `TODO with id ${todoId} not found`
        });
    });

    it('Should return an updated TODO only the date api/todos/:id', async () => {
        const todo = await prisma.todo.create({data: todo1});

        const { body } = await request(testServer.app)
        .put(`/api/todos/${todo.id}`)
        .send({completedAt: '2024-04-05'})
        .expect(200);

        expect(body).toEqual({
            id: expect.any(Number),
            text: todo1.text,
            completedAt: '2024-04-05T00:00:00.000Z'
        })
    });

    
});
```

## 9. Prueba - Delete api/tosos/:id
``` ts
    it('Should delete a TODO api/todos/:id', async () => {
        const todo = await prisma.todo.create({data: todo1});

        const { body } = await request(testServer.app)
        .delete(`/api/todos/${todo.id}`)
        .expect(200);

        expect(body).toEqual({
            id: expect.any(Number),
            text: todo1.text,
            completedAt: null
        })
    });

    it('Should return 404 if TODO does not exist api/todos/:id', async () => {
        const todoId = 9999;
        const { body } = await request(testServer.app)
        .delete(`/api/todos/${todoId}`)
        .expect(400);

        expect(body).toEqual({
            error: `TODO with id ${todoId} not found`
        })
    });
```

## 10. Custom Errors
- Van a permitir enviar el status correcto en lugar de solo 400. De igual forma se personaliza el mensaje de error según el status.
1. Node\13-RestWeb\src\domain\errors\custom.error.ts

``` ts
export class CustomError extends Error {
    constructor(
        public readonly message:string,
        public readonly statusCode: number = 400
    ){
        super(message);
    }
}
```

2. Utilizarlo en todo.datasource.impl.ts
    - Se usa solo en findById, ya que los demás métodos ocupan de éste para encontrar un objeto.

``` ts
    async findById(id: number): Promise<TodoEntity> {
        const todo = await prisma.todo.findFirst({where: {id}})
        if(!todo) throw new CustomError(`TODO with id ${id} not found`, 404);
        return TodoEntity.fromObject(todo);
    }
```

3. Centralizar la respuesta con error
    1. Crear método privado en controller para manejar el error.
    2. Usar el método en catch de cada método

``` ts
import { Request, Response } from "express";
import { prisma } from "../../data/postgres";
import { CreateTodoDto } from "../../domain/dtos/todos/create-todo.dto";
import { UpdateTodoDto } from "../../domain/dtos/todos/update-todo.dto";
import { TodoRepository } from "../../domain/repositories/todo.repository";
import { GetTodos } from "../../domain/use-cases/todos/get-todos";
import { GetTodo } from "../../domain/use-cases/todos/get-todo";
import { CreateTodo } from "../../domain/use-cases/todos/create-todo";
import { UpdateTodo } from "../../domain/use-cases/todos/update-todo";
import { DeleteTodo } from "../../domain/use-cases/todos/delete-todo";
import { CustomError } from "../../domain/errors/custom.error";

export class TodosController {
    constructor(
        private readonly todoRepository: TodoRepository
    ){}

    // El error es unkown ya que puede venir de cualquier exepción
    private handleError = (res: Response, error: unknown) => {
        if(error instanceof CustomError) {
            res.status(error.statusCode).json({error: error.message});
            return;
        }

        res.status(500).json({error: 'Internal server error - check logs'})
    }

    public getTodos = (req: Request, res: Response) => {
        new GetTodos(this.todoRepository)
            .execute()
            .then(todos => res.json(todos))
            .catch(error => this.handleError(res, error));
    }

    public getTodoById = (req: Request, res: Response) => {
        const id = +req.params.id;

        new GetTodo(this.todoRepository)
        .execute(id)
        .then(todo => res.json(todo))
        .catch(error => this.handleError(res, error));
    }

    public createTodo = (req: Request, res: Response) => {
        const [error, createTodoDto] = CreateTodoDto.create(req.body);
        if(error) return res.status(400).json({error});

        new CreateTodo(this.todoRepository)
        .execute(createTodoDto!)
        .then(todo => res.status(201).json(todo))
        .catch(error => this.handleError(res, error));
    }

    public updateTodo = (req: Request, res: Response) => {
        const id = +req.params.id;
        const [error, updateTodoDto] = UpdateTodoDto.create({
            ...req.body, id
        })

        if(error) return res.status(400).json(error);

        new UpdateTodo(this.todoRepository)
        .execute(updateTodoDto!)
        .then(todo => res.json(todo))
        .catch(error => this.handleError(res, error));
    }

    public deleteTodo =  (req: Request, res: Response) => {
        const id = +req.params.id;
        new DeleteTodo(this.todoRepository)
        .execute(id)
        .then(todo => res.json(todo))
        .catch(error => this.handleError(res, error));
    }

}
```

