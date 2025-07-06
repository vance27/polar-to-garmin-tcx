import { Position, Trackpoint } from '../types/garmin-zod.js';
import { PolarTrackpoint } from '../types/polar-zod.js';
import { defaultLatLonAltRad, defaultSpeedDistanceConfig } from './defaults.js';
import {
    calculateSpeedFromHR,
    interpolateAltitude,
} from './track-data-enhancer.js';

interface PositionState {
    currentPosition: Position;
    isOnSideline: boolean;
    sidelinePosition: Position | null;
    movementDirection: { lat: number; lon: number };
    stationaryTime: number;
}

// Convert meters to approximate degrees (rough conversion)
function metersToLatDegrees(meters: number): number {
    return meters / 111000; // Approximately 111km per degree of latitude
}

function metersToLonDegrees(meters: number, latitude: number): number {
    return meters / (111000 * Math.cos((latitude * Math.PI) / 180));
}

function calculateDistance(pos1: Position, pos2: Position): number {
    const R = 6371000; // Earth's radius in meters
    const lat1Rad = (pos1.LatitudeDegrees * Math.PI) / 180;
    const lat2Rad = (pos2.LatitudeDegrees * Math.PI) / 180;
    const deltaLat =
        ((pos2.LatitudeDegrees - pos1.LatitudeDegrees) * Math.PI) / 180;
    const deltaLon =
        ((pos2.LongitudeDegrees - pos1.LongitudeDegrees) * Math.PI) / 180;

    const a =
        Math.sin(deltaLat / 2) * Math.sin(deltaLat / 2) +
        Math.cos(lat1Rad) *
            Math.cos(lat2Rad) *
            Math.sin(deltaLon / 2) *
            Math.sin(deltaLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

    return R * c;
}

function getRandomSidelinePosition(): Position {
    const { lat, lon } = defaultLatLonAltRad;
    const sidelineDistance = -30; // meters from center

    // Randomly choose left or right sideline
    // const isLeftSide = Math.random() < 0.5;
    // const sideMultiplier = isLeftSide ? -1 : 1;

    // Add some random variation along the sideline
    const alongSidelineVariation = (Math.random() - 0.5) * 10; // ±10 meters

    return {
        LatitudeDegrees:
            // lat + metersToLatDegrees(sidelineDistance * sideMultiplier),
            lat + metersToLatDegrees(alongSidelineVariation), // TODO always one side
        // LongitudeDegrees: lon + metersToLonDegrees(alongSidelineVariation, lat),
        LongitudeDegrees: lon + metersToLonDegrees(sidelineDistance, lat),
    };
}

function generateMovementDirection(
    currentPos: Position,
    centerPos: Position,
    distanceFromCenter: number,
    maxRadius: number
): { lat: number; lon: number } {
    const { lat, lon } = defaultLatLonAltRad;

    // Calculate direction towards center
    const towardsCenterLat = lat - currentPos.LatitudeDegrees;
    const towardsCenterLon = lon - currentPos.LongitudeDegrees;

    // Normalize the direction
    const magnitude = Math.sqrt(
        towardsCenterLat * towardsCenterLat +
            towardsCenterLon * towardsCenterLon
    );
    const normalizedTowardsCenter =
        magnitude > 0
            ? {
                  lat: towardsCenterLat / magnitude,
                  lon: towardsCenterLon / magnitude,
              }
            : { lat: 0, lon: 0 };

    // Calculate bias towards center based on distance from center
    const centerBias = Math.pow(distanceFromCenter / maxRadius, 2); // Exponential bias near edges

    // Generate random direction
    const randomAngle = Math.random() * 2 * Math.PI;
    const randomDirection = {
        lat: Math.sin(randomAngle),
        lon: Math.cos(randomAngle),
    };

    // Blend random direction with center bias
    return {
        lat:
            randomDirection.lat * (1 - centerBias) +
            normalizedTowardsCenter.lat * centerBias,
        lon:
            randomDirection.lon * (1 - centerBias) +
            normalizedTowardsCenter.lon * centerBias,
    };
}

// Global position state to maintain continuity
let globalPositionState: PositionState | null = null;

// Updated enhance function to use intelligent position interpolation
export function enhanceTrackDataWithSpeedDistanceAdv(
    trackpoints: PolarTrackpoint[],
    targetLapDistance: number
): Trackpoint[] {
    let cumulativeDistance = 0;
    const enhancedPointsPosition: any[] = [];
    const enhancedPoints = trackpoints.map((tp, index) => {
        const hr = tp?.HeartRateBpm?.Value || 0;
        const speed = calculateSpeedFromHR(hr, defaultSpeedDistanceConfig);
        // Assume 1 second intervals if no time data available
        const timeInterval = 1; // seconds
        const distanceIncrement =
            index > 0 && speed > 0 ? speed * timeInterval : 0;

        cumulativeDistance += distanceIncrement;

        // Get previous position for continuity
        const previousPosition =
            index > 0 ? enhancedPointsPosition[index - 1].Position : undefined;
        enhancedPointsPosition.push({
            Position: interpolatePosition(
                index,
                trackpoints.length,
                speed,
                previousPosition
            ),
        });
        return {
            ...tp,
            Position:
                tp.Position ||
                interpolatePosition(
                    index,
                    trackpoints.length,
                    speed,
                    previousPosition
                ),
            AltitudeMeters: tp.AltitudeMeters || interpolateAltitude(index),
            DistanceMeters: cumulativeDistance,
            Extensions: {
                'ns3:TPX': {
                    '@_xmlns:ns3':
                        'http://www.garmin.com/xmlschemas/ActivityExtension/v2',
                    'ns3:Speed': String(speed),
                    'ns3:CadenceRPM':
                        speed > 0 ? Math.round(75 + speed * 5) : 0,
                },
            },
        };
    });

    // Scale distances to match target lap distance
    const actualDistance = cumulativeDistance;
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
                ),
            },
        },
    }));
}

export function interpolatePosition(
    index: number,
    totalPoints: number,
    speed: number = 0,
    previousPosition?: Position
): Position {
    const { lat, lon, radius } = defaultLatLonAltRad;
    const centerPosition: Position = {
        LatitudeDegrees: lat,
        LongitudeDegrees: lon,
    };

    // Initialize state if first call or no previous state
    if (!globalPositionState || index === 0) {
        globalPositionState = {
            currentPosition: previousPosition || centerPosition,
            isOnSideline: false,
            sidelinePosition: null,
            movementDirection: { lat: 0, lon: 1 },
            stationaryTime: 0,
        };
    }

    // Update stationary time
    if (speed === 0) {
        globalPositionState.stationaryTime++;
    } else {
        globalPositionState.stationaryTime = 0;
    }

    // Determine if player should be on sideline
    const shouldBeOnSideline =
        speed === 0 && globalPositionState.stationaryTime > 3; // 3+ seconds stationary

    if (shouldBeOnSideline && !globalPositionState.isOnSideline) {
        // Moving to sideline
        globalPositionState.isOnSideline = true;
        globalPositionState.sidelinePosition = getRandomSidelinePosition();
        return globalPositionState.sidelinePosition;
    } else if (shouldBeOnSideline && globalPositionState.isOnSideline) {
        // Stay on sideline with minor variation
        const variation = {
            lat: (Math.random() - 0.5) * metersToLatDegrees(2), // ±1 meter variation
            lon:
                (Math.random() - 0.5) *
                metersToLonDegrees(
                    2,
                    globalPositionState.sidelinePosition!.LatitudeDegrees
                ),
        };

        return {
            LatitudeDegrees:
                globalPositionState.sidelinePosition!.LatitudeDegrees +
                variation.lat,
            LongitudeDegrees:
                globalPositionState.sidelinePosition!.LongitudeDegrees +
                variation.lon,
        };
    } else if (!shouldBeOnSideline && globalPositionState.isOnSideline) {
        // Moving back from sideline to field
        globalPositionState.isOnSideline = false;
        globalPositionState.sidelinePosition = null;
        // Start moving towards center
        globalPositionState.movementDirection = generateMovementDirection(
            globalPositionState.currentPosition,
            centerPosition,
            calculateDistance(
                globalPositionState.currentPosition,
                centerPosition
            ),
            radius
        );
    }

    // Normal field movement
    if (speed > 0) {
        const currentDistanceFromCenter = calculateDistance(
            globalPositionState.currentPosition,
            centerPosition
        );

        // Generate movement direction based on current position
        globalPositionState.movementDirection = generateMovementDirection(
            globalPositionState.currentPosition,
            centerPosition,
            currentDistanceFromCenter,
            radius
        );

        // Calculate movement distance (speed is in m/s, assume 1 second intervals)
        const movementDistance = speed * 1; // 1 second interval

        // Apply movement
        const latMovement = metersToLatDegrees(
            movementDistance * globalPositionState.movementDirection.lat
        );
        const lonMovement = metersToLonDegrees(
            movementDistance * globalPositionState.movementDirection.lon,
            globalPositionState.currentPosition.LatitudeDegrees
        );

        const newPosition: Position = {
            LatitudeDegrees:
                globalPositionState.currentPosition.LatitudeDegrees +
                latMovement,
            LongitudeDegrees:
                globalPositionState.currentPosition.LongitudeDegrees +
                lonMovement,
        };

        // Ensure we don't exceed the radius boundary
        const newDistanceFromCenter = calculateDistance(
            newPosition,
            centerPosition
        );
        if (newDistanceFromCenter > radius) {
            // Scale back to boundary
            const scaleFactor = radius / newDistanceFromCenter;
            newPosition.LatitudeDegrees =
                lat + (newPosition.LatitudeDegrees - lat) * scaleFactor;
            newPosition.LongitudeDegrees =
                lon + (newPosition.LongitudeDegrees - lon) * scaleFactor;
        }

        globalPositionState.currentPosition = newPosition;
        return newPosition;
    }

    // If not moving and not on sideline, stay at current position with minor variation
    const smallVariation = {
        lat: (Math.random() - 0.5) * metersToLatDegrees(0.5), // ±0.25 meter variation
        lon:
            (Math.random() - 0.5) *
            metersToLonDegrees(
                0.5,
                globalPositionState.currentPosition.LatitudeDegrees
            ),
    };

    return {
        LatitudeDegrees:
            globalPositionState.currentPosition.LatitudeDegrees +
            smallVariation.lat,
        LongitudeDegrees:
            globalPositionState.currentPosition.LongitudeDegrees +
            smallVariation.lon,
    };
}

// Helper function to reset position state (useful for new activities)
export function resetPositionState(): void {
    globalPositionState = null;
}
