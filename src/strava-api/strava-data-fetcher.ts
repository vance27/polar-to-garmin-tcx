import fs from 'fs/promises';
import path from 'path';
import {
    StravaConfig,
    StravaTokens,
    StravaActivity,
} from './strava-interfaces.js';

const STRAVA_CONFIG: StravaConfig = {
    client_id: process.env.STRAVA_CLIENT_ID || 'your_client_id',
    client_secret: process.env.STRAVA_CLIENT_SECRET || 'your_client_secret',
    redirect_uri: 'http://localhost:3000/callback',
    scope: 'read,activity:read',
};

// Output directory for TCX files
const OUTPUT_DIR = process.env.STRAVA_TCX_OUTPUT_DIR || './strava_tcx_data';

export default class StravaDataFetcher {
    private accessToken: string | null = null;
    private refreshToken: string | null = null;

    async initialize(): Promise<void> {
        // Create output directory if it doesn't exist
        try {
            await fs.mkdir(OUTPUT_DIR, { recursive: true });
        } catch (error) {
            console.error('Error creating output directory:', error);
        }

        // Try to load existing tokens
        await this.loadTokens();
    }

    private async loadTokens(): Promise<void> {
        try {
            const tokenData = await fs.readFile('strava_tokens.json', 'utf8');
            const tokens: StravaTokens = JSON.parse(tokenData);
            this.accessToken = tokens.access_token;
            this.refreshToken = tokens.refresh_token;
            console.log('✓ Loaded existing tokens');
        } catch (error) {
            console.log('No existing tokens found, will need to authenticate');
        }
    }

    private async saveTokens(tokens: StravaTokens): Promise<void> {
        await fs.writeFile(
            'strava_tokens.json',
            JSON.stringify(tokens, null, 2)
        );
        this.accessToken = tokens.access_token;
        this.refreshToken = tokens.refresh_token;
        console.log('✓ Tokens saved');
    }

    async authenticate(): Promise<void> {
        if (!this.accessToken) {
            console.log('\n🔐 Authentication required!');
            console.log(
                '1. Go to: https://www.strava.com/oauth/authorize?' +
                    `client_id=${STRAVA_CONFIG.client_id}&` +
                    `redirect_uri=${STRAVA_CONFIG.redirect_uri}&` +
                    `response_type=code&` +
                    `scope=${STRAVA_CONFIG.scope}`
            );

            console.log(
                '2. After authorization, copy the "code" parameter from the callback URL'
            );
            console.log(
                '3. Set the code as environment variable: STRAVA_AUTH_CODE=your_code'
            );
            console.log('4. Run the script again');

            const authCode = process.env.STRAVA_AUTH_CODE;
            if (!authCode) {
                console.log('❌ STRAVA_AUTH_CODE environment variable not set');
                process.exit(1);
            }

            try {
                const tokenResponse =
                    await this.exchangeCodeForTokens(authCode);
                await this.saveTokens(tokenResponse);
            } catch (error) {
                console.error('❌ Authentication failed:', error);
                process.exit(1);
            }
        }
    }

    private async exchangeCodeForTokens(code: string): Promise<StravaTokens> {
        const response = await fetch('https://www.strava.com/oauth/token', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                client_id: STRAVA_CONFIG.client_id,
                client_secret: STRAVA_CONFIG.client_secret,
                code: code,
                grant_type: 'authorization_code',
            }),
        });

        if (!response.ok) {
            throw new Error(`Token exchange failed: ${response.status}`);
        }

        return (await response.json()) as StravaTokens;
    }

    private async refreshAccessToken(): Promise<StravaTokens> {
        if (!this.refreshToken) {
            throw new Error('No refresh token available');
        }

        const response = await fetch('https://www.strava.com/oauth/token', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                client_id: STRAVA_CONFIG.client_id,
                client_secret: STRAVA_CONFIG.client_secret,
                refresh_token: this.refreshToken,
                grant_type: 'refresh_token',
            }),
        });

        if (!response.ok) {
            throw new Error(`Token refresh failed: ${response.status}`);
        }

        const tokens = (await response.json()) as StravaTokens;
        await this.saveTokens(tokens);
        return tokens;
    }

    private async makeAuthenticatedRequest(
        url: string,
        options: RequestInit = {}
    ): Promise<Response> {
        const requestOptions: RequestInit = {
            ...options,
            headers: {
                Authorization: `Bearer ${this.accessToken}`,
                ...options.headers,
            },
        };

        let response = await fetch(url, requestOptions);

        // If unauthorized, try to refresh token
        if (response.status === 401) {
            console.log('🔄 Access token expired, refreshing...');
            await this.refreshAccessToken();

            requestOptions.headers = {
                ...requestOptions.headers,
                Authorization: `Bearer ${this.accessToken}`,
            };
            response = await fetch(url, requestOptions);
        }

        return response;
    }

    async getAllRunningActivities(): Promise<StravaActivity[]> {
        console.log('📋 Fetching all running activities...');

        const allActivities: StravaActivity[] = [];
        let page = 1;
        const perPage = 100;

        while (true) {
            const response = await this.makeAuthenticatedRequest(
                `https://www.strava.com/api/v3/athlete/activities?page=${page}&per_page=${perPage}`
            );

            if (!response.ok) {
                throw new Error(
                    `Failed to fetch activities: ${response.status}`
                );
            }

            const activities: StravaActivity[] = await response.json();

            if (activities.length === 0) {
                console.log('Break no more activities');
                break; // No more activities
            }

            // Filter for running activities only
            const runningActivities = activities.filter(
                (activity) =>
                    activity.type === 'Run' || activity.sport_type === 'Run'
            );

            allActivities.push(...runningActivities);

            console.log(
                `📄 Page ${page}: Found ${runningActivities.length} running activities (${activities.length} total)`
            );

            page++;

            // Rate limiting - Strava allows 100 requests per 15 minutes
            console.log('sleeping for strava rate limiting');
            await this.sleep(200);
        }

        console.log(
            `✅ Total running activities found: ${allActivities.length}`
        );
        return allActivities;
    }

    private async downloadTCXData(
        activityId: number,
        filename: string
    ): Promise<boolean> {
        console.log(`⬇️  Downloading TCX for activity ${activityId}...`);

        const response = await this.makeAuthenticatedRequest(
            `https://www.strava.com/api/v3/activities/${activityId}/export_tcx`
        );

        if (!response.ok) {
            if (response.status === 404) {
                console.log(
                    `   ⚠️  TCX not available for activity ${activityId}`
                );
                return false;
            }
            throw new Error(
                `Failed to download TCX for activity ${activityId}: ${response.status}`
            );
        }

        const tcxData = await response.text();
        const filePath = path.join(OUTPUT_DIR, filename);

        await fs.writeFile(filePath, tcxData);
        console.log(`   ✅ Saved: ${filename}`);

        return true;
    }

    async downloadAllTCXData(): Promise<void> {
        await this.authenticate();

        const activities = await this.getAllRunningActivities();

        if (activities.length === 0) {
            console.log('❌ No running activities found');
            return;
        }

        console.log(
            `🚀 Starting TCX download for ${activities.length} activities...`
        );

        let successCount = 0;
        let failCount = 0;

        for (const activity of activities) {
            try {
                const filename = `${activity.id}_${activity.start_date.split('T')[0]}_${activity.name?.replace(/[^a-zA-Z0-9]/g, '_') || 'run'}.tcx`;
                const success = await this.downloadTCXData(
                    activity.id,
                    filename
                );

                if (success) {
                    successCount++;
                } else {
                    failCount++;
                }

                // Rate limiting
                await this.sleep(100);
            } catch (error) {
                console.error(
                    `❌ Error downloading activity ${activity.id}:`,
                    error instanceof Error ? error.message : 'Unknown error'
                );
                failCount++;
            }
        }

        console.log(`\n📊 Download Summary:`);
        console.log(`   ✅ Success: ${successCount}`);
        console.log(`   ❌ Failed: ${failCount}`);
        console.log(`   📁 Files saved to: ${OUTPUT_DIR}`);
    }

    private sleep(ms: number): Promise<void> {
        return new Promise((resolve) => setTimeout(resolve, ms));
    }
}
