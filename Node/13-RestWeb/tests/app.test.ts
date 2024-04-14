import {describe, it, jest, expect} from '@jest/globals';
import { Server } from "../src/presentation/server";
import { envs } from '../src/config/envs';

jest.mock('../src/presentation/server');

describe("App.ts",  ()=>{
    it("Should call server start with arguments", async () => {
        await import('../src/app');
        expect(Server).toHaveBeenCalledTimes(1);
        expect(Server).toHaveBeenCalledWith({
            port: envs.PORT,
            public_path: envs.PUBLIC_PATH,
            routes: expect.any(Function)
        });

        expect(Server.prototype.start).toHaveBeenCalledWith();
    });
})