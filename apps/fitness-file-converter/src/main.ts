import { FitToCsvConverter } from '@ptgt/fit-to-csv-converter';

const converter = new FitToCsvConverter({
    minHeartRate: 60,
    maxHeartRate: 200, // Adjust to your max HR
    maxHrZone: 190, // Your estimated max HR
    minSpeedMps: 1.0, // ~17 min/km minimum
    maxSpeedMps: 8.0, // ~2 min/km maximum
});

await converter.convertFitFilesToCsv('./fit_files', './training_data.csv');
