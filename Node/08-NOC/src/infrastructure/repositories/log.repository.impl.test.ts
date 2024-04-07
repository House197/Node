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