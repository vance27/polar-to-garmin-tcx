import {
    Author,
    Creator,
    GarminTcxDocument,
    TrainingCenterDatabase,
} from '../types/garmin-zod';
import { z } from 'zod';

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
