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