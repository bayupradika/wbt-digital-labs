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
        window.logState = () => {
            console.log(`Entities: ${gameState.entities.length}, Panning: ${isPanning}, Cam: ${camera.x},${camera.y}`);
        };
        
        console.log("--- BEFORE BUILD ---");
        logState();
        
        // 1. Open build menu
        document.getElementById('buildBtn').click();
        await new Promise(r => setTimeout(r, 100)); // wait for transition
        
        // 2. Click Buy Barrack
        document.getElementById('buyBarrackBtn').click();
        await new Promise(r => setTimeout(r, 100));
        
        console.log("--- DURING PLACEMENT ---");
        console.log(`PlacingEntities: ${placingEntities.length}`);
        
        // 3. Confirm placement
        document.getElementById('confirmPlaceBtn').click();
        await new Promise(r => setTimeout(r, 100));
        
        console.log("--- AFTER BUILD ---");
        logState();
        if (gameState.entities.length > 0) {
            let ent = gameState.entities[gameState.entities.length - 1];
            console.log(`Spawned Barrack at r:${ent.r}, c:${ent.c}, size:${ent.size}`);
            
            // Try to click the building
            let cartX = ent.c * TILE_W;
            let cartY = ent.r * TILE_H;
            let iso = cartToIso(cartX, cartY);
            let screenX = (iso.x + camera.x) * zoom + width / 2;
            let screenY = (iso.y + camera.y) * zoom + height / 2;
            
            console.log(`Clicking building at screen ${screenX}, ${screenY}`);
            canvas.dispatchEvent(new PointerEvent('pointerdown', { clientX: screenX, clientY: screenY, bubbles: true }));
            canvas.dispatchEvent(new PointerEvent('pointerup', { clientX: screenX, clientY: screenY, bubbles: true }));
            
            logState();
            if (gameState.entities.length > 0) {
                let ent2 = gameState.entities[gameState.entities.length - 1];
                console.log(`Barrack is now at r:${ent2.r}, c:${ent2.c}`);
            }
        }
    });
    
    await browser.close();
})();
