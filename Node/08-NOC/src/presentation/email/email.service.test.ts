import { describe, it, expect, beforeAll, afterAll, beforeEach } from '@jest/globals';
import { EmailService, SendEmailOptions } from './email.service';
import nodemailer, { SentMessageInfo, Transporter } from 'nodemailer';

describe('EmailService', () => {

    const emailService = new EmailService();

    const options: SendEmailOptions  = {
        to: 'houser@gmail.com',
        subject: 'Test',
        htmlBody: '<h1>Test</h1>',
        attachments: []
    }


    const mockSendMail = jest.fn() as unknown as Transporter<SentMessageInfo>;

    // Mock de createTransport
    nodemailer.createTransport = jest.fn().mockReturnValue({
        sendMail: mockSendMail
    });

    it('Should send email', async () => {

        await emailService.sendEmail(options);

        expect(mockSendMail).toHaveBeenCalledWith({
            to: 'houser@gmail.com',
            subject: 'Test',
            html: '<h1>Test</h1>',
            attachments: [],
        })
    });

    it('Should send email with attachements', async () => {
        const email = 'houser@gmail.com'

        await emailService.senEmailWithFileSystemLogs(email);

        expect(mockSendMail).toHaveBeenCalledWith({
            to: email,
            subject: 'Logs del servidor',
            html: expect.any(String),
            attachments: expect.arrayContaining([            {filename: 'logs-all.log', path: './logs/logs-all.log'},
            {filename: 'logs-medium.log', path: './logs/logs-medium.log'},
            {filename: 'logs-high.log', path: './logs/logs-high.log'}]),
        })
    });
});