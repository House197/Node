import { describe, it, expect, beforeEach, jest} from "@jest/globals";
import { CheckService } from './check-service';
import { LogEntity } from "../../entities/log-entity";

describe('CheckService UseCase', () => {
    const mockRepository = {
        saveLog: jest.fn(),
        getLogs: jest.fn(),
    }

    const successCallback = jest.fn();
    const errorCallback = jest.fn();

    const checkService = new CheckService(
        mockRepository as any,
        successCallback,
        errorCallback,
    );

    beforeEach(() => {
        jest.clearAllMocks();
    });

    it("Should call successCallback when fetch returns true", async ()=> {
        const wasOk = await checkService.execute('https://google.com')

        expect(wasOk).toBeTruthy();
        expect(successCallback).toHaveBeenCalled();
        expect(errorCallback).not.toHaveBeenCalled();

        expect(mockRepository.saveLog).toBeCalledWith(expect.any(LogEntity));
    });

    it("Should call errorCallback when fetch returns false", async ()=> {
        const wasOk = await checkService.execute('https://goodasdasdasdsagle')

        expect(wasOk).toBeFalsy();
        expect(successCallback).not.toHaveBeenCalled();
        expect(errorCallback).toHaveBeenCalled();

        expect(mockRepository.saveLog).toBeCalledWith(expect.any(LogEntity));
    });
});