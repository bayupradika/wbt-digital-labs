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
    const isVisible = await page.evaluate(() => {
        let buildBtn = document.getElementById('buildBtn');
        let buildMenu = document.getElementById('buildMenu');
        
        console.log('Before click buildMenu classes:', buildMenu.className);
        
        buildBtn.click();
        
        console.log('After click buildMenu classes:', buildMenu.className);
        
        const style = window.getComputedStyle(buildMenu);
        return style.display !== 'none' && style.opacity !== '0' && style.visibility !== 'hidden' && buildMenu.classList.contains('active');
    });
    
    console.log("Is buildMenu visible? ", isVisible);
    
    await browser.close();
})();
