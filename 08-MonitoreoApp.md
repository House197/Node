# Sección 08. Aplicación de Monitoreo - NOC (Network Operation Center)
- Ejecutar c´dogi oen momento específicos:
    - Por hora.
    - Al final del día.
    - Todos los lunes.
    - Etc
- La aplicación hará:
    - Monitorear una API.
    - Crear propios procesos de monitoreo.
    - Enviar correos.
- Grabar los logs en (datasources):
    - File System.
    - MongoDB
    - PostgresSQL

## Temas
1. Introducción a la Arquitectura Limpia
2. Introducción a la inyección de dependencias (DI - Dependency injection)
3. JSON-Server
4. Casos de Uso
5. CRON Task - Tareas cronometradas

## 1. Arquitectura limpia.
### Entidades
- En esta app es la representación de lo que se va a meter a la base de datos.
- La entidad será LogEntity
    - Nivel de seguridad.
    - Mensaje del suceo.
    - Cuándo pasó.

### Casos de uso
- Grabar logs.
- Leer logs por severidad.
- Enviar email.

### Presenters
- Consola.

### Database
- fyleSystem.
- MongoDB.
- PostgresSQL.

## 2. Crear proyecto
1. Se usa la versión preferida, la cual usa TS-Node-dev. Revisar archivo ConfiguraciónProyecto.md
2. Crear src -> app.ts

``` ts
import { Server } from "./presentation/server"

(async() => {
    main();
})()

function main() {
    Server.start();
}
```

## 3. Main - Server App
1. src -> presentation -> server.ts

``` ts
export class Server {
    public static start() {
        console.log("Server started...");
    }
}
```

## 4. CRON Tasks
1. Instalar cron

``` bash
npm i cron
```

2. Crear patrón adaptador src -> presentation -> cron -> cron-service.ts

``` ts
import { CronJob } from 'cron';

type CronTime = string | Date;
type OnTick = () => void;

export class CronService {
    static createJob(cronTime: CronTime, onTick: OnTick): CronJob {

        const job = new CronJob(cronTime, onTick);

        job.start();

        return job;
        
    }
}
```

3. Usarlo en App.ts

``` ts
import { CronService } from "./presentation/cron/cron-service";
import { Server } from "./presentation/server"

(async() => {
    main();
})()

function main() {
    Server.start();

    CronService.createJob(
        '*/5 * * * * *',
        () => {
            const date = new Date();
            console.log('5 seconds', date)
        }
    )
}
```

## 5. CronService - UseCase
1. src -> domain -> use-cases -> checks -> check-service.ts

``` ts
interface CheckServiceUseCase {
    execute(url: string):Promise<boolean>;
}

export class CheckService implements CheckServiceUseCase {
    public async execute(url: string): Promise<boolean> {
        try {
            const req = await fetch(url);
            if(!req.ok){
                throw new Error(`Error on check service ${url}`);
            }
            return true;
        } catch (error) {
            console.log(`${error}`);
            return false
        }
    }
}
```

2. Llamar en server.ts, en el callback de CronService.

``` ts
function main() {
    Server.start();

    CronService.createJob(
        '*/5 * * * * *',
        () => {
            new CheckService().execute('https://google.com');
        }
    )
}
```

## 6. JSON-Server
- Permite crear un RESTFul service de forma rápida.
- Permite crear endpoints de forma rápida.
- Se usará para tener un servidor qué probar en la app.
https://www.npmjs.com/package/json-server

1. Crear nuevo proyecto, en donde se llama 08-json-server
2. Descargar JSON server
``` bash
npm i json-server
```
3. Crear db.json
``` json
{
    "posts": [
      { "id": "1", "title": "a title", "views": 100 },
      { "id": "2", "title": "Cui cui", "views": 200 }
    ],
    "comments": [
      { "id": "1", "text": "a comment about post 1", "postId": "1" },
      { "id": "2", "text": "another comment about post 1", "postId": "1" }
    ],
    "profile": {
      "name": "typicode"
    }
}
```
4. Levantar servidor.
    - Al levantarlo ya se tendrán los endpoints para probarlos en el localhost 3000.
``` bash
npx json-server db.json
```

5. Usar endpoint para probar check-service.ts al mandar callback desde app.ts.

``` ts
(async() => {
    main();
})()

function main() {
    Server.start();

    CronService.createJob(
        '*/5 * * * * *',
        () => {
            new CheckService().execute('http://localhost:3000');
        }
    )
}
```

## 7. Inyección de dependencias
- Normalmente se realiza en un constructor.
- Se añaden dependencias a la clase.

``` ts
interface CheckServiceUseCase {
    execute(url: string):Promise<boolean>;
}

type SuccessCallback = () => void;
type ErrorCallback = (error: string) => void;

export class CheckService implements CheckServiceUseCase {

    constructor(
        private readonly successCallback: SuccessCallback,
        private readonly errorCallback: ErrorCallback
    ){}

    public async execute(url: string): Promise<boolean> {
        try {
            const req = await fetch(url);
            if(!req.ok){
                throw new Error(`Error on check service ${url}`);
            }
            this.successCallback();
            console.log(`${url} is ok`);
            return true;
        } catch (error) {
            console.log(`${error}`);
            this.errorCallback(`${error}`);
            return false
        }
    }
}
```

```ts 
import { CheckService } from "./domain/use-cases/checks/check-service";
import { CronService } from "./presentation/cron/cron-service";
import { Server } from "./presentation/server"

(async() => {
    main();
})()

function main() {
    Server.start();

    CronService.createJob(
        '*/5 * * * * *',
        () => {
            new CheckService(
                () => console.log('succes'),
                (error) => console.log(error), 
            ).execute('http://localhost:3000');
        }
    )
}
```

- Generalmente solo importan los logs de error.

# Sección 09. Clean Arquitecture - Repository Pattern
## Tema
1. Entidades
2. DataSources
3. Repositorios
4. Clases Abstractas
5. Implementaciones
6. Variables de entorno
7. Validación de variables de entorno.

## 1. LogEntity
1. src -> domain -> entities -> log-entity.ts

``` ts
export enum LogSeverityLevel {
    low = 'low',
    mediuem = 'medium',
    high = 'high',
}

export class LogEntity {
    constructor(
        public level: LogSeverityLevel,
        public message: string,
        public createdAt: Date = new Date(),
    ){}

    static fromJson = (json: string): LogEntity => {
        const {message, level, createdAt} = JSON.parse(json);
        const log = new LogEntity(message, level);
        log.createdAt = new Date(createdAt)

        return log;
    }
}
```

## 2. Datasources y Repositorios abstractos
1. src -> domain -> datasources -> log.datasource.ts
2. src -> domain -> repositories -> log.repository.ts

``` ts
import { LogEntity, LogSeverityLevel } from "../entities/log-entity";

export abstract class LogDatasource {
    abstract saveLog(log: LogEntity): Promise<void>;
    abstract getLogs(severityLevel: LogSeverityLevel): Promise<LogEntity[]>;
}
```

## 3. FileSystem - Datasource
1. src -> infrastructure -> datasources -> file-system.datasource.ts

### 1. SaveLog
``` ts
    async saveLog(newLog: LogEntity): Promise<void> {
        const logAsJson = `${JSON.stringify(newLog)}\n`
        fs.appendFileSync(this.allLogsPath, logAsJson);

        if(newLog.level === LogSeverityLevel.low) return;
        
        if(newLog.level === LogSeverityLevel.medium) {
            fs.appendFileSync(this.mediumLogsPath, logAsJson);
        } else {
            fs.appendFileSync(this.highLogsPath, logAsJson);
        };
    }
```

### 2. GetLogs

``` ts
import { LogDatasource } from "../../domain/datasources/log.datasource";
import { LogEntity, LogSeverityLevel } from "../../domain/entities/log-entity";
import fs from 'fs';

export class FileSystemDatasource implements LogDatasource {

    private readonly logPath = 'logs/';
    private readonly allLogsPath = `${this.logPath}/logs-all.log`
    private readonly mediumLogsPath = `${this.logPath}/logs-medium.log`
    private readonly highLogsPath = `${this.logPath}/logs-high.log`

    constructor(){
        this.createLogsFiles();
    }

    private createLogsFiles = () => {
        if(!fs.existsSync(this.logPath)) {
            fs.mkdirSync(this.logPath);
        }

        [
            this.allLogsPath,
            this.mediumLogsPath,
            this.highLogsPath,
        ].forEach(path => {
            if(fs.existsSync(path)) return;
            fs.writeFileSync(path, '');
        })

    } 

    async saveLog(newLog: LogEntity): Promise<void> {
        const logAsJson = `${JSON.stringify(newLog)}\n`
        fs.appendFileSync(this.allLogsPath, logAsJson);

        if(newLog.level === LogSeverityLevel.low) return;
        
        if(newLog.level === LogSeverityLevel.medium) {
            fs.appendFileSync(this.mediumLogsPath, logAsJson);
        } else {
            fs.appendFileSync(this.highLogsPath, logAsJson);
        };
    }

    private getLogsFromFile = (path: string): LogEntity[] => {
        const content = fs.readFileSync(path, 'utf8');
        const logs = content.split('\n').map(LogEntity.fromJson);

        return logs;
    }

    async getLogs(severityLevel: LogSeverityLevel): Promise<LogEntity[]> {
        switch(severityLevel){
            case LogSeverityLevel.low:
                return this.getLogsFromFile(this.allLogsPath);
            case LogSeverityLevel.medium:
                return this.getLogsFromFile(this.mediumLogsPath);
            case LogSeverityLevel.high:
                return this.getLogsFromFile(this.highLogsPath);
            default:
                throw new Error(`${severityLevel} not implemented`);
        }
    }

}
```

## 4. LogRepository - Implementation
1. src -> infrastructure -> repositories -> log.repository.impl.ts
2. Realizar inyección de dependencia para inyectar datasource.

``` ts
import { LogEntity, LogSeverityLevel } from "../../domain/entities/log-entity";
import { LogRepository } from "../../domain/repositories/log.repository";
import { LogDatasource } from '../../domain/datasources/log.datasource';

export class LogRepositoryImpl implements LogRepository {

    constructor(
        private readonly logDatasource: LogDatasource,
    ) {}

    async saveLog(log: LogEntity): Promise<void> {
        return this.logDatasource.saveLog(log);
    }
    async getLogs(severityLevel: LogSeverityLevel): Promise<LogEntity[]> {
        return this.logDatasource.getLogs(severityLevel);
    }

}
```

## 5. Inyectar repositorio en caso de uso
- Se realiza la inyección del repositorio para poder empezar a registrar los logs por medio del método saveLog.

``` ts
import { LogEntity, LogSeverityLevel } from '../../entities/log-entity';
import { LogRepository } from '../../repositories/log.repository';
interface CheckServiceUseCase {
    execute(url: string):Promise<boolean>;
}

type SuccessCallback = () => void;
type ErrorCallback = (error: string) => void;

export class CheckService implements CheckServiceUseCase {

    constructor(
        private readonly logRepository: LogRepository,
        private readonly successCallback: SuccessCallback,
        private readonly errorCallback: ErrorCallback
    ){}

    public async execute(url: string): Promise<boolean> {
        try {
            const req = await fetch(url);
            if(!req.ok){
                throw new Error(`Error on check service ${url}`);
            }
            const log = new LogEntity(LogSeverityLevel.low, `Service ${url} working`);
            this.logRepository.saveLog(log);
            this.successCallback();
            return true;
        } catch (error) {
            const errorMessage = `${error}`
            const log = new LogEntity(LogSeverityLevel.low, errorMessage);
            this.logRepository.saveLog(log);
            this.errorCallback(`${error}`);
            return false
        }
    }
}
```

### Crar instancia del repositorio para poder pasarla a los use cases que la requieran
- En Flutter se usaba un gestor de estado. En este caso se define en server.ts
``` ts
import { CheckService } from "../domain/use-cases/checks/check-service";
import { FileSystemDatasource } from "../infrastructure/datasources/file-system.datasource";
import { LogRepositoryImpl } from "../infrastructure/repositories/log.repository.impl";
import { CronService } from "./cron/cron-service";

const fileSystemLogRepository = new LogRepositoryImpl(
    new FileSystemDatasource(),
);

export class Server {
    public static start() {
        console.log("Server started...");

        CronService.createJob(
            '*/5 * * * * *',
            () => {
                new CheckService(
                    fileSystemLogRepository,
                    () => console.log('succes'),
                    (error) => console.log(error), 
                ).execute('http://localhost:3000');
            }
        )
    }
}
```

## 6. Variables de entorno
https://www.npmjs.com/package/dotenv

``` bash
npm i dotenv
```

### 1. Validaciones en env
https://www.npmjs.com/package/env-var

``` bash
npm i env-var
```

### 2. Patrón adaptador
1. src -> config -> plugins -> envs.plugin.ts

``` ts
import 'dotenv/config';
import * as env from 'env-var';

export const envs = {
    PORT: env.get('PORT').required().asPortNumber(),
    MAILER_EMAIL: env.get('MAILER_EMAIL').required().asEmailString(),
    MAILER_SECRET_KEY: env.get('MAILER_SECRET_KEY').required().asString(),
    PROD: env.get('PROD').required().asBool(),
}
```

# Sección 10. Correos electrónicos
## Temas
1. Casos de Uso
2. Servicios
3. Inyecciones de dependencias
4. Configuración de password en Gmail (secret keys)
5. NodeMailer
6. Y más

## 1. Refactorización
1. log.entity.ts
    - Definir propiedad origin, la cual va a proveer del archivo en el que se llamó el log.
    - Se va a pasar un objeto como argumento en lugar de propiedades individuales.

``` ts
export enum LogSeverityLevel {
    low = 'low',
    medium = 'medium',
    high = 'high',
}

export interface LogEntityOptions {
    level: LogSeverityLevel,
    message: string,
    createdAt?: Date,
    origin: string,
}

export class LogEntity {
    public level: LogSeverityLevel;
    public message: string;
    public createdAt?: Date;
    public origin: string;

    constructor(options: LogEntityOptions){
        const {message, level, origin, createdAt = new Date()} = options;
        this.message = message;
        this.level = level;
        this.createdAt = createdAt;
        this.origin = origin;
    }

    static fromJson = (json: string): LogEntity => {
        const {message, level, createdAt, origin} = JSON.parse(json);
        const log = new LogEntity({message, level, origin, createdAt});
        log.createdAt = new Date(createdAt)

        return log;
    }
}
```

## 2. Preparación de envío de correo
1. Instalar nodemailer y archivo de definición de TS
``` bash
npm i nodemailer
npm i -D @types/nodemailer
```
2. Gmail Keys Two-factor authentication
    - https://myaccount.google.com/security
    - https://myaccount.google.com/u/0/apppasswords

3. src -> presentantion -> email -> email.service.ts

``` ts
import nodemailer from 'nodemailer'
import { envs } from '../../config/plugins/envs.plugin';

interface SendEmailOptions {
    to: string;
    subject: string;
    htmlBody: string;
    // TODO: attachments
}

export class EmailService {
    private tansporter = nodemailer.createTransport({
        service: envs.MAILER_SERVICE,
        auth: {
            user:envs.MAILER_EMAIL,
            pass:envs.MAILER_SECRET_KEY,
        }
    });

    async sendEmail(options: SendEmailOptions): Promise<boolean> {
        const {to, subject, htmlBody} = options;

        try {
            const sentInformation = await this.tansporter.sendMail({
                to,
                subject,
                html: htmlBody,
            });

            console.log(sentInformation);
            return true;
        } catch (error) {
            console.log(error);
            return false;
        }
    }
}
```

4. Mandar mensaje de prueba en server.ts
    - El campo de to debe ser el correro electrónico.

``` ts
export class Server {
    public static start() {
        console.log("Server started...");
        const emailService = new EmailService();
        emailService.sendEmail({
            to:'arturo.riverar97@gmail.com',
            subject: 'Logs sistema',
            htmlBody: `
            <h3>Logs de sistem - NOC</h3>
            <p>Lorem ipsum</p>
            `
        })
/*         CronService.createJob(
            '5 * * * * *',
            () => {
                new CheckService(
                    fileSystemLogRepository,
                    () => console.log('success'),
                    (error) => console.log(error), 
                ).execute('http://localhost:3000');
            }
        ) */
    }
}
```

5. Enviar archivos adjuntos
    - https://nodemailer.com/message/attachments/
    1. Crear método en email.service y definir attachment

``` ts
import nodemailer from 'nodemailer'
import { envs } from '../../config/plugins/envs.plugin';

interface SendEmailOptions {
    to: string | string[];
    subject: string;
    htmlBody: string;
    attachments: Attachment[];
}

interface Attachment {
    filename: string;
    path: string;
}

export class EmailService {
    private tansporter = nodemailer.createTransport({
        service: envs.MAILER_SERVICE,
        auth: {
            user:envs.MAILER_EMAIL,
            pass:envs.MAILER_SECRET_KEY,
        }
    });

    async sendEmail(options: SendEmailOptions): Promise<boolean> {
        const {to, subject, htmlBody, attachments = []} = options;

        try {
            const sentInformation = await this.tansporter.sendMail({
                to,
                subject,
                html: htmlBody,
                attachments,
            });

            console.log(sentInformation);
            return true;
        } catch (error) {
            console.log(error);
            return false;
        }
    }

    async senEmailWithFileSystemLogs(to: string | string[]) {
        const subject = 'Logs del servidor';
        const htmlBody = `
        <h3>Logs de sistem - NOC con método senEmailWithFileSystemLogs</h3>
        <p>Lorem ipsum</p>
        `

        const attachments: Attachment[] = [
            {filename: 'logs-all.log', path: './logs/logs-all.log'},
            {filename: 'logs-medium.log', path: './logs/logs-medium.log'},
            {filename: 'logs-high.log', path: './logs/logs-high.log'}
        ];

        return this.sendEmail({
            to, subject, attachments, htmlBody
        })
    }
}
```

6. Inyectar repositorio y usar saveLog.

``` ts
import nodemailer from 'nodemailer'
import { envs } from '../../config/plugins/envs.plugin';
import { LogRepository } from '../../domain/repositories/log.repository';
import { LogEntity, LogSeverityLevel } from '../../domain/entities/log-entity';

interface SendEmailOptions {
    to: string | string[];
    subject: string;
    htmlBody: string;
    attachments: Attachment[];
}

interface Attachment {
    filename: string;
    path: string;
}

export class EmailService {
    private tansporter = nodemailer.createTransport({
        service: envs.MAILER_SERVICE,
        auth: {
            user:envs.MAILER_EMAIL,
            pass:envs.MAILER_SECRET_KEY,
        }
    });

    constructor(
        private readonly logRepository: LogRepository,
    ){}

    async sendEmail(options: SendEmailOptions): Promise<boolean> {
        const {to, subject, htmlBody, attachments = []} = options;

        try {
            const sentInformation = await this.tansporter.sendMail({
                to,
                subject,
                html: htmlBody,
                attachments,
            });
            const log = new LogEntity({
                level: LogSeverityLevel.low,
                message: 'Email sent',
                origin: 'email.service.ts',
            });
            this.logRepository.saveLog(log);
            return true;
        } catch (error) {
            const log = new LogEntity({
                level: LogSeverityLevel.high,
                message: 'Email not sent',
                origin: 'email.service.ts',
            });
            this.logRepository.saveLog(log);
            return false;
        }
    }

    async senEmailWithFileSystemLogs(to: string | string[]) {
        const subject = 'Logs del servidor';
        const htmlBody = `
        <h3>Logs de sistem - NOC con método senEmailWithFileSystemLogs</h3>
        <p>Lorem ipsum</p>
        `

        const attachments: Attachment[] = [
            {filename: 'logs-all.log', path: './logs/logs-all.log'},
            {filename: 'logs-medium.log', path: './logs/logs-medium.log'},
            {filename: 'logs-high.log', path: './logs/logs-high.log'}
        ];

        return this.sendEmail({
            to, subject, attachments, htmlBody
        })
    }
}
```

7. Usar inyección en server.ts

``` ts
import { CheckService } from "../domain/use-cases/checks/check-service";
import { FileSystemDatasource } from "../infrastructure/datasources/file-system.datasource";
import { LogRepositoryImpl } from "../infrastructure/repositories/log.repository.impl";
import { CronService } from "./cron/cron-service";
import { EmailService } from './email/email.service';

const fileSystemLogRepository = new LogRepositoryImpl(
    new FileSystemDatasource(),
);

export class Server {
    public static start() {
        console.log("Server started...");
        const emailService = new EmailService(fileSystemLogRepository);
        emailService.senEmailWithFileSystemLogs(
            ['arturo.riverar97@gmail.com'],
        )
/*         CronService.createJob(
            '5 * * * * *',
            () => {
                new CheckService(
                    fileSystemLogRepository,
                    () => console.log('success'),
                    (error) => console.log(error), 
                ).execute('http://localhost:3000');
            }
        ) */
    }
}
```
## 3. SendEmail - UseCase
- En lugar de mandar el repositorio directamente a EmailService ahora se le pasa el useCase, el cual ya contiene el repository.
    - El useCase va a recibir el emailService y el repositorio.

1. src\domain\use-cases\email\send-logs.ts

``` ts
import { EmailService } from '../../../presentation/email/email.service';
import { LogEntity, LogSeverityLevel } from '../../entities/log-entity';
import { LogRepository } from '../../repositories/log.repository';

interface SendLogEmailUseCase {
    execute: (to: string | string[]) => Promise<boolean>;
}

export class SendEmailLogs implements SendLogEmailUseCase {
    constructor(
        private readonly emailService: EmailService,
        private readonly logRepository: LogRepository,
    ){}

    async execute( to: string | string[]) {
        try {
            const sent = await this.emailService.senEmailWithFileSystemLogs(to);
            if(!sent) throw new Error('Email log not sent');

            const log = new LogEntity({
                message: `Log email sent`,
                level: LogSeverityLevel.low,
                origin: 'send-email-logs.ts'
            })
            this.logRepository.saveLog(log);

            return true;
        } catch (error) {
            const log = new LogEntity({
                message: `${error}`,
                level: LogSeverityLevel.high,
                origin: 'send-email-logs.ts'
            })
            this.logRepository.saveLog(log);
            return false;
        }
    }


}
```

2. Eliminar inyección de dependencia de repositorio en email.service.ts

``` ts
import nodemailer from 'nodemailer'
import { envs } from '../../config/plugins/envs.plugin';
import { LogRepository } from '../../domain/repositories/log.repository';
import { LogEntity, LogSeverityLevel } from '../../domain/entities/log-entity';

interface SendEmailOptions {
    to: string | string[];
    subject: string;
    htmlBody: string;
    attachments: Attachment[];
}

interface Attachment {
    filename: string;
    path: string;
}

export class EmailService {
    private tansporter = nodemailer.createTransport({
        service: envs.MAILER_SERVICE,
        auth: {
            user:envs.MAILER_EMAIL,
            pass:envs.MAILER_SECRET_KEY,
        }
    });

    constructor(){}

    async sendEmail(options: SendEmailOptions): Promise<boolean> {
        const {to, subject, htmlBody, attachments = []} = options;

        try {
            const sentInformation = await this.tansporter.sendMail({
                to,
                subject,
                html: htmlBody,
                attachments,
            });

            return true;
        } catch (error) {
            return false;
        }
    }

    async senEmailWithFileSystemLogs(to: string | string[]) {
        const subject = 'Logs del servidor';
        const htmlBody = `
        <h3>Logs de sistem - NOC con método senEmailWithFileSystemLogs</h3>
        <p>Lorem ipsum</p>
        `

        const attachments: Attachment[] = [
            {filename: 'logs-all.log', path: './logs/logs-all.log'},
            {filename: 'logs-medium.log', path: './logs/logs-medium.log'},
            {filename: 'logs-high.log', path: './logs/logs-high.log'}
        ];

        return this.sendEmail({
            to, subject, attachments, htmlBody
        })
    }
}
```

3. Hacer prueba en server.ts

``` ts
const fileSystemLogRepository = new LogRepositoryImpl(
    new FileSystemDatasource(),
);

const emailService = new EmailService();

export class Server {
    public static start() {
        console.log("Server started...");
        new SendEmailLogs(emailService, fileSystemLogRepository).execute(['arturo.riverar97@gmail.com']);
```

# Sección 11. MongoDB y PostgreSQL
## Temas
1. Mongoose
2. Prisma
3. TypeORM (superficialmente)
4. Migraciones de prisma
5. Insertar en base de datos
6. Leer de base de datos
7. Mapeo de data a Entidades
8. Creación de datasources
9. Caso de uso nuevo, para grabar en múltiples destinos simultáneamente

## 1. Base de datos MongoDB
1. Crear archivo docker compose

``` yml
version: '3.8'

services:
  mongo-db:
    image: mongo:6.0.6
    restart: always
    entrypoint: 
      MONGO_INITDB_ROOT_USERNAME: ${MONGO_USER}
      MONGO_INITDB_ROOT_PASSWORD: ${MONGO_PASS}
    volumes:
      - ./mongo:/data/db
    ports:
      - 27017:27017
```

2. Se prueba con mongo compass.
    - Se debe colocar el user y passwords colocados en .env.
    - Al poderse conectar en el menú de conexión se da el url (cadena de conexión), el cual debe colocarse en .env MONGO_URL

## 2. Node + Mongo - Mongoose
1. Instalar dependencia
``` bash
npm i mongoose
```

2. src -> data -> mongo -> init.ts

``` ts
import mongoose from "mongoose";

interface ConnectionOptions {
    mongoUrl: string;
    dbName: string;
}

export class MongoDatabase {
    constructor(){}

    static async connect(options: ConnectionOptions) {
        const {mongoUrl, dbName} = options;

        try {
            await mongoose.connect(mongoUrl, {
                dbName: dbName,
            })

            console.log('Mongo connected');
        } catch (error) {
            console.log('Mongo connection error');
            throw error;
        }
    }
}
```

3. Probar en app.ts
``` ts
import { envs } from "./config/plugins/envs.plugin";
import { MongoDatabase } from "./data/mongo-set/init";
import { Server } from "./presentation/server"

(async() => {
    main();
})()

async function main() {
    await MongoDatabase.connect({mongoUrl: envs.MONGO_URL, dbName: envs.MONGO_DB_NAME});
    Server.start();
}
```

## 3. Schema & Model Mongo
- Se les puede ver como una forma de conectarse a una "colección" (similar a una tabla) en base de datos.  
    - A diferencia de base de datos relaciones, con Mongo ya s epude empezar a trabajar con la DB antes de tner definida la db con las tablas.

1. src -> data -> mongo-set -> models -> log.model.ts
    - Se le puso mongo-set en lugar de mongo ya que el volumen se llama igual, por lo que en gitgnore iba a ignorar esta carpeta también.

``` ts
import mongoose from "mongoose";

// Definir Schema, el cual define las reglas del objeto
const logSchema = new mongoose.Schema({
    level: {
        type: String,
        enum: ['low','medium','high'],
        default: 'low',
    },
    message: {
        type: String,
        required: true,
    },
    origin: {
        type: String,
    },
    createdAt: {
        type: Date,
        default: new Date(),
    },
});

// Crear modelo para poder interactuar con Mongo.
export const LogModel = mongoose.model('log', logSchema);
```

## 4. Crear y leer de mongo
1. Hacer prueba en App.ts

``` ts
import { envs } from "./config/plugins/envs.plugin";
import { MongoDatabase } from "./data/mongo-set/init";
import { LogModel } from "./data/mongo-set/models/log.model";
import { Server } from "./presentation/server"

(async() => {
    main();
})()

async function main() {
    await MongoDatabase.connect({mongoUrl: envs.MONGO_URL, dbName: envs.MONGO_DB_NAME});

    const newLog = await LogModel.create({
        message: 'Test message desde mongo',
        origin: 'App.ts',
        level: 'low'
    });

    await newLog.save();

    Server.start();
}
```

2. Leer db.

``` ts
    const logs = await LogModel.find();
    console.log(logs);
```

3. MongoLogDatasource
    1. src -> infrastructure -> datasources -> mongo-log.datasource.ts
    2. Definir método en LogEntity para convertir de Mongo a entidad.

``` ts
    static fromObject = (object: {[key:string]: any}): LogEntity => {
        const { message, level, createdAt, origin } = object;
        const log = new LogEntity({
            message, level, createdAt, origin
        })
        return log;
    }
```

``` ts
    async getLogs(severityLevel: LogSeverityLevel): Promise<LogEntity[]> {
        const logs = await LogModel.find({
            level: severityLevel
        });

        return logs.map(mongoLog => LogEntity.fromObject(mongoLog));
    }

```

4. Grabar logs en mongo.
    - Se cambia el repositorio que se le pasa a cron en server.ts

``` ts
const logRepository = new LogRepositoryImpl(
    //new FileSystemDatasource(),
    new MongoLogDatasource(),
);

const emailService = new EmailService();

export class Server {
    public static start() {
        console.log("Server started...");
        //new SendEmailLogs(emailService, fileSystemLogRepository).execute(['arturo.riverar97@gmail.com']);

/*         emailService.senEmailWithFileSystemLogs(
            ['arturo.riverar97@gmail.com'],
        ) */
        CronService.createJob(
            '*/5 * * * * *',
            () => {
                new CheckService(
                    logRepository,
                    () => console.log('success'),
                    (error) => console.log(error), 
                ).execute('http://localhost:3000');
            }
        )
    }
}
```