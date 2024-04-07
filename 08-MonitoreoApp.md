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

## 5. LogEntity fromJson Depuración
- Sucedía un error ya que llega a veces un json vacío.
    - Esto es porque en algún documento log que está en DB no tiene datos entonces retorna un string vacío.
- Lo antertior surge en el video al probar el método getLogs del repositorio, en donde se buscaba por severidad de medium.
1. Retornar un arreglo vacío en el método de file-sytstem.datasource.ts
``` ts
    private getLogsFromFile = (path: string): LogEntity[] => {
        const content = fs.readFileSync(path, 'utf8');
        if (content === '') return []
        const logs = content.split('\n').map(LogEntity.fromJson);

        return logs;
    }
```

2. Validar en LogEntity si el json es vacío.

``` ts
    static fromJson = (json: string): LogEntity => {
        json = (json === '') ? '{}':json;
        const {message, level, createdAt, origin} = JSON.parse(json);
        const log = new LogEntity({message, level, origin, createdAt});
        log.createdAt = new Date(createdAt)

        return log;
    }
```

## 6. PostgreSQL instalación
1. Se crea el servicio de Postgres en el docker compose.
2. Definir nueva variable de entorno para guardar enlace de conexión a la db de postgres.
    - De igual manera se definen las demás variables para el user, pwd y db.

## 7. Prisma - ORM
https://www.prisma.io/docs/getting-started
1. Instalar
``` bash
npm i -D prisma
```

2. Set up Prisma
``` bash
npx prisma init --datasource-provider PostgreSQL
```

3. Configurar Prisma.
    - Por defecto ya crea un archivo en donde se muestra la configuración y reconoce automáticamente variables en el .env.
    1. Prisma coloca su propia variable en .env con la cadena de conexión, la cual se pega en la variable definida propiamente y se modifica la última parte para colocar el nombre de la DB, el user y pwd.
    2. Se coloca en el archivo de prisma la variable de entorno que tiene la url.
    3. Crear modelo en archivo de prisma.
        - En prisma se pueden crear enums, los cuales deben ir en mayúsculas.
        - El esquema creado se usa para construir el objeto. Se tienen dos situaciones:
            1. Con este modelo significa que no se tiene la base de datos creada (no hay nada en la db). Entonces, se requiere de migraciones o hacer modificaciones.
            2. Si ya se tiene la db creada, entonces se puede hacer npx prisma db pull para traer todo el esquema y crear estos objetos nuevamente. Es decir, Prisma va a leer la db y crear los objetos, lo cual se tuvo que hacer a mano ya que se está en la situación 1.

``` ts
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("POSTGRES_URL")
}

enum SeverityLevel {
  LOW
  MEDIUM
  HIGH
}

model LogModel {
  id        Int       @id @default(autoincrement())
  message   String
  origin    String
  level     SeverityLevel
  createdAt DateTime  @default(now())
}

```

4. Crear migración para crear tablas en db con Prisma Migrate.
    - Esto genera el Prisma Client, el cual es lo que se ocupa para trabajar con la db. Se puede ver como si automáticamente ya se crea el esquema, modelo, cadena de conexión, etc.
    - Las migracione sen db indican por ejemplo cómo está la db antes y la modificación que se hace.
        - Si algo sale mal se pueden revertir las migraciones, lo cual sería revertir la acción creada.
        - En la carpeta de prisma ahora se tiene el folder de migrations.
``` bash
npx prisma migrate dev --name init
```

5. Pruebas de inserción
    - En app.ts se hacen las pruebas.

``` ts

(async() => {
    main();
})()

async function main() {
    await MongoDatabase.connect({mongoUrl: envs.MONGO_URL, dbName: envs.MONGO_DB_NAME});

/*     const newLog = await LogModel.create({
        message: 'Test message desde mongo',
        origin: 'App.ts',
        level: 'low'
    });

    await newLog.save(); 

    const logs = await LogModel.find();
    console.log(logs);*/

    //Server.start();

    const prisma = new PrismaClient();

    const newLog= await prisma.logModel.create({
        data: {
            level: "HIGH",
            message: 'Test message Prisma',
            origin: 'App.ts'
        }
    });

    console.log({newLog});
}
```

6. Pruebas de búsqueda

``` ts
    const prisma = new PrismaClient();

    const logs = await prisma.logModel.findMany(
        {where: {
            level:  "HIGH"
        }}
    );
    console.log(logs);
```

## 8. PostgresLog DataSource
1. src\infrastructure\datasources\postgres-log.datasource.ts
    - Se tiene que los ENUM de prisma están en mayúscula, por lo que se crea un enum para relacionar el severityLevel creado de forma propia con el enum creado por prisma.
    - Al momento de buscar en la db se debe hacer conversión del objeto de la app con lo que retorna la db.

``` ts
import { LogDatasource } from "../../domain/datasources/log.datasource";
import { LogEntity, LogSeverityLevel } from "../../domain/entities/log-entity";
import { PrismaClient, SeverityLevel } from '@prisma/client';

const prismaClient = new PrismaClient();

const severityEnum = {
    low: SeverityLevel.LOW,
    medium: SeverityLevel.MEDIUM,
    high: SeverityLevel.HIGH,
}

export class PostgresLogDatasource implements LogDatasource {
    async saveLog(log: LogEntity): Promise<void> {
        const level = severityEnum[log.level];
        const newLog = await prismaClient.logModel.create({
            data: {
                ...log,
                level,
            }
        });
    }
    
    async getLogs(severityLevel: LogSeverityLevel): Promise<LogEntity[]> {
        const level = severityEnum[severityLevel];

        const dbLogs = await prismaClient.logModel.findMany({
            where: {level}
        });

        return dbLogs.map(dbLog => LogEntity.fromObject(dbLog));
    }

}
```

2. Llamar datasource en server.ts

``` ts
const logRepository = new LogRepositoryImpl(
    //new FileSystemDatasource(),
    //new MongoLogDatasource(),
    new PostgresLogDatasource()
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

## 9. Grabar en Mongo, PostgresSQL y FS simultáneamente
- A los casos de uso no le interesa el origen de datos siempre y cuando se le mande la función o el repositorio que se tiene que llamar.
- Se crea nuevo caso de uso que trabaje con las tres datasources.
1. Crear copia de check-service.ts
    1. src\domain\use-cases\checks\check-service-multiple.ts
    - Va a ser igual, solo se cambia el nombre de la enum y de la clase.
    - La diferencia es que se recibe un arreglo de datasources.
2. Crear método callLogs para mandar a guardar en todos datasources, el cual va a reemplazar a saveLog, el cual está marcado por rojo gracias a ts.

``` ts
export class CheckServiceMultiple implements CheckServiceMultiplUseCase {

    constructor(
        private readonly logRepository: LogRepository[],
        private readonly successCallback: SuccessCallback,
        private readonly errorCallback: ErrorCallback
    ){}

    private callLogs(log: LogEntity) {
        this.logRepository.forEach(logRepository => {
            logRepository.saveLog(log);
        })
    }
```

3. Probar en server.ts
    1. Usar clase CheckServiceMultiple.
    2. Definir repositorios en nivel superior.

``` ts
const fsLogRepository = new LogRepositoryImpl(
    new FileSystemDatasource(),
);

const mongoLogRepository = new LogRepositoryImpl(
   new MongoLogDatasource(), 
);

const postgresLogRepository = new LogRepositoryImpl(
    new PostgresLogDatasource(),
 );
    
    

const emailService = new EmailService();

export class Server {
    public static start() {
        console.log("Server started...");

         CronService.createJob(
            '*/5 * * * * *',
            () => {
                new CheckServiceMultiple(
                    [fsLogRepository,mongoLogRepository,postgresLogRepository],
                    () => console.log('success'),
                    (error) => console.log(error), 
                ).execute('http://localhost:3000');
            }
        ) 
    }
}
```

# Sección 12. NOC - Testing - Clean Architecture
- El testing va a ser un proceso de construcción de producción de la aplicación, por lo que se recomienda usar bases de datos fuera de docker para que estén siempre disponibles a la hora de hacer testeos.
    - Esto es el caso cuando el testing se ejecuta con GitHub Action y similares, los cuales requieren de una db para ir haciendo el testeo cada que detectan cambios.
    - Si se hace de forma local entonces docker puede funcionar.
## 1. Preparación testing. Opcional ya que ya se tiene la db funcionando
1. Borrar volúmenes de bases de datos.
2. Borrar contenedores de bases de datos.
3. Volver a levantar bases de datos con docker.
    - Al borrar bases de datos entonces se debe ejecutar la sección de prisma de nuevo.
4. Ejecutar comando:
``` bash
npx prisma migrate dev
```
- Si la DB ya existiera entonces sería:
``` bash
npx prisma db pool
```

## 2. Configurar testing
1. Instalar dependencias de jest.
``` bash
npm i -D jest @types/jest ts-jest supertest
```

2. Crear archivo de configuración de jest.
    - Se da que sí a todo, se selecciona node y v8.
    - Por otro lado, la sección de limpieza de mocks se sigue diciendo que no para seguir aprendiendo cómo limpiarlos manualmente.
``` bash
npx jest --init
```

3. Configurar jest.config.ts
``` js
    preset: 'ts-jest',
    testEnvironment: "jest-environment-node"
```

4. Crear scripts en package.json.

``` json
    "test": "jest",
    "test:watch": "jest --watch",
    "test:coverage": "jets --coverage"
```

## 3. Montar bases de datos y ENVs de Testing
- Se separa el ambiente de desarrollo del de testeo.
1. Crear archivo .env.test
    - Por el momento basta solo con cambiar el nombre de las DB.
2. Crear archivo de docker compose llamado docker-compose.test.yml
    - Lo único que va a variar es el nombre del volumen.
3. Colocar scripts en package.json
``` json
    "docker:test": "docker compose -f docker-compose.test.yml --env-file .env.test up -d",
    "test": "npm run docker:test && jest",
    "test:watch": "npm run docker:test && jest --watch",
    "test:coverage": "npm run docker:test && jest --coverage"
```
4. Correr comando:
``` bash
npm run test:watch
```
## 4. Crear setupTest.ts
- Es un script o serie de procesos que se van a ejecutar antes de levantar la aplicación.
- Se configuran las variables de entorno de test.

``` ts
import { config } from 'dotenv';

config({
    path: '.env.test'
});
```

- Se le indica a Jest que cuando se levante debe ejecutar este archivo primero. Esto se hace en jest.config.ts con el campo setupfiles

``` ts
  setupFiles: [
    "<rootDir>/setupTest.ts"
  ],
```

## 4. Pruebas en ENVs
- Para las pruebas se sigue la arquitectura de crear los archivos de test a lado de los originales en lugar de crear un carpeta específica para los tests.
1. src\config\plugins\envs.plugin.test.ts

``` ts
import { envs } from "./envs.plugin";
import { describe, it, expect, jest } from "@jest/globals";

describe("envs.plugin", () => {
    it("Should return env options", () => {
        expect(envs).toEqual(  {
            PORT: 3000,
            MAILER_SERVICE: 'gmail',
            MAILER_EMAIL: 'arturo.riverar97@gmail.com',
            MAILER_SECRET_KEY: 'xhezkmrlfepvvpvn',
            PROD: true,
            MONGO_URL: 'mongodb://arturo:123456@localhost:27017/',
            MONGO_USER: 'arturo',
            MONGO_PASS: '123456',
            MONGO_DB_NAME: 'NOC-TEST'
          })
    });

    it("Should return error if not found env", async () => {
        jest.resetModules();
        process.env.PORT = 'ABC';
        try {
            await import('./envs.plugin');
            expect(true).toBe(false);
        } catch (error) {
            expect(error).toContain('"PORT" should be a valid integer'); 
        }

    })
})
```

## 5. Pruebas en la conexión de MongoDB
- Se sigue la metodología de lo que menos dependencias tiene hasta el que más tiene.

### 1. init.ts
- Se coloca que la clase retorna true o false según si s elogra la conexión o no. Por otro lado, los tests también ayudan a que los console.logs no lleguen a producción.

``` ts
import { describe, it, expect, jest } from "@jest/globals";
import { MongoDatabase } from './init';

describe('init MongoDB', () => {
    it('Should connet to MongoDB', async () => {
        console.log(process.env.MONGO_URL, process.env.MONGO_DB_NAME);

        const connected = await MongoDatabase.connect({
            dbName: process.env.MONGO_DB_NAME!,
            mongoUrl: process.env.MONGO_URL!    
        })

        expect(connected).toBeTruthy();
    });

    it('Should throw and error', async () => {

        try {
            const connected = await MongoDatabase.connect({
                dbName: process.env.MONGO_DB_NAME!,
                mongoUrl: 'fake_url'    
            });
            expect(true).toBeFalsy();
        } catch (error) {

        }
    });
})
```

### 2. Pruebas en modelo de mongo
1. Node\08-NOC\src\data\mongo-set\models\log.model.test.ts
2. Se conecta primero a la DB para hacer pruebas, lo cual se realiza con un beforeAll.
    - De igual manera se termina la conexión con afterAll.
- Al evaluar el schema en la sección de createdAt se evalúa rapidamente con expect.any(Object) a modo de no tener que evaluar cada campo de ahí.
- Cuando se acaba la prueba de insertar en db se borra el registro.

``` ts
import { describe, it, beforeAll, afterAll,expect, jest } from "@jest/globals";
import { MongoDatabase } from "../init";
import { envs } from "../../../config/plugins/envs.plugin";
import mongoose from "mongoose";
import { LogModel } from './log.model';

describe('log.mode.test.ts', () => {

    beforeAll(async () => {
        await MongoDatabase.connect({
            mongoUrl: envs.MONGO_URL,
            dbName: envs.MONGO_DB_NAME
        })
    });

    afterAll(() => {
       mongoose.connection.close(); 
    });

    it('Should return LogModel', async () => {
        const logData = {
            origin: 'log.model.test.ts',
            message: 'test-message',
            level: 'low'
        }

        const log = await LogModel.create(logData);
        expect(log).toEqual(expect.objectContaining({
            ...logData,
            id: expect.any(String),
            createdAt: expect.any(Date)
        }))

        // Limpiar registro de la base de datos
        await LogModel.findByIdAndDelete(log.id);
    });

    it('Should return the schema object', () => {
        const schema = LogModel.schema.obj;

        expect(schema).toEqual(expect.objectContaining(
            {
                level: {
                  type: expect.any(Function),
                  enum: [ 'low', 'medium', 'high' ],
                  default: 'low'
                },
                message: { type:  expect.any(Function), required: true },
                origin: { type:  expect.any(Function) },
                createdAt: expect.any(Object),
              }
        ));
    });
});
```

## 6. Pruebas en clases abstractas
1. Node\08-NOC\src\domain\datasources\log.datasource.test.ts
- Se hacen pruebas de que las implementaciones existan y de que se pasen los argumentos correctamente.

``` ts
import { describe, it, beforeAll, afterAll,expect, jest } from "@jest/globals";
import { LogDatasource } from './log.datasource';
import { LogEntity, LogSeverityLevel } from "../entities/log-entity";

describe('log.datasource.ts LogDatasource', () => {

    const newLog = new LogEntity({
        origin: 'log.datasource.test.ts',
        message: 'test-message',
        level: LogSeverityLevel.low,
    })

    class MockLogDatasource implements LogDatasource {
        async saveLog(log: LogEntity): Promise<void> {
            return ;
        }
        async getLogs(severityLevel: LogSeverityLevel): Promise<LogEntity[]> {
            return [newLog];
        }

    }

    it('Should test the abstract class', async () => {
        const mockLogDatasource = new MockLogDatasource();

        expect(mockLogDatasource).toBeInstanceOf(MockLogDatasource);
        expect(typeof mockLogDatasource.saveLog).toBe('function');
        expect(typeof mockLogDatasource.getLogs).toBe('function');

        await mockLogDatasource.saveLog(newLog);
        const logs = await mockLogDatasource.getLogs(LogSeverityLevel.high);
        expect(logs).toHaveLength(1);
        expect(logs[0]).toBeInstanceOf(LogEntity);
    });
});
```

## 7. Pruebas en LogEntity
1. Node\08-NOC\src\domain\entities\log-entity.test.ts
- En este test se aprecia que si no se pasaba una fecha con ese tipo de dato entonces se volvía string.
``` ts
import { describe, it, expect } from "@jest/globals";
import { LogEntity, LogSeverityLevel } from "./log-entity";

describe("LogEntity", () => {
    it('Should create a LogEntity instance', () => {

        const dataObj = {
            message: "Hola Mundo",
            level: LogSeverityLevel.high,
            origin: 'log.entity.test.ts',
        }

        const log = new LogEntity(dataObj);

        expect(log).toBeInstanceOf(LogEntity);
        expect(log.message).toBe(dataObj.message);
        expect(log.level).toBe(dataObj.level);
        expect(log.origin).toBe(dataObj.origin);
        expect(log.createdAt).toBeInstanceOf(Date);
    });

    it("Should crate a LogEntity instance from json", () => {
        const json = `{"message":"http://localhost:3000 is not ok. TypeError: fetch failed","level":"high","createdAt":"2024-04-03T02:07:50.057Z","origin":"check-service.ts"}`

        const log = LogEntity.fromJson(json);

        expect(log).toBeInstanceOf(LogEntity);
        expect(log.message).toBe("http://localhost:3000 is not ok. TypeError: fetch failed");
        expect(log.level).toBe(LogSeverityLevel.low);
        expect(log.origin).toBe("check-service.ts");
        expect(log.createdAt).toBeInstanceOf(Date);
    });

    it("Should create a LogEntity instance from object", () => {
        const dataObj = {
            message: "Hola Mundo",
            level: LogSeverityLevel.high,
            origin: 'log.entity.test.ts',
        }

        const log = LogEntity.fromObject(dataObj);

        expect(log).toBeInstanceOf(LogEntity);
        expect(log.message).toBe("http://localhost:3000 is not ok. TypeError: fetch failed");
        expect(log.level).toBe(LogSeverityLevel.low);
        expect(log.origin).toBe("check-service.ts");
        expect(log.createdAt).toBeInstanceOf(Date);
    });
});
```

## 8. Pruebas en CheckService UseCase
1. Node\08-NOC\src\domain\use-cases\checks\check-service.test.ts
2. Los sujetos de prueba siempre se colocan en el nivel superior.

``` ts
import { describe, it, expect, beforeEach} from "@jest/globals";
import { CheckService } from './check-service';
import { LogEntity } from "../../entities/log-entity";

describe('CheckService UseCase', () => {
    const mockRepository = {
        saveLog: jest.fn(),
        getLogs: jest.fn(),
    }

    const successCallback = jest.fn();
    const errorCallback = jest.fn();

    const checkService = new CheckService(
        mockRepository,
        successCallback,
        errorCallback,
    );

    beforeEach(() => {
        jest.clearAllMocks();
    });

    it("Should call successCallback when fetch returns true", async ()=> {
        const wasOk = await checkService.execute('https://google.com')

        expect(wasOk).toBeTruthy();
        expect(successCallback).toHaveBeenCalled();
        expect(errorCallback).not.toHaveBeenCalled();

        expect(mockRepository.saveLog).toBeCalledWith(expect.any(LogEntity));
    });

    it("Should call errorCallback when fetch returns false", async ()=> {
        const wasOk = await checkService.execute('https://goodasdasdasdsagle')

        expect(wasOk).toBeFalsy();
        expect(successCallback).not.toHaveBeenCalled();
        expect(errorCallback).toHaveBeenCalled();

        expect(mockRepository.saveLog).toBeCalledWith(expect.any(LogEntity));
    });
});
```

## 9. Pruebas en SendEmailLogs UseCase
1. Node\08-NOC\src\domain\use-cases\email\send-email-logs.test.ts
- En este caso se tiene el email service, el cual no requiere de test ahora ya que se llegará a eso después.
- Solo importa que se mande a llamar lo que se desea.
2. Usar palabra reservada as para indicarle a TS que tome un determinado mock como si fuera de tipo EmailService o any de última opción. Esto permite no tener que implementar todo de esa clase para poder probar lo que interesa.
    - Usar any permite usar jest de @types/glboal

``` ts
import { describe, it, expect, jest } from "@jest/globals";
import { SendEmailLogs } from './send-email-logs';
import { LogEntity, LogSeverityLevel } from "../../entities/log-entity";
import { beforeEach } from "node:test";

describe('send-email-logs.ts', () => {

    const mockLogRepository = {
        saveLog: jest.fn(),
        getLogs: jest.fn(),
    }
    
    const emailService = {
        senEmailWithFileSystemLogs: jest.fn().mockReturnValue(true),
    }

    const sendEmailLogs = new SendEmailLogs(
        emailService as any,
        mockLogRepository as any,
    )

    beforeEach(() => {
        jest.clearAllMocks()
    })

    it('Should callsendEmail and saveLog', async () => {
        const wasOk = await sendEmailLogs.execute('test@google.com');

        expect(wasOk).toBeTruthy();
        expect(emailService.senEmailWithFileSystemLogs).toHaveBeenCalledTimes(1);
        expect(mockLogRepository.saveLog).toBeCalledWith(expect.any(LogEntity));
        expect(mockLogRepository.saveLog).toBeCalledWith({
            message: `Log email sent`,
            level: LogSeverityLevel.low,
            origin: 'send-email-logs.ts',
            createdAt: expect.any(Date)
        });
    });

    it('Should log in case of error', async () => {
        emailService.senEmailWithFileSystemLogs = jest.fn().mockReturnValue(false);
        const wasOk = await sendEmailLogs.execute('test@google.com');

        expect(wasOk).toBeFalsy();
        expect(emailService.senEmailWithFileSystemLogs).toHaveBeenCalledTimes(1);
        expect(mockLogRepository.saveLog).toBeCalledWith(expect.any(LogEntity));
        expect(mockLogRepository.saveLog).toBeCalledWith({
            message: `Error: Email log not send`,
            level: LogSeverityLevel.high,
            origin: 'send-email-logs.ts',
            createdAt: expect.any(Date)
        });
    });
});
```

## 10. Pruebas en MongoLogDatasource
1. Node\08-NOC\src\infrastructure\datasources\mongo-log.datasource.test.ts
- En este caso el caso de uso no retorna algo, por lo que se aprecia que se pudo haber hecho algo más para ayudar con el testeo como lo es el retorno de una instancia del log creado. Entonces, se va a probar el console log que se tiene, lo cual es bueno desde el punto de vista educativo pero en producción los console.logs no deben llegar.

``` ts
import { describe, it, expect, jest, beforeAll, afterAll, afterEach } from '@jest/globals';
import { MongoDatabase } from '../../data/mongo-set/init';
import { envs } from "../../config/plugins/envs.plugin";
import mongoose from 'mongoose';
import { MongoLogDatasource } from './mongo-log.datasource';
import { LogEntity, LogSeverityLevel } from '../../domain/entities/log-entity';
import { LogModel } from '../../data/mongo-set/models/log.model';

describe('mongo-log.datasource.ts', () => {

    const logDatasource = new MongoLogDatasource();

    
    const log = new LogEntity({
        message: `Mensaje desde test`,
        level: LogSeverityLevel.high,
        origin: 'mongo-log.datasource.test.ts'
    })

    beforeAll(async () => {
        await MongoDatabase.connect({
            dbName: envs.MONGO_DB_NAME,
            mongoUrl: envs.MONGO_URL
        })
    });

    afterEach(async () => {
        // Por esta razón la db debe ser diferente en testing.
        await LogModel.deleteMany();
    })

    afterAll(() => {
        mongoose.connection.close();
    })

    it('Should create a log', async () => {
        const logDatasource = new MongoLogDatasource();
        const logSpy = jest.spyOn(console, 'log');

        await logDatasource.saveLog(log);

        expect(logSpy).toHaveBeenCalled();
        expect(logSpy).toHaveBeenCalledWith('Mongo log created', expect.any(String));
    });

    it('Should get logs', async () => {
        await logDatasource.saveLog(log);
        const logs = await logDatasource.getLogs(LogSeverityLevel.high);
        
        expect(logs.length).toBe(1);
        expect(logs[0].level).toBe(LogSeverityLevel.high);
    });
});
```

## 11. Pruebas en FileSystemDatasource
- Para este caso se debe borrar la carpeta de logs para poder crearla por medio de testing.

``` ts
import { describe, it, expect, jest, beforeAll, afterAll, beforeEach } from '@jest/globals';
import fs from 'fs';
import path from 'path';
import { FileSystemDatasource } from './file-system.datasource';
import { LogEntity, LogSeverityLevel } from '../../domain/entities/log-entity';

describe('FileSystemDatasource', () => {
    const logPath = path.join(__dirname, '../../../logs');

    beforeEach(() => {
        fs.rmSync(logPath, {recursive: true, force: true});
    })

    it('Should create log files if they do not exist', () => {
        new FileSystemDatasource();
        const files = fs.readdirSync(logPath);
        expect(files).toEqual(['logs-all.log', 'logs-high.log', 'logs-medium.log']);
    });

    it('Should save a log in logs-all.log', () => {
        const logDatasource = new FileSystemDatasource();
        const log = new LogEntity({
            message: `test`,
            level: LogSeverityLevel.low,
            origin: 'file system test'
        })

        logDatasource.saveLog(log);
        const allLogs = fs.readFileSync(`${logPath}/logs-all.log`, 'utf-8');
        expect(allLogs).toContain(JSON.stringify(log));
    });

    it('Should save a log in logs-all.log and medium', () => {
        const logDatasource = new FileSystemDatasource();
        const log = new LogEntity({
            message: `test`,
            level: LogSeverityLevel.medium,
            origin: 'file system test'
        })

        logDatasource.saveLog(log);
        const allLogs = fs.readFileSync(`${logPath}/logs-all.log`, 'utf-8');
        const mediumLogs = fs.readFileSync(`${logPath}/logs-medium.log`, 'utf-8');
        expect(allLogs).toContain(JSON.stringify(log));
        expect(mediumLogs).toContain(JSON.stringify(log));
    });

    it('Should save a log in logs-all.log and logs-high.log', () => {
        const logDatasource = new FileSystemDatasource();
        const log = new LogEntity({
            message: `test`,
            level: LogSeverityLevel.high,
            origin: 'file system test'
        })

        logDatasource.saveLog(log);
        const allLogs = fs.readFileSync(`${logPath}/logs-all.log`, 'utf-8');
        const highLogs = fs.readFileSync(`${logPath}/logs-high.log`, 'utf-8');
        expect(allLogs).toContain(JSON.stringify(log));
        expect(highLogs).toContain(JSON.stringify(log));
    });

    it('Should return all logs', async () => {
        const logDatasource = new FileSystemDatasource();
        const logLow = new LogEntity({
            message: `test`,
            level: LogSeverityLevel.low,
            origin: 'low'
        })

        const logMedium = new LogEntity({
            message: `test`,
            level: LogSeverityLevel.medium,
            origin: 'medium'
        })

        const logHigh = new LogEntity({
            message: `test`,
            level: LogSeverityLevel.high,
            origin: 'high'
        })

        await logDatasource.saveLog(logLow);
        await logDatasource.saveLog(logMedium);
        await logDatasource.saveLog(logHigh);

        const logsLow = await logDatasource.getLogs(LogSeverityLevel.low);
        const logsMedium = await logDatasource.getLogs(LogSeverityLevel.medium);
        const logsHigh = await logDatasource.getLogs(LogSeverityLevel.high);

        expect(logsLow).toEqual(expect.arrayContaining([logLow, logMedium, logHigh]));
        expect(logsMedium).toEqual(expect.arrayContaining([logMedium]));
        expect(logsHigh).toEqual(expect.arrayContaining([logHigh]));
    });
});
```

## 12. Pruebas en LogRepositoryImpl
- La pruebas consisten en crar un datasource mock y probar que lo que se pasa como argumento haga que los métodos que se llamen sí hayan sido llamados con esos argumentos.

``` ts
import { describe, it, expect, jest, beforeAll, afterAll, beforeEach } from '@jest/globals';
import { LogRepositoryImpl } from './log.repository.impl';
import { LogDatasource } from '../../domain/datasources/log.datasource';
import { LogEntity, LogSeverityLevel } from '../../domain/entities/log-entity';

describe('LogRepositoryImpl', () => {

    const mockDatasource = {
        saveLog: jest.fn(),
        getLogs: jest.fn()
    }

    const logRepositoryImpl = new LogRepositoryImpl(mockDatasource as LogDatasource);

    const log = new LogEntity({
        message: `Log email sent`,
        level: LogSeverityLevel.low,
        origin: 'send-email-logs.ts'
    })

    beforeEach(() => {
        jest.clearAllMocks();
    })

    it('saveLog should call the datasource with arguments', async () => {
        await logRepositoryImpl.saveLog(log);
        expect(mockDatasource.saveLog).toHaveBeenCalledWith(log);
        expect(mockDatasource.saveLog).toHaveBeenCalledTimes(1);
    }); 

    it('getLogs should call the datasource with arguments', async () => {
        await logRepositoryImpl.getLogs(log.level);
        expect(mockDatasource.getLogs).toHaveBeenCalledWith(log.level);
        expect(mockDatasource.getLogs).toHaveBeenCalledTimes(1);
    }); 
});
```

## 13. Pruebas en CronService
- En este caso se debe comprobar que la tarea se ejecute la cantidad de veces dependiendo de lo que se le mande.
- Se utiliza done para código asíncrono en donde se le desea indicar a jest que se espere en la prueba.

``` ts
import { describe, it, expect, jest, beforeAll, afterAll, beforeEach } from '@jest/globals';
import { CronService } from './cron-service';

describe('CronService', () => {
    const mockTick = jest.fn();
    it('Should create a job', (done)=> {
        const job = CronService.createJob('* * * * *', mockTick);
        setTimeout(() => {
            expect(mockTick).toBeCalledTimes(2);
            job.stop();
            done();
        }, 2000);
    });
});
```

## 14. Pruebas con EmailService
- Esta sección es más compleja ya que a propósito se dejaron dependencias ocultas.
- Se va a probar que si se llama a sendEmail entonces que haya sido llamado con los argumentos que se esperan se envíen.
    - Por el momento no se van a enviar porque no se tiene configurado el .env.test
    - De modo educativo se hace de la forma complicada usando mocks en lugar de definir las variables de prueba en .env.test
- Se realiza mock a createTransport.

### Creación de mock para paquete
1. Se importa el paquete.
2. Se crea mock a createTransport.