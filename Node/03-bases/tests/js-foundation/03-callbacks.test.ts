import { getUserById } from "../../src/js-foundation/03-callbacks";

describe('js-foundation/03-callback.ts', ()=>{
    it('getUserById should return an error if user does not exits', (done) => {
        const id = 10;
        getUserById(id, (err, user) => {
            expect(err).toBe(`User not found with id ${id}`);
            expect(user).toBeUndefined();
            done();
        });
    });

    it('getUserById return John Doe if id is 2', () => {
        const id = 2;
        getUserById(id, (err, user) => {
            expect(err).toBeUndefined();
            expect(user).toStrictEqual(  {
                id: 2,
                name: 'Jane Doe',
              });
        })
    });
});