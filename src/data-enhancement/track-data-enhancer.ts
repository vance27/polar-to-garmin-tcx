import {
    Position,
    HeartRateBpm,
    Lap,
    Activities,
    Trackpoint,
} from '../types/garmin-zod.js';
import { SpeedDistanceConfig } from '../types/interface.js';
import {
    PolarLap,
    PolarActivity,
    PolarTrackpoint,
} from '../types/polar-zod.js';
import { enhanceTrackDataWithSpeedDistanceAdv } from './advanced-distance.js';
import {
    defaultGarminCreator,
    defaultLatLonAltRad,
    defaultSpeedDistanceConfig,
} from './defaults.js';

export function interpolateTime(index: number, totalPoints: number): string {
    const baseTime = new Date();
    const intervalSeconds = 1; // 1 second intervals
    return new Date(
        baseTime.getTime() + index * intervalSeconds * 1000
    ).toISOString();
}

export function interpolatePosition(
    index: number,
    totalPoints: number
): Position {
    const { lat, lon, radius } = defaultLatLonAltRad;
    const angle = (index / totalPoints) * 2 * Math.PI;

    return {
        LatitudeDegrees: lat + radius * Math.sin(angle),
        LongitudeDegrees: lon + radius * Math.cos(angle),
    };
}

export function interpolateAltitude(index: number): number {
    // Create gentle elevation changes
    const variation = 0.1 * Math.sin(index * 0.1);
    return defaultLatLonAltRad.altitude + variation;
}

export function interpolateDistance(
    index: number,
    totalPoints: number
): number {
    // Approximate distance based on position
    const avgSpeed = 3.0; // meters per second
    return index * avgSpeed;
}

export function interpolateHeartRate(index: number): HeartRateBpm {
    // Create realistic heart rate variation
    // TODO should allow a base HR config
    const baseHR = 140;
    const variation = 20 * Math.sin(index * 0.05) + (Math.random() - 0.5) * 10;
    const maxHr =
        process.env.MAX_HR?.trim() && isFinite(Number(process.env.MAX_HR))
            ? Number(process.env.MAX_HR)
            : 200;

    return {
        Value: Math.max(60, Math.min(maxHr, Math.round(baseHR + variation))),
    };
}

export function calculateSpeedFromHR(
    hr: number,
    config: SpeedDistanceConfig
): number {
    // If HR is below floor, assume not running (sideline)
    if (hr < config.floorHR) {
        // return 0;
        return Math.random() * (0.06 - 0.01) + 0.01;
    }

    // Calculate HR intensity as percentage between floor and max
    const hrRange = config.maxHR - config.floorHR;
    const hrIntensity = Math.max(
        0,
        Math.min(1, (hr - config.floorHR) / hrRange)
    );

    // Use exponential curve for more realistic speed mapping
    // Lower HR = walking/jogging, higher HR = running/sprinting
    const baseSpeed =
        config.minActiveSpeed +
        (config.maxSpeed - config.minActiveSpeed) * Math.pow(hrIntensity, 1.5);

    // Add some variability to make it more realistic
    const variability = 1 + (Math.random() - 0.5) * config.speedVariability;

    return Math.max(0, baseSpeed * variability);
}

function distributeDistanceAcrossLaps(
    laps: any[],
    totalDistance: number
): number[] {
    // Calculate relative activity levels for each lap based on average HR
    const lapActivityLevels = laps.map((lap) => {
        const trackPoints = Array.isArray(lap.Track) ? lap.Track : [lap.Track];
        const avgHR =
            trackPoints.reduce((sum, tp) => {
                const hr = tp?.HeartRateBpm?.Value || 0;
                return sum + hr;
            }, 0) / trackPoints.length;

        // Higher HR = more distance allocation
        return Math.max(0, avgHR - 60); // Assuming 60 as baseline resting HR
    });

    const totalActivity = lapActivityLevels.reduce(
        (sum, level) => sum + level,
        0
    );

    // If no activity detected, distribute evenly
    if (totalActivity === 0) {
        return laps.map(() => totalDistance / laps.length);
    }

    // Distribute distance proportionally based on activity
    return lapActivityLevels.map(
        (level) => (level / totalActivity) * totalDistance
    );
}

// Calculate speeds for each Trackpoint
// Calculate time intervals and distances
export function enhanceTrackDataWithSpeedDistance(
    trackpoints: PolarTrackpoint[],
    targetLapDistance: number
): Trackpoint[] {
    let cumulativeDistance = 0;

    const enhancedPoints = trackpoints.map((tp, index) => {
        const hr = tp?.HeartRateBpm?.Value || 0;
        const speed = calculateSpeedFromHR(hr, defaultSpeedDistanceConfig);
        // Assume 1 second intervals if no time data available
        const timeInterval = 1; // seconds // TODO see if timeinterval comes from data rather than defaulting
        const distanceIncrement =
            index > 0 && speed > 0 ? speed * timeInterval : 0;

        cumulativeDistance += distanceIncrement;

        return {
            ...tp,
            // TODO added position
            // Position:
            //     tp.Position || interpolatePosition(index, trackpoints.length), // TODO position needs to based on distance relative to the last point rather than random.
            AltitudeMeters: tp.AltitudeMeters || interpolateAltitude(index), // TODO added altitude
            // HeartRateBpm: tp.HeartRateBpm || interpolateHeartRate(index), // TODO shouldn't need
            // Time: tp.Time || interpolateTime(index, trackpoints.length), // TODO shouldn't need

            DistanceMeters: cumulativeDistance,
            Extensions: {
                'ns3:TPX': {
                    '@_xmlns:ns3':
                        'http://www.garmin.com/xmlschemas/ActivityExtension/v2',
                    'ns3:Speed': String(speed), // Random speed variation
                    // "ns3:Watts": Math.round(200 + Math.random() * 100), // Power data // TODO no power data with garmin forerunner 645 music
                    'ns3:CadenceRPM':
                        speed > 0 ? Math.round(75 + speed * 5) : 0, // Rough cadence estimation
                },
            },
        };
    });

    // Scale distances to match target lap distance
    const actualDistance = cumulativeDistance;

    // ScaleFactor is 1 (no scale) if actual distance or target distance are <= 0
    const scaleFactor =
        actualDistance > 0 && targetLapDistance > 0
            ? targetLapDistance / actualDistance
            : 1;

    return enhancedPoints.map((tp) => ({
        ...tp,
        DistanceMeters: tp.DistanceMeters * scaleFactor,
        Extensions: {
            ...tp.Extensions,
            'ns3:TPX': {
                ...tp.Extensions['ns3:TPX'],
                'ns3:Speed': String(
                    Number(tp.Extensions['ns3:TPX']['ns3:Speed']) * scaleFactor
                ), // Scale speed proportionally
            },
        },
    }));
}

export function transformLap(laps: PolarLap | PolarLap[]): Lap[] {
    // Create array of laps depending on input
    const lapArray = Array.isArray(laps) ? laps : [laps];

    // Get the total distance or default to 6 miles
    const totalDistance = process.env.DISTANCE
        ? Number(process.env.DISTANCE) * 1609.344 // TODO need to access this value safer
        : 9656.06;

    const lapDistances = distributeDistanceAcrossLaps(lapArray, totalDistance);

    return lapArray.map((lap: PolarLap, index: number) => {
        const trackPoints = lap.Track.Trackpoint;
        const targetLapDistance = lapDistances[index];

        // Enhance track data with realistic speed and distance
        const enhancedTrackData = enhanceTrackDataWithSpeedDistanceAdv(
            trackPoints,
            targetLapDistance
        );

        // Calculate lap statistics
        const speeds = enhancedTrackData
            .map((tp) => Number(tp.Extensions?.['ns3:TPX']['ns3:Speed']))
            .filter((s) => s !== undefined)
            .filter((s) => s > 0);

        const maxSpeed = speeds.length > 0 ? Math.max(...speeds) : 0;
        const avgCadence =
            enhancedTrackData.reduce((sum, tp) => sum + (tp.Cadence || 0), 0) /
            enhancedTrackData.length;

        return {
            DistanceMeters: targetLapDistance,
            Cadence: Math.round(avgCadence),
            Track: {
                Trackpoint: enhancedTrackData,
            },
            TotalTimeSeconds: lap.TotalTimeSeconds || enhancedTrackData.length, // Trackpoint length
            MaximumSpeed: maxSpeed,
            Calories: lap.Calories || Math.round(targetLapDistance * 0.05), // Rough calorie estimate
            AverageHeartRateBpm: lap.AverageHeartRateBpm || { Value: 0 },
            MaximumHeartRateBpm: lap.MaximumHeartRateBpm || { Value: 0 },
            Intensity: lap.Intensity || 'Active',
            TriggerMethod: lap.TriggerMethod || 'Manual',
            '@_StartTime': lap['@_StartTime'] || new Date().toISOString(),
        };
    });
}

export function transformActivities(activity: PolarActivity): Activities {
    return {
        Activity: {
            '@_Sport': activity['@_Sport'],
            Id: activity.Id,
            Lap: transformLap(activity.Lap),
            Creator: defaultGarminCreator,
        },
    };
}
