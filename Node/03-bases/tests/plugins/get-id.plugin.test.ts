import { getUUID } from "../../src/plugins";

describe('js-foundation/get-id.plugin.test.ts', () => {
    it('getAge should return a UUID', () => {
        const uuid = getUUID();

        expect(typeof uuid).toBe('string');
        expect(uuid.length).toBe(36);
    });
});