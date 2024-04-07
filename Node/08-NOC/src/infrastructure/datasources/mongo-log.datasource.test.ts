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