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