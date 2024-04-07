import { describe, it, expect } from "@jest/globals";
import { LogEntity, LogSeverityLevel } from "./log-entity";

describe("LogEntity", () => {
    it('Should create a LogEntity instance', () => {

        const dataObj = {
            message: "Hola Mundo",
            level: LogSeverityLevel.high,
            origin: 'log.entity.test.ts',
        }

        const log = new LogEntity(dataObj);

        expect(log).toBeInstanceOf(LogEntity);
        expect(log.message).toBe(dataObj.message);
        expect(log.level).toBe(dataObj.level);
        expect(log.origin).toBe(dataObj.origin);
        expect(log.createdAt).toBeInstanceOf(Date);
    });

    it("Should crate a LogEntity instance from json", () => {
        const json = `{"message":"http://localhost:3000 is not ok. TypeError: fetch failed","level":"high","createdAt":"2024-04-03T02:07:50.057Z","origin":"check-service.ts"}`

        const log = LogEntity.fromJson(json);

        expect(log).toBeInstanceOf(LogEntity);
        expect(log.message).toBe("http://localhost:3000 is not ok. TypeError: fetch failed");
        expect(log.level).toBe(LogSeverityLevel.high);
        expect(log.origin).toBe("check-service.ts");
        expect(log.createdAt).toBeInstanceOf(Date);
    });

    it("Should create a LogEntity instance from object", () => {
        const dataObj = {
            message: "Hola Mundo",
            level: LogSeverityLevel.high,
            origin: 'log.entity.test.ts',
        }

        const log = LogEntity.fromObject(dataObj);

        expect(log).toBeInstanceOf(LogEntity);
        expect(log.message).toBe("Hola Mundo");
        expect(log.level).toBe(LogSeverityLevel.high);
        expect(log.origin).toBe("log.entity.test.ts");
        expect(log.createdAt).toBeInstanceOf(Date);
    });
});