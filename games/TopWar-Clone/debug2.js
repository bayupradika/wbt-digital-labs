const puppeteer = require('puppeteer');
const path = require('path');

(async () => {
    const browser = await puppeteer.launch();
    const page = await browser.newPage();
    
    // Set a realistic viewport
    await page.setViewport({ width: 1280, height: 720 });

    page.on('console', msg => {
        console.log('BROWSER CONSOLE:', msg.type(), msg.text());
    });
    
    page.on('pageerror', err => {
        console.log('BROWSER PAGE ERROR:', err.message);
    });

    const fileUrl = 'file:///' + path.resolve('D:/Produk-Sell/games/TopWar-Clone/index.html').replace(/\\/g, '/');
    await page.goto(fileUrl, { waitUntil: 'networkidle0' });
    
    // Wait a bit for gameLoop to render
    await new Promise(r => setTimeout(r, 1000));
    
    // Take a screenshot
    await page.screenshot({ path: 'C:/Users/Asus/.gemini/antigravity/brain/eae69e7d-2fa7-4975-b763-08a934ebfc64/scratch/screenshot.png' });
    
    console.log('Screenshot taken at scratch/screenshot.png');
    
    await browser.close();
})();
