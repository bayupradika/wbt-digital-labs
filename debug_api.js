const https = require('https');

function testTikWM() {
    https.get('https://www.tikwm.com/api/?url=https://www.tiktok.com/@mrbeast/video/7279318182740921642', (res) => {
        let data = '';
        res.on('data', chunk => data += chunk);
        res.on('end', () => console.log('TikWM:', data.substring(0, 200)));
    });
}

function testCobalt() {
    const data = JSON.stringify({ url: 'https://www.facebook.com/watch/?v=123456789' });
    const req = https.request('https://api.cobalt.tools/api/json', {
        method: 'POST',
        headers: {
            'Accept': 'application/json',
            'Content-Type': 'application/json',
            'User-Agent': 'Mozilla/5.0'
        }
    }, (res) => {
        let responseData = '';
        res.on('data', chunk => responseData += chunk);
        res.on('end', () => console.log('Cobalt:', responseData));
    });
    req.write(data);
    req.end();
}

testTikWM();
testCobalt();
