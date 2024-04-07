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
            expect(error).toEqual({'EnvVarError': {'env-var': `"PORT" should be a valid integer`}}); 
        }

    })
})