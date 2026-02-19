const axios = require('axios');

const API_KEY = 'AQntUCAuhGvqMDlsjBcpOTPTyhjGlSVpLCDELjFOROOwdgZcqnEHGWDdusHrnFP'; // Token from user
// The token in dokploy_projects.json is "refreshToken": "BYQoxkcLnQGa3-PdlqWRw" for backend?
// Or "RefreshToken": "CAkOghX4MN-5gMJoJY5Pn" for frontend?
// The user provided "AQnt..." which looks like a Bearer token.
// Let's try both.

const HOST = 'http://187.77.11.79:3000';
const APP_ID = 'xG2KoLPs9vazW92mNwESt'; // Backend

async function deployApp() {
    try {
        console.log('Triggering deployment...');

        // Try with user provided token
        try {
            const res = await axios.post(`${HOST}/api/application.deploy`, {
                applicationId: APP_ID
            }, {
                headers: { 'Authorization': `Bearer ${API_KEY}` }
            });
            console.log('Deploy response:', res.data);
        } catch (e) {
            console.log('Deploy with USER token failed:', e.message);
            if (e.response) console.log(e.response.data);
        }

        // Try with refreshToken from json? (Likely not valid for this endpoint, but worth a shot if it's an API token)
        // Actually, let's try to get logs again with a different endpoint just in case.

    } catch (err) {
        console.error('Error:', err.message);
    }
}

deployApp();
