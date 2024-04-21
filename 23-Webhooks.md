# Sección 23. Webhooks
## Temas
1. ¿Qué son los webhooks? (Explicación)
2. Como funcionan
3. Configurar los webhooks de
4. Github
5. Discord
6. Crear un canal de discord para recibir los mensajes de nuestro server
7. Envio de imágenes a Discord
8. Creación de variables de entorno y todo lo necesario para que esto funcione.

## 1. Webhooks
- En la aplicaciones por ejemplo de pagos no se debe confiar del estado del cliente ya que es muy volátil; es decir, mientras se efectúa un pago puede que el cliente pierda conexión o cierre sesión.
- Por otro lado, tampoco se recomienda que un servidor esté mandando peticiones al servidor de pago para verificar si el pago fue exitoso, ya que la mayoría de esas peticiones no arrojarán nada debido a que el proceso de pago no ha finalizado.
- La idea es que cuando se paga, sea el servidor de pago el que notifique que algo pasó.
    - Esto se puede hacer por medio de petición HTTP mediante:
        - Restful API (usualmente POST)
        - Edge Function
    - Se ocupan tokens para mejorar la seguridad.

- Al trabajar con webhooks se debe considerar:
    1. No compartir los secrets.
    2. Deben ser aleatorios seguros.
    3. Seguir las recomendación de la documentación.
    4. No confiar en el anonimato.
    5. La idea es la misma entre servicios.

- Se pueden tener casos en donde se bloqueen ip's que intenten atacar el servicio.

## 2. Preparación de proyecto. Github - Webhooks
1. Crear package.json e instalar dependencias de ts.
2. En Github al crear el repositorio se tiene en settings la sección de webhooks, en donde se puede agregar un nuevo webhook.
3. Instalar express.
4. Instalar dotenv y env-var

## 3. Conectar Github Webhooks con backend
1. Se crea el endpoint en app.ts

``` ts
import express from 'express';
import { envs } from './config/envs';
import { GithubController } from './presentation/github/controller';
(() =>{
   main(); 
})();

function main() {
    const app = express();

    const controller = new GithubController();

    app.post('/api/github', controller.webhookHandler);

    app.listen(envs.PORT, () => {
        console.log(`Server running on port ${envs.PORT}`)
    })
}
```

``` ts
import { Request, Response } from "express";

export class GithubController {
    constructor(){}

    webhookHandler = (req: Request, res: Response) => {
        res.json('hecho');
    }
}
```

2. Usar ngrok para exponer puerto y usarlo en el URL que pide github para el webhook.
    - De esta forma, el url sería: https://8cc9-187-189-215-146.ngrok-free.app/api/github
``` bash
ngrok http 3000
```

3. El Webhook se especifica el uso de application/json y se coloca el secret que se quiera.
4. Se escucha a:
    - Issues.
    - Stars.

## 4. GitHub Eventos y Payloads
- Definir middleware de express para la serialización de la petición, la cual es json.

``` ts
app.use(express.json());
```

- Cuando en el header se ve que empieza con una x significa que es algo personalizado de la plataforma.
    - Por ejemplo, en postman se puede poner un header que empieza con X para indicar que es personalizado.

``` ts
import { Request, Response } from "express";

export class GithubController {
    constructor(){}

    webhookHandler = (req: Request, res: Response) => {
        const githubEvent = req.header('x-github-event') ?? 'unknown';
        const signature = req.header('x-hub-signature-256') ?? 'unknown';
        const payload = req.body;

        console.log(JSON.stringify(payload))


        res.status(202).send('Accepted');
    }
}
```

## 5. Colcoar tipado estricto en las respuestas
1. Se imprime en consola el payload para poder copiar el string del evento. Esto ya se dejó hecho en el código del paso anterior.
    - Se copia de la consola usando CTRL + A, y luego CTRL + copy
2. src -> interfaces -> github-star.interface.ts
    - Se hace esta carpeta ya que no se desea que la app crezca mucho.
    1. Usar la extensión Paste JSON as Code con el string copiado del payload y se le coloca el nombre de GitHubStarPayload.
    2. Solo se exporta la interfaz con el nombre que se le dio.
3. Repetir proceso para respuesta dada al crear una issue en github.
4. Node\23-webhooks\src\interfaces\github-issue.interface.ts
4. Node\23-webhooks\src\interfaces\github-star.interface.ts

## 6. Servicio para controlar las respuestas
1. Node\23-webhooks\src\presentation\services\github-service.ts

``` ts
import { GitHubStarPayload } from "../../interfaces/github-star.interface";
import { GitHubIssuePayload } from '../../interfaces/github-issue.interface';

export class GitHubService {
    constructor(){}

    onStar(payload: GitHubStarPayload): string {
        let message: string = ''
        const { starred_at, sender, action, repository } = payload;


        return `User ${sender.login} ${action} star on ${repository.full_name}`;

    }

    onIssue( payload: GitHubIssuePayload): string {
        let message:string;
        const { action, issue } = payload;

        if(action === 'opened') {
            const message = `An issue was opened with this title ${issue.title}`;
            console.log(message);
            return message;
        }

        if(action === 'closed') {
            const message = `An issue was closed by ${issue.user.login}`;
            console.log(message);
            return message;
        }

        if(action === 'reopened') {
            const message = `An issue was reopened by ${issue.user.login}`;
            console.log(message);
            return message;
        }

        return `Unhandled action for the iisue event ${issue.user.login}`;
    }
}
```

2. Usar servicio en el controlador.
    - Usar en el método.
    - Inyectarlo como dependencia.

``` ts
import { Request, Response } from "express";
import { GitHubService } from "../services/github-service";

export class GithubController {
    constructor(
        private readonly githubService = new GitHubService(),
    ){}

    webhookHandler = (req: Request, res: Response) => {
        const githubEvent = req.header('x-github-event') ?? 'unknown';
        const payload = req.body;
        let message: string;

        switch(githubEvent){
            case 'star':
                message = this.githubService.onStar(payload);
                break;
            case 'issues':
                message = this.githubService.onIssue(payload);
                break;
            default:
                message = `Unknown event ${githubEvent}`;
        }

        console.log({message});


        res.status(202).send('Accepted');
    }
}
```

## 7. Discord Server y Bots
https://cursos.devtalles.com/courses/take/nodejs-de-cero-a-experto/lessons/48870917-discord-server-y-bots
1. Crear nuevos servidor en Discord.
2. Crear bot.
    1. Click derecho sobre el servidor en la barra izquierda.
    2. Ajuster se de servidor.
    3. Overview.
    4. En la barra lateral izquierda en Apps -> Integrations
    5. Create Webhook.
    6. Definir nombre y dejar que el canal en el que comunique sea en general.
    7. Copiar URL del Webhook que aparece al hacer click sobre el bot.
3. Colocar URL del webhook en variable de entorno.
4. Definir variable de entorno en envs.
5. Node\23-webhooks\src\presentation\services\discord.service.ts
``` ts
import { envs } from "../../config/envs";

export class DiscordService {
    private readonly discordWebhookUrl = envs.DISCORD_WEBHOOK_URL;
    
    constructor(){}

    async notify( message: string ) {
        const body = {
            content: message,
        }

        const resp = await fetch(this.discordWebhookUrl, {
            method: 'POST',
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify(body),
        })

        if(!resp.ok) {
            console.log('Error sending message to discord');
            return false;
        }

        return true;
    }
}
```

6. Usar servicio en controlador.

``` ts
import { Request, Response } from "express";
import { GitHubService } from "../services/github-service";
import { DiscordService } from '../services/discord.service';

export class GithubController {
    constructor(
        private readonly githubService = new GitHubService(),
        private readonly discordService = new DiscordService(),
    ){}

    webhookHandler = (req: Request, res: Response) => {
        const githubEvent = req.header('x-github-event') ?? 'unknown';
        const payload = req.body;
        let message: string;

        switch(githubEvent){
            case 'star':
                message = this.githubService.onStar(payload);
                break;
            case 'issues':
                message = this.githubService.onIssue(payload);
                break;
            default:
                message = `Unknown event ${githubEvent}`;
        }

        this.discordService.notify(message)
            .then(() => res.status(202).send('Accepted'))
            .catch(() => res.status(500).json({error: 'Internar server error'}));
    }
}
```

## 8. Enviar Gif animado a Discord
- En el servicio de Discord se coloca como embeds en el body.

``` ts
    async notify( message: string ) {
        const body = {
            content: message,
            embeds: [{
                image: {url: 'https://i.gifer.com/1IG.gif'}
            }]
        }
```

# Sección 24. Seguridad de Webhooks
## Temas
1. Headers de petición personalizados
2. Middleware de autenticación
3. Bloqueo de peticiones no válidas

## 1. Generar Token
https://docs.github.com/en/webhooks/using-webhooks/validating-webhook-deliveries
https://docs.github.com/en/webhooks/using-webhooks/validating-webhook-deliveries

1. En la sección de webhooks de GitHub, en la configuración del webhook creado se selecciona el link de **our developer documentation**.
2. Seleecionar la opción de validating webhooks.
3. Ir a aparato de setting secret token.
    - En el video se muestra que existe un comando de ruby para generar un código, el cual ya no está.
        - En caso de encontrarlo, se debe trener ruby instalado.
    - El instructor provee de un código por el momento.
    - El token puede ser cualquiera, así como se ha trabajado con tokens en otras aplicaciones.

``` bash
ruby -rsecurerandom -e 'puts SecureRandom.hex(20)'
```

4. Colocar token en variable de entorno.
5. Ajustar envs.

``` ts

export const envs = {
    PORT: get('PORT').required().asPortNumber(),
    DISCORD_WEBHOOK_URL: get('DISCORD_WEBHOOK_URL').required().asString(),
    SECRET_TOKEN: get('SECRET_TOKEN').required().asString(),
}
```

6. Colocar secret token en el input secret de github en la configuración del webhook creado.

## 2. Autenticar las peticiones
1. Crear middleware con el código que provee github.
    - Node\23-webhooks\src\presentation\middlewares\github-sha256.middleware.ts

``` ts
import * as crypto from "crypto";

import { NextFunction, Request, Response } from "express";
import { envs } from "../../config/envs";

const WEBHOOK_SECRET = envs.SECRET_TOKEN;

const verify_signature = (req: Request) => {
    try {
        const signature = crypto
        .createHmac("sha256", WEBHOOK_SECRET)
        .update(JSON.stringify(req.body))
        .digest("hex");

        const xHubSignature = req.header("x-hub-signature-256") ?? '';

        let trusted = Buffer.from(`sha256=${signature}`, 'ascii');
        let untrusted =  Buffer.from(xHubSignature, 'ascii');
        return crypto.timingSafeEqual(trusted, untrusted);
    } catch (error) {
        return false
    }
};

export class GitHubSha256Middleware {
    static verifySignature = (req: Request, res: Response, next:NextFunction) => {
        if (!verify_signature(req)) {
            res.status(401).send("Unauthorized");
            return;
        }

          next();
    }
}
```

2. Usar middleware, la cual se aplica para todas las rutasd en el endpoint de github.
    - En este proyecto se definieron las rutas en app.ts

``` ts
import express from 'express';
import { envs } from './config/envs';
import { GithubController } from './presentation/github/controller';
import { GitHubSha256Middleware } from './presentation/middlewares/github-sha256.middleware';
(() =>{
   main(); 
})();

function main() {
    const app = express();

    const controller = new GithubController();
    app.use(express.json());

    app.use(GitHubSha256Middleware.verifySignature);

    app.post('/api/github', controller.webhookHandler);

    app.listen(envs.PORT, () => {
        console.log(`Server running on port ${envs.PORT}`)
    })
}
```

