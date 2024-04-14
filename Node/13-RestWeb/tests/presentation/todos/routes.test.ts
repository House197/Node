import {describe, it, jest, expect, beforeAll, afterAll, beforeEach} from '@jest/globals';
import request from 'supertest';
import { testServer } from '../../test-server';
import { prisma } from '../../../src/data/postgres';

describe('Todo route testing', () => {
    beforeAll(async () => {
        await testServer.start();
    });

    beforeEach(async () => {
        await prisma.todo.deleteMany();
    })

    afterAll(() => {
        testServer.close();
    });

    const todo1 = {text: 'Hola mundo 1'};
    const todo2 = {text: 'Hola mundo 2'};

    it('Should return TODOs api/todos', async () => {
        await prisma.todo.createMany({
            data: [todo1, todo2]
        })

        const {body} = await request(testServer.app)
            .get('/api/todos')
            .expect(200);
        expect(body).toBeInstanceOf(Array);
        expect(body.length).toBe(2);
        expect(body[0].text).toBe(todo1.text);
        expect(body[1].text).toBe(todo2.text);
    });

    it('Should return a TODO api/todos/:id', async () => {
        const todo = await prisma.todo.create({data: todo1});
        const { body } = await request(testServer.app)
            .get(`/api/todos/${todo.id}`)
            .expect(200);

        expect(body).toEqual({
            id: todo.id,
            text: todo.text,
            completedAt: todo.completedAt,
        })
    });

    it('Should return a 404 NotFound api/todos/:id', async () => {
        const { body } = await request(testServer.app)
        .get(`/api/todos/9999`)
        .expect(404);

        expect(body).toEqual({
            error: 'TODO with id 9999 not found'
        });
    });

    it('Should return a new Todo api/todos', async () => {
        const { body } = await request(testServer.app)
        .post(`/api/todos`)
        .send(todo1)
        .expect(201);

        expect(body).toEqual({
            id: expect.any(Number),
            text: todo1.text,
            completedAt: null
        });
    });

    it('Should return an error if text is present Todo api/todos', async () => {
        const { body } = await request(testServer.app)
        .post(`/api/todos`)
        .send({})
        .expect(400);

        expect(body).toEqual({
            error: 'Text property is required'
        });
    });

    it('Should return an error if text is empty Todo api/todos', async () => {
        const { body } = await request(testServer.app)
        .post(`/api/todos`)
        .send({text: ''})
        .expect(400);

        expect(body).toEqual({
            error: 'Text property is required'
        });
    });

    it('Should return an updated Todo api/todos/:id', async () => {
        const todo = await prisma.todo.create({data: todo1});

        const { body } = await request(testServer.app)
        .put(`/api/todos/${todo.id}`)
        .send({text: 'Hola mundo updated', completedAt: '2024-04-04'})
        .expect(200);

        console.log(body)

        expect(body).toEqual({
            id: expect.any(Number),
            text: 'Hola mundo updated',
            completedAt: '2024-04-04T00:00:00.000Z'
        });
    });
    // TODO: Realizar la operación con errores personalizados
    it('Should return 404 if TODO not found api/todos/:id', async () => {
        const todoId = 9999;
        const { body } = await request(testServer.app)
        .put(`/api/todos/${todoId}`)
        .send({text: 'Hola mundo updated', completedAt: '2024-04-04'})
        .expect(404);
        console.log(body)
        expect(body).toEqual({
            error: `TODO with id ${todoId} not found`
        });
    });

    it('Should return an updated TODO only the date api/todos/:id', async () => {
        const todo = await prisma.todo.create({data: todo1});

        const { body } = await request(testServer.app)
        .put(`/api/todos/${todo.id}`)
        .send({completedAt: '2024-04-05'})
        .expect(200);

        expect(body).toEqual({
            id: expect.any(Number),
            text: todo1.text,
            completedAt: '2024-04-05T00:00:00.000Z'
        })
    });

    it('Should delete a TODO api/todos/:id', async () => {
        const todo = await prisma.todo.create({data: todo1});

        const { body } = await request(testServer.app)
        .delete(`/api/todos/${todo.id}`)
        .expect(200);

        expect(body).toEqual({
            id: expect.any(Number),
            text: todo1.text,
            completedAt: null
        })
    });

    it('Should return 404 if TODO does not exist api/todos/:id', async () => {
        const todoId = 9999;
        const { body } = await request(testServer.app)
        .delete(`/api/todos/${todoId}`)
        .expect(404);

        expect(body).toEqual({
            error: `TODO with id ${todoId} not found`
        })
    });
    
});