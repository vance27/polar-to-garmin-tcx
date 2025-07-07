import { PolarTrackpoint, Position, Trackpoint } from '@ptgt/fitness-zod';

import { defaultLatLonAltRad, defaultSpeedDistanceConfig } from './defaults';
import {
    calculateSpeedFromHR,
    interpolateAltitude,
} from './track-data-enhancer';

interface PositionState {
    currentPosition: Position;
    isOnSideline: boolean;
    sidelinePosition: Position | null;
    movementDirection: { lat: number; lon: number };
    stationaryTime: number;
    // New properties for natural movement
    dynamicTarget: Position;
    targetChangeCounter: number;
    momentum: { lat: number; lon: number };
    lastMovementDirection: { lat: number; lon: number };
}

// Convert meters to approximate degrees (rough conversion)
function metersToLatDegrees(meters: number): number {
    return meters / 111000; // Approximately 111km per degree of latitude
}

function metersToLonDegrees(meters: number, latitude: number): number {
    return meters / (111000 * Math.cos((latitude * Math.PI) / 180));
}

// Haversine formula
function calculateDistance(pos1: Position, pos2: Position): number {
    const R = 6378000; // Earth's radius in meters

    // Convert degrees to radians
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

// Check if position is within rectangular boundary
function isWithinRectangle(
    position: Position,
    centerLat: number,
    centerLon: number,
    width: number,
    height: number
): boolean {
    const latDiff = Math.abs(position.LatitudeDegrees - centerLat);
    const lonDiff = Math.abs(position.LongitudeDegrees - centerLon);

    const maxLatDiff = metersToLatDegrees(height / 2);
    const maxLonDiff = metersToLonDegrees(width / 2, centerLat);

    return latDiff <= maxLatDiff && lonDiff <= maxLonDiff;
}

// Get distance from center of rectangle (for boundary calculations)
function getDistanceFromRectangleCenter(
    position: Position,
    centerLat: number,
    centerLon: number
): number {
    return calculateDistance(position, {
        LatitudeDegrees: centerLat,
        LongitudeDegrees: centerLon,
    });
}

// Calculate distance from rectangle edge (0 if inside, positive if outside)
function getDistanceFromRectangleEdge(
    position: Position,
    centerLat: number,
    centerLon: number,
    width: number,
    height: number
): number {
    const latDiff = Math.abs(position.LatitudeDegrees - centerLat);
    const lonDiff = Math.abs(position.LongitudeDegrees - centerLon);

    const maxLatDiff = metersToLatDegrees(height / 2);
    const maxLonDiff = metersToLonDegrees(width / 2, centerLat);

    // If inside rectangle, return 0
    if (latDiff <= maxLatDiff && lonDiff <= maxLonDiff) {
        return 0;
    }

    // Calculate distance to nearest edge
    const latExcess = Math.max(0, latDiff - maxLatDiff);
    const lonExcess = Math.max(0, lonDiff - maxLonDiff);

    // Convert back to meters for distance calculation
    const latExcessMeters = latExcess * 111000;
    const lonExcessMeters =
        lonExcess * 111000 * Math.cos((centerLat * Math.PI) / 180);

    return Math.sqrt(
        latExcessMeters * latExcessMeters + lonExcessMeters * lonExcessMeters
    );
}

function getRandomSidelinePosition(width: number, height: number): Position {
    const { lat, lon } = defaultLatLonAltRad;
    const sidelineDistance = -30; // meters from center

    // Add some random variation along the sideline
    const alongSidelineVariation = (Math.random() - 0.5) * 10; // ±10 meters

    return {
        LatitudeDegrees: lat + metersToLatDegrees(alongSidelineVariation),
        LongitudeDegrees: lon + metersToLonDegrees(sidelineDistance, lat),
    };
}

// Generate a random target position within the rectangle
function generateRandomTargetRectangle(
    width: number,
    height: number
): Position {
    const { lat, lon } = defaultLatLonAltRad;

    // Generate a random position within 60-90% of the rectangle dimensions for more natural movement
    const targetWidth = (0.6 + Math.random() * 0.3) * width;
    const targetHeight = (0.6 + Math.random() * 0.3) * height;

    // Random offset from center
    const randomEastWest = (Math.random() - 0.5) * targetWidth;
    const randomNorthSouth = (Math.random() - 0.5) * targetHeight;

    const targetLat = lat + metersToLatDegrees(randomNorthSouth);
    const targetLon = lon + metersToLonDegrees(randomEastWest, lat);

    return {
        LatitudeDegrees: targetLat,
        LongitudeDegrees: targetLon,
    };
}

// Add natural jitter to movement direction
function addJitterToDirection(
    direction: { lat: number; lon: number },
    jitterAmount = 0.3
): { lat: number; lon: number } {
    const jitterLat = (Math.random() - 0.5) * jitterAmount;
    const jitterLon = (Math.random() - 0.5) * jitterAmount;

    return {
        lat: direction.lat + jitterLat,
        lon: direction.lon + jitterLon,
    };
}

// Apply momentum to create smoother, more natural movement
function applyMomentum(
    newDirection: { lat: number; lon: number },
    momentum: { lat: number; lon: number },
    momentumFactor = 0.4
): { lat: number; lon: number } {
    return {
        lat:
            newDirection.lat * (1 - momentumFactor) +
            momentum.lat * momentumFactor,
        lon:
            newDirection.lon * (1 - momentumFactor) +
            momentum.lon * momentumFactor,
    };
}

function generateMovementDirection(
    currentPos: Position,
    targetPos: Position,
    distanceFromCenter: number,
    width: number,
    height: number,
    momentum: { lat: number; lon: number }
): { lat: number; lon: number } {
    // Calculate direction towards dynamic target instead of always center
    const towardsTargetLat =
        targetPos.LatitudeDegrees - currentPos.LatitudeDegrees;
    const towardsTargetLon =
        targetPos.LongitudeDegrees - currentPos.LongitudeDegrees;

    // Normalize the direction
    const magnitude = Math.sqrt(
        towardsTargetLat * towardsTargetLat +
            towardsTargetLon * towardsTargetLon
    );
    const normalizedTowardsTarget =
        magnitude > 0
            ? {
                  lat: towardsTargetLat / magnitude,
                  lon: towardsTargetLon / magnitude,
              }
            : { lat: 0, lon: 0 };

    // Calculate bias based on distance from rectangle center
    // Use diagonal distance of rectangle as reference
    const maxRectangleDistance = Math.sqrt(width * width + height * height) / 2;
    const centerBias = Math.min(
        0.3,
        Math.pow(distanceFromCenter / maxRectangleDistance, 1.5)
    );

    // Generate random direction with more influence
    const randomAngle = Math.random() * 2 * Math.PI;
    const randomDirection = {
        lat: Math.sin(randomAngle),
        lon: Math.cos(randomAngle),
    };

    // Blend directions with less center bias
    let blendedDirection = {
        lat:
            randomDirection.lat * (1 - centerBias) +
            normalizedTowardsTarget.lat * centerBias,
        lon:
            randomDirection.lon * (1 - centerBias) +
            normalizedTowardsTarget.lon * centerBias,
    };

    // Add jitter for natural movement
    blendedDirection = addJitterToDirection(blendedDirection, 0.4);

    // Apply momentum for smoother movement
    blendedDirection = applyMomentum(blendedDirection, momentum, 0.3);

    // Normalize the final direction
    const finalMagnitude = Math.sqrt(
        blendedDirection.lat * blendedDirection.lat +
            blendedDirection.lon * blendedDirection.lon
    );

    if (finalMagnitude > 0) {
        blendedDirection.lat /= finalMagnitude;
        blendedDirection.lon /= finalMagnitude;
    }

    return blendedDirection;
}

// Global position state to maintain continuity
let globalPositionState: PositionState | null = null;

export function interpolatePosition(
    index: number,
    totalPoints: number,
    speed = 0,
    previousPosition?: Position,
    width = 100, // Default width in meters
    height = 80 // Default height in meters
): Position {
    const { lat, lon } = defaultLatLonAltRad;
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
            // Initialize new properties
            dynamicTarget: generateRandomTargetRectangle(width, height),
            targetChangeCounter: 0,
            momentum: { lat: 0, lon: 0 },
            lastMovementDirection: { lat: 0, lon: 1 },
        };
    }

    // Update target periodically for more natural movement
    globalPositionState.targetChangeCounter++;
    if (globalPositionState.targetChangeCounter > 8 + Math.random() * 12) {
        // Change target every 8-20 seconds
        globalPositionState.dynamicTarget = generateRandomTargetRectangle(
            width,
            height
        );
        globalPositionState.targetChangeCounter = 0;
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
        globalPositionState.sidelinePosition = getRandomSidelinePosition(
            width,
            height
        );
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
        // Generate new target when returning to field
        globalPositionState.dynamicTarget = generateRandomTargetRectangle(
            width,
            height
        );
    }

    // Normal field movement
    if (speed > 0) {
        const currentDistanceFromCenter = getDistanceFromRectangleCenter(
            globalPositionState.currentPosition,
            lat,
            lon
        );

        // Check if we're close to the current target, if so generate a new one
        const distanceToTarget = calculateDistance(
            globalPositionState.currentPosition,
            globalPositionState.dynamicTarget
        );

        if (distanceToTarget < 15) {
            // Within 15 meters of target
            globalPositionState.dynamicTarget = generateRandomTargetRectangle(
                width,
                height
            );
        }

        // Generate movement direction towards dynamic target
        const newDirection = generateMovementDirection(
            globalPositionState.currentPosition,
            globalPositionState.dynamicTarget,
            currentDistanceFromCenter,
            width,
            height,
            globalPositionState.momentum
        );

        // Update momentum
        globalPositionState.momentum = {
            lat:
                newDirection.lat * 0.7 + globalPositionState.momentum.lat * 0.3,
            lon:
                newDirection.lon * 0.7 + globalPositionState.momentum.lon * 0.3,
        };

        globalPositionState.movementDirection = newDirection;
        globalPositionState.lastMovementDirection = newDirection;

        // Calculate movement distance (speed is in m/s, assume 1 second intervals)
        const movementDistance = speed * 1; // 1 second interval

        // Apply movement with some speed variation for more natural feel
        const speedVariation = 0.9 + Math.random() * 0.2; // 0.9x to 1.1x speed variation
        const adjustedMovementDistance = movementDistance * speedVariation;

        // Apply movement
        const latMovement = metersToLatDegrees(
            adjustedMovementDistance * globalPositionState.movementDirection.lat
        );
        const lonMovement = metersToLonDegrees(
            adjustedMovementDistance *
                globalPositionState.movementDirection.lon,
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

        // Ensure we don't exceed the rectangle boundary
        if (!isWithinRectangle(newPosition, lat, lon, width, height)) {
            // Constrain to rectangle boundary
            const maxLatDiff = metersToLatDegrees(height / 2);
            const maxLonDiff = metersToLonDegrees(width / 2, lat);

            // Clamp to boundary
            const latDiff = newPosition.LatitudeDegrees - lat;
            const lonDiff = newPosition.LongitudeDegrees - lon;

            newPosition.LatitudeDegrees =
                lat +
                Math.sign(latDiff) * Math.min(Math.abs(latDiff), maxLatDiff);
            newPosition.LongitudeDegrees =
                lon +
                Math.sign(lonDiff) * Math.min(Math.abs(lonDiff), maxLonDiff);

            // Generate new target when hitting boundary
            globalPositionState.dynamicTarget = generateRandomTargetRectangle(
                width,
                height
            );
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

// Updated enhance function to use rectangular boundary
export function enhanceTrackDataWithSpeedDistanceAdv(
    trackpoints: PolarTrackpoint[],
    targetLapDistance: number,
    width = 70, // Default width in meters
    height = 100 // Default height in meters
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

        const interpolatedPosition = interpolatePosition(
            index,
            trackpoints.length,
            speed,
            previousPosition,
            width,
            height
        );

        enhancedPointsPosition.push({
            Position: interpolatedPosition,
        });

        return {
            ...tp,
            Position: tp.Position || interpolatedPosition,
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

// Helper function to reset position state (useful for new activities)
export function resetPositionState(): void {
    globalPositionState = null;
}
