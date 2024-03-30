import { getPokemonById } from "../../src/js-foundation/06-promises";

describe('js-foundation/06-promises.ts', () => {
    it('getPokemonById should return a pokemon', async () => {
        const pokemonId = 1;
        const pokemon = await getPokemonById(pokemonId);

        expect(pokemon).toBe('bulbasaur');
    });

    it('Should return an error if pokemon does not exist', async () => {
        const pokemonId = 10000000;
        try {
            await getPokemonById(pokemonId);
            // Se coloca un expect que nunca va a suceder.
            expect(true).toBeFalsy();
        } catch (error) {
            expect(error).toBe(`Pokemon not found with id ${pokemonId}`);
        }

    });
});