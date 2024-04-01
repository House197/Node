import { expect, describe, it, jest  } from '@jest/globals';
import { SaveFile } from './save-file.use-case';
import fs from 'fs';
import { afterEach } from 'node:test';

describe("SaveFileUseCase", () => {

    const customOptions = {
        fileContent: 'custom content',
        destination: 'custom-outputs',
        fileName: 'custom-table-name',
    };

    const customFilePath = `${customOptions.destination}/${customOptions.fileName}.txt`

    afterEach(() => {
        const outputFolderExists = fs.existsSync('outputs');
        if(outputFolderExists) fs.rmSync('outputs', {recursive:true});

        const customOutputFolderExists = fs.existsSync(customOptions.destination);
        if(customOutputFolderExists) fs.rmSync(customOptions.destination, {recursive:true});
    });

    it("Should save file with default values", () => {
        const saveFile = new SaveFile();
        const filePath = 'outputs/table.txt'
        const options = {
            fileContent: 'test content'
        }

        const result = saveFile.execute(options);
        const fileExists = fs.existsSync(filePath);
        const fileContent = fs.readFileSync(filePath, {encoding: 'utf-8'});

        expect(result).toBe(true);
        expect(fileExists).toBe(true);
        expect(fileContent).toBe(options.fileContent);

    });

    it("Should save file with custom values", () => {
        const saveFile = new SaveFile();

        const result = saveFile.execute(customOptions);
        const fileExists = fs.existsSync(customFilePath);
        const fileContent = fs.readFileSync(customFilePath, {encoding: 'utf-8'});

        expect(result).toBe(true);
        expect(fileExists).toBe(true);
        expect(fileContent).toBe(customOptions.fileContent);
    });

    it("Should return false if directory could not be created", () => {
        const saveFile = new SaveFile();
        const mkdirSpy = jest.spyOn(fs, 'mkdirSync').mockImplementation(
            () => {throw new Error('Custom error from testing');}
        );

        const result = saveFile.execute(customOptions);

        expect(result).toBe(false);

        mkdirSpy.mockRestore();
    });

    it("Should return false if file could not be written", () => {
        const saveFile = new SaveFile();
        const writeFileSpy = jest.spyOn(fs, 'writeFileSync').mockImplementation(
            () => {throw new Error('Custom file writing error from testing');}
        );

        const result = saveFile.execute(customOptions);

        expect(result).toBe(false);

        writeFileSpy.mockRestore();
    });
});