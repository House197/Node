import { describe, it, expect } from "@jest/globals";
import { ServerApp } from "./presentation/server-app";

describe("App.ts", () => {
    it("Should call Server.run with value", async () => {
        const serverRunMock = jest.fn();
        ServerApp.run = serverRunMock;
        process.argv = ['node', 'app.ts', '-b','10','-l','5','-s','-n','test-file','-d','test-path'];

        await import('./app');

        expect(serverRunMock).toHaveBeenCalledWith({
            base: 10,
            limit: 5,
            showTable: true,
            name: 'test-file',
            destination: 'test-path'
        });
    });
});