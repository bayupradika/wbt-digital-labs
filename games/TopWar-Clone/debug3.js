const puppeteer = require('puppeteer');
const path = require('path');

(async () => {
    const browser = await puppeteer.launch();
    const page = await browser.newPage();
    
    page.on('console', msg => {
        console.log('BROWSER CONSOLE:', msg.type(), msg.text());
    });
    
    page.on('pageerror', err => {
        console.log('BROWSER PAGE ERROR:', err.message);
    });

    const fileUrl = 'file:///' + path.resolve('D:/Produk-Sell/games/TopWar-Clone/index.html').replace(/\\/g, '/');
    await page.goto(fileUrl, { waitUntil: 'networkidle0' });
    
    // Evaluate if the train button has a listener or try to click it
    await page.evaluate(() => {
        let btn = document.getElementById('trainUnitsLeftBtn');
        if (btn) {
            console.log('Button found! Clicking...');
            btn.click();
        } else {
            console.log('Button NOT found!');
        }
        
        let buildBtn = document.getElementById('buildBtn');
        if (buildBtn) {
            console.log('Build Button found! Clicking...');
            buildBtn.click();
        } else {
            console.log('Build Button NOT found!');
        }
    });
    
    await new Promise(r => setTimeout(r, 1000));
    
    await browser.close();
})();
