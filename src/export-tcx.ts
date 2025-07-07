import StravaDataFetcher from './strava-api/strava-data-fetcher.js';

// Main execution
async function main(): Promise<void> {
    console.log('🏃‍♂️ Strava TCX Data Fetcher Starting...\n');

    // Check for required environment variables
    if (!process.env.STRAVA_CLIENT_ID || !process.env.STRAVA_CLIENT_SECRET) {
        console.error('❌ Missing required environment variables:');
        console.error('   STRAVA_CLIENT_ID');
        console.error('   STRAVA_CLIENT_SECRET');
        console.error('\nGet these from: https://www.strava.com/settings/api');
        process.exit(1);
    }

    const fetcher = new StravaDataFetcher();

    try {
        await fetcher.initialize();
        await fetcher.downloadAllTCXData();
    } catch (error) {
        console.error('❌ Script failed:', error);
        process.exit(1);
    }
}

main().catch(console.error);
