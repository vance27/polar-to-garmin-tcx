import {
    Author,
    Creator,
    GarminTcxDocument,
    TrainingCenterDatabase,
    LatLonAltRad,
    SpeedDistanceConfig,
} from '@ptgt/fitness-zod';
import { z } from 'zod';

export const defaultSpeedDistanceConfig: SpeedDistanceConfig = {
    restingHR: 50,
    maxHR: 196,
    floorHR: 130, // Below this, assume on sideline
    maxSpeed: 8.5, // ~19 mph max sprint speed
    minActiveSpeed: 1.5, // ~3.4 mph walking
    speedVariability: 0.3,
};

export const defaultLatLonAltRad: LatLonAltRad = {
    lat: Number(process.env.LATITUDE ?? 44.970814),
    lon: Number(process.env.LONGITUDE ?? -93.292994),
    altitude: Number(process.env.ALTITUDE ?? 252),
    // radius: 0.00035, used to be in degrees, now in meters
    radius: 40,
};

export const defaultGarminCreator: Creator = {
    '@_xsi:type': 'Device_t',
    Name: 'Forerunner 645 Music',
    UnitId: 3966577896,
    ProductID: 2888,
    Version: {
        VersionMajor: 7,
        VersionMinor: 20,
        BuildMajor: 0,
        BuildMinor: 0,
    },
};

export const defaultGarminAuthor: Author = {
    '@_xsi:type': 'Application_t',
    Name: 'Connect Api',
    Build: {
        Version: {
            VersionMajor: 25,
            VersionMinor: 13,
            BuildMajor: 0,
            BuildMinor: 0,
        },
    },
    LangID: 'en',
    PartNumber: '006-D2449-00',
};

export const GarminTrainingCenterDatabaseOmitActivities =
    TrainingCenterDatabase.omit({ Activities: true });
export type GarminTrainingCenterDatabaseOmitActivities = z.infer<
    typeof GarminTrainingCenterDatabaseOmitActivities
>;
export const defaultGarminTrainingCenterDatabaseOmitActivities: GarminTrainingCenterDatabaseOmitActivities =
    {
        Author: defaultGarminAuthor,
        '@_xmlns': 'http://www.garmin.com/xmlschemas/TrainingCenterDatabase/v2',
        '@_xmlns:xsi': 'http://www.w3.org/2001/XMLSchema-instance',
        '@_xsi:schemaLocation':
            'http://www.garmin.com/xmlschemas/TrainingCenterDatabase/v2 http://www.garmin.com/xmlschemas/TrainingCenterDatabasev2.xsd',
    };

export const GarminTcxDocumentOmitTrainingCenterDatabase =
    GarminTcxDocument.omit({ TrainingCenterDatabase: true });
export type GarminTcxDocumentOmitTrainingCenterDatabase = z.infer<
    typeof GarminTcxDocumentOmitTrainingCenterDatabase
>;

export const defaultGarminTcxDocumentOmitTrainingCenterDatabase: GarminTcxDocumentOmitTrainingCenterDatabase =
    {
        '?xml': {
            '@_version': '1.0',
            '@_encoding': 'UTF-8',
        },
    };

export const TempGarminTcxDocumentDefault = GarminTcxDocument.extend({
    TrainingCenterDatabase: GarminTrainingCenterDatabaseOmitActivities,
});
export type TempGarminTcxDocumentDefault = z.infer<
    typeof TempGarminTcxDocumentDefault
>;
export const defaultGarminTcxDocument: TempGarminTcxDocumentDefault = {
    '?xml': {
        '@_version': '1.0',
        '@_encoding': 'UTF-8',
    },
    TrainingCenterDatabase: {
        ...defaultGarminTrainingCenterDatabaseOmitActivities,
    },
};
