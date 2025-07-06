export interface SpeedDistanceConfig {
    restingHR: number;
    maxHR: number;
    floorHR: number;
    maxSpeed: number; // m/s
    minActiveSpeed: number; // m/s
    speedVariability: number; // 0-1, how much speed varies within HR zones
}
