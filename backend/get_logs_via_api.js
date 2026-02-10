const axios = require('axios');

const API_KEY = 'AQntUCAuhGvqMDlsjBcpOTPTyhjGlSVpLCDELjFOROOwdgZcqnEHGWDdusHrnFP';
const HOST = 'http://187.77.11.79:3000';
const APP_ID = 'xG2KoLPs9vazW92mNwESt'; // Backend App ID from json

async function getLogs() {
    try {
        console.log('Fetching logs...');
        // Dokploy API might use /api/application.logs or similar
        // Based on open source Dokploy code structure or standard Trpc usage
        // It seems Dokploy uses Trpc.
        // Let's try to hit the application.get route first to verify auth.

        // Auth header might be 'Authorization: Bearer ...' or 'api-key: ...'
        // User said "mi api key es...".

        // Let's try standard REST-like endpoints if they exist, or Trpc.
        // Assuming simple REST for now or trial.
        // Actually, looking at Dokploy docs (simulated):
        // POST /trpc/application.logs?batch=1&input={...}

        // Let's try a simple GET /api/application/${APP_ID}/logs if it exists.
        // Or check if we can list projects.

        const res = await axios.get(`${HOST}/api/application/${APP_ID}`, {
            headers: { 'Authorization': `Bearer ${API_KEY}` }
        });
        console.log('App Info:', res.data);

    } catch (err) {
        console.error('Error fetching app info:', err.message);
        if (err.response) {
            console.error('Status:', err.response.status);
            console.error('Data:', err.response.data);
        }
    }
}

// Try to access logs via SSH from Node if API fails?
// No, let's try to SSH from Node using 'ssh2' lib if installed?
// I don't have ssh2 installed. I'll stick to curl/axios.

getLogs();
