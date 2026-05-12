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

// NEW: Rotation helper functions
/**
 * Rotate a point around the origin (0,0) by the given angle in degrees
 */
function rotatePoint(
    x: number,
    y: number,
    angleDegrees: number
): { x: number; y: number } {
    const angleRadians = (angleDegrees * Math.PI) / 180;
    const cos = Math.cos(angleRadians);
    const sin = Math.sin(angleRadians);

    return {
        x: x * cos - y * sin,
        y: x * sin + y * cos,
    };
}

/**
 * Convert a position offset (in meters from center) to lat/lon coordinates
 * accounting for field rotation
 */
function offsetToPosition(
    offsetX: number,
    offsetY: number,
    centerLat: number,
    centerLon: number,
    rotation = 0
): Position {
    // Apply rotation to the offset
    const rotated = rotatePoint(offsetX, offsetY, rotation);

    return {
        LatitudeDegrees: centerLat + metersToLatDegrees(rotated.y),
        LongitudeDegrees: centerLon + metersToLonDegrees(rotated.x, centerLat),
    };
}

/**
 * Convert a lat/lon position to offset (in meters from center)
 * accounting for field rotation
 */
function positionToOffset(
    position: Position,
    centerLat: number,
    centerLon: number,
    rotation = 0
): { x: number; y: number } {
    // Convert to meters offset
    const offsetX =
        (position.LongitudeDegrees - centerLon) *
        111000 *
        Math.cos((centerLat * Math.PI) / 180);
    const offsetY = (position.LatitudeDegrees - centerLat) * 111000;

    // Apply reverse rotation to get back to field coordinates
    return rotatePoint(offsetX, offsetY, -rotation);
}

// MODIFIED: Check if position is within rectangular boundary (accounting for rotation)
function isWithinRectangle(
    position: Position,
    centerLat: number,
    centerLon: number,
    width: number,
    height: number,
    rotation = 0
): boolean {
    const offset = positionToOffset(position, centerLat, centerLon, rotation);

    return Math.abs(offset.x) <= width / 2 && Math.abs(offset.y) <= height / 2;
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

// MODIFIED: Calculate distance from rectangle edge (accounting for rotation)
function getDistanceFromRectangleEdge(
    position: Position,
    centerLat: number,
    centerLon: number,
    width: number,
    height: number,
    rotation = 0
): number {
    const offset = positionToOffset(position, centerLat, centerLon, rotation);

    const xExcess = Math.max(0, Math.abs(offset.x) - width / 2);
    const yExcess = Math.max(0, Math.abs(offset.y) - height / 2);

    // If inside rectangle, return 0
    if (xExcess === 0 && yExcess === 0) {
        return 0;
    }

    return Math.sqrt(xExcess * xExcess + yExcess * yExcess);
}

// MODIFIED: Get random sideline position (accounting for rotation)
function getRandomSidelinePosition(
    width: number,
    height: number,
    rotation = 0
): Position {
    const { lat, lon } = defaultLatLonAltRad;
    const sidelineDistance = Number(process.env.SIDELINE_DISTANCE ?? -30);
    const alongSidelineVariation = (Math.random() - 0.5) * 10;

    // Generate sideline position in field coordinates (unrotated)
    return offsetToPosition(
        sidelineDistance,
        alongSidelineVariation,
        lat,
        lon,
        rotation
    );
}

// MODIFIED: Generate random target within rectangle (accounting for rotation)
function generateRandomTargetRectangle(
    width: number,
    height: number,
    rotation = 0
): Position {
    const { lat, lon } = defaultLatLonAltRad;

    const targetWidth = (0.6 + Math.random() * 0.3) * width;
    const targetHeight = (0.6 + Math.random() * 0.3) * height;

    const randomEastWest = (Math.random() - 0.5) * targetWidth;
    const randomNorthSouth = (Math.random() - 0.5) * targetHeight;

    return offsetToPosition(
        randomEastWest,
        randomNorthSouth,
        lat,
        lon,
        rotation
    );
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

// MODIFIED: Generate movement direction (accounting for rotation)
function generateMovementDirection(
    currentPos: Position,
    targetPos: Position,
    distanceFromCenter: number,
    width: number,
    height: number,
    momentum: { lat: number; lon: number },
    rotation = 0
): { lat: number; lon: number } {
    const { lat: centerLat, lon: centerLon } = defaultLatLonAltRad;

    // Convert current position and target to field coordinates
    const currentOffset = positionToOffset(
        currentPos,
        centerLat,
        centerLon,
        rotation
    );
    const targetOffset = positionToOffset(
        targetPos,
        centerLat,
        centerLon,
        rotation
    );

    // Calculate direction in field coordinates
    const fieldDirection = {
        x: targetOffset.x - currentOffset.x,
        y: targetOffset.y - currentOffset.y,
    };

    // Normalize
    const magnitude = Math.sqrt(
        fieldDirection.x * fieldDirection.x +
            fieldDirection.y * fieldDirection.y
    );
    const normalizedFieldDirection =
        magnitude > 0
            ? {
                  x: fieldDirection.x / magnitude,
                  y: fieldDirection.y / magnitude,
              }
            : { x: 0, y: 0 };

    // Apply existing logic for center bias and random direction in field coordinates
    const maxRectangleDistance = Math.sqrt(width * width + height * height) / 2;
    const centerDistance = Math.sqrt(
        currentOffset.x * currentOffset.x + currentOffset.y * currentOffset.y
    );
    const centerBias = Math.min(
        0.3,
        Math.pow(centerDistance / maxRectangleDistance, 1.5)
    );

    const randomAngle = Math.random() * 2 * Math.PI;
    const randomFieldDirection = {
        x: Math.cos(randomAngle),
        y: Math.sin(randomAngle),
    };

    // Blend directions in field coordinates
    const blendedFieldDirection = {
        x:
            randomFieldDirection.x * (1 - centerBias) +
            normalizedFieldDirection.x * centerBias,
        y:
            randomFieldDirection.y * (1 - centerBias) +
            normalizedFieldDirection.y * centerBias,
    };

    // Add jitter in field coordinates
    const jitterAmount = 0.4;
    blendedFieldDirection.x += (Math.random() - 0.5) * jitterAmount;
    blendedFieldDirection.y += (Math.random() - 0.5) * jitterAmount;

    // Convert momentum to field coordinates for blending
    const currentMomentumOffset = positionToOffset(
        {
            LatitudeDegrees: centerLat + momentum.lat / 111000,
            LongitudeDegrees:
                centerLon +
                momentum.lon / (111000 * Math.cos((centerLat * Math.PI) / 180)),
        },
        centerLat,
        centerLon,
        rotation
    );

    // Apply momentum in field coordinates
    const momentumFactor = 0.3;
    blendedFieldDirection.x =
        blendedFieldDirection.x * (1 - momentumFactor) +
        currentMomentumOffset.x * momentumFactor;
    blendedFieldDirection.y =
        blendedFieldDirection.y * (1 - momentumFactor) +
        currentMomentumOffset.y * momentumFactor;

    // Normalize final direction in field coordinates
    const finalMagnitude = Math.sqrt(
        blendedFieldDirection.x * blendedFieldDirection.x +
            blendedFieldDirection.y * blendedFieldDirection.y
    );

    if (finalMagnitude > 0) {
        blendedFieldDirection.x /= finalMagnitude;
        blendedFieldDirection.y /= finalMagnitude;
    }

    // Rotate the direction vector back to world coordinates
    const worldDirection = rotatePoint(
        blendedFieldDirection.x,
        blendedFieldDirection.y,
        rotation
    );

    // Convert back to lat/lon direction
    return {
        lat: worldDirection.y / 111000,
        lon:
            worldDirection.x / (111000 * Math.cos((centerLat * Math.PI) / 180)),
    };
}

// Global position state to maintain continuity
let globalPositionState: PositionState | null = null;

// MODIFIED: Main interpolatePosition function - add rotation parameter
export function interpolatePosition(
    index: number,
    totalPoints: number,
    speed = 0,
    previousPosition?: Position,
    width = 100, // Default width in meters
    height = 80, // Default height in meters
    rotation = 0 // NEW PARAMETER: degrees of rotation
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
            dynamicTarget: generateRandomTargetRectangle(
                width,
                height,
                rotation
            ),
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
            height,
            rotation
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
            height,
            rotation
        );
        return globalPositionState.sidelinePosition;
    } else if (shouldBeOnSideline && globalPositionState.isOnSideline) {
        // Stay on sideline with minor variation
        const currentOffset = positionToOffset(
            globalPositionState.sidelinePosition!,
            lat,
            lon,
            rotation
        );

        // Add small variation in field coordinates
        const variationOffset = {
            x: currentOffset.x + (Math.random() - 0.5) * 2, // ±1 meter variation
            y: currentOffset.y + (Math.random() - 0.5) * 2,
        };

        return offsetToPosition(
            variationOffset.x,
            variationOffset.y,
            lat,
            lon,
            rotation
        );
    } else if (!shouldBeOnSideline && globalPositionState.isOnSideline) {
        // Moving back from sideline to field
        globalPositionState.isOnSideline = false;
        globalPositionState.sidelinePosition = null;
        // Generate new target when returning to field
        globalPositionState.dynamicTarget = generateRandomTargetRectangle(
            width,
            height,
            rotation
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
                height,
                rotation
            );
        }

        // Generate movement direction towards dynamic target with rotation
        const newDirection = generateMovementDirection(
            globalPositionState.currentPosition,
            globalPositionState.dynamicTarget,
            currentDistanceFromCenter,
            width,
            height,
            globalPositionState.momentum,
            rotation
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
        const latMovement =
            adjustedMovementDistance *
            globalPositionState.movementDirection.lat;
        const lonMovement =
            adjustedMovementDistance *
            globalPositionState.movementDirection.lon;

        const newPosition: Position = {
            LatitudeDegrees:
                globalPositionState.currentPosition.LatitudeDegrees +
                latMovement,
            LongitudeDegrees:
                globalPositionState.currentPosition.LongitudeDegrees +
                lonMovement,
        };

        // Ensure we don't exceed the rotated rectangle boundary
        if (
            !isWithinRectangle(newPosition, lat, lon, width, height, rotation)
        ) {
            // Project back onto the boundary
            const currentOffset = positionToOffset(
                newPosition,
                lat,
                lon,
                rotation
            );

            // Clamp to field boundaries
            const clampedOffset = {
                x:
                    Math.sign(currentOffset.x) *
                    Math.min(Math.abs(currentOffset.x), width / 2),
                y:
                    Math.sign(currentOffset.y) *
                    Math.min(Math.abs(currentOffset.y), height / 2),
            };

            const clampedPosition = offsetToPosition(
                clampedOffset.x,
                clampedOffset.y,
                lat,
                lon,
                rotation
            );
            globalPositionState.currentPosition = clampedPosition;

            // Generate new target when hitting boundary
            globalPositionState.dynamicTarget = generateRandomTargetRectangle(
                width,
                height,
                rotation
            );

            return clampedPosition;
        }

        globalPositionState.currentPosition = newPosition;
        return newPosition;
    }

    // If not moving and not on sideline, stay at current position with minor variation
    const currentOffset = positionToOffset(
        globalPositionState.currentPosition,
        lat,
        lon,
        rotation
    );
    const variationOffset = {
        x: currentOffset.x + (Math.random() - 0.5) * 0.5, // ±0.25 meter variation
        y: currentOffset.y + (Math.random() - 0.5) * 0.5,
    };

    return offsetToPosition(
        variationOffset.x,
        variationOffset.y,
        lat,
        lon,
        rotation
    );
}

// MODIFIED: Updated enhance function to use rectangular boundary with rotation
export function enhanceTrackDataWithSpeedDistanceAdv(
    trackpoints: PolarTrackpoint[],
    targetLapDistance: number,
    width = 70, // Default width in meters
    height = 100, // Default height in meters
    rotation = 0 // NEW PARAMETER: degrees of rotation
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
            height,
            rotation // Pass rotation parameter
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
