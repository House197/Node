import { describe, it, expect, jest, beforeAll, afterAll, beforeEach } from '@jest/globals';
import { CronService } from './cron-service';

describe('CronService', () => {
    const mockTick = jest.fn();
    it('Should create a job', (done)=> {
        const job = CronService.createJob('* * * * * *', mockTick);
        setTimeout(() => {
            expect(mockTick).toBeCalledTimes(2);
            job.stop();
            done();
        }, 2000);
    });
});