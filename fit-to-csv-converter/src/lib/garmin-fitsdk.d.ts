// TypeScript definitions for @garmin/fitsdk
// Based on the official Garmin FIT JavaScript SDK
// GitHub: https://github.com/garmin/fit-javascript-sdk

declare module '@garmin/fitsdk' {
    // Stream class for handling binary FIT data
    export class Stream {
        static fromByteArray(bytes: number[]): Stream;
        static fromArrayBuffer(buffer: ArrayBuffer): Stream;
        static fromBuffer(buffer: Buffer): Stream;
    }

    // Decoder options interface
    export interface DecoderOptions {
        mesgListener?: (messageNumber: number, message: any) => void;
        mesgDefinitionListener?: (mesgDefinition: any) => void;
        fieldDescriptionListener?: (
            key: string,
            developerDataIdMesg: any,
            fieldDescriptionMesg: any
        ) => void;
        applyScaleAndOffset?: boolean;
        expandSubFields?: boolean;
        expandComponents?: boolean;
        convertTypesToStrings?: boolean;
        convertDateTimesToDates?: boolean;
        includeUnknownData?: boolean;
        mergeHeartRates?: boolean;
    }

    // Decoder result interface
    export interface DecoderResult {
        messages: { [messageType: string]: any[] };
        errors: any[];
    }

    // Decoder class for decoding FIT files
    export class Decoder {
        constructor(stream: Stream);

        // Static method to check if stream is a FIT file
        static isFIT(stream: Stream): boolean;

        // Instance method to check if stream is a FIT file
        isFIT(): boolean;

        // Check file integrity
        checkIntegrity(): boolean;

        // Read and decode messages from the FIT file
        read(options?: DecoderOptions): DecoderResult;
    }

    // Encoder class for encoding FIT files
    export class Encoder {
        constructor();

        // Write a message with separate message number and data
        onMesg(mesgNum: number, message: any): void;

        // Write a message with message number included in data
        writeMesg(message: any & { mesgNum: number }): void;

        // Close encoder and return the FIT file as Uint8Array
        close(): Uint8Array;
    }

    // Profile namespace containing FIT protocol definitions
    export namespace Profile {
        // Message numbers
        export const MesgNum: {
            FILE_ID: number;
            CAPABILITIES: number;
            DEVICE_SETTINGS: number;
            USER_PROFILE: number;
            HRM_PROFILE: number;
            SDM_PROFILE: number;
            BIKE_PROFILE: number;
            ZONES_TARGET: number;
            HR_ZONE: number;
            POWER_ZONE: number;
            MET_ZONE: number;
            SPORT: number;
            GOAL: number;
            SESSION: number;
            LAP: number;
            RECORD: number;
            EVENT: number;
            DEVICE_INFO: number;
            WORKOUT: number;
            WORKOUT_STEP: number;
            SCHEDULE: number;
            WEIGHT_SCALE: number;
            COURSE: number;
            COURSE_POINT: number;
            TOTALS: number;
            ACTIVITY: number;
            SOFTWARE: number;
            FILE_CAPABILITIES: number;
            MESG_CAPABILITIES: number;
            FIELD_CAPABILITIES: number;
            FILE_CREATOR: number;
            BLOOD_PRESSURE: number;
            SPEED_ZONE: number;
            MONITORING: number;
            TRAINING_FILE: number;
            HRV: number;
            ANT_RX: number;
            ANT_TX: number;
            ANT_CHANNEL_ID: number;
            LENGTH: number;
            MONITORING_INFO: number;
            PAD: number;
            SLAVE_DEVICE: number;
            CONNECTIVITY: number;
            WEATHER_CONDITIONS: number;
            WEATHER_ALERT: number;
            CADENCE_ZONE: number;
            HR: number;
            SEGMENT_LAP: number;
            MEMO_GLOB: number;
            SEGMENT_ID: number;
            SEGMENT_LEADERBOARD_ENTRY: number;
            SEGMENT_POINT: number;
            SEGMENT_FILE: number;
            WORKOUT_SESSION: number;
            WATCHFACE_SETTINGS: number;
            GPS_METADATA: number;
            CAMERA_EVENT: number;
            TIMESTAMP_CORRELATION: number;
            GYROSCOPE_DATA: number;
            ACCELEROMETER_DATA: number;
            THREE_D_SENSOR_CALIBRATION: number;
            VIDEO_FRAME: number;
            OBDII_DATA: number;
            NMEA_SENTENCE: number;
            AVIATION_ATTITUDE: number;
            VIDEO: number;
            VIDEO_TITLE: number;
            VIDEO_DESCRIPTION: number;
            VIDEO_CLIP: number;
            OHR_SETTINGS: number;
            EXD_SCREEN_CONFIGURATION: number;
            EXD_DATA_FIELD_CONFIGURATION: number;
            EXD_DATA_CONCEPT_CONFIGURATION: number;
            FIELD_DESCRIPTION: number;
            DEVELOPER_DATA_ID: number;
            MAGNETOMETER_DATA: number;
            BAROMETER_DATA: number;
            ONE_D_SENSOR_CALIBRATION: number;
            SET: number;
            STRESS_LEVEL: number;
            DIVE_SETTINGS: number;
            DIVE_GAS: number;
            DIVE_ALARM: number;
            EXERCISE_TITLE: number;
            DIVE_SUMMARY: number;
            JUMP: number;
            CLIMB_PRO: number;
            TANK_UPDATE: number;
            TANK_SUMMARY: number;
            SLEEP_LEVEL: number;
            BODY_BATTERY_EVENT: number;
            RESPIRATION_RATE: number;
            SPLIT: number;
            SPLIT_SUMMARY: number;
            CLIMB_STATS: number;
            HRZONE_CALC: number;
            RECOVERY_HR: number;
            SPEED_POWERZONE_CALC: number;
            POWER_ZONE_CALC: number;
            CADENCE_ZONE_CALC: number;
            TRAINING_EFFECT: number;
            INVALID: number;
            [key: string]: number;
        };

        // Type definitions
        export const types: {
            mesgNum: { [key: number]: string };
            file: { [key: number]: string };
            mesgCount: { [key: number]: string };
            dateTime: { [key: number]: string };
            localDateTime: { [key: number]: string };
            messageIndex: { [key: number]: string };
            deviceIndex: { [key: number]: string };
            gender: { [key: number]: string };
            language: { [key: number]: string };
            languageBits0: { [key: number]: string };
            languageBits1: { [key: number]: string };
            languageBits2: { [key: number]: string };
            languageBits3: { [key: number]: string };
            languageBits4: { [key: number]: string };
            timeZone: { [key: number]: string };
            displayMeasure: { [key: number]: string };
            displayHeart: { [key: number]: string };
            displayPower: { [key: number]: string };
            displayPosition: { [key: number]: string };
            switch: { [key: number]: string };
            sport: { [key: number]: string };
            sportBits0: { [key: number]: string };
            sportBits1: { [key: number]: string };
            sportBits2: { [key: number]: string };
            sportBits3: { [key: number]: string };
            sportBits4: { [key: number]: string };
            sportBits5: { [key: number]: string };
            sportBits6: { [key: number]: string };
            subSport: { [key: number]: string };
            sportEvent: { [key: number]: string };
            activity: { [key: number]: string };
            intensity: { [key: number]: string };
            sessionTrigger: { [key: number]: string };
            autolap: { [key: number]: string };
            lapTrigger: { [key: number]: string };
            timeMode: { [key: number]: string };
            backlight: { [key: number]: string };
            backlightMode: { [key: number]: string };
            event: { [key: number]: string };
            eventType: { [key: number]: string };
            timer: { [key: number]: string };
            fitnessEquipmentState: { [key: number]: string };
            tone: { [key: number]: string };
            autoscroll: { [key: number]: string };
            activityClass: { [key: number]: string };
            hrZoneCalc: { [key: number]: string };
            pwrZoneCalc: { [key: number]: string };
            wktStepDuration: { [key: number]: string };
            wktStepTarget: { [key: number]: string };
            goal: { [key: number]: string };
            goalRecurrence: { [key: number]: string };
            goalSource: { [key: number]: string };
            schedule: { [key: number]: string };
            coursePoint: { [key: number]: string };
            manufacturer: { [key: number]: string };
            garminProduct: { [key: number]: string };
            antplusDeviceType: { [key: number]: string };
            antNetwork: { [key: number]: string };
            workoutCapabilities: { [key: number]: string };
            batteryStatus: { [key: number]: string };
            hrType: { [key: number]: string };
            courseCapabilities: { [key: number]: string };
            weight: { [key: number]: string };
            workoutHr: { [key: number]: string };
            workoutPower: { [key: number]: string };
            bpStatus: { [key: number]: string };
            userLocalId: { [key: number]: string };
            swimStroke: { [key: number]: string };
            activityType: { [key: number]: string };
            activitySubtype: { [key: number]: string };
            activityLevel: { [key: number]: string };
            side: { [key: number]: string };
            leftRightBalance: { [key: number]: string };
            leftRightBalance100: { [key: number]: string };
            lengthType: { [key: number]: string };
            dayOfWeek: { [key: number]: string };
            connectivityCapabilities: { [key: number]: string };
            weatherReport: { [key: number]: string };
            weatherStatus: { [key: number]: string };
            weatherSeverity: { [key: number]: string };
            weatherSevereType: { [key: number]: string };
            timeIntoDay: { [key: number]: string };
            localizedDateTime: { [key: number]: string };
            strokeType: { [key: number]: string };
            locationType: { [key: number]: string };
            displayOrientation: { [key: number]: string };
            workoutEquipment: { [key: number]: string };
            watchfaceMode: { [key: number]: string };
            digitalWatchfaceLayout: { [key: number]: string };
            analogWatchfaceLayout: { [key: number]: string };
            riderPositionType: { [key: number]: string };
            powerPhaseType: { [key: number]: string };
            cameraEventType: { [key: number]: string };
            sensorType: { [key: number]: string };
            bikeAccessoryType: { [key: number]: string };
            bikeAccessoryAlarmType: { [key: number]: string };
            bikeAccessoryLightType: { [key: number]: string };
            bikeAccessoryLightBeamAngleMode: { [key: number]: string };
            bikeAccessoryLightNetworkConfigType: { [key: number]: string };
            commTimeoutType: { [key: number]: string };
            cameraOrientationType: { [key: number]: string };
            attitudeStage: { [key: number]: string };
            attitudeValidity: { [key: number]: string };
            autoSyncFrequency: { [key: number]: string };
            exdLayout: { [key: number]: string };
            exdDisplayType: { [key: number]: string };
            exdDataUnits: { [key: number]: string };
            exdQualifiers: { [key: number]: string };
            exdDescriptors: { [key: number]: string };
            autoActivityDetect: { [key: number]: string };
            supportedExdScreenLayouts: { [key: number]: string };
            fitBaseType: { [key: number]: string };
            turnType: { [key: number]: string };
            bikeLightBeamAngleMode: { [key: number]: string };
            fitBaseUnit: { [key: number]: string };
            setType: { [key: number]: string };
            exerciseCategory: { [key: number]: string };
            benchPressExerciseName: { [key: number]: string };
            calfRaiseExerciseName: { [key: number]: string };
            cardioExerciseName: { [key: number]: string };
            carryExerciseName: { [key: number]: string };
            chopExerciseName: { [key: number]: string };
            coreExerciseName: { [key: number]: string };
            crunchExerciseName: { [key: number]: string };
            curlExerciseName: { [key: number]: string };
            deadliftExerciseName: { [key: number]: string };
            flyeExerciseName: { [key: number]: string };
            hipRaiseExerciseName: { [key: number]: string };
            hipStabilityExerciseName: { [key: number]: string };
            hipSwingExerciseName: { [key: number]: string };
            hyperextensionExerciseName: { [key: number]: string };
            lateralRaiseExerciseName: { [key: number]: string };
            legCurlExerciseName: { [key: number]: string };
            legRaiseExerciseName: { [key: number]: string };
            lungeExerciseName: { [key: number]: string };
            olympicLiftExerciseName: { [key: number]: string };
            plankExerciseName: { [key: number]: string };
            plyoExerciseName: { [key: number]: string };
            pullUpExerciseName: { [key: number]: string };
            pushUpExerciseName: { [key: number]: string };
            rowExerciseName: { [key: number]: string };
            shoulderPressExerciseName: { [key: number]: string };
            shoulderStabilityExerciseName: { [key: number]: string };
            shrugExerciseName: { [key: number]: string };
            sitUpExerciseName: { [key: number]: string };
            squatExerciseName: { [key: number]: string };
            totalBodyExerciseName: { [key: number]: string };
            tricepsExtensionExerciseName: { [key: number]: string };
            warmUpExerciseName: { [key: number]: string };
            runExerciseName: { [key: number]: string };
            waterType: { [key: number]: string };
            tissueModelType: { [key: number]: string };
            diveGasStatus: { [key: number]: string };
            diveAlarmType: { [key: number]: string };
            diveBacklightMode: { [key: number]: string };
            sleepLevel: { [key: number]: string };
            spo2MeasurementType: { [key: number]: string };
            ccr: { [key: number]: string };
            sideType: { [key: number]: string };
            bodyBatteryEventType: { [key: number]: string };
            antChannelId: { [key: number]: string };
            splitType: { [key: number]: string };
            climbProEvent: { [key: number]: string };
            gasConsumptionRateType: { [key: number]: string };
            tapSensitivity: { [key: number]: string };
            radarThreatLevelType: { [key: number]: string };
            maxMetSpeedSource: { [key: number]: string };
            hrZoneCalculation: { [key: number]: string };
            powerZoneCalculation: { [key: number]: string };
            cadenceZoneCalculation: { [key: number]: string };
            trainingEffectType: { [key: number]: string };
            [key: string]: { [key: number]: string };
        };

        // Field definitions
        export const fields: {
            [messageName: string]: {
                [fieldName: string]: {
                    num: number;
                    type: string;
                    scale?: number;
                    offset?: number;
                    units?: string;
                    bits?: string;
                    components?: string[];
                    subFields?: any[];
                    comment?: string;
                };
            };
        };

        // Message definitions
        export const messages: {
            [messageName: string]: {
                num: number;
                fields: string[];
            };
        };
    }

    // Utils namespace containing utility functions and constants
    export namespace Utils {
        // FIT Epoch constant (milliseconds between Unix Epoch and FIT Epoch)
        export const FIT_EPOCH_MS: number;

        // Convert FIT DateTime to JavaScript Date
        export function convertDateTimeToDate(fitDateTime: number): Date;
    }

    // Common message interfaces (based on FIT protocol)
    export interface FileIdMessage {
        type?: string | number;
        manufacturer?: string | number;
        product?: string | number;
        serialNumber?: number;
        timeCreated?: Date | number;
        number?: number;
        productName?: string;
    }

    export interface RecordMessage {
        timestamp?: Date | number;
        positionLat?: number;
        positionLong?: number;
        altitude?: number;
        heartRate?: number;
        cadence?: number;
        distance?: number;
        speed?: number;
        power?: number;
        compressedSpeedDistance?: number;
        grade?: number;
        resistance?: number;
        timeFromCourse?: number;
        cycleLength?: number;
        temperature?: number;
        speed1s?: number[];
        cycles?: number;
        totalCycles?: number;
        compressedAccumulatedPower?: number;
        accumulatedPower?: number;
        leftRightBalance?: number;
        gpsAccuracy?: number;
        verticalSpeed?: number;
        calories?: number;
        verticalOscillation?: number;
        stanceTimePercent?: number;
        stanceTime?: number;
        activityType?: string | number;
        leftTorqueEffectiveness?: number;
        rightTorqueEffectiveness?: number;
        leftPedalSmoothness?: number;
        rightPedalSmoothness?: number;
        combinedPedalSmoothness?: number;
        time128?: number;
        strokeType?: string | number;
        zone?: number;
        ballSpeed?: number;
        cadence256?: number;
        fractionalCadence?: number;
        totalHemoglobinConc?: number;
        totalHemoglobinConcMin?: number;
        totalHemoglobinConcMax?: number;
        saturatedHemoglobinPercent?: number;
        saturatedHemoglobinPercentMin?: number;
        saturatedHemoglobinPercentMax?: number;
        deviceIndex?: number;
        leftPco?: number;
        rightPco?: number;
        leftPowerPhase?: number[];
        leftPowerPhasePeak?: number[];
        rightPowerPhase?: number[];
        rightPowerPhasePeak?: number[];
        enhancedSpeed?: number;
        enhancedAltitude?: number;
        batterySoc?: number;
        motorPower?: number;
        verticalRatio?: number;
        stanceTimeBalance?: number;
        stepLength?: number;
        absolutePressure?: number;
        depth?: number;
        nextStopDepth?: number;
        nextStopTime?: number;
        timeToSurface?: number;
        ndlTime?: number;
        cnsLoad?: number;
        n2Load?: number;
        grit?: number;
        flow?: number;
        ebikeTravelRange?: number;
        ebikeBatteryLevel?: number;
        ebikeAssistMode?: number;
        ebikeAssistLevelPercent?: number;
        coreTemperature?: number;
        [key: string]: any;
    }

    export interface SessionMessage {
        messageIndex?: number;
        timestamp?: Date | number;
        event?: string | number;
        eventType?: string | number;
        startTime?: Date | number;
        startPositionLat?: number;
        startPositionLong?: number;
        sport?: string | number;
        subSport?: string | number;
        totalElapsedTime?: number;
        totalTimerTime?: number;
        totalDistance?: number;
        totalCycles?: number;
        totalCalories?: number;
        totalFatCalories?: number;
        avgSpeed?: number;
        maxSpeed?: number;
        avgHeartRate?: number;
        maxHeartRate?: number;
        avgCadence?: number;
        maxCadence?: number;
        avgPower?: number;
        maxPower?: number;
        totalAscent?: number;
        totalDescent?: number;
        totalTrainingEffect?: number;
        firstLapIndex?: number;
        numLaps?: number;
        eventGroup?: number;
        trigger?: string | number;
        necLat?: number;
        necLong?: number;
        swcLat?: number;
        swcLong?: number;
        name?: string;
        normalizedPower?: number;
        trainingStressScore?: number;
        intensityFactor?: number;
        leftRightBalance?: number;
        avgStrokeCount?: number;
        avgStrokeDistance?: number;
        swimStroke?: string | number;
        poolLength?: number;
        thresholdPower?: number;
        poolLengthUnit?: string | number;
        numActiveLengths?: number;
        totalWork?: number;
        avgAltitude?: number;
        maxAltitude?: number;
        gpsAccuracy?: number;
        avgGrade?: number;
        avgPosGrade?: number;
        avgNegGrade?: number;
        maxPosGrade?: number;
        maxNegGrade?: number;
        avgTemperature?: number;
        maxTemperature?: number;
        totalMovingTime?: number;
        avgPosVerticalSpeed?: number;
        avgNegVerticalSpeed?: number;
        maxPosVerticalSpeed?: number;
        maxNegVerticalSpeed?: number;
        minHeartRate?: number;
        timeInHrZone?: number[];
        timeInSpeedZone?: number[];
        timeInCadenceZone?: number[];
        timeInPowerZone?: number[];
        avgLeftTorqueEffectiveness?: number;
        avgRightTorqueEffectiveness?: number;
        avgLeftPedalSmoothness?: number;
        avgRightPedalSmoothness?: number;
        avgCombinedPedalSmoothness?: number;
        sportIndex?: number;
        timeStanding?: number;
        standCount?: number;
        avgLeftPco?: number;
        avgRightPco?: number;
        avgLeftPowerPhase?: number[];
        avgLeftPowerPhasePeak?: number[];
        avgRightPowerPhase?: number[];
        avgRightPowerPhasePeak?: number[];
        avgPowerPosition?: number[];
        maxPowerPosition?: number[];
        avgCadencePosition?: number[];
        maxCadencePosition?: number[];
        enhancedAvgSpeed?: number;
        enhancedMaxSpeed?: number;
        enhancedAvgAltitude?: number;
        enhancedMinAltitude?: number;
        enhancedMaxAltitude?: number;
        avgLevMotorPower?: number;
        maxLevMotorPower?: number;
        levBatteryConsumption?: number;
        avgVerticalRatio?: number;
        avgStanceTimePercent?: number;
        avgStanceTime?: number;
        avgFractionalCadence?: number;
        maxFractionalCadence?: number;
        totalFractionalCycles?: number;
        avgTotalHemoglobinConc?: number;
        minTotalHemoglobinConc?: number;
        maxTotalHemoglobinConc?: number;
        avgSaturatedHemoglobinPercent?: number;
        minSaturatedHemoglobinPercent?: number;
        maxSaturatedHemoglobinPercent?: number;
        avgLeftPlatformCenterOffset?: number;
        avgRightPlatformCenterOffset?: number;
        avgLeftPowerPhaseAngle?: number[];
        avgRightPowerPhaseAngle?: number[];
        avgLeftPowerPhasePeakAngle?: number[];
        avgRightPowerPhasePeakAngle?: number[];
        avgStanceTimeBalance?: number;
        avgStepLength?: number;
        avgVam?: number;
        avgVerticalOscillation?: number;
        totalGrit?: number;
        totalFlow?: number;
        jumpCount?: number;
        avgGrit?: number;
        avgFlow?: number;
        totalFractionalAscent?: number;
        totalFractionalDescent?: number;
        avgCoreTemperature?: number;
        minCoreTemperature?: number;
        maxCoreTemperature?: number;
        [key: string]: any;
    }

    export interface ActivityMessage {
        timestamp?: Date | number;
        totalTimerTime?: number;
        numSessions?: number;
        type?: string | number;
        event?: string | number;
        eventType?: string | number;
        localTimestamp?: Date | number;
        eventGroup?: number;
        [key: string]: any;
    }

    export interface EventMessage {
        timestamp?: Date | number;
        event?: string | number;
        eventType?: string | number;
        data16?: number;
        data?: number;
        eventGroup?: number;
        score?: number;
        opponentScore?: number;
        frontGearNum?: number;
        frontGear?: number;
        rearGearNum?: number;
        rearGear?: number;
        deviceIndex?: number;
        activityType?: string | number;
        startTimestamp?: Date | number;
        radarThreatLevelMax?: string | number;
        radarThreatCount?: number;
        radarThreatAvgApproachSpeed?: number;
        radarThreatMaxApproachSpeed?: number;
        [key: string]: any;
    }

    export interface DeviceInfoMessage {
        deviceIndex?: number;
        deviceType?: string | number;
        manufacturer?: string | number;
        serialNumber?: number;
        product?: string | number;
        softwareVersion?: number;
        hardwareVersion?: number;
        cumOperatingTime?: number;
        batteryVoltage?: number;
        batteryStatus?: string | number;
        sensorPosition?: string | number;
        descriptor?: string;
        antTransmissionType?: number;
        antDeviceNumber?: number;
        antNetwork?: string | number;
        sourceType?: string | number;
        productName?: string;
        timestamp?: Date | number;
        batteryLevel?: number;
        [key: string]: any;
    }

    export interface HrMessage {
        timestamp?: Date | number;
        fractionalTimestamp?: number;
        time256?: number;
        filteredBpm?: number[];
        eventTimestamp?: number[];
        eventTimestamp12?: number[];
        [key: string]: any;
    }

    export interface WorkoutMessage {
        sport?: string | number;
        capabilities?: number;
        numValidSteps?: number;
        wktName?: string;
        subSport?: string | number;
        poolLength?: number;
        poolLengthUnit?: string | number;
        [key: string]: any;
    }

    export interface WorkoutStepMessage {
        messageIndex?: number;
        wktStepName?: string;
        durationType?: string | number;
        durationValue?: number;
        targetType?: string | number;
        targetValue?: number;
        customTargetValueLow?: number;
        customTargetValueHigh?: number;
        intensity?: string | number;
        notes?: string;
        equipment?: string | number;
        exerciseCategory?: string | number;
        exerciseName?: string | number;
        exerciseWeight?: number;
        weightDisplayUnit?: string | number;
        [key: string]: any;
    }

    export interface UserProfileMessage {
        messageIndex?: number;
        friendlyName?: string;
        gender?: string | number;
        age?: number;
        height?: number;
        weight?: number;
        language?: string | number;
        elevDisplayUnit?: string | number;
        weightDisplayUnit?: string | number;
        restingHeartRate?: number;
        defaultMaxRunningHeartRate?: number;
        defaultMaxBikingHeartRate?: number;
        defaultMaxHeartRate?: number;
        hrSetting?: string | number;
        speedSetting?: string | number;
        distSetting?: string | number;
        powerSetting?: string | number;
        activityClass?: string | number;
        positionSetting?: string | number;
        temperatureSetting?: string | number;
        localId?: number;
        globalId?: number;
        wakeTime?: Date | number;
        sleepTime?: Date | number;
        heightSetting?: string | number;
        userRunningStepLength?: number;
        userWalkingStepLength?: number;
        depthSetting?: string | number;
        diveCount?: number;
        [key: string]: any;
    }

    export interface HrZoneMessage {
        messageIndex?: number;
        highBpm?: number;
        name?: string;
        [key: string]: any;
    }

    export interface PowerZoneMessage {
        messageIndex?: number;
        highValue?: number;
        name?: string;
        [key: string]: any;
    }

    export interface MetZoneMessage {
        messageIndex?: number;
        highBpm?: number;
        calories?: number;
        fatCalories?: number;
        [key: string]: any;
    }

    export interface SpeedZoneMessage {
        messageIndex?: number;
        highValue?: number;
        name?: string;
        [key: string]: any;
    }

    export interface CadenceZoneMessage {
        messageIndex?: number;
        highValue?: number;
        name?: string;
        [key: string]: any;
    }

    export interface SportMessage {
        sport?: string | number;
        subSport?: string | number;
        name?: string;
        [key: string]: any;
    }

    export interface BikeProfileMessage {
        messageIndex?: number;
        name?: string;
        sport?: string | number;
        subSport?: string | number;
        odometer?: number;
        bikeSpdAntId?: number;
        bikeCadAntId?: number;
        bikeSpdcadAntId?: number;
        bikePowerAntId?: number;
        customWheelsize?: number;
        autoWheelsize?: number;
        bikeWeight?: number;
        powerCalFactor?: number;
        autoWheelCal?: boolean;
        autoWheelCalOption?: boolean;
        odometer32?: number;
        bikeSpdAntIdTransType?: number;
        bikeCadAntIdTransType?: number;
        bikeSpdcadAntIdTransType?: number;
        bikePowerAntIdTransType?: number;
        enabled?: boolean;
        bikeSpdEnabled?: boolean;
        bikeCadEnabled?: boolean;
        bikeSpdcadEnabled?: boolean;
        bikePowerEnabled?: boolean;
        crankLength?: number;
        enabled2?: boolean;
        bikeSpdEnabled2?: boolean;
        bikeCadEnabled2?: boolean;
        bikeSpdcadEnabled2?: boolean;
        bikePowerEnabled2?: boolean;
        bikeSpdAntId2?: number;
        bikeCadAntId2?: number;
        bikeSpdcadAntId2?: number;
        bikePowerAntId2?: number;
        bikeSpdAntIdTransType2?: number;
        bikeCadAntIdTransType2?: number;
        bikeSpdcadAntIdTransType2?: number;
        bikePowerAntIdTransType2?: number;
        shiftingEnabled?: boolean;
        [key: string]: any;
    }

    export interface LengthMessage {
        messageIndex?: number;
        timestamp?: Date | number;
        event?: string | number;
        eventType?: string | number;
        startTime?: Date | number;
        totalElapsedTime?: number;
        totalTimerTime?: number;
        totalStrokes?: number;
        avgSpeed?: number;
        swimStroke?: string | number;
        avgSwimmingCadence?: number;
        eventGroup?: number;
        totalCalories?: number;
        lengthType?: string | number;
        playerScore?: number;
        opponentScore?: number;
        strokeCount?: number[];
        zoneCount?: number[];
        enhancedAvgSpeed?: number;
        totalWork?: number;
        avgPower?: number;
        maxPower?: number;
        avgVerticalOscillation?: number;
        avgStanceTimePercent?: number;
        avgStanceTime?: number;
        avgFractionalCadence?: number;
        maxFractionalCadence?: number;
        totalFractionalCycles?: number;
        avgTotalHemoglobinConc?: number;
        minTotalHemoglobinConc?: number;
        maxTotalHemoglobinConc?: number;
        avgSaturatedHemoglobinPercent?: number;
        minSaturatedHemoglobinPercent?: number;
        maxSaturatedHemoglobinPercent?: number;
        avgLeftTorqueEffectiveness?: number;
        avgRightTorqueEffectiveness?: number;
        avgLeftPedalSmoothness?: number;
        avgRightPedalSmoothness?: number;
        avgCombinedPedalSmoothness?: number;
        timeStanding?: number;
        standCount?: number;
        avgLeftPco?: number;
        avgRightPco?: number;
        avgLeftPowerPhase?: number[];
        avgLeftPowerPhasePeak?: number[];
        avgRightPowerPhase?: number[];
        avgRightPowerPhasePeak?: number[];
        avgPowerPosition?: number[];
        maxPowerPosition?: number[];
        avgCadencePosition?: number[];
        maxCadencePosition?: number[];
        avgVerticalRatio?: number;
        avgStanceTimeBalance?: number;
        avgStepLength?: number;
        avgVam?: number;
        totalGrit?: number;
        totalFlow?: number;
        jumpCount?: number;
        avgGrit?: number;
        avgFlow?: number;
        avgCoreTemperature?: number;
        minCoreTemperature?: number;
        maxCoreTemperature?: number;
        [key: string]: any;
    }

    export interface MonitoringMessage {
        timestamp?: Date | number;
        deviceIndex?: number;
        calories?: number;
        distance?: number;
        cycles?: number;
        activeTime?: number;
        activityType?: string | number;
        activitySubtype?: string | number;
        activityLevel?: string | number;
        distance16?: number;
        cycles16?: number;
        activeTime16?: number;
        localTimestamp?: Date | number;
        temperature?: number;
        temperatureMin?: number;
        temperatureMax?: number;
        activityTime?: number[];
        activeCalories?: number;
        currentActivityTypeIntensity?: number;
        timestampMin8?: number;
        timestamp16?: number;
        heartRate?: number;
        intensity?: number;
        durationMin?: number;
        duration?: number;
        ascent?: number;
        descent?: number;
        moderateActivityMinutes?: number;
        vigorousActivityMinutes?: number;
        [key: string]: any;
    }

    export interface CourseMessage {
        sport?: string | number;
        name?: string;
        capabilities?: number;
        subSport?: string | number;
        [key: string]: any;
    }

    export interface CoursePointMessage {
        messageIndex?: number;
        timestamp?: Date | number;
        positionLat?: number;
        positionLong?: number;
        distance?: number;
        type?: string | number;
        name?: string;
        favorite?: boolean;
        [key: string]: any;
    }

    export interface SegmentIdMessage {
        name?: string;
        uuid?: string;
        sport?: string | number;
        enabled?: boolean;
        userProfilePrimaryKey?: number;
        deviceId?: number;
        defaultRaceLeader?: number;
        deleteStatus?: string | number;
        selectionType?: string | number;
        [key: string]: any;
    }

    export interface SegmentLapMessage {
        messageIndex?: number;
        timestamp?: Date | number;
        event?: string | number;
        eventType?: string | number;
        startTime?: Date | number;
        startPositionLat?: number;
        startPositionLong?: number;
        endPositionLat?: number;
        endPositionLong?: number;
        totalElapsedTime?: number;
        totalTimerTime?: number;
        totalDistance?: number;
        totalCycles?: number;
        totalCalories?: number;
        totalFatCalories?: number;
        avgSpeed?: number;
        maxSpeed?: number;
        avgHeartRate?: number;
        maxHeartRate?: number;
        avgCadence?: number;
        maxCadence?: number;
        avgPower?: number;
        maxPower?: number;
        totalAscent?: number;
        totalDescent?: number;
        sport?: string | number;
        eventGroup?: number;
        necLat?: number;
        necLong?: number;
        swcLat?: number;
        swcLong?: number;
        name?: string;
        normalizedPower?: number;
        leftRightBalance?: number;
        subSport?: string | number;
        totalWork?: number;
        avgAltitude?: number;
        maxAltitude?: number;
        gpsAccuracy?: number;
        avgGrade?: number;
        avgPosGrade?: number;
        avgNegGrade?: number;
        maxPosGrade?: number;
        maxNegGrade?: number;
        avgTemperature?: number;
        maxTemperature?: number;
        totalMovingTime?: number;
        avgPosVerticalSpeed?: number;
        avgNegVerticalSpeed?: number;
        maxPosVerticalSpeed?: number;
        maxNegVerticalSpeed?: number;
        timeInHrZone?: number[];
        timeInSpeedZone?: number[];
        timeInCadenceZone?: number[];
        timeInPowerZone?: number[];
        repetitionNum?: number;
        minAltitude?: number;
        minHeartRate?: number;
        activeTime?: number;
        wktStepIndex?: number;
        sportEvent?: string | number;
        avgLeftTorqueEffectiveness?: number;
        avgRightTorqueEffectiveness?: number;
        avgLeftPedalSmoothness?: number;
        avgRightPedalSmoothness?: number;
        avgCombinedPedalSmoothness?: number;
        followsTrackpoint?: boolean;
        totalFractionalCycles?: number;
        avgTotalHemoglobinConc?: number;
        minTotalHemoglobinConc?: number;
        maxTotalHemoglobinConc?: number;
        avgSaturatedHemoglobinPercent?: number;
        minSaturatedHemoglobinPercent?: number;
        maxSaturatedHemoglobinPercent?: number;
        avgLeftPco?: number;
        avgRightPco?: number;
        avgLeftPowerPhase?: number[];
        avgLeftPowerPhasePeak?: number[];
        avgRightPowerPhase?: number[];
        avgRightPowerPhasePeak?: number[];
        avgPowerPosition?: number[];
        maxPowerPosition?: number[];
        avgCadencePosition?: number[];
        maxCadencePosition?: number[];
        manufacturer?: string | number;
        totalGrit?: number;
        totalFlow?: number;
        avgGrit?: number;
        avgFlow?: number;
        totalFractionalAscent?: number;
        totalFractionalDescent?: number;
        [key: string]: any;
    }

    export interface SegmentFileMessage {
        messageIndex?: number;
        fileUuid?: string;
        enabled?: boolean;
        userProfilePrimaryKey?: number;
        leaderType?: string | number[];
        leaderGroupPrimaryKey?: number;
        leaderActivityId?: number;
        leaderActivityIdString?: string;
        defaultRaceLeader?: number;
        [key: string]: any;
    }

    export interface SegmentPointMessage {
        messageIndex?: number;
        positionLat?: number;
        positionLong?: number;
        distance?: number;
        altitude?: number;
        leaderTime?: number[];
        [key: string]: any;
    }

    export interface SegmentLeaderboardEntryMessage {
        messageIndex?: number;
        name?: string;
        type?: string | number;
        groupPrimaryKey?: number;
        activityId?: number;
        segmentTime?: number;
        activityIdString?: string;
        [key: string]: any;
    }

    export interface WeatherConditionsMessage {
        timestamp?: Date | number;
        weatherReport?: string | number;
        temperature?: number;
        condition?: string | number;
        windDirection?: number;
        windSpeed?: number;
        precipitationProbability?: number;
        temperatureFeelsLike?: number;
        relativeHumidity?: number;
        location?: string;
        observedAtTime?: Date | number;
        observedLocationLat?: number;
        observedLocationLong?: number;
        dayOfWeek?: string | number;
        highTemperature?: number;
        lowTemperature?: number;
        [key: string]: any;
    }

    export interface WeatherAlertMessage {
        timestamp?: Date | number;
        reportId?: string;
        issueTime?: Date | number;
        expireTime?: Date | number;
        severity?: string | number;
        type?: string | number;
        [key: string]: any;
    }

    export interface GpsMetadataMessage {
        timestamp?: Date | number;
        timestampMs?: number;
        positionLat?: number;
        positionLong?: number;
        enhancedAltitude?: number;
        enhancedSpeed?: number;
        heading?: number;
        utcTimestamp?: Date | number;
        velocity?: number[];
        [key: string]: any;
    }

    export interface CameraEventMessage {
        timestamp?: Date | number;
        timestampMs?: number;
        cameraEventType?: string | number;
        cameraFileUuid?: string;
        cameraOrientation?: string | number;
        [key: string]: any;
    }

    export interface GyroscopeDataMessage {
        timestamp?: Date | number;
        timestampMs?: number;
        sampleTimeOffset?: number[];
        gyroX?: number[];
        gyroY?: number[];
        gyroZ?: number[];
        calibratedGyroX?: number[];
        calibratedGyroY?: number[];
        calibratedGyroZ?: number[];
        [key: string]: any;
    }

    export interface AccelerometerDataMessage {
        timestamp?: Date | number;
        timestampMs?: number;
        sampleTimeOffset?: number[];
        accelX?: number[];
        accelY?: number[];
        accelZ?: number[];
        calibratedAccelX?: number[];
        calibratedAccelY?: number[];
        calibratedAccelZ?: number[];
        compressedCalibratedAccelX?: number[];
        compressedCalibratedAccelY?: number[];
        compressedCalibratedAccelZ?: number[];
        [key: string]: any;
    }

    export interface MagnetometerDataMessage {
        timestamp?: Date | number;
        timestampMs?: number;
        sampleTimeOffset?: number[];
        magX?: number[];
        magY?: number[];
        magZ?: number[];
        calibratedMagX?: number[];
        calibratedMagY?: number[];
        calibratedMagZ?: number[];
        [key: string]: any;
    }

    export interface BarometerDataMessage {
        timestamp?: Date | number;
        timestampMs?: number;
        sampleTimeOffset?: number[];
        baroPress?: number[];
        [key: string]: any;
    }

    export interface ThreeDSensorCalibrationMessage {
        timestamp?: Date | number;
        sensorType?: string | number;
        calibrationFactor?: number;
        calibrationDivisor?: number;
        levelShift?: number;
        offsetCal?: number[];
        orientationMatrix?: number[];
        [key: string]: any;
    }

    export interface OneDSensorCalibrationMessage {
        timestamp?: Date | number;
        sensorType?: string | number;
        calibrationFactor?: number;
        calibrationDivisor?: number;
        levelShift?: number;
        [key: string]: any;
    }

    export interface VideoFrameMessage {
        timestamp?: Date | number;
        timestampMs?: number;
        frameNumber?: number;
        [key: string]: any;
    }

    export interface ObdiiDataMessage {
        timestamp?: Date | number;
        timestampMs?: number;
        timeOffset?: number[];
        pid?: number;
        rawData?: number[];
        pidDataSize?: number[];
        systemTime?: number[];
        startTimestamp?: Date | number;
        startTimestampMs?: number;
        [key: string]: any;
    }

    export interface NmeaSentenceMessage {
        timestamp?: Date | number;
        timestampMs?: number;
        sentence?: string;
        [key: string]: any;
    }

    export interface AviationAttitudeMessage {
        timestamp?: Date | number;
        timestampMs?: number;
        systemTime?: number[];
        pitch?: number[];
        roll?: number[];
        accelLateral?: number[];
        accelNormal?: number[];
        turnRate?: number[];
        stage?: string | number[];
        attitudeStageComplete?: number[];
        track?: number[];
        validity?: string | number[];
        [key: string]: any;
    }

    export interface VideoMessage {
        url?: string;
        hostingProvider?: string;
        duration?: number;
        [key: string]: any;
    }

    export interface VideoTitleMessage {
        messageIndex?: number;
        messageCount?: number;
        text?: string;
        [key: string]: any;
    }

    export interface VideoDescriptionMessage {
        messageIndex?: number;
        messageCount?: number;
        text?: string;
        [key: string]: any;
    }

    export interface VideoClipMessage {
        clipNumber?: number;
        startTimestamp?: Date | number;
        startTimestampMs?: number;
        endTimestamp?: Date | number;
        endTimestampMs?: number;
        clipStart?: number;
        clipEnd?: number;
        [key: string]: any;
    }

    export interface SetMessage {
        timestamp?: Date | number;
        duration?: number;
        repetitions?: number;
        weight?: number;
        setType?: string | number;
        startTime?: Date | number;
        category?: string | number;
        categorySubtype?: string | number;
        weightDisplayUnit?: string | number;
        messageIndex?: number;
        wktStepIndex?: number;
        [key: string]: any;
    }

    export interface JumpMessage {
        timestamp?: Date | number;
        distance?: number;
        height?: number;
        rotations?: number;
        hangTime?: number;
        score?: number;
        positionLat?: number;
        positionLong?: number;
        speed?: number;
        enhancedSpeed?: number;
        [key: string]: any;
    }

    export interface ClimbProMessage {
        timestamp?: Date | number;
        positionLat?: number;
        positionLong?: number;
        climbProEvent?: string | number;
        climbNumber?: number;
        climbCategory?: number;
        currentDist?: number;
        [key: string]: any;
    }

    export interface SplitMessage {
        messageIndex?: number;
        splitType?: string | number;
        totalElapsedTime?: number;
        totalTimerTime?: number;
        totalDistance?: number;
        avgSpeed?: number;
        startTime?: Date | number;
        totalAscent?: number;
        totalDescent?: number;
        startPositionLat?: number;
        startPositionLong?: number;
        endPositionLat?: number;
        endPositionLong?: number;
        maxSpeed?: number;
        avgHeartRate?: number;
        startElevation?: number;
        endElevation?: number;
        [key: string]: any;
    }

    export interface SplitSummaryMessage {
        messageIndex?: number;
        splitType?: string | number;
        numSplits?: number;
        totalTimerTime?: number;
        totalDistance?: number;
        avgSpeed?: number;
        maxSpeed?: number;
        totalAscent?: number;
        totalDescent?: number;
        avgHeartRate?: number;
        maxHeartRate?: number;
        avgPower?: number;
        maxPower?: number;
        normalizedPower?: number;
        totalWork?: number;
        [key: string]: any;
    }

    export interface SleepLevelMessage {
        timestamp?: Date | number;
        sleepLevel?: string | number;
        [key: string]: any;
    }

    export interface BodyBatteryEventMessage {
        timestamp?: Date | number;
        batteryLevel?: number;
        eventType?: string | number;
        [key: string]: any;
    }

    export interface RespirationRateMessage {
        timestamp?: Date | number;
        respirationRate?: number;
        [key: string]: any;
    }

    export interface StressLevelMessage {
        stressLevelValue?: number;
        stressLevelTime?: Date | number;
        [key: string]: any;
    }

    export interface DiveSettingsMessage {
        messageIndex?: number;
        name?: string;
        model?: string | number;
        gfLow?: number;
        gfHigh?: number;
        waterType?: string | number;
        waterDensity?: number;
        po2Warn?: number;
        po2Critical?: number;
        po2Deco?: number;
        safetyStopEnable: number;
        jumpCount?: number;
        avgGrit?: number;
        avgFlow?: number;
        totalFractionalAscent?: number;
        totalFractionalDescent?: number;
        avgCoreTemperature?: number;
        minCoreTemperature?: number;
        maxCoreTemperature?: number;
        [key: string]: any;
    }

    export interface LapMessage {
        messageIndex?: number;
        timestamp?: Date | number;
        event?: string | number;
        eventType?: string | number;
        startTime?: Date | number;
        startPositionLat?: number;
        startPositionLong?: number;
        endPositionLat?: number;
        endPositionLong?: number;
        totalElapsedTime?: number;
        totalTimerTime?: number;
        totalDistance?: number;
        totalCycles?: number;
        totalCalories?: number;
        totalFatCalories?: number;
        avgSpeed?: number;
        maxSpeed?: number;
        avgHeartRate?: number;
        maxHeartRate?: number;
        avgCadence?: number;
        maxCadence?: number;
        avgPower?: number;
        maxPower?: number;
        totalAscent?: number;
        totalDescent?: number;
        intensity?: string | number;
        lapTrigger?: string | number;
        sport?: string | number;
        eventGroup?: number;
        numLengths?: number;
        normalizedPower?: number;
        leftRightBalance?: number;
        firstLengthIndex?: number;
        avgStrokeCount?: number;
        avgStrokeDistance?: number;
        swimStroke?: string | number;
        subSport?: string | number;
        numActiveLengths?: number;
        totalWork?: number;
        avgAltitude?: number;
        maxAltitude?: number;
        gpsAccuracy?: number;
        avgGrade?: number;
        avgPosGrade?: number;
        avgNegGrade?: number;
        maxPosGrade?: number;
        maxNegGrade?: number;
        avgTemperature?: number;
        maxTemperature?: number;
        totalMovingTime?: number;
        avgPosVerticalSpeed?: number;
        avgNegVerticalSpeed?: number;
        maxPosVerticalSpeed?: number;
        maxNegVerticalSpeed?: number;
        timeInHrZone?: number[];
        timeInSpeedZone?: number[];
        timeInCadenceZone?: number[];
        timeInPowerZone?: number[];
        repetitionNum?: number;
        minAltitude?: number;
        minHeartRate?: number;
        wktStepIndex?: number;
        opponentScore?: number;
        opponentName?: string;
        strokeCount?: number[];
        zoneCount?: number[];
        avgVerticalOscillation?: number;
        avgStanceTimePercent?: number;
        avgStanceTime?: number;
        avgFractionalCadence?: number;
        maxFractionalCadence?: number;
        totalFractionalCycles?: number;
        playerScore?: number;
        avgTotalHemoglobinConc?: number;
        minTotalHemoglobinConc?: number;
        maxTotalHemoglobinConc?: number;
        avgSaturatedHemoglobinPercent?: number;
        minSaturatedHemoglobinPercent?: number;
        maxSaturatedHemoglobinPercent?: number;
        avgLeftTorqueEffectiveness?: number;
        avgRightTorqueEffectiveness?: number;
        avgLeftPedalSmoothness?: number;
        avgRightPedalSmoothness?: number;
        avgCombinedPedalSmoothness?: number;
        timeStanding?: number;
        standCount?: number;
        avgLeftPco?: number;
        avgRightPco?: number;
        avgLeftPowerPhase?: number[];
        avgLeftPowerPhasePeak?: number[];
        avgRightPowerPhase?: number[];
        avgRightPowerPhasePeak?: number[];
        avgPowerPosition?: number[];
        maxPowerPosition?: number[];
        avgCadencePosition?: number[];
        maxCadencePosition?: number[];
        enhancedAvgSpeed?: number;
        enhancedMaxSpeed?: number;
        enhancedAvgAltitude?: number;
        enhancedMinAltitude?: number;
        enhancedMaxAltitude?: number;
        avgLevMotorPower?: number;
        maxLevMotorPower?: number;
        levBatteryConsumption?: number;
        avgVerticalRatio?: number;
        avgStanceTimeBalance?: number;
        avgStepLength?: number;
        avgVam?: number;
        totalGrit?: number;
        totalFlow?: number;
    }
}
