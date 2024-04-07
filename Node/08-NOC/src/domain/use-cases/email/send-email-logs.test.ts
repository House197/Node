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
            message: `Error: Email log not sent`,
            level: LogSeverityLevel.high,
            origin: 'send-email-logs.ts',
            createdAt: expect.any(Date)
        });
    });
});