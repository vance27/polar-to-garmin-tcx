import { HeartRateBpm, Position, Track } from '../types/garmin-zod';

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
