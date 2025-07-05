interface XmlDeclaration {
  "@_version": string;
  "@_encoding": string;
}

interface HeartRateBpm {
  Value: number;
}

interface Extensions {
  "ns3:TPX": {
    "@_xmlns:ns3": string;
    "ns3:Speed": string;
    "ns3:Watts"?: number;
    "ns3:CadenceRPM": number;
  };
}

interface Position {
  LatitudeDegrees: number;
  LongitudeDegrees: number;
}

interface Trackpoint {
  Time: string;
  HeartRateBpm?: HeartRateBpm;
  SensorState?: string;
  Position?: Position;
  AltitudeMeters?: number;
  DistanceMeters?: number;
  Cadence?: number;
  Extensions?: Extensions;
}

interface Track {
  Trackpoint: Trackpoint[];
}

interface Lap {
  TotalTimeSeconds: number;
  DistanceMeters: number;
  MaximumSpeed: number;
  Calories: number;
  AverageHeartRateBpm: HeartRateBpm;
  MaximumHeartRateBpm: HeartRateBpm;
  Intensity: string;
  Cadence: number;
  TriggerMethod: string;
  Track: Track;
  "@_StartTime": string;
}

interface Version {
  VersionMajor: number;
  VersionMinor: number;
}

interface Plan {
  Extensions: string;
  "@_Type": string;
  "@_IntervalWorkout": string;
}

interface Training {
  Plan: Plan;
  "@_VirtualPartner": string;
}

interface Creator {
  Name: string;
  UnitId: number;
  ProductID: number;
  Version: Version;
  "@_xmlns:xsi": string;
  "@_xsi:type": string;
}

interface Activity {
  Id: string;
  Lap: Lap[];
  Training: Training;
  Creator: Creator;
  "@_Sport": string;
}

interface Build {
  Version: Version;
}

interface Author {
  Name: string;
  Build: Build;
  LangID: string;
  PartNumber: string;
  "@_xmlns:xsi": string;
  "@_xsi:type": string;
}

interface TrainingCenterDatabase {
  Activities: {
    Activity: Activity;
  };
  Author: Author;
  "@_xmlns": string;
  "@_xmlns:xsi": string;
  "@_xsi:schemaLocation": string;
}

interface GarminTcxDocument {
  "?xml": XmlDeclaration;
  TrainingCenterDatabase: TrainingCenterDatabase;
}

// Export all interfaces
export {
  XmlDeclaration,
  HeartRateBpm,
  Trackpoint,
  Track,
  Lap,
  Version,
  Plan,
  Training,
  Creator,
  Activity,
  Build,
  Author,
  Position,
  Extensions,
  TrainingCenterDatabase,
  GarminTcxDocument,
};
