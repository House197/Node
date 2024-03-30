import { buildMakePerson } from "../../src/js-foundation/05-factory";

describe('js-foundation/05-factory.ts', () => {
    const getUUID = () => '1234';
    const getAge = () => 35;
    it('Should return a function', () => {
        const makePerson = buildMakePerson({getUUID, getAge});

        expect(typeof makePerson).toBe('function');
    });

    it('Should return a person', () => {
        const makePerson = buildMakePerson({getUUID, getAge});
        const john = makePerson({name: 'John', birthdate: '1985-10-21'});
        expect(john).toEqual({ id: '1234', name: 'John', birthdate: '1985-10-21', age: 35 });
    });
});