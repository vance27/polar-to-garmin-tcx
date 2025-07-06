//////////////////

import {
    Track,
    Position,
    HeartRateBpm,
    Lap,
    Activities,
} from '../types/garmin-zod';
import { PolarLap, PolarActivity } from '../types/polar-zod';
import { defaultGarminCreator } from './defaults';

interface SpeedDistanceConfig {
    restingHR: number;
    maxHR: number;
    floorHR: number;
    maxSpeed: number; // m/s
    minActiveSpeed: number; // m/s
    speedVariability: number; // 0-1, how much speed varies within HR zones
}

function calculateSpeedFromHR(hr: number, config: SpeedDistanceConfig): number {
    // If HR is below floor, assume not running (sideline)
    if (hr < config.floorHR) {
        return 0;
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
export function enhanceTrackDataWithSpeedDistance(
    track: any,
    targetLapDistance: number
): Track {
    if (!track || !track.Trackpoint) return { Trackpoint: [] };

    const trackpoints = Array.isArray(track.Trackpoint)
        ? track.Trackpoint
        : [track.Trackpoint];

    const config: SpeedDistanceConfig = {
        restingHR: 60,
        maxHR: 196,
        floorHR: 100, // Below this, assume on sideline
        maxSpeed: 8.5, // ~19 mph max sprint speed
        minActiveSpeed: 1.5, // ~3.4 mph walking
        speedVariability: 0.3,
    };

    // Calculate speeds for each Trackpoint
    const enhancedPoints = trackpoints.map((tp) => {
        const hr = tp?.HeartRateBpm?.Value || 0;
        const speed = calculateSpeedFromHR(hr, config);

        return {
            ...tp,
            Extensions: {
                'ns3:TPX': {
                    '@_xmlns:ns3':
                        'http://www.garmin.com/xmlschemas/ActivityExtension/v2',
                    'ns3:Speed': String(speed), // Random speed variation // TODO should add the speed here
                    // "ns3:Watts": Math.round(200 + Math.random() * 100), // Power data // TODO no power data with garmin forerunner 645 music
                    'ns3:CadenceRPM':
                        speed > 0 ? Math.round(75 + speed * 5) : 0, // Rough cadence estimation
                },
            },
        };
    });

    // Calculate time intervals and distances
    let cumulativeDistance = 0;
    const pointsWithDistance = enhancedPoints.map((tp, index) => {
        let distanceIncrement = 0;

        if (index > 0 && Number(tp.Extensions['ns3:TPX']['ns3:Speed']) > 0) {
            // Assume 1 second intervals if no time data available
            const timeInterval = 1; // seconds
            distanceIncrement =
                Number(tp.Extensions['ns3:TPX']['ns3:Speed']) * timeInterval;
        }

        cumulativeDistance += distanceIncrement;

        return {
            ...tp,
            DistanceMeters: cumulativeDistance,
        };
    });

    // Scale distances to match target lap distance
    const actualDistance = cumulativeDistance;
    if (actualDistance > 0 && targetLapDistance > 0) {
        const scaleFactor = targetLapDistance / actualDistance;

        return pointsWithDistance.map((tp) => ({
            ...tp,
            DistanceMeters: tp.DistanceMeters * scaleFactor,
            Extensions: {
                ...tp.Extensions,
                'ns3:TPX': {
                    ...tp.Extensions['ns3:TPX'],
                    'ns3:Speed': String(
                        Number(tp.Extensions['ns3:TPX']['ns3:Speed']) *
                            scaleFactor
                    ), // Scale speed proportionally
                },
            },
        }));
    }

    return pointsWithDistance;
}

////////////////

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
    // Create a simple circular path for demonstration
    const centerLat = 45.0; // Example latitude
    const centerLon = -93.0; // Example longitude
    const radius = 0.001; // Small radius for realistic GPS variation

    const angle = (index / totalPoints) * 2 * Math.PI;

    return {
        LatitudeDegrees: centerLat + radius * Math.sin(angle),
        LongitudeDegrees: centerLon + radius * Math.cos(angle),
    };
}

// TODO need to reduce the traveled altitude - currently too high
export function interpolateAltitude(index: number): number {
    // Create gentle elevation changes
    const baseAltitude = 100;
    const variation = 10 * Math.sin(index * 0.1);
    return baseAltitude + variation;
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

export function enhanceTrackData(track: any): Track {
    if (!track || !track.Trackpoint) return { Trackpoint: [] };

    const trackpoints = Array.isArray(track.Trackpoint)
        ? track.Trackpoint
        : [track.Trackpoint];

    return {
        Trackpoint: trackpoints.map((point, index) => {
            return {
                Time: point.Time || interpolateTime(index, trackpoints.length),
                Position:
                    point.Position ||
                    interpolatePosition(index, trackpoints.length),
                AltitudeMeters:
                    point.AltitudeMeters || interpolateAltitude(index),
                DistanceMeters:
                    point.DistanceMeters ||
                    interpolateDistance(index, trackpoints.length),
                HeartRateBpm: point.HeartRateBpm || interpolateHeartRate(index),
                Extensions: {
                    'ns3:TPX': {
                        '@_xmlns:ns3':
                            'http://www.garmin.com/xmlschemas/ActivityExtension/v2',
                        'ns3:Speed': (3.0 + Math.random() * 2).toFixed(2), // Random speed variation // TODO should add the speed here
                        // "ns3:Watts": Math.round(200 + Math.random() * 100), // Power data // TODO no power data with garmin forerunner 645 music
                        'ns3:CadenceRPM': Math.round(80 + Math.random() * 20), // Cadence
                    },
                },
            };
        }),
    };
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

export function transformLap(laps: PolarLap | PolarLap[]): Lap[] {
    if (!laps) {
        console.warn('No laps in input data', JSON.stringify(laps));
        return [];
    }

    const lapArray = Array.isArray(laps) ? laps : [laps];

    /**
     * Total distance would typically be broken up over all of the laps, might need to consider ALL laps
     * TODO come up with an algorithm that takes hr and converts to speed to the best of its ability
     * Gets value from process.env or sets distance equal to ~ 6 miles
     */
    const totalDistance = process.env.DISTANCE
        ? Number(process.env.DISTANCE) * 1609.344 // TODO need to access this value safer
        : 9656.06;

    const lapDistances = distributeDistanceAcrossLaps(lapArray, totalDistance);

    return lapArray.map((lap, index) => {
        // const trackData = enhanceTrackData(lap.Track);
        const trackPoints = Array.isArray(lap.Track) ? lap.Track : [lap.Track];
        const targetLapDistance = lapDistances[index];

        // Enhance track data with realistic speed and distance
        const enhancedTrackData = enhanceTrackDataWithSpeedDistance(
            trackPoints,
            targetLapDistance
        );

        // Calculate lap statistics
        const speeds = enhancedTrackData.Trackpoint.map((tp) =>
            Number(tp.Extensions?.['ns3:TPX']['ns3:Speed'])
        )
            .filter((s) => s !== undefined)
            .filter((s) => s > 0);
        const maxSpeed = speeds.length > 0 ? Math.max(...speeds) : 0;
        const avgCadence =
            enhancedTrackData.Trackpoint.reduce(
                (sum, tp) => sum + (tp.Cadence || 0),
                0
            ) / enhancedTrackData.Trackpoint.length;

        return {
            DistanceMeters: targetLapDistance,
            Cadence: Math.round(avgCadence),
            Track: enhancedTrackData,
            TotalTimeSeconds:
                lap.TotalTimeSeconds || enhancedTrackData.Trackpoint.length, // Trackpoint length
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
