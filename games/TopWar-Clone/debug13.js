const puppeteer = require('puppeteer');
const path = require('path');

(async () => {
    const browser = await puppeteer.launch();
    const page = await browser.newPage();
    
    let errorCount = 0;
    page.on('console', msg => {
        if (msg.type() === 'error') {
            console.log('BROWSER ERROR:', msg.text());
            errorCount++;
        }
    });
    page.on('pageerror', err => {
        console.log('BROWSER PAGE ERROR:', err.message);
        errorCount++;
    });
    
    const fileUrl = 'file:///' + path.resolve('D:/Produk-Sell/games/TopWar-Clone/index.html').replace(/\\/g, '/');
    await page.goto(fileUrl, { waitUntil: 'networkidle0' });
    
    if (errorCount === 0) {
        console.log("No syntax or load errors detected.");
    }
    
    await browser.close();
})();
