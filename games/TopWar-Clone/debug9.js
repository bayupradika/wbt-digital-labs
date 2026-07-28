const puppeteer = require('puppeteer');
const path = require('path');

(async () => {
    const browser = await puppeteer.launch();
    const page = await browser.newPage();
    
    page.on('console', msg => console.log('BROWSER CONSOLE:', msg.text()));
    
    const fileUrl = 'file:///' + path.resolve('D:/Produk-Sell/games/TopWar-Clone/index.html').replace(/\\/g, '/');
    await page.goto(fileUrl, { waitUntil: 'networkidle0' });
    
    await page.evaluate(() => {
        // Mock a click on a building
        let r = 30, c = 30;
        spawnEntity('barrack', 2, r, c, 1);
        
        let ent = gameState.entities[0];
        console.log("Entity created at:", ent.r, ent.c);
        
        // Find screen position of entity
        let cartX = ent.c * TILE_W;
        let cartY = ent.r * TILE_H;
        let iso = cartToIso(cartX, cartY);
        let screenX = (iso.x + camera.x) * zoom + width / 2;
        let screenY = (iso.y + camera.y) * zoom + height / 2;
        
        console.log("Screen pos:", screenX, screenY);
        
        // Trigger pointerdown
        let downEvent = new PointerEvent('pointerdown', { clientX: screenX, clientY: screenY, bubbles: true });
        canvas.dispatchEvent(downEvent);
        
        console.log("After down draggedEntity id:", draggedEntity ? draggedEntity.id : 'null');
        
        // Trigger pointerup
        let upEvent = new PointerEvent('pointerup', { clientX: screenX, clientY: screenY, bubbles: true });
        canvas.dispatchEvent(upEvent);
        
        console.log("After up, entity:", gameState.entities.length > 0 ? gameState.entities[0].r + ',' + gameState.entities[0].c : 'DELETED');
    });
    
    await browser.close();
})();
