import { fitnessZod } from './fitness-zod';

describe('fitnessZod', () => {
    it('should work', () => {
        expect(fitnessZod()).toEqual('@ptgt/fitness-zod');
    });
});
