import { CreateTable } from './create-table.use-case';
import { expect, describe, it  } from '@jest/globals';

describe("CreateTableUseCase", ()=>{
    it('Sould create table with default values', () =>{
        const createTable = new CreateTable();

        const table = createTable.execute({base: 2});
        const rows = table.split('\n');

        expect(createTable).toBeInstanceOf(CreateTable);
        expect(table).toContain('2 x 1 = 2');
        expect(table).toContain('2 x 10 = 20');
        expect(rows.length).toBe(10);
    });

    it('Should create table with custom values', () => {
        const createTable = new CreateTable();
        const options = {
            base: 3,
            limit: 5,
        }

        const table = createTable.execute(options);
        const rows = table.split('\n').length;

        expect(table).toContain('3 x 1 = 3');
        expect(table).toContain('3 x 5 = 15');
        expect(rows).toBe(options.limit);
    });
});