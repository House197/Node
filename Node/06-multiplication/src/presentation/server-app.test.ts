import { expect, describe, it } from '@jest/globals';
import { ServerApp } from './server-app';
import { CreateTable } from '../domain/use-cases/create-table.use-case';
import { SaveFile } from '../domain/use-cases/save-file.use-case';
import { beforeEach } from 'node:test';

describe("Server App", () => {

    const options = {
        base: 3,
        limit: 3,
        showTable: false,
        destination: 'test-destination',
        name: 'test-filename'
    };

    beforeEach(() => {
        jest.clearAllMocks();
    });

    it("Should create ServerApp instance", () => {
        const serverApp = new ServerApp();

        expect(serverApp).toBeInstanceOf(ServerApp);
        expect(typeof ServerApp.run).toBe('function')
    });

    it("Should run ServerApp with options", () => {

        const logSpy = jest.spyOn(console, 'log');
        const createTableSpy = jest.spyOn(CreateTable.prototype, 'execute');
        const saveFileSpy = jest.spyOn(SaveFile.prototype, 'execute');

        ServerApp.run(options);

        expect(logSpy).toHaveBeenCalledTimes(2);
        expect(logSpy).toHaveBeenCalledWith('Server running...');
        expect(logSpy).toHaveBeenLastCalledWith('File created');

        expect(createTableSpy).toHaveBeenCalledTimes(1);
        expect(createTableSpy).toHaveBeenCalledWith({
            base: options.base, limit: options.limit
        });

        expect(saveFileSpy).toHaveBeenCalledTimes(1);
        expect(saveFileSpy).toHaveBeenCalledWith({
            fileContent: expect.any(String), fileName: options.name, destination: options.destination
        });

    });

    it("Should run ServerApp with custom values mocks", () => {

        const logMock = jest.fn();
        const logErrorMock = jest.fn();
        const createMock   = jest.fn().mockReturnValue('3 x 1 = 3');
        const saveFileMock = jest.fn().mockReturnValue(false);
    
        console.log = logMock;
        console.error = logErrorMock;
        CreateTable.prototype.execute = createMock;
        SaveFile.prototype.execute = saveFileMock;
    
    
        ServerApp.run(options);
    
        expect( logMock ).toHaveBeenCalledWith('Server running...');
        expect( createMock ).toHaveBeenCalledWith({"base": options.base, "limit": options.limit });
        expect( saveFileMock ).toHaveBeenCalledWith({
          fileContent: '3 x 1 = 3',
          destination: options.destination,
          fileName: options.name,
        });
        // expect( logMock ).toHaveBeenCalledWith('File created!');
        expect( logErrorMock ).not.toBeCalledWith();
    
    });
});