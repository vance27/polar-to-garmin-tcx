import { enhanceTrackDataWithSpeedDistance } from './claude-generated-fake-gen.js';
import { Track, Position, HeartRateBpm, Lap } from '../types/garmin-zod.js';
import { PolarLap } from '../types/polar-zod.js';

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

export function transformLaps(laps: PolarLap[]): Lap[] {
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
