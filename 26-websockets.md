# Sección 26. Websockets
- Se caracteriza porque los clientes se encuentran escuchando al servidor, el cual emite mensajes sin que el cliente lo solicite y se los envía.
## Temas
1. ¿Qué son los websockets?
2. Librerías para websockets
3. Implementación Nativa del navegador web para WS
4. WS Library para nuestro servidor
5. Configuración mínima en el servidor
6. Broadcasts
7. Cliente
8. Servidor
9. Re-conexión manual en caso de perdida de comunicación

## 1. Creación proyecto.
1. Revisar notas.

## 2. Instalar librerías para websockets
- En el lado del cliente se va a ocupar la opción nativa de WebSocket. Para el backend se va a usar ws.
    - La opción nativa del cliente solo escucha 'message', pero con otras librerías se puede personalizar esto.
1. Instalar ws. https://www.npmjs.com/package/ws
``` bash
npm i ws

npm i --save-dev @types/ws
```

2. Con el código de la documentación se crea el servicio. Por lo mientras se coloca en app.ts
    - wss es la isntancia de WebSocketServer
    - ws es el socket del cliente, el cual viene en el argumento de connection.

``` ts
import { WebSocketServer } from 'ws';

const wss = new WebSocketServer({ port: 3000 });

wss.on('connection', function connection(ws) {
  ws.on('error', console.error);

  ws.on('message', function message(data) {
    console.log('received: %s', data);
  });

  ws.send('Cui cui desde el servidor');
});

console.log('Server running on port 3000')
```

3. Probar con Postman.
    1. Crear nueva ventana, en donde en el ícono de http se despliegan las opciones para seleccionar WEBSOCKET.
    2. Se usa el protocolo ws para probar, no http. ws://localhost:3000

## 3. Crear frontend para probar
1. Crear proyecto nuevo 26-websocket-frontend
2. Crear archivo index.html

``` html
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Document</title>
</head>
<body>
    <h1>Websockets - Status</h1>

    <form>
        <input type = 'Text' placeholder="Enviar mensaje">
        <button>Enviar</button>
    </form>
    
    <ul id="messages">

    </ul>

    <script>
        const socket = new WebSocket('ws://localhost:3000');
        socket.onopen = (event) => {
            console.log(event);
            console.log('Connected Cui');
        }

        socket.onclose = (event) => {
            console.log(event);
            console.log('Disconnected Cui');
        }
    </script>
</body>
</html>
```

3. Correr archivo.
    - No se debe correr haciendo click derecho y seleccionando un navegador. Esto corre el archivo con el protocolo file.
        - file://path/to/file
    - Se requiere de cierta funcionalidad que depende de un servidor. Es decir, se desea ejecutar la aplicación basada en un servidor, como usualmente se hace en la vida real.
    - Correr el siguiente comando en el root del index.html. Se debe tener http-server, el cual se instala con el siguiente comando.

``` bash
npm install --global http-server
```

``` bash
npx http-server -o
```

## 4. Enviar mensajes al servidor
- En el front se va a usar un form con un input.

``` html
    <script>
        const socket = new WebSocket('ws://localhost:3000');

        const form = document.querySelector('form');
        const input = document.querySelector('input')

        function sendMessage(message) {
            socket.send(message);
        }

        form.addEventListener('submit', (event) => {
            event.preventDefault();
            const message = input.value;
            sendMessage(message);
        })

        socket.onopen = (event) => {
            console.log(event);
            console.log('Connected Cui');
        }

        socket.onclose = (event) => {
            console.log(event);
            console.log('Disconnected Cui');
        }
    </script>
```

## 5. Cliente - Escuchar mensajes del servidor
1. Cuando se llega al on de 'message' en el servidor se le responderá con lo que se recibió pero en mayúscula.

``` ts
  ws.on('message', function message(data) {
    console.log('received: %s', data);

    ws.send(data.toString().toUpperCase());
  });
```

2. Se empieza a esuchar onMessage en el cliente.

``` html
    <script>
        const socket = new WebSocket('ws://localhost:3000');

        const form = document.querySelector('form');
        const input = document.querySelector('input')

        function sendMessage(message) {
            socket.send(message);
        }

        form.addEventListener('submit', (event) => {
            event.preventDefault();
            const message = input.value;
            sendMessage(message);
        })

        socket.onopen = (event) => {
            console.log(event);
            console.log('Connected Cui');
        }

        socket.onclose = (event) => {
            console.log(event);
            console.log('Disconnected Cui');
        }

        socket.onmessage = (event) => {
            console.log(event.data)
        }
    </script>
```

3. En caso de querer mandar un objeto desde el servidor se debe serializar (JSON.stringify).

``` ts

  ws.on('message', function message(data) {
    console.log('received: %s', data);

    const payload = {
        type: 'custom-message',
        payload: data.toString(),
    }
    ws.send(JSON.stringify(payload));
  });
```

4. En el cliente se usa JSON.parse.

``` js
        socket.onmessage = (event) => {
            const payload = JSON.parse(event.data);
            console.log(payload)
        }
```

5. Insertar lo que se recibe del servidor en ul.
    - Se crea un elemento li, se le agrega el texto y se hace prepend al elemento de ul.

``` html
    <script>
        const socket = new WebSocket('ws://localhost:3000');

        const form = document.querySelector('form');
        const input = document.querySelector('input');
        const messagesElem = document.querySelector('#messages');

        function sendMessage(message) {
            socket.send(message);
        }

        function renderMessage(message) {
            const li = document.createElement('li');
            li.innerHTML = message;
            messagesElem.prepend(li);
        }

        form.addEventListener('submit', (event) => {
            event.preventDefault();
            const message = input.value;
            sendMessage(message);
        })

        socket.onopen = (event) => {
            console.log(event);
            console.log('Connected Cui');
        }

        socket.onclose = (event) => {
            console.log(event);
            console.log('Disconnected Cui');
        }

        socket.onmessage = (event) => {
            const {payload} = JSON.parse(event.data);
            renderMessage(payload)
            console.log(payload)
        }
    </script>
```

## 6. Server Broadcast
- La idea es escribir un mensaje desde un cliente y que se envíen a los demás.
    - Se importa WebSocket y se revisan todos los clientes conectados para mandar el mensaje.

``` ts
import { WebSocketServer, WebSocket } from 'ws';

...
  ws.on('message', function message(data) {
    

    const payload = JSON.stringify({
        type: 'custom-message',
        payload: data.toString(),
    })
    //ws.send(JSON.stringify(payload));
    wss.clients.forEach(function each(client) {
        if (client.readyState === WebSocket.OPEN) {
          client.send(payload, { binary: false });
        }
      });
  });
```

- Se envía menos al emisor.

``` ts
wss.on('connection', function connection(ws) {
  ws.on('error', console.error);

  console.log('Cliente conectado')

  ws.on('message', function message(data) {
    

    const payload = JSON.stringify({
        type: 'custom-message',
        payload: data.toString(),
    })
    //ws.send(JSON.stringify(payload));

    //* Todos - incluyendo
/*     wss.clients.forEach(function each(client) {
        if (client.readyState === WebSocket.OPEN) {
          client.send(payload, { binary: false });
        }
      }); */
    
      //* Todos excluyente
      wss.clients.forEach(function each(client) {
        if (client != ws && client.readyState === WebSocket.OPEN) {
          client.send(payload, { binary: false });
        }
      });
  });

  //ws.send('Cui cui desde el servidor');

  ws.on('close', () => {
    console.log('Client disconnected')
  })
});
```

## 7. Cliente - Reconectar en caso de perder conexión
- La iplementación nativa de websockets en el cliente no trae forma de reconectar.
- Se envuelve todo el código en una función, la cual se va a incocar cada que se active el onClose.
    - Se usa un setTimeout para volver a invocar a la función, en donde se recomienda que el tiempo del timeOut se defina de forma aleatoria para que si hay muchos clientes entonces las peticiones lleguen de manera diferente y no todas al mismo tiempo.

``` html
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Document</title>
</head>
<body>
    <h1>Websockets - <small>Status</small></h1>

    <form>
        <input type = 'Text' placeholder="Enviar mensaje">
        <button>Enviar</button>
    </form>
    
    <ul id="messages">

    </ul>

    <script>
        const form = document.querySelector('form');
        const input = document.querySelector('input');
        const messagesElem = document.querySelector('#messages');
        const statusElement = document.querySelector('small');


        function connectToServer() {
            const socket = new WebSocket('ws://localhost:3000');
            function sendMessage(message) {
                socket.send(message);
            }

            function renderMessage(message) {
                const li = document.createElement('li');
                li.innerHTML = message;
                messagesElem.prepend(li);
            }

            form.addEventListener('submit', (event) => {
                event.preventDefault();
                const message = input.value;
                sendMessage(message);
            })

            socket.onopen = (event) => {
                statusElement.innerText = 'Online'
            }

            socket.onclose = (event) => {
                statusElement.innerText = 'Offline'
                setTimeout(() => {
                    connectToServer();
                }, 1500);
            }

            socket.onmessage = (event) => {
                const {payload} = JSON.parse(event.data);
                renderMessage(payload)
                console.log(payload)
            }
        }

        connectToServer();

    </script>
</body>
</html>
```




# Sección 27. RESTApi + WebSockets - Aplicación de filas
## Temas
1. Websockets
2. Restful
3. Conectar WebSockets con Restful
4. Vanilla JavaScript para el frontend
5. Servicios
6. Lógica relacionada para el funcionamiento de la aplicación

## 1. Creación proyecto.
1. Revisar notas.
2. Para este momento ya se tiene lo básico:
    - config -> envs.ts
    - presentation -> routes.ts
    - presentation -> server.ts
    - app.ts

3. Instalar ws package

``` bash
npm i ws

npm i --save-dev @types/ws
```

## 2. WSS WebSocketService
https://www.npmjs.com/package/ws
- Se revisa el código de external http server.

1. Node\27-socket-server\src\presentation\services\wss-service.ts
    - Va a ser un singleton, ya que solo se necesita una instancia.
``` ts
import { Server } from 'http';
import { WebSocket, WebSocketServer } from 'ws';

interface Options {
    server: Server;
    path?: string; // ws

}

export class WssService {
    private static _instance: WssService;
    private wss: WebSocketServer;

    private constructor(options: Options){
        const { server, path = '/ws' } = options;

        this.wss = new WebSocketServer({server, path});
        this.start();
    }

    static get instance(): WssService {
        if(!WssService._instance) {
            throw 'WssService is not initialized';
        }

        return WssService._instance;
    }

    static initWss(options: Options) {
        WssService._instance = new WssService(options);
    }

    public start(){
        this.wss.on('connection', (ws: WebSocket) => {
            console.log('Client connected');

            ws.on('close', () => {
                console.log('Client disconnected');
            })
        })
    }
}
```

## 3. Conectar Servidores Express y WS
1. Iniciar serverHttp en app.ts
``` ts
import { createServer } from 'http';
import { envs } from './config/envs';
import { AppRoutes } from './presentation/routes';
import { Server } from './presentation/server';
import { WssService } from './presentation/services/wss-service';


(async()=> {
  main();
})();


function main() {

  const server = new Server({
    port: envs.PORT,
    routes: AppRoutes.routes,
  });

  const httpServer = createServer(server.app); // Las configuraciones pueden ser las mismas que las de express.
  // Entonces, se tiene este otro servidor con la misma configuración del server creado con express.
  // Este nuevo servidor tiene la configuración de WSS.
  WssService.initWss({server: httpServer});

  httpServer.listen(envs.PORT, () => {
    console.log(`Server running on port: ${envs.PORT}`);
  });
}
```

2. Modificar presentation/server.ts
    - Se coloca en un método la configuración del servidor. El método se llama en el constructor.
    - En SPA se coloca una expresión regular de api para que el servidor responda con index.html siempre y cuando no empiece con api. Así, cuando empiece con api entonces las rutas son las que responden.


## 4. Endpoints REST para la aplicación
1. Node\27-socket-server\src\presentation\tickets\controller.ts

``` ts
import { Request, Response } from "express";

export class TicketController {
    // DI - WssService}
    // RESTful API van a ocupar info del servicio para mandar comunicación por Websockets.
    constructor(){}

    public getTickets = async(req: Request, res: Response) => {
        res.json('getTickets');
    }

    public getLastTicketNumber = async(req: Request, res: Response) => {
        res.json('getLastTicketNumber');
    }

    public pendingTickets = async(req: Request, res: Response) => {
        res.json('pendingTickets');
    }

    public createTicket = async(req: Request, res: Response) => {
        res.json('createTicket');
    }

    public ticketFinished = async(req: Request, res: Response) => {
        res.json('ticketFinished');
    }

    public workingOn = async(req: Request, res: Response) => {
        res.json('workingOn');
    }

}
```

2. Node\27-socket-server\src\presentation\tickets\routes.ts
    - Los Websockets pueden verse como un sustituo de los métodos HTTP.
    - Se prefiere usa websockets cuando realmente se ocupa comunicación en tiempo real.

``` ts
import { Router } from "express";
import { TicketController } from "./controller";

export class TicketRoutes {
    static get routes() {
        const router = Router();
        const tickerController = new TicketController();

        router.get('/', tickerController.getTickets);
        router.get('/last', tickerController.getLastTicketNumber);
        router.get('/pending', tickerController.pendingTickets);

        router.post('/', tickerController.createTicket);

        router.get('/draw/:desk', tickerController.drawTicket);
        router.put('/done/:ticketId', tickerController.ticketFinished);

        router.get('/working-on', tickerController.workingOn);

        return router;
    }
}
```

3. Conectar rutas con el controlador de rutas principal.

``` ts
import { Router } from 'express';
import { TicketRoutes } from './tickets/routes';




export class AppRoutes {


  static get routes(): Router {

    const router = Router();
    
    // Definir las rutas
    // router.use('/api/todos', /*TodoRoutes.routes */ );

    router.use('/api/ticket', TicketRoutes.routes );



    return router;
  }


}
```

## 5. Ticket Service
1. Crear interface. Node\27-socket-server\src\domain\interfaces\ticket.ts
``` ts
export interface Ticket {
    id: string;
    number: number;
    createdAt: Date;
    handleAtDesk?: string;
    handleAt?: Date;
    done: boolean;
}
```

2. Instalar uuid.

``` bash
npm i uuid

npm i --save-dev @types/uuid
```

3. Patrón adaptador para uuid.

``` ts
import { v4 as uuidv4 } from 'uuid';

export class UuidAdapter {
    public static v4() {
        return uuidv4();
    }
}
```

4. Crear servicio.
    - Para el método de workingOn se desea siempre tener los últimos 4 para estarlos moviendo.

``` ts
import { UuidAdapter } from "../../config/uuid.adapter";
import { Ticket } from "../../domain/interfaces/ticket";

export class TicketService {
    private readonly tickets:Ticket [] = [
        { id: UuidAdapter.v4(), number: 1, createdAt: new Date(), done: false },
        { id: UuidAdapter.v4(), number: 2, createdAt: new Date(), done: false },
        { id: UuidAdapter.v4(), number: 3, createdAt: new Date(), done: false },
        { id: UuidAdapter.v4(), number: 4, createdAt: new Date(), done: false },
        { id: UuidAdapter.v4(), number: 5, createdAt: new Date(), done: false },
        { id: UuidAdapter.v4(), number: 6, createdAt: new Date(), done: false },
        { id: UuidAdapter.v4(), number: 7, createdAt: new Date(), done: false },
    ];

    private readonly workingOnTickets: Ticket[] = [];

    public get lastWorkingOnTickets(): Ticket[] {
        return this.workingOnTickets.splice(0,4);
    }

    public get PendingTickets(): Ticket[] {
        return this.tickets.filter( ticket => !ticket.handleAtDesk);
    }

    public lastTicketNumber() {
        return this.tickets.length > 0 ? this.tickets.at(-1)!.number : 0
    }

    public createTicket() {

        const ticket: Ticket = {
            id: UuidAdapter.v4(),
            number: this.lastTicketNumber() + 1,
            createdAt: new Date(),
            handleAt: undefined,
            handleAtDesk: undefined,
            done: false
        };

        this.tickets.push(ticket);
        // TODO WS. Cuando se cree uno nuevo se debe notificar que hay un nuevo ticket creado.
        return ticket;
    }

    public drawTicket(desk: string) {
        const ticket = this.tickets.find( t => !t.handleAtDesk);
        if(!ticket) return {status: 'error', message: 'No hay tickets pendientes'};

        ticket.handleAtDesk = desk;
        ticket.handleAt = new Date();

        this.workingOnTickets.unshift({...ticket});

        // TODO WS. Notificar que el ticket ya está siendo trabajado.

        return {status: 'ok', ticket}
    }

    public onFinishedTicket( id: string ) {
        const ticket = this.tickets.find(t => t.id === id);
        if(!ticket) return {status: 'error', message: 'Ticket no encontrado'};

        this.tickets.map(ticket => {
            if(ticket.id === id){
                ticket.done = true;
            }

            return ticket;
        });

        return { status: 'ok' }
        
    }
}
```

5. Inyectar servicio en controlador.

``` ts
import { Request, Response } from "express";
import { TicketService } from "../services/ticket-service";

export class TicketController {
    // DI - WssService}
    // RESTful API van a ocupar info del servicio para mandar comunicación por Websockets.
    constructor(
        private readonly ticketService = new TicketService(),
    ){}

    public getTickets = async(req: Request, res: Response) => {
        res.json(this.ticketService.tickets);
    }

    public getLastTicketNumber = async(req: Request, res: Response) => {
        res.json(this.ticketService.lastTicketNumber);
    }

    public pendingTickets = async(req: Request, res: Response) => {
        res.json(this.ticketService.pendingTickets);
    }

    public createTicket = async(req: Request, res: Response) => {
        res.status(201).json(this.ticketService.createTicket());
    }

    public ticketFinished = async(req: Request, res: Response) => {
        const { ticketId } = req.params;
        res.json(this.ticketService.onFinishedTicket(ticketId));
    }

    public workingOn = async(req: Request, res: Response) => {
        res.json(this.ticketService.lastWorkingOnTickets);
    }

    public drawTicket = async(req: Request, res: Response) => {
        const { desk } = req.params;
        res.json(this.ticketService.drawTicket(desk));
    }

}
```

## 6. Inicializar las rutas
- Hasta este puto cuando se empiecen a usar las rutas el WssService no va a estar inicializado ya que esto está definido después de que la app de express está creada. Entonces, la inicialización de las rutas debe suceder después cuando el servicio de WssService esté levantado.

1. Crear método setRoutes en server para inicializar rutas, y quitar la inicialización de rutas en donde actualmente se estaba usando.

``` ts
import express, { Router } from 'express';
import path from 'path';

interface Options {
  port: number;
  // routes: Router;
  public_path?: string;
}


export class Server {

  public readonly app = express();
  private serverListener?: any;
  private readonly port: number;
  private readonly publicPath: string;
  // private readonly routes: Router;

  constructor(options: Options) {
    const { port, public_path = 'public' } = options;
    this.port = port;
    this.publicPath = public_path;
    this.configure();
  }

  private configure() {
    //* Middlewares
    this.app.use( express.json() ); // raw
    this.app.use( express.urlencoded({ extended: true }) ); // x-www-form-urlencoded

    //* Public Folder
    this.app.use( express.static( this.publicPath ) );

    //* Routes
    // this.app.use( this.routes );

    //* SPA /^\/(?!api).*/  <== Únicamente si no empieza con la palabra api
    this.app.get(/^\/(?!api).*/, (req, res) => {
      const indexPath = path.join( __dirname + `../../../${ this.publicPath }/index.html` );
      res.sendFile(indexPath);
    });
  }

  public setRoutes(router: Router) {
    this.app.use(router);
  }
  
  async start() {
    
    this.serverListener = this.app.listen(this.port, () => {
      console.log(`Server running on port ${ this.port }`);
    });

  }

  public close() {
    this.serverListener?.close();
  }

}

```

2. Invocar método en app.ts cuando WssService ya esté levantado.

``` ts
import { createServer } from 'http';
import { envs } from './config/envs';
import { AppRoutes } from './presentation/routes';
import { Server } from './presentation/server';
import { WssService } from './presentation/services/wss-service';


(async()=> {
  main();
})();


function main() {

  const server = new Server({
    port: envs.PORT,
  });

  const httpServer = createServer(server.app); // Las configuraciones pueden ser las mismas que las de express.
  // Entonces, se tiene este otro servidor con la misma configuración del server creado con express.
  // Este nuevo servidor tiene la configuración de WSS.
  WssService.initWss({server: httpServer});

  server.setRoutes(AppRoutes.routes);

  httpServer.listen(envs.PORT, () => {
    console.log(`Server running on port: ${envs.PORT}`);
  });
}
```

## 7. Llenar funciones js del cliente para interactuar con WS
1. desk.js contiene la lógica para saber los tickets que hay, así como de mandar a llamar a la función de inicializar el websocket.
    - Para este punto se define un método para que wss.service emita.

``` ts
    public sendMessage(type: string, payload: Object) {
        this.wss.clients.forEach(client => {
            if(client.readyState === WebSocket.OPEN) {
                client.send(JSON.stringify({type, payload}))
            }
        })
    }
```

2. En ticket.service se coloca el TODO que faltaba en drawTicket usando WS. De igual manera se hace inyección de dependencia para usar el servicio de wss. Esto se consigue haciendo una función privada y llamarla en donde es necesario.

``` ts
    private onTicketNumberChanged() {
        this.wssService.sendMessage('on-ticket-count-changed', this.pendingTickets.length);
    }

        public createTicket() {

        const ticket: Ticket = {
            id: UuidAdapter.v4(),
            number: this.lastTicketNumber + 1,
            createdAt: new Date(),
            handleAt: undefined,
            handleAtDesk: undefined,
            done: false
        };

        this.tickets.push(ticket);
        this.onTicketNumberChanged();

        return ticket;
    }
```

3. En el cliente, en la función desk se escucha onMessage para poder recuperar la cantidad de tickets y mostrarla en pantalla en el elemento HTML correspondiente.

``` js
    socket.onmessage = ( event ) => {
      const { type, payload } = JSON.parse(event.data)
      if(type !== 'on-ticket-count-changed') return;
      lblPending.innerHTML = payload;
    };
```

# Notas
- Al imprimir ws en consola se tiene:
    - ping-pong: se usa para medir la latencia entre la comunicación que hay. Para ver qué tan rápida es la comunicación.