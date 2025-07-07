import {
    Author,
    Creator,
    TrainingCenterDatabase,
    Position,
    HeartRateBpm,
    Lap,
    Activities,
    Trackpoint,
    GarminTcxDocument,
} from './lib/garmin-zod';
import {
    PolarActivity,
    PolarLap,
    PolarTrackpoint,
    PolarTcxDocument,
} from './lib/polar-zod';
import { SpeedDistanceConfig, LatLonAlt, LatLonAltRad } from './lib/interface';

// TODO would rather use barrel exports lol, change once we figure out ts compilation issues
export {
    Position,
    PolarActivity,
    PolarLap,
    PolarTrackpoint,
    HeartRateBpm,
    Lap,
    Activities,
    Trackpoint,
    SpeedDistanceConfig,
    PolarTcxDocument,
    GarminTcxDocument,
    Author,
    Creator,
    TrainingCenterDatabase,
    LatLonAlt,
    LatLonAltRad,
};
