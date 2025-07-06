import { Lap, Track, Trackpoint } from '../types/garmin-zod.js';

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
// export function enhanceTrackDataWithSpeedDistance(
//   Trackpoints: Trackpoint[],
//   targetLapDistance: number
// ): Trackpoint[] {
//   if (!Trackpoints || Trackpoints.length === 0) {
//     return [];
//   }

//   const config: SpeedDistanceConfig = {
//     restingHR: 60,
//     maxHR: 196,
//     floorHR: 100, // Below this, assume on sideline
//     maxSpeed: 8.5, // ~19 mph max sprint speed
//     minActiveSpeed: 1.5, // ~3.4 mph walking
//     speedVariability: 0.3,
//   };

//   // Calculate speeds for each Trackpoint
//   const enhancedPoints = Trackpoints.map((tp) => {
//     const hr = tp?.HeartRateBpm?.Value || 0;
//     const speed = calculateSpeedFromHR(hr, config);

//     return {
//       ...tp,
//       Extensions: {
//         "ns3:TPX": {
//           "@_xmlns:ns3":
//             "http://www.garmin.com/xmlschemas/ActivityExtension/v2",
//           "ns3:Speed": String(speed), // Random speed variation // TODO should add the speed here
//           // "ns3:Watts": Math.round(200 + Math.random() * 100), // Power data // TODO no power data with garmin forerunner 645 music
//           "ns3:CadenceRPM": speed > 0 ? Math.round(75 + speed * 5) : 0, // Rough cadence estimation
//         },
//       },
//     };
//   });

//   // Calculate time intervals and distances
//   let cumulativeDistance = 0;
//   const pointsWithDistance = enhancedPoints.map((tp, index) => {
//     let distanceIncrement = 0;

//     if (index > 0 && Number(tp.Extensions["ns3:TPX"]["ns3:Speed"]) > 0) {
//       // Assume 1 second intervals if no time data available
//       const timeInterval = 1; // seconds
//       distanceIncrement =
//         Number(tp.Extensions["ns3:TPX"]["ns3:Speed"]) * timeInterval;
//     }

//     cumulativeDistance += distanceIncrement;

//     return {
//       ...tp,
//       DistanceMeters: cumulativeDistance,
//     };
//   });

//   // Scale distances to match target lap distance
//   const actualDistance = cumulativeDistance;
//   if (actualDistance > 0 && targetLapDistance > 0) {
//     const scaleFactor = targetLapDistance / actualDistance;

//     return pointsWithDistance.map((tp) => ({
//       ...tp,
//       DistanceMeters: tp.DistanceMeters * scaleFactor,
//       Extensions: {
//         ...tp.Extensions,
//         "ns3:TPX": {
//           ...tp.Extensions["ns3:TPX"],
//           "ns3:Speed": String(
//             Number(tp.Extensions["ns3:TPX"]["ns3:Speed"]) * scaleFactor
//           ), // Scale speed proportionally
//         },
//       },
//     }));
//   }

//   return pointsWithDistance;
// }

// export function transformLaps(laps: any): Lap[] {
//   if (!laps) {
//     console.warn("No laps in input data", JSON.stringify(laps));
//     return [];
//   }

//   const lapArray = Array.isArray(laps) ? laps : [laps];

//   // Get total distance from environment or default to ~6 miles
//   const totalDistance = process.env.DISTANCE
//     ? Number(process.env.DISTANCE) * 1609.344
//     : 9656.06;

//   // Distribute total distance across laps based on activity level
//   const lapDistances = 0; // TODO adjusted

//   return lapArray.map((lap, index) => {
//     const Trackpoints = Array.isArray(lap.Track) ? lap.Track : [lap.Track];
//     const targetLapDistance = lapDistances[index];

//     // Enhance track data with realistic speed and distance
//     const enhancedTrackData = enhanceTrackDataWithSpeedDistance(
//       Trackpoints,
//       targetLapDistance
//     );

//     // Calculate lap statistics
//     const speeds = enhancedTrackData
//       .map((tp) => Number(tp.Extensions?.["ns3:TPX"]["ns3:Speed"])) // TODO need to make sure I'm not converting undefined shit to a number
//       .filter((s) => s !== undefined)
//       .filter((s) => s > 0);
//     const maxSpeed = speeds.length > 0 ? Math.max(...speeds) : 0;
//     const avgCadence =
//       enhancedTrackData.reduce((sum, tp) => sum + (tp.Cadence || 0), 0) /
//       enhancedTrackData.length;

//     return {
//       DistanceMeters: targetLapDistance,
//       Cadence: Math.round(avgCadence),
//       Track: enhanceTrackDataWithSpeedDistance,
//       TotalTimeSeconds: lap.TotalTimeSeconds || enhancedTrackData.length,
//       MaximumSpeed: maxSpeed,
//       Calories: lap.Calories || Math.round(targetLapDistance * 0.05), // Rough calorie estimate
//       AverageHeartRateBpm: lap.AverageHeartRateBpm || { Value: 0 },
//       MaximumHeartRateBpm: lap.MaximumHeartRateBpm || { Value: 0 },
//       Intensity: lap.Intensity || "Active",
//       TriggerMethod: lap.TriggerMethod || "Manual",
//       "@_StartTime": lap["@_StartTime"] || new Date().toISOString(),
//     };
//   });
// }
