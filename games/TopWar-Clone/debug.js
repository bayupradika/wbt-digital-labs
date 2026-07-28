const puppeteer = require('puppeteer');
const path = require('path');

(async () => {
    const browser = await puppeteer.launch();
    const page = await browser.newPage();
    
    page.on('console', msg => {
        if (msg.type() === 'error') {
            console.log('PAGE ERROR:', msg.text());
        }
    });
    
    page.on('pageerror', err => {
        console.log('UNCAUGHT EXCEPTION:', err.message);
    });

    const fileUrl = 'file:///' + path.resolve('D:/Produk-Sell/games/TopWar-Clone/index.html').replace(/\\/g, '/');
    await page.goto(fileUrl, { waitUntil: 'networkidle0' });
    
    // Check if canvas exists and what its size is
    const canvasBox = await page.evaluate(() => {
        const c = document.getElementById('gameCanvas');
        if(!c) return null;
        const rect = c.getBoundingClientRect();
        return { w: rect.width, h: rect.height, zIndex: window.getComputedStyle(c).zIndex };
    });
    
    console.log('Canvas Box:', canvasBox);
    
    await browser.close();
})();
