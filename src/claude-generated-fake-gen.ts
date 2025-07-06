interface TrackPoint {
  HeartRateBpm?: { Value: number };
  Time?: string;
  DistanceMeters?: number;
  Speed?: number;
  Cadence?: number;
  [key: string]: any;
}

interface Lap {
  DistanceMeters: number;
  Cadence: number;
  Track: TrackPoint[];
  TotalTimeSeconds: number;
  MaximumSpeed: number;
  Calories: number;
  AverageHeartRateBpm: { Value: number };
  MaximumHeartRateBpm: { Value: number };
  Intensity: string;
  TriggerMethod: string;
  "@_StartTime": string;
}

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
  const hrIntensity = Math.max(0, Math.min(1, (hr - config.floorHR) / hrRange));

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

function enhanceTrackDataWithSpeedDistance(
  trackPoints: TrackPoint[],
  targetLapDistance: number
): TrackPoint[] {
  if (!trackPoints || trackPoints.length === 0) {
    return [];
  }

  const config: SpeedDistanceConfig = {
    restingHR: 60,
    maxHR: 190,
    floorHR: 90, // Below this, assume on sideline
    maxSpeed: 8.5, // ~19 mph max sprint speed
    minActiveSpeed: 1.5, // ~3.4 mph walking
    speedVariability: 0.3,
  };

  // Calculate speeds for each trackpoint
  const enhancedPoints = trackPoints.map((tp) => {
    const hr = tp?.HeartRateBpm?.Value || 0;
    const speed = calculateSpeedFromHR(hr, config);

    return {
      ...tp,
      Speed: speed,
      Cadence: speed > 0 ? Math.round(75 + speed * 5) : 0, // Rough cadence estimation
    };
  });

  // Calculate time intervals and distances
  let cumulativeDistance = 0;
  const pointsWithDistance = enhancedPoints.map((tp, index) => {
    let distanceIncrement = 0;

    if (index > 0 && tp.Speed > 0) {
      // Assume 1 second intervals if no time data available
      const timeInterval = 1; // seconds
      distanceIncrement = tp.Speed * timeInterval;
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
      Speed: tp.Speed * scaleFactor, // Scale speed proportionally
    }));
  }

  return pointsWithDistance;
}

export function transformLaps(laps: any): Lap[] {
  if (!laps) {
    console.warn("No laps in input data", JSON.stringify(laps));
    return [];
  }

  const lapArray = Array.isArray(laps) ? laps : [laps];

  // Get total distance from environment or default to ~6 miles
  const totalDistance = process.env.DISTANCE
    ? Number(process.env.DISTANCE) * 1609.344
    : 9656.06;

  // Distribute total distance across laps based on activity level
  const lapDistances = distributeDistanceAcrossLaps(lapArray, totalDistance);

  return lapArray.map((lap, index) => {
    const trackPoints = Array.isArray(lap.Track) ? lap.Track : [lap.Track];
    const targetLapDistance = lapDistances[index];

    // Enhance track data with realistic speed and distance
    const enhancedTrackData = enhanceTrackDataWithSpeedDistance(
      trackPoints,
      targetLapDistance
    );

    // Calculate lap statistics
    const speeds = enhancedTrackData
      .map((tp) => tp.Speed)
      .filter((s) => s !== undefined)
      .filter((s) => s > 0);
    const maxSpeed = speeds.length > 0 ? Math.max(...speeds) : 0;
    const avgCadence =
      enhancedTrackData.reduce((sum, tp) => sum + (tp.Cadence || 0), 0) /
      enhancedTrackData.length;

    return {
      DistanceMeters: targetLapDistance,
      Cadence: Math.round(avgCadence),
      Track: enhancedTrackData,
      TotalTimeSeconds: lap.TotalTimeSeconds || enhancedTrackData.length,
      MaximumSpeed: maxSpeed,
      Calories: lap.Calories || Math.round(targetLapDistance * 0.05), // Rough calorie estimate
      AverageHeartRateBpm: lap.AverageHeartRateBpm || { Value: 0 },
      MaximumHeartRateBpm: lap.MaximumHeartRateBpm || { Value: 0 },
      Intensity: lap.Intensity || "Active",
      TriggerMethod: lap.TriggerMethod || "Manual",
      "@_StartTime": lap["@_StartTime"] || new Date().toISOString(),
    };
  });
}
