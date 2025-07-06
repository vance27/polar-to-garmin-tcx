import {
    XMLParser,
    XMLBuilder,
    X2jOptions,
    XmlBuilderOptions,
} from 'fast-xml-parser';
import { GarminTcxDocument } from '../types/garmin-zod.js';
import { transformActivities } from './track-data-enhancer.js';
import { PolarTcxDocument } from '../types/polar-zod.js';
import { defaultGarminTcxDocument } from './defaults.js';

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

            // Create Garmin-compatible structure
            const garminData: GarminTcxDocument = {
                ...defaultGarminTcxDocument,
                TrainingCenterDatabase: {
                    ...defaultGarminTcxDocument.TrainingCenterDatabase,
                    Activities: transformActivities(
                        polarData.TrainingCenterDatabase.Activities.Activity
                    ),
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
