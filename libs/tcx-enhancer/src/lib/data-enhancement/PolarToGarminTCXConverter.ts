import { XMLParser, XMLBuilder } from 'fast-xml-parser';
import { GarminTcxDocument } from '../types/garmin-zod.js';
import { transformActivities } from './track-data-enhancer.js';
import { PolarTcxDocument } from '../types/polar-zod.js';
import { defaultGarminTcxDocument } from './defaults.js';

export class PolarToGarminTCXConverter {
    private parser: XMLParser;
    private builder: XMLBuilder;

    constructor() {
        this.parser = new XMLParser({
            ignoreAttributes: false,
            attributeNamePrefix: '@_',
            parseAttributeValue: true,
            trimValues: true,
        });
        this.builder = new XMLBuilder({
            ignoreAttributes: false,
            attributeNamePrefix: '@_',
            format: true,
            suppressEmptyNode: true,
        });
    }

    public convertPolarToGarmin(polarTcxContent: string): string {
        try {
            // Parse the Polar TCX file
            const parsed = this.parser.parse(polarTcxContent);

            // Parse the raw string in Polar schema
            const polarData = PolarTcxDocument.parse(parsed);

            // Transform the activities (add fake data based on heart rate)
            const activities = transformActivities(
                polarData.TrainingCenterDatabase.Activities.Activity
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
}
