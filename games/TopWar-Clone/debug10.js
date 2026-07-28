const puppeteer = require('puppeteer');
const path = require('path');

(async () => {
    const browser = await puppeteer.launch();
    const page = await browser.newPage();
    
    page.on('console', msg => console.log('BROWSER CONSOLE:', msg.text()));
    
    const fileUrl = 'file:///' + path.resolve('D:/Produk-Sell/games/TopWar-Clone/index.html').replace(/\\/g, '/');
    await page.goto(fileUrl, { waitUntil: 'networkidle0' });
    
    await page.evaluate(() => {
        // Mock a placed building
        let r = 30, c = 30;
        spawnEntity('barrack', 2, r, c, 1);
        
        let ent = gameState.entities.find(e => e.type === 'barrack');
        console.log("Entity created at:", ent.r, ent.c);
        console.log("Entities total:", gameState.entities.length);
        
        // Find screen position
        let cartX = ent.c * TILE_W;
        let cartY = ent.r * TILE_H;
        let iso = cartToIso(cartX, cartY);
        let screenX = (iso.x + camera.x) * zoom + width / 2;
        let screenY = (iso.y + camera.y) * zoom + height / 2;
        
        // Click the building
        let downEvent = new PointerEvent('pointerdown', { clientX: screenX, clientY: screenY, bubbles: true });
        canvas.dispatchEvent(downEvent);
        
        // Move the building slightly
        let moveEvent = new PointerEvent('pointermove', { clientX: screenX + 5, clientY: screenY + 5, bubbles: true });
        canvas.dispatchEvent(moveEvent);
        
        // Release
        let upEvent = new PointerEvent('pointerup', { clientX: screenX + 5, clientY: screenY + 5, bubbles: true });
        canvas.dispatchEvent(upEvent);
        
        console.log("Entities after click/move:", gameState.entities.length);
        if (gameState.entities.length > 0) {
            console.log("Entity is at:", gameState.entities[0].r, gameState.entities[0].c);
        }
    });
    
    await browser.close();
})();
