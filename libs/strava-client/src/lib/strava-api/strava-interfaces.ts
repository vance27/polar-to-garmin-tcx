// Configuration - Add your Strava API credentials
export interface StravaConfig {
    client_id: string;
    client_secret: string;
    redirect_uri: string;
    scope: string;
}

export interface StravaTokens {
    access_token: string;
    refresh_token: string;
    expires_at: number;
    expires_in: number;
    token_type: string;
}

export interface StravaActivity {
    id: number;
    name: string;
    type: string;
    sport_type: string;
    start_date: string;
    distance: number;
    moving_time: number;
    elapsed_time: number;
    total_elevation_gain: number;
    achievement_count: number;
    kudos_count: number;
    comment_count: number;
    athlete_count: number;
    photo_count: number;
    trainer: boolean;
    commute: boolean;
    manual: boolean;
    private: boolean;
    flagged: boolean;
    gear_id: string | null;
    from_accepted_tag: boolean;
    upload_id: number;
    upload_id_str: string;
    external_id: string;
    average_speed: number;
    max_speed: number;
    average_cadence: number;
    has_heartrate: boolean;
    average_heartrate: number;
    max_heartrate: number;
    heartrate_opt_out: boolean;
    display_hide_heartrate_option: boolean;
    elev_high: number;
    elev_low: number;
    pr_count: number;
    total_photo_count: number;
    has_kudoed: boolean;
}
