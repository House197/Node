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