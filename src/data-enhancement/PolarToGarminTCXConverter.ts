import {
    XMLParser,
    XMLBuilder,
    X2jOptions,
    XmlBuilderOptions,
} from 'fast-xml-parser';
import { Activities, GarminTcxDocument } from '../types/garmin-zod.js';
import { transformLap } from './track-data-enhancer.js';
import { PolarActivities, PolarTcxDocument } from '../types/polar-zod.js';
import { defaultGarminCreator, defaultGarminTcxDocument } from './defaults.js';

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

            // Parse the raw string in Polar schema
            const polarData = PolarTcxDocument.parse(parsed);

            const activities = this.transformActivity(
                polarData.TrainingCenterDatabase.Activities
            );

            // Create Garmin-compatible structure
            const garminData: GarminTcxDocument = {
                ...defaultGarminTcxDocument,
                TrainingCenterDatabase: {
                    ...defaultGarminTcxDocument.TrainingCenterDatabase,
                    Activities: activities,
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

    private transformActivity(activities: PolarActivities): Activities {
        const activity = activities.Activity;

        const transformedLap = transformLap(activity.Lap);

        return {
            Activity: {
                '@_Sport': activity['@_Sport'] || 'Running',
                Id: activity.Id,
                Lap: transformedLap,
                Creator: defaultGarminCreator,
            },
        };
    }
}
