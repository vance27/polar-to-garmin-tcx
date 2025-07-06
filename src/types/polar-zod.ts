import { z } from 'zod';

export type PolarXmlDeclaration = z.infer<typeof PolarXmlDeclaration>;
export const PolarXmlDeclaration = z.object({
    '@_version': z.string(),
    '@_encoding': z.string(),
});

export type PolarHeartRateBpm = z.infer<typeof PolarHeartRateBpm>;
export const PolarHeartRateBpm = z.object({
    Value: z.number(),
});

export type PolarExtensions = z.infer<typeof PolarExtensions>;
export const PolarExtensions = z
    .object({
        // Extensions can be empty or contain various structures
    })
    .optional();

export type PolarPosition = z.infer<typeof PolarPosition>;
export const PolarPosition = z.object({
    LatitudeDegrees: z.number(),
    LongitudeDegrees: z.number(),
});

export type PolarTrackpoint = z.infer<typeof PolarTrackpoint>;
export const PolarTrackpoint = z.object({
    Time: z.string(),
    HeartRateBpm: PolarHeartRateBpm.optional(),
    SensorState: z.string().optional(),
    Position: PolarPosition.optional(),
    AltitudeMeters: z.number().optional(),
    DistanceMeters: z.number().optional(),
    Cadence: z.number().optional(),
    Extensions: PolarExtensions.optional(),
});

export type PolarTrack = z.infer<typeof PolarTrack>;
export const PolarTrack = z.object({
    Trackpoint: z.array(PolarTrackpoint),
});

export type PolarLap = z.infer<typeof PolarLap>;
export const PolarLap = z.object({
    TotalTimeSeconds: z.number(),
    DistanceMeters: z.number(),
    Calories: z.number(),
    AverageHeartRateBpm: PolarHeartRateBpm,
    MaximumHeartRateBpm: PolarHeartRateBpm,
    Intensity: z.string(),
    TriggerMethod: z.string(),
    Track: PolarTrack,
    '@_StartTime': z.string(),
});

export type PolarVersion = z.infer<typeof PolarVersion>;
export const PolarVersion = z.object({
    VersionMajor: z.number(),
    VersionMinor: z.number(),
});

export type PolarPlan = z.infer<typeof PolarPlan>;
export const PolarPlan = z.object({
    Extensions: PolarExtensions,
    '@_Type': z.string(),
    '@_IntervalWorkout': z.string(),
});

export type PolarTraining = z.infer<typeof PolarTraining>;
export const PolarTraining = z.object({
    Plan: PolarPlan,
    '@_VirtualPartner': z.string(),
});

export type PolarCreator = z.infer<typeof PolarCreator>;
export const PolarCreator = z.object({
    Name: z.string(),
    UnitId: z.number(),
    ProductID: z.number(),
    Version: PolarVersion,
    '@_xmlns:xsi': z.string().optional(),
    '@_xsi:type': z.string(),
});

export type PolarActivity = z.infer<typeof PolarActivity>;
export const PolarActivity = z.object({
    Id: z.string(),
    Lap: z.array(PolarLap),
    Training: PolarTraining.optional(),
    Creator: PolarCreator,
    '@_Sport': z.string(),
});

export type PolarBuild = z.infer<typeof PolarBuild>;
export const PolarBuild = z.object({
    Version: PolarVersion,
});

export type PolarAuthor = z.infer<typeof PolarAuthor>;
export const PolarAuthor = z.object({
    Name: z.string(),
    Build: PolarBuild,
    LangID: z.string(),
    PartNumber: z.string(),
    '@_xsi:type': z.string(),
    '@_xmlns:xsi': z.string().optional(),
});

export type PolarActivities = z.infer<typeof PolarActivities>;
export const PolarActivities = z.object({
    Activity: PolarActivity,
});

export type PolarTrainingCenterDatabase = z.infer<
    typeof PolarTrainingCenterDatabase
>;
export const PolarTrainingCenterDatabase = z.object({
    Activities: PolarActivities,
    Author: PolarAuthor,
    '@_xmlns': z.string(),
});

export type PolarTcxDocument = z.infer<typeof PolarTcxDocument>;
export const PolarTcxDocument = z.object({
    '?xml': PolarXmlDeclaration,
    TrainingCenterDatabase: PolarTrainingCenterDatabase,
});
