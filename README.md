# Polar HR Data to Garmin TCX

Given polar beat data (hr and timings stored *on device*), generate soccer position data. This is not intended to make "fake" data to hack strava, but instead it is meant to fill in the gaps of recording only via heart rate.

Strava and Garmin can only judge training readiness so much. I prefer the Strava algorithm because it uses heart rate data to calculate "Relative Effort". Garmin is not the same. Without location data and distance information, recommendations for workouts or training readiness can be way off. This is meant to help Garmin be a better tool for people doing activities where they can't wear a watch.

![Alt text](garmin-screenshot.png)

```mermaid
graph TD
    A[Strava Data Export] --> B{File Format}
    B -->|FIT Files| C[FIT to CSV Converter]
    B -->|GPX Files| D[GPX Processing]
    B -->|TCX Files| E[TCX to CSV Converter]
    
    C --> F[CSV Running Data]
    E --> F
    D --> F
    
    F --> G[TensorFlow.js ML Engine]
    G --> H[Linear Regression Model]
    G --> I[Polynomial Regression Model]
    
    H --> J[Distance Prediction Model]
    I --> J
    
    K[Polar Beat HR Data] --> L{TCX Heart Rate Data}
    L --> M[HR Data Processing]
    
    J --> N[Position Data Generator]
    M --> N
    
    N --> O[Augmented TCX File]
    O --> P[Enhanced Garmin TCX Output]
    
    style A fill:#e1f5fe
    style G fill:#f3e5f5
    style J fill:#e8f5e8
    style P fill:#fff3e0
    
    classDef inputData fill:#e3f2fd,stroke:#1976d2,stroke-width:2px
    classDef converter fill:#f1f8e9,stroke:#388e3c,stroke-width:2px
    classDef ml fill:#fce4ec,stroke:#c2185b,stroke-width:2px
    classDef output fill:#fff8e1,stroke:#f57c00,stroke-width:2px
    
    class A,K inputData
    class C,E,N converter
    class G,H,I,J ml
    class P output
```

## Polar tcx to garmin tcx

`npm run start` to run the application. Takes in a input.tcx that can be specified in the .env.local, and outputs a out.tcx that can be specified in the env.local.

## Strava export-tcx

`npm run export-tcx` to run the application. Currently it doesn't really know what it's doing. Strava doesn't want you slamming there api and they prefer to do bulk export via request. Code is written to get activities and attempt to export via the *frontend*. Sigh, it probably makes sense. Code needs some work.

## Fit to tcx converter

TODO - looking to create an app that converts fit files to the tcx standard so that they can be parsed without needing to be in a binary format that needs a special tool to view

## TCX to CSV

Convert the TCX data to CSV for easier regression data creation

## ML on running CSV data

Running linear/polynomial regression to create a model to better assist polar tcx to garmin tcx
