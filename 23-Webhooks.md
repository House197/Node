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