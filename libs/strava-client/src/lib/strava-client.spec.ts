import { stravaClient } from './strava-client';

describe('stravaClient', () => {
    it('should work', () => {
        expect(stravaClient()).toEqual('strava-client');
    });
});
