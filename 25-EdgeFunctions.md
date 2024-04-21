# Sección 25. Edge Functions con Netlify
En esta sección trabajaremos creando pequeñas funciones que nos permitan desplegarlas en la nube, y así evitar tener que crear todo un servidor que se encuentre corriendo el 100% del tiempo, en la espera de peticiones http esporádicas.

Lo que veremos es muy utilizado para abaratar costos y desplegar procedimientos en la nube. Hay muchos servicios que ofrecen este tipo de funciones en la nube (edge functions) que te permitirán realizar lo que necesites, pero en esta sección lo haremos con Netlify por su capa gratuita y funcional.

## 1. Iniciar proyecto
1. npm init -y
2. Instalar TS con Node (checar notas)

## 2. Instalación de NetlifyCLI
1. Hacer cuenta.
    - https://www.netlify.com/
2. Instalar CLI
    - https://docs.netlify.com/cli/get-started/

``` bash
npm install netlify-cli --save-dev
```

o de forma global, la cual se recomienda.

``` bash
npm install netlify-cli -g
```

3. Hacer login

``` bash
netlify login
```

## 3. Hola mundo con funciones
https://docs.netlify.com/functions/overview/
1. Instalar netflify function para poedr trabajar con TS.

``` bash
npm i @netlify/functions
```

2. Crear estructura de carpeta recomendada por la documentación.
    - Se hace en el root del proyecto.
    - Node\25-EdgeFunctions\netlify\functions\hello\hello.ts

``` ts
import type { Handler, HandlerEvent, HandlerContext } from "@netlify/functions"

const handler: Handler = async (event: HandlerEvent, context: HandlerContext) => {
    return {
        statusCode: 200,
        body: JSON.stringify({
            message:'Hola Mundo',
        }),
        headers: {
            'Content-Type': 'application/json'
        }
    }
}

export {handler}
```

3. Crear script para probar código en modo desarrollo.

``` json
"netlify:dev": "netlify dev"
```

4. Abrir navegador en el url que entrega el output de la ejecución del comando.
    - Al url se le debe concatenar el path de la función, la cual es el nombre dado a su archivo.
    - Si se hacen cambios en el archivo entonces se tiene un reload.

``` 
http://localhost:8888/.netlify/functions/hello
```

## 4. Variables de entorno
1. Crear nueva función.
    - Node\25-EdgeFunctions\netlify\functions\variables\variables.ts

``` ts
import type { Handler, HandlerEvent, HandlerContext } from "@netlify/functions"

const handler: Handler = async (event: HandlerEvent, context: HandlerContext) => {
    const myImportanVariable = process.env.MY_IMPORTANT_VARIABLE;

    if(!myImportanVariable) throw 'Error, missing variable myImportanVariable'

    return {
        statusCode: 200,
        body: JSON.stringify({
            myImportanVariable,
        }),
        headers: {
            'Content-Type': 'application/json'
        }
    }
}

export {handler}
```

2. Crear .env en root.
```
MY_IMPORTANT_VARIABLE=CuiCui
```

- Se recomienda no lanzar new Error, ya que esto da el stack trace lo cual da información de más al usuario.

## 5. Desplegar funciones en producción
1. Ejecutar comando siguiente, en donde se debe estar ubicado en el root del proyecto:

``` bash
netlify deploy --prod
```

2. Las opciones por escoger son:
    - Create & configure a new site
    - Team: Houser's Team
    - Site name: AARR-functions (Debe ser único, ya que puede ser difícil cambiarlo después debido a las referencias que se pueden tener en el código al llamar el endpoint)

- Con lo anterior se tienen los siguientes urls (se colocaron en .env los valores):
    - El URL es el que se usa como el root del endpoint.
    - Admin URL se utiliza para configurar envs.

```
Admin URL:
URL:      
Site ID:  
```

3. Especificar que el proyecto a publicar es el actual, por lo que solo se da enter.
4. Configurar variables de entorno en Admin URL
    - En caso de no abrir se puede hacer desde la página de netlify en el dashboard al momento de inicar sesión
5. Volver a hacer deploy después de configurar variables de entorno.

## 6. Discord messages desde Edge Functions
1. Crear variable de github-discord para mandar mensaje de éxito.
    - Node\25-EdgeFunctions\netlify\functions\github-discord\github-discord.ts

``` ts
import type { Handler, HandlerEvent, HandlerContext } from "@netlify/functions"

const notify = async ( message: string ) => {
    const body = {
        content: message,
        embeds: [{
            image: {url: 'https://i.gifer.com/1IG.gif'}
        }]
    }

    const resp = await fetch(process.env.DISCORD_WEBHOOK_URL ?? '', {
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

const handler: Handler = async (event: HandlerEvent, context: HandlerContext) => {

    await notify('Hola mundo Net dev')

    return {
        statusCode: 200,
        body: JSON.stringify({
            message:'done',
        }),
        headers: {
            'Content-Type': 'application/json'
        }
    }
}

export {handler}
```

2. Colocar DISCORD_WEBHOOK_URL en .env

## 7. Webhooks Github > Netlify > Discord

- Se colocan las mismas funciones que se tenían en el servicio de Github del proyecto de 23-webhooks
    - Esto se refiere a las funciones que gestionan la acción que se recibe: onStar y onIssue
    - La función notify hace el post en el endpoint del webhook de Discord.
    - La función principal es Handler, la cual es la que se manda a llamar cuando se le pega al endpoint. 
        - En su argumento se tiene event, el cual contiene toda la información del evento.
            - En este caso, trae la información que trae Github, tal como los headers y el body. 

``` ts
import type { Handler, HandlerEvent, HandlerContext } from "@netlify/functions"

const notify = async ( message: string ) => {
    const body = {
        content: message,
        embeds: [{
            image: {url: 'https://i.gifer.com/1IG.gif'}
        }]
    }

    const resp = await fetch(process.env.DISCORD_WEBHOOK_URL ?? '', {
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

const onStar = (payload: any): string => {
    let message: string = ''
    const { starred_at, sender, action, repository } = payload;


    return `User ${sender.login} ${action} star on ${repository.full_name}`;

}

const onIssue = ( payload: any): string => {
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

const handler: Handler = async (event: HandlerEvent, context: HandlerContext) => {

    const githubEvent = event.headers['x-github-event'] ?? 'unknown';
    const payload = JSON.parse(event.body ?? '{}');
    let message: string;

    switch(githubEvent){
        case 'star':
            message = onStar(payload);
            break;
        case 'issues':
            message = onIssue(payload);
            break;
        default:
            message = `Unknown event ${githubEvent}`;
    }

    await notify(message)

    return {
        statusCode: 200,
        body: JSON.stringify({
            message:'done',
        }),
        headers: {
            'Content-Type': 'application/json'
        }
    }
}

export {handler}
```

2. Subir a producción cambios hechos:

``` bash
netlify deploy --prod
```

3. Colocar URL de Netlify como URL para el webhook en los settings de Github.
    - El URL debe ser el del endpoint, el cual se puede consultar directamente en Netlify al seleccionar la función deseada (info).
    - https://app.netlify.com/teams/arturo-riverar97/overview