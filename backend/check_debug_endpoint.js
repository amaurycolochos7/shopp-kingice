const https = require('https');

const url = 'https://kingicegold.com.mx/api/debug-config?key=KingIceDebug2026';

https.get(url, (res) => {
    let data = '';

    res.on('data', (chunk) => {
        data += chunk;
    });

    res.on('end', () => {
        try {
            const json = JSON.parse(data);
            console.log('--- DEBUG INFO ---');
            console.log('DB Status:', json.db_status);
            console.log('DB Error:', json.db_error);
            console.log('DB URL (Masked):', json.db_url_masked);
            console.log('------------------');
        } catch (e) {
            console.error('Error parsing JSON:', e.message);
            console.log('Raw Data:', data);
        }
    });

}).on('error', (err) => {
    console.error('Error fetching URL:', err.message);
});
