const puppeteer = require('puppeteer');
const path = require('path');

(async () => {
    const browser = await puppeteer.launch();
    const page = await browser.newPage();
    
    // Set viewport
    await page.setViewport({ width: 1280, height: 720 });
    
    page.on('console', msg => {
        if (msg.type() === 'error') console.log('BROWSER ERROR:', msg.text());
        else console.log('BROWSER CONSOLE:', msg.text());
    });
    page.on('pageerror', err => console.log('BROWSER PAGE ERROR:', err.message));
    page.on('dialog', async dialog => await dialog.dismiss());
    
    const fileUrl = 'file:///' + path.resolve('D:/Produk-Sell/games/TopWar-Clone/index.html').replace(/\\/g, '/');
    await page.goto(fileUrl, { waitUntil: 'networkidle0' });
    
    await page.evaluate(async () => {
        console.log("Starting...");
        gameState.gold = 10000;
        
        // Open build menu
        document.getElementById('buildBtn').click();
        await new Promise(r => setTimeout(r, 100));
        
        // Set qty
        document.getElementById('barrackQty').value = 3;
        
        // Buy Barrack
        document.getElementById('buyBarrackBtn').click();
        await new Promise(r => setTimeout(r, 100));
        
        console.log(`PlacingEntities count: ${placingEntities.length}`);
        placingEntities.forEach((p, i) => console.log(`Placing ${i}: r=${p.r}, c=${p.c}`));
        
        // Confirm
        document.getElementById('confirmPlaceBtn').click();
        await new Promise(r => setTimeout(r, 100));
        
        console.log(`Entities count: ${gameState.entities.length}`);
        gameState.entities.filter(e => e.type === 'barrack').forEach((e, i) => console.log(`Spawned ${i}: r=${e.r}, c=${e.c}`));
        
        // Test panning
        console.log(`isPanning: ${isPanning}`);
    });
    
    await browser.close();
})();
