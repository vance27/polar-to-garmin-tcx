import { XMLParser, XMLBuilder } from "fast-xml-parser";

interface Position {
  LatitudeDegrees: number;
  LongitudeDegrees: number;
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

interface Trackpoint {
  Time: string;
  Position?: Position;
  AltitudeMeters?: number;
  DistanceMeters?: number;
  HeartRateBpm?: HeartRateBpm;
  Extensions?: Extensions;
}

interface Track {
  Trackpoint: Trackpoint[];
}

interface Lap {
  "@_StartTime": string;
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
}

interface Activity {
  "@_Sport": string;
  Id: string;
  Lap: Lap[];
  Notes: string;
  Training: any;
  Creator: any;
}

interface TrainingCenterDatabase {
  "@_xmlns": string;
  "@_xmlns:xsi": string;
  "@_xsi:schemaLocation": string;
  Activities: {
    Activity: Activity[];
  };
  Author: any;
}

export class PolarToGarminTCXConverter {
  private parserOptions: any;
  private builderOptions: any;
  private parser: XMLParser;
  private builder: XMLBuilder;

  constructor() {
    this.parserOptions = {
      ignoreAttributes: false,
      attributeNamePrefix: "@_",
      parseAttributeValue: true,
      parseNodeValue: true,
      trimValues: true,
    };

    this.builderOptions = {
      ignoreAttributes: false,
      attributeNamePrefix: "@_",
      format: true,
      suppressEmptyNode: true,
    };

    this.parser = new XMLParser(this.parserOptions);
    this.builder = new XMLBuilder(this.builderOptions);
  }

  public convertPolarToGarmin(polarTcxContent: string): string {
    // Parse the Polar TCX file
    const parsed = this.parser.parse(polarTcxContent);

    // Transform to Garmin structure
    const garminData = this.transformToGarminStructure(parsed);

    // Build the new TCX content
    return this.builder.build(garminData);
  }

  private transformToGarminStructure(polarData: any): {
    TrainingCenterDatabase: TrainingCenterDatabase;
  } {
    const tcxData = polarData.TrainingCenterDatabase || polarData;

    // Create Garmin-compatible structure
    const garminStructure = {
      TrainingCenterDatabase: {
        "@_xmlns": "http://www.garmin.com/xmlschemas/TrainingCenterDatabase/v2",
        "@_xmlns:xsi": "http://www.w3.org/2001/XMLSchema-instance",
        "@_xsi:schemaLocation":
          "http://www.garmin.com/xmlschemas/TrainingCenterDatabase/v2 http://www.garmin.com/xmlschemas/TrainingCenterDatabasev2.xsd",
        Activities: {
          Activity: this.transformActivity(
            tcxData.Activities?.Activity || tcxData.Activity
          ),
        },
        Author: this.createGarminAuthor(),
      },
    };

    return garminStructure;
  }

  private transformActivity(activity: any): Activity[] {
    if (!activity) return [];

    const activityArray = Array.isArray(activity) ? activity : [activity];

    return activityArray.map((act) => ({
      "@_Sport": act["@_Sport"] || "Running",
      Id: act.Id || this.generateActivityId(),
      Lap: this.transformLaps(act.Lap),
      Notes: act.Notes || "",
      Training: this.createTrainingElement(),
      Creator: this.createGarminCreator(),
    }));
  }

  private transformLaps(laps: any): Lap[] {
    if (!laps) return [];

    const lapArray = Array.isArray(laps) ? laps : [laps];

    return lapArray.map((lap, index) => ({
      "@_StartTime": lap["@_StartTime"] || new Date().toISOString(),
      TotalTimeSeconds: lap.TotalTimeSeconds || 0,
      DistanceMeters: lap.DistanceMeters || 0,
      MaximumSpeed: lap.MaximumSpeed || 0,
      Calories: lap.Calories || 0,
      AverageHeartRateBpm: lap.AverageHeartRateBpm || { Value: 0 },
      MaximumHeartRateBpm: lap.MaximumHeartRateBpm || { Value: 0 },
      Intensity: lap.Intensity || "Active",
      Cadence: lap.Cadence || 0,
      TriggerMethod: lap.TriggerMethod || "Manual",
      Track: this.enhanceTrackData(lap.Track),
    }));
  }

  private enhanceTrackData(track: any): Track {
    if (!track || !track.Trackpoint) return { Trackpoint: [] };

    const trackpoints = Array.isArray(track.Trackpoint)
      ? track.Trackpoint
      : [track.Trackpoint];

    return {
      Trackpoint: trackpoints.map((point, index) =>
        this.enhanceTrackpoint(point, index, trackpoints.length)
      ),
    };
  }

  private enhanceTrackpoint(
    point: any,
    index: number,
    totalPoints: number
  ): Trackpoint {
    const enhanced: Trackpoint = {
      Time: point.Time || this.interpolateTime(index, totalPoints),
      Position: point.Position || this.interpolatePosition(index, totalPoints),
      AltitudeMeters: point.AltitudeMeters || this.interpolateAltitude(index),
      DistanceMeters:
        point.DistanceMeters || this.interpolateDistance(index, totalPoints),
      HeartRateBpm: point.HeartRateBpm || this.interpolateHeartRate(index),
      Extensions: this.createGarminExtensions(point, index),
    };

    return enhanced;
  }

  private interpolateTime(index: number, totalPoints: number): string {
    const baseTime = new Date();
    const intervalSeconds = 1; // 1 second intervals
    return new Date(
      baseTime.getTime() + index * intervalSeconds * 1000
    ).toISOString();
  }

  private interpolatePosition(index: number, totalPoints: number): Position {
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

  private interpolateAltitude(index: number): number {
    // Create gentle elevation changes
    const baseAltitude = 100;
    const variation = 10 * Math.sin(index * 0.1);
    return baseAltitude + variation;
  }

  private interpolateDistance(index: number, totalPoints: number): number {
    // Approximate distance based on position
    const avgSpeed = 3.0; // meters per second
    return index * avgSpeed;
  }

  private interpolateHeartRate(index: number): HeartRateBpm {
    // Create realistic heart rate variation
    const baseHR = 140;
    const variation = 20 * Math.sin(index * 0.05) + (Math.random() - 0.5) * 10;
    return {
      Value: Math.max(60, Math.min(200, Math.round(baseHR + variation))),
    };
  }

  private createGarminExtensions(point: any, index: number): Extensions {
    return {
      "ns3:TPX": {
        "@_xmlns:ns3": "http://www.garmin.com/xmlschemas/ActivityExtension/v2",
        "ns3:Speed": (3.0 + Math.random() * 2).toFixed(2), // Random speed variation
        // "ns3:Watts": Math.round(200 + Math.random() * 100), // Power data
        "ns3:CadenceRPM": Math.round(80 + Math.random() * 20), // Cadence
      },
    };
  }

  private createGarminCreator(): any {
    return {
      "@_xsi:type": "Device_t",
      Name: "Forerunner 645 Music",
      UnitId: 3966577896,
      ProductID: 2888,
      Version: {
        VersionMajor: 7,
        VersionMinor: 20,
        BuildMajor: 0,
        BuildMinor: 0,
      },
    };
  }

  private createGarminAuthor(): any {
    return {
      "@_xsi:type": "Application_t",
      Name: "Garmin Connect",
      Build: {
        Version: {
          VersionMajor: 25,
          VersionMinor: 13,
          BuildMajor: 0,
          BuildMinor: 0,
        },
      },
      LangID: "en",
      PartNumber: "006-D2449-00",
    };
  }

  private createTrainingElement(): any {
    return {
      QuickWorkoutResults: {
        TotalTimeSeconds: 0,
        DistanceMeters: 0,
      },
    };
  }

  private generateActivityId(): string {
    return new Date().toISOString().replace(/[:.]/g, "").slice(0, -1) + "Z";
  }

  // Static method for convenience
  public static convertFile(polarTcxContent: string): string {
    const converter = new PolarToGarminTCXConverter();
    return converter.convertPolarToGarmin(polarTcxContent);
  }
}

// Default export for easier importing
export default PolarToGarminTCXConverter;
