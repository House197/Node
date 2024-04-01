import fs from 'fs';
export interface SaveFileUseCase {
    execute: (options: Options) => boolean;
}

export interface Options {
    fileContent: string;
    destination?: string;
    fileName?: string;
}

export class SaveFile implements SaveFileUseCase {
    constructor(
        /** repository: StorageRepository */
    ){ }

    execute({fileContent, fileName = 'table', destination = 'outputs'}: Options): boolean {
        try {
            fs.mkdirSync(destination, {recursive: true});
            fs.writeFileSync(`${destination}/${fileName}.txt`, fileContent);
            return true;
        } catch (error) {
            console.log(error);
            return false;
        }
    };
}