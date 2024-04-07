import { LogEntity, LogSeverityLevel } from '../../entities/log-entity';
import { LogRepository } from '../../repositories/log.repository';
import { describe, it, expect, beforeEach } from "@jest/globals";
import { CheckServiceMultiple } from './check-service-multiple';

describe('check-service-multiple.test.ts', () => {
    const mockRepository1 = {
        saveLog: jest.fn(),
        getLogs: jest.fn(),
    }

    const mockRepository2 = {
        saveLog: jest.fn(),
        getLogs: jest.fn(),
    }

    const mockRepository3 = {
        saveLog: jest.fn(),
        getLogs: jest.fn(),
    }

    const logRepositories = [
        mockRepository1, mockRepository2, mockRepository3
    ]

    const successCallback = jest.fn();
    const errorCallback = jest.fn();

    const checkMultipleService = new CheckServiceMultiple(logRepositories, successCallback, errorCallback);

    beforeEach(() => {
        jest.clearAllMocks();
    })

    it("Should call successCallback when fetch returns true", async ()=> {
        const wasOk = await checkMultipleService.execute('https://google.com')

        expect(wasOk).toBeTruthy();
        expect(successCallback).toHaveBeenCalled();
        expect(errorCallback).not.toHaveBeenCalled();

        expect(mockRepository1.saveLog).toBeCalledWith(expect.any(LogEntity));
        expect(mockRepository2.saveLog).toBeCalledWith(expect.any(LogEntity));
        expect(mockRepository3.saveLog).toBeCalledWith(expect.any(LogEntity));
    });

    it("Should call errorCallback when fetch returns false", async ()=> {
        const wasOk = await checkMultipleService
        .execute('https://goodasdasdasdsagle')

        expect(wasOk).toBeFalsy();
        expect(successCallback).not.toHaveBeenCalled();
        expect(errorCallback).toHaveBeenCalled();

        expect(mockRepository1.saveLog).toBeCalledWith(expect.any(LogEntity));
        expect(mockRepository2.saveLog).toBeCalledWith(expect.any(LogEntity));
        expect(mockRepository3.saveLog).toBeCalledWith(expect.any(LogEntity));
    });
});