import { getAge } from "../../src/plugins";

describe('js-foundation/get-age.plugin.test.ts', () => {
    it('getAge should return a number', () => {
        const birthdate = '1997-11-11';
        const age = getAge(birthdate);

        expect(typeof age).toBe('number');
    });

    it('getAge should return current age', () => {
        const birthdate = '1997-11-11';
        const age = getAge(birthdate);

        const calculatedAge = new Date().getFullYear() - new Date(birthdate).getFullYear();

        expect(age).toBe(calculatedAge);
    });

    it('getAge should return 0 years', () => {
        const spy = jest.spyOn(Date.prototype, 'getFullYear').mockReturnValue(1997);
        const birthdate = '1997-11-11';
        const age = getAge(birthdate);

        expect(age).toBe(0);
        expect(spy).toHaveBeenCalled();

    });
});