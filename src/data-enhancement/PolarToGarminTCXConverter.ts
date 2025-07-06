import {
    XMLParser,
    XMLBuilder,
    X2jOptions,
    XmlBuilderOptions,
} from 'fast-xml-parser';
import { Activity, GarminTcxDocument } from '../types/garmin-zod.js';
import { requireKey } from '../helpers.js';
import { transformLaps } from './track-data-enhancer.js';

export class PolarToGarminTCXConverter {
    private parserOptions: X2jOptions;
    private builderOptions: XmlBuilderOptions;
    private parser: XMLParser;
    private builder: XMLBuilder;

    constructor() {
        this.parserOptions = {
            ignoreAttributes: false,
            attributeNamePrefix: '@_',
            parseAttributeValue: true,
            trimValues: true,
        };

        this.builderOptions = {
            ignoreAttributes: false,
            attributeNamePrefix: '@_',
            format: true,
            suppressEmptyNode: true,
        };

        this.parser = new XMLParser(this.parserOptions);
        this.builder = new XMLBuilder(this.builderOptions);
    }

    public convertPolarToGarmin(polarTcxContent: string): string {
        try {
            // Parse the Polar TCX file
            const parsed = this.parser.parse(polarTcxContent);

            // Transform to Garmin structure
            const tcxData = parsed.TrainingCenterDatabase || parsed;

            // Create Garmin-compatible structure
            const garminData: GarminTcxDocument = {
                '?xml': {
                    '@_version': '1.0',
                    '@_encoding': 'UTF-8',
                },
                TrainingCenterDatabase: {
                    '@_xmlns':
                        'http://www.garmin.com/xmlschemas/TrainingCenterDatabase/v2',
                    '@_xmlns:xsi': 'http://www.w3.org/2001/XMLSchema-instance',
                    '@_xsi:schemaLocation':
                        'http://www.garmin.com/xmlschemas/TrainingCenterDatabase/v2 http://www.garmin.com/xmlschemas/TrainingCenterDatabasev2.xsd',
                    Activities: {
                        Activity: this.transformActivity(
                            tcxData.Activities?.Activity || tcxData.Activity
                        ),
                    },
                    Author: {
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
                    },
                },
            };

            // Build the new TCX content
            return this.builder.build(garminData);
        } catch (err) {
            console.error('Problem converting polar data to garmin', err);
            throw err;
        }
    }

    // Static method for convenience
    public static convertFile(polarTcxContent: string): string {
        const converter = new PolarToGarminTCXConverter();
        return converter.convertPolarToGarmin(polarTcxContent);
    }

    private transformActivity(activity: any): Activity {
        if (!activity) throw new Error('No activity in base document');
        if (Array.isArray(activity))
            throw new Error('Cannot process activity with multiple activities');

        requireKey(activity, 'Id'); //TODO disabled??

        return {
            '@_Sport': activity['@_Sport'] || 'Running',
            Id: activity.Id,
            Lap: transformLaps(activity.Lap),
            Creator: {
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
            },
        };
    }
}

// Default export for easier importing
export default PolarToGarminTCXConverter;
