const https = require('https');

function testCorsProxy() {
    https.get('https://corsproxy.io/?url=' + encodeURIComponent('https://www.facebook.com/facebook/videos/10153231379946729/'), (res) => {
        let data = '';
        res.on('data', chunk => data += chunk);
        res.on('end', () => {
            const match = data.match(/<meta property="og:video"[^>]+content="([^"]+)"/i);
            console.log('FB og:video:', match ? match[1] : 'NOT FOUND');
        });
    });
}
testCorsProxy();
