import { characters } from "../../src/js-foundation/02-destructuring";

describe('js-foundation/02-destructuring.ts', ()=>{
    it('Characters should contain Flash, Superman',() => {
        expect(characters).toContain('Flash');
        expect(characters).toContain('Superman');
    });

    it('first character should be Flash, and second should be Superman', () => {
        const [flash, superman] = characters;

        expect(flash).toBe('Flash');
        expect(superman).toBe('Superman');
    });
});