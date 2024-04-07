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

