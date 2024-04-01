import { expect, describe, it, jest, beforeEach  } from '@jest/globals';

const runCommand = async(args: string[]) => {
    process.argv = [...process.argv, ...args]

    const { yarg } = await import('./args.plugin');
    return yarg;
}

describe("Test args.plugin.ts", () => {

    const originalArgv = process.argv;

    beforeEach(() => {
        process.argv = originalArgv;
        jest.resetModules();
    });

    it("Should return default values", async () => {
        const argv = await runCommand(['-b', '5']);

        expect(argv).toEqual( expect.objectContaining({
            b: 5,
            l: 10,
            s: false,
            n: 'multiplication-table',
            d: './outputs',
        }));
    });

    it("Should return configuration with custom values", async () => {
        const argv = await runCommand(['-b', '10', '-l', '5', '-s', 'true', '-n', 'testing table', '-d', 'test-output']);
        expect(argv).toEqual( expect.objectContaining({
            b: 10,
            l: 5,
            s: true,
            n: 'testing table',
            d: 'test-output',
        }));
    });
});
