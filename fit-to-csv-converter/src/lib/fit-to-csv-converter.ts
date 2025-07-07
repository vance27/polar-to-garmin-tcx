import { Decoder, Stream } from '@garmin/fitsdk';
import fs from 'fs/promises';
import path from 'path';

// Interface for clean CSV training data
interface TrainingDataPoint {
    timestamp: string; // ISO timestamp
    activity_id: string; // Unique identifier for the activity
    seconds_into_activity: number; // Time elapsed since start (seconds)
    heart_rate: number | null; // Heart rate in BPM
    speed_mps: number | null; // Speed in meters per second
    pace_min_per_km: number | null; // Pace in minutes per kilometer
    distance_m: number | null; // Cumulative distance in meters
    altitude_m: number | null; // Altitude in meters
    grade_percent: number | null; // Grade/incline percentage
    cadence_rpm: number | null; // Cadence in steps per minute
    power_watts: number | null; // Power in watts (if available)
    temperature_c: number | null; // Temperature in Celsius
    lap_number: number | null; // Current lap number
    position_lat: number | null; // Latitude
    position_long: number | null; // Longitude
    // Derived features for ML
    hr_zone: number | null; // Heart rate zone (1-5)
    speed_zone: number | null; // Speed zone relative to activity
    elevation_change_mps: number | null; // Rate of elevation change
    hr_lag_5s: number | null; // Heart rate 5 seconds ago
    hr_lag_10s: number | null; // Heart rate 10 seconds ago
    speed_smoothed_10s: number | null; // 10-second rolling average speed
    is_uphill: boolean | null; // Whether currently going uphill
    is_interval: boolean | null; // Whether in an interval/tempo section
}

// Configuration for processing
interface ProcessingConfig {
    minHeartRate: number;
    maxHeartRate: number;
    maxHrZone: number;
    minSpeedMps: number;
    maxSpeedMps: number;
    smoothingWindowSeconds: number;
    gradeThreshold: number;
}

class FitToCsvConverter {
    private config: ProcessingConfig;

    constructor(config: Partial<ProcessingConfig> = {}) {
        this.config = {
            minHeartRate: 60,
            maxHeartRate: 220,
            maxHrZone: 220, // Will be set per activity if max HR is available
            minSpeedMps: 0.5, // ~2 min/km pace minimum
            maxSpeedMps: 15, // ~2 min/km pace maximum
            smoothingWindowSeconds: 10,
            gradeThreshold: 2.0, // 2% grade threshold for uphill
            ...config,
        };
    }

    async convertFitFilesToCsv(
        fitDirectory: string,
        outputCsvPath: string
    ): Promise<void> {
        console.log('🔄 Starting FIT to CSV conversion...');

        const fitFiles = await this.getFitFiles(fitDirectory);
        if (fitFiles.length === 0) {
            console.log('❌ No FIT files found in directory');
            return;
        }

        console.log(`📁 Found ${fitFiles.length} FIT files`);

        const allTrainingData: TrainingDataPoint[] = [];

        for (const fitFile of fitFiles) {
            try {
                console.log(`📊 Processing ${path.basename(fitFile)}...`);
                const activityData = await this.processFitFile(fitFile);

                if (activityData.length > 0) {
                    allTrainingData.push(...activityData);
                    console.log(
                        `   ✅ Added ${activityData.length} data points`
                    );
                } else {
                    console.log(`   ⚠️  No valid data points found`);
                }
            } catch (error) {
                console.error(`   ❌ Error processing ${fitFile}:`, error);
            }
        }

        if (allTrainingData.length === 0) {
            console.log('❌ No training data generated');
            return;
        }

        await this.saveToCsv(allTrainingData, outputCsvPath);
        console.log(
            `✅ Conversion complete! ${allTrainingData.length} data points saved to ${outputCsvPath}`
        );
    }

    private async getFitFiles(directory: string): Promise<string[]> {
        const files = await fs.readdir(directory);
        return files
            .filter((file) => file.toLowerCase().endsWith('.fit'))
            .map((file) => path.join(directory, file));
    }

    private async processFitFile(
        filePath: string
    ): Promise<TrainingDataPoint[]> {
        const fitData = await fs.readFile(filePath);

        // Parse the FIT file
        const stream = Stream.fromArrayBuffer(fitData.buffer);
        const decoder = new Decoder(stream);
        const { messages, errors } = decoder.read();
        const parsedData = {
            messages,
        };

        if (!parsedData.messages) {
            throw new Error('No messages found in FIT file');
        }

        const activityId = this.generateActivityId(filePath);
        const recordMessages = parsedData.messages.recordMesgs || [];
        const sessionMessages = parsedData.messages.sessionMesgs || [];
        const lapMessages = parsedData.messages.lapMesgs || [];

        if (recordMessages.length === 0) {
            console.log('   ⚠️  No record messages found');
            return [];
        }

        // Extract activity metadata
        const activityStartTime = this.getActivityStartTime(parsedData);
        const maxHeartRate = this.getMaxHeartRate(sessionMessages);

        // Process record messages into training data
        const trainingData = this.processRecordMessages(
            recordMessages,
            lapMessages,
            activityId,
            activityStartTime,
            maxHeartRate
        );

        // Apply smoothing and feature engineering
        return this.applyFeatureEngineering(trainingData);
    }

    private generateActivityId(filePath: string): string {
        const filename = path.basename(filePath, '.fit');
        return filename.replace(/[^a-zA-Z0-9]/g, '_');
    }

    private getActivityStartTime(parsedData: any): Date {
        if (parsedData.messages.activityMesgs?.[0]?.timestamp) {
            return new Date(parsedData.messages.activityMesgs[0].timestamp);
        }
        if (parsedData.messages.recordMesgs?.[0]?.timestamp) {
            return new Date(parsedData.messages.recordMesgs[0].timestamp);
        }
        return new Date(); // Fallback to current time
    }

    private getMaxHeartRate(sessionMessages: any[]): number {
        for (const session of sessionMessages) {
            if (session.maxHeartRate && session.maxHeartRate > 0) {
                return session.maxHeartRate;
            }
        }
        return this.config.maxHrZone; // Fallback to config
    }

    private processRecordMessages(
        recordMessages: any[],
        lapMessages: any[],
        activityId: string,
        startTime: Date,
        maxHeartRate: number
    ): TrainingDataPoint[] {
        const trainingData: TrainingDataPoint[] = [];
        let previousAltitude: number | null = null;
        let previousTimestamp: Date | null = null;

        for (let i = 0; i < recordMessages.length; i++) {
            const record = recordMessages[i];

            if (!record.timestamp) continue;

            const timestamp = new Date(record.timestamp);
            const secondsIntoActivity = Math.floor(
                (timestamp.getTime() - startTime.getTime()) / 1000
            );

            // Calculate grade if we have altitude data
            let grade: number | null = null;
            let elevationChangeRate: number | null = null;

            if (
                record.altitude &&
                previousAltitude !== null &&
                previousTimestamp
            ) {
                const altitudeChange = record.altitude - previousAltitude;
                const timeChange =
                    (timestamp.getTime() - previousTimestamp.getTime()) / 1000;

                if (timeChange > 0) {
                    elevationChangeRate = altitudeChange / timeChange;

                    // Calculate grade if we have distance or speed
                    if (record.distance && timeChange > 0) {
                        const horizontalDistance =
                            (record.speed || 0) * timeChange;
                        if (horizontalDistance > 0) {
                            grade = (altitudeChange / horizontalDistance) * 100;
                        }
                    }
                }
            }

            const dataPoint: TrainingDataPoint = {
                timestamp: timestamp.toISOString(),
                activity_id: activityId,
                seconds_into_activity: secondsIntoActivity,
                heart_rate: this.cleanHeartRate(record.heartRate),
                speed_mps: this.cleanSpeed(record.speed),
                pace_min_per_km: this.speedToPace(record.speed),
                distance_m: record.distance || null,
                altitude_m: record.altitude || null,
                grade_percent: grade,
                cadence_rpm: record.cadence || null,
                power_watts: record.power || null,
                temperature_c: record.temperature || null,
                lap_number: this.getCurrentLap(lapMessages, timestamp),
                position_lat: record.positionLat
                    ? record.positionLat * (180 / Math.pow(2, 31))
                    : null,
                position_long: record.positionLong
                    ? record.positionLong * (180 / Math.pow(2, 31))
                    : null,
                hr_zone: this.calculateHrZone(record.heartRate, maxHeartRate),
                speed_zone: null, // Will be calculated later
                elevation_change_mps: elevationChangeRate,
                hr_lag_5s: null, // Will be calculated later
                hr_lag_10s: null, // Will be calculated later
                speed_smoothed_10s: null, // Will be calculated later
                is_uphill:
                    grade !== null ? grade > this.config.gradeThreshold : null,
                is_interval: null, // Will be calculated later
            };

            trainingData.push(dataPoint);

            previousAltitude = record.altitude || previousAltitude;
            previousTimestamp = timestamp;
        }

        return trainingData;
    }

    private cleanHeartRate(hr: number): number | null {
        if (
            !hr ||
            hr < this.config.minHeartRate ||
            hr > this.config.maxHeartRate
        ) {
            return null;
        }
        return hr;
    }

    private cleanSpeed(speed: number): number | null {
        if (
            !speed ||
            speed < this.config.minSpeedMps ||
            speed > this.config.maxSpeedMps
        ) {
            return null;
        }
        return speed;
    }

    private speedToPace(speedMps: number): number | null {
        if (!speedMps || speedMps <= 0) return null;

        const paceSecondsPerKm = 1000 / speedMps;
        return paceSecondsPerKm / 60; // Convert to minutes per km
    }

    private getCurrentLap(lapMessages: any[], timestamp: Date): number | null {
        for (let i = 0; i < lapMessages.length; i++) {
            const lap = lapMessages[i];
            if (lap.startTime && lap.timestamp) {
                const lapStart = new Date(lap.startTime);
                const lapEnd = new Date(lap.timestamp);

                if (timestamp >= lapStart && timestamp <= lapEnd) {
                    return i + 1;
                }
            }
        }
        return null;
    }

    private calculateHrZone(
        heartRate: number,
        maxHeartRate: number
    ): number | null {
        if (!heartRate || !maxHeartRate) return null;

        const hrPercent = (heartRate / maxHeartRate) * 100;

        if (hrPercent < 60) return 1;
        if (hrPercent < 70) return 2;
        if (hrPercent < 80) return 3;
        if (hrPercent < 90) return 4;
        return 5;
    }

    private applyFeatureEngineering(
        data: TrainingDataPoint[]
    ): TrainingDataPoint[] {
        if (data.length === 0) return data;

        // Calculate speed zones for this activity
        const validSpeeds = data
            .map((d) => d.speed_mps)
            .filter((s) => s !== null) as number[];
        const speedQuartiles = this.calculateQuartiles(validSpeeds);

        // Apply lag features and smoothing
        for (let i = 0; i < data.length; i++) {
            const point = data[i];

            // Speed zone
            if (point.speed_mps !== null) {
                point.speed_zone = this.getSpeedZone(
                    point.speed_mps,
                    speedQuartiles
                );
            }

            // Heart rate lag features
            if (i >= 5) {
                point.hr_lag_5s = data[i - 5].heart_rate;
            }
            if (i >= 10) {
                point.hr_lag_10s = data[i - 10].heart_rate;
            }

            // Smoothed speed (10-second rolling average)
            point.speed_smoothed_10s = this.calculateRollingAverage(
                data,
                i,
                'speed_mps',
                this.config.smoothingWindowSeconds
            );

            // Interval detection (simple heuristic: speed > 75th percentile)
            if (point.speed_mps !== null && speedQuartiles.q3) {
                point.is_interval = point.speed_mps > speedQuartiles.q3;
            }
        }

        return data;
    }

    private calculateQuartiles(values: number[]): {
        q1: number;
        q2: number;
        q3: number;
    } {
        const sorted = values.sort((a, b) => a - b);
        const q1Index = Math.floor(sorted.length * 0.25);
        const q2Index = Math.floor(sorted.length * 0.5);
        const q3Index = Math.floor(sorted.length * 0.75);

        return {
            q1: sorted[q1Index],
            q2: sorted[q2Index],
            q3: sorted[q3Index],
        };
    }

    private getSpeedZone(
        speed: number,
        quartiles: { q1: number; q2: number; q3: number }
    ): number {
        if (speed <= quartiles.q1) return 1;
        if (speed <= quartiles.q2) return 2;
        if (speed <= quartiles.q3) return 3;
        return 4;
    }

    private calculateRollingAverage(
        data: TrainingDataPoint[],
        currentIndex: number,
        field: keyof TrainingDataPoint,
        windowSize: number
    ): number | null {
        const startIndex = Math.max(0, currentIndex - windowSize + 1);
        const values: number[] = [];

        for (let i = startIndex; i <= currentIndex; i++) {
            const value = data[i][field];
            if (typeof value === 'number') {
                values.push(value);
            }
        }

        if (values.length === 0) return null;

        return values.reduce((sum, val) => sum + val, 0) / values.length;
    }

    private async saveToCsv(
        data: TrainingDataPoint[],
        outputPath: string
    ): Promise<void> {
        const headers = Object.keys(data[0]).join(',');
        const csvRows = data.map((point) =>
            Object.values(point)
                .map((value) => {
                    if (value === null) return '';
                    if (typeof value === 'string') return `"${value}"`;
                    if (typeof value === 'boolean') return value ? '1' : '0';
                    return value.toString();
                })
                .join(',')
        );

        const csvContent = [headers, ...csvRows].join('\n');
        await fs.writeFile(outputPath, csvContent);
    }
}

export { FitToCsvConverter, TrainingDataPoint, ProcessingConfig };
