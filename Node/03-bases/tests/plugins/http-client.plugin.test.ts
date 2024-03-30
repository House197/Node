import { httpClientPlugin } from '../../src/plugins/http-client.plugin';
import { describe, expect, it } from '@jest/globals';

describe('js-foundation/http-client.plugin.test.ts', () => {
    it('httpClientPlugin should return a string', async () => {
        const data = await httpClientPlugin.get('https://jsonplaceholder.typicode.com/todos/1');

        expect(data).toEqual({
            "userId": 1,
            "id": 1,
            "title": "delectus aut autem",
            "completed": expect.any(Boolean)
            });
    });

    it('httpClientPlugin should have POST, PUT and Delete methods', async () => {
        expect(typeof httpClientPlugin.post).toBe('function');
        expect(typeof httpClientPlugin.put).toBe('function');
        expect(typeof httpClientPlugin.delete).toBe('function');
    });
});