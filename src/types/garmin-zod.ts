import { z } from 'zod';

export type XmlDeclaration = z.infer<typeof XmlDeclaration>;
export const XmlDeclaration = z.object({
    '@_version': z.string(),
    '@_encoding': z.string(),
});

export type HeartRateBpm = z.infer<typeof HeartRateBpm>;
export const HeartRateBpm = z.object({
    Value: z.number(),
});

export type Extensions = z.infer<typeof Extensions>;
export const Extensions = z.object({
    'ns3:TPX': z.object({
        '@_xmlns:ns3': z.string(),
        'ns3:Speed': z.string(),
        'ns3:Watts': z.number().optional(),
        'ns3:CadenceRPM': z.number(),
    }),
});

export type Position = z.infer<typeof Position>;
export const Position = z.object({
    LatitudeDegrees: z.number(),
    LongitudeDegrees: z.number(),
});

export type Trackpoint = z.infer<typeof Trackpoint>;
export const Trackpoint = z.object({
    Time: z.string(),
    HeartRateBpm: HeartRateBpm.optional(),
    SensorState: z.string().optional(),
    Position: Position.optional(),
    AltitudeMeters: z.number().optional(),
    DistanceMeters: z.number().optional(),
    Cadence: z.number().optional(),
    Extensions: Extensions.optional(),
});

export type Track = z.infer<typeof Track>;
export const Track = z.object({
    Trackpoint: z.array(Trackpoint),
});

export type Lap = z.infer<typeof Lap>;
export const Lap = z.object({
    TotalTimeSeconds: z.number(),
    DistanceMeters: z.number(),
    MaximumSpeed: z.number(),
    Calories: z.number(),
    AverageHeartRateBpm: HeartRateBpm,
    MaximumHeartRateBpm: HeartRateBpm,
    Intensity: z.string(),
    Cadence: z.number(),
    TriggerMethod: z.string(),
    Track: Track,
    '@_StartTime': z.string(),
});

export type Version = z.infer<typeof Version>;
export const Version = z.object({
    VersionMajor: z.number(),
    VersionMinor: z.number(),
    BuildMajor: z.number(),
    BuildMinor: z.number(),
});

export type Plan = z.infer<typeof Plan>;
export const Plan = z.object({
    Extensions: z.string(),
    '@_Type': z.string(),
    '@_IntervalWorkout': z.string(),
});

export type Training = z.infer<typeof Training>;
export const Training = z.object({
    Plan: Plan,
    '@_VirtualPartner': z.string(),
});

export type Creator = z.infer<typeof Creator>;
export const Creator = z.object({
    Name: z.string(),
    UnitId: z.number(),
    ProductID: z.number(),
    Version: Version,
    '@_xmlns:xsi': z.string().optional(),
    '@_xsi:type': z.string(),
});

export type Activity = z.infer<typeof Activity>;
export const Activity = z.object({
    Id: z.string(),
    Lap: z.array(Lap),
    Training: Training.optional(),
    Creator: Creator,
    '@_Sport': z.string(),
});

export type Activities = z.infer<typeof Activities>;
export const Activities = z.object({
    Activity: Activity,
})

export type Build = z.infer<typeof Build>;
export const Build = z.object({
    Version: Version,
});

export type Author = z.infer<typeof Author>;
export const Author = z.object({
    Name: z.string(),
    Build: Build,
    LangID: z.string(),
    PartNumber: z.string(),
    '@_xsi:type': z.string(),
    '@_xmlns:xsi': z.string().optional(),
});

export type TrainingCenterDatabase = z.infer<typeof TrainingCenterDatabase>;
export const TrainingCenterDatabase = z.object({
    Activities: Activities,
    Author: Author,
    '@_xmlns': z.string(),
    '@_xmlns:xsi': z.string(),
    '@_xsi:schemaLocation': z.string(),
});

export type GarminTcxDocument = z.infer<typeof GarminTcxDocument>;
export const GarminTcxDocument = z.object({
    '?xml': XmlDeclaration,
    TrainingCenterDatabase: TrainingCenterDatabase,
});
