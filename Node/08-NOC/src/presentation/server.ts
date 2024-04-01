import { CheckService } from "../domain/use-cases/checks/check-service";
import { SendEmailLogs } from "../domain/use-cases/email/send-email-logs";
import { FileSystemDatasource } from "../infrastructure/datasources/file-system.datasource";
import { MongoLogDatasource } from "../infrastructure/datasources/mongo-log.datasource";
import { LogRepositoryImpl } from "../infrastructure/repositories/log.repository.impl";
import { CronService } from "./cron/cron-service";
import { EmailService } from './email/email.service';

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