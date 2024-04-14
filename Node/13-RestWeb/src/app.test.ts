import {describe, it, jest, expect} from '@jest/globals';
import { Server } from "./presentation/server";
import { envs } from './config/envs';

jest.mock('./presentation/server');

describe("App.ts",  ()=>{
    it("Should call server start with arguments", async () => {
        await import('./app');
        expect(Server).toHaveBeenCalledTimes(1);
        expect(Server).toHaveBeenCalledWith({
            port: envs.PORT,
            public_path: envs.PUBLIC_PATH,
            routes: expect.any(Function)
        });

        expect(Server.prototype.start).toHaveBeenCalledWith();
    });
})