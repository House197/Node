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