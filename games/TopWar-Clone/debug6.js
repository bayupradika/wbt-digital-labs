const puppeteer = require('puppeteer');
const path = require('path');

(async () => {
    const browser = await puppeteer.launch();
    const page = await browser.newPage();
    
    // Set viewport to a common desktop size
    await page.setViewport({ width: 1280, height: 720 });
    
    page.on('console', msg => console.log('BROWSER CONSOLE:', msg.text()));
    
    const fileUrl = 'file:///' + path.resolve('D:/Produk-Sell/games/TopWar-Clone/index.html').replace(/\\/g, '/');
    await page.goto(fileUrl, { waitUntil: 'networkidle0' });
    
    // Check bounding box of the build button
    const buildBtnBox = await page.evaluate(() => {
        let btn = document.getElementById('buildBtn');
        let rect = btn.getBoundingClientRect();
        return { x: rect.x, y: rect.y, width: rect.width, height: rect.height };
    });
    console.log("buildBtn box:", buildBtnBox);
    
    // Check what element is at the center of the build button
    const centerPoint = { x: buildBtnBox.x + buildBtnBox.width / 2, y: buildBtnBox.y + buildBtnBox.height / 2 };
    console.log("Center point:", centerPoint);
    
    const elementAtPoint = await page.evaluate((point) => {
        let el = document.elementFromPoint(point.x, point.y);
        return el ? (el.id || el.className || el.tagName) : 'none';
    }, centerPoint);
    console.log("Element at point:", elementAtPoint);
    
    await browser.close();
})();
