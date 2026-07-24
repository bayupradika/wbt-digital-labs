const fs = require('fs');
let code = fs.readFileSync('D:/Produk-Sell/games/TopWar-Clone/game.js', 'utf8');

// 1. gameState & variables
code = code.replace(/let gameState = \{[\s\S]*?\};[\s\S]*?let placingEntity = null;/, 
`let gameState = {
    gold: 50000,
    gems: 100000,
    level: 5,
    exp: 4650,
    maxExp: 6570,
    power: 3235,
    entities: []
};
let placingEntities = [];`);

// 2. updateHUD
code = code.replace(/function updateHUD\(\) \{[\s\S]*?\}/,
`function formatNumber(num) {
    if (num >= 1000000) return (num / 1000000).toFixed(1).replace(/\\.0$/, '') + 'M';
    if (num >= 1000) return (num / 1000).toFixed(2).replace(/\\.00$/, '').replace(/0$/, '') + 'K';
    return num.toString();
}

function updateHUD() {
    let goldEl = document.getElementById('goldText');
    if(goldEl) goldEl.innerText = formatNumber(gameState.gold);
    
    let gemEl = document.getElementById('gemText');
    if(gemEl) gemEl.innerText = formatNumber(gameState.gems);
    
    let lvlEl = document.getElementById('levelText');
    if(lvlEl) lvlEl.innerText = gameState.level;
    
    let powEl = document.getElementById('powerText');
    if(powEl) powEl.innerText = gameState.power.toLocaleString();
    
    let expPct = Math.min(100, (gameState.exp / gameState.maxExp) * 100);
    let barEl = document.getElementById('expBar');
    if(barEl) barEl.style.width = expPct + '%';
    
    let curEl = document.getElementById('expCurrentText');
    if(curEl) curEl.innerText = formatNumber(gameState.exp);
    
    let maxEl = document.getElementById('expMaxText');
    if(maxEl) maxEl.innerText = formatNumber(gameState.maxExp);
    
    let nextLvlEl = document.getElementById('nextLevelText');
    if(nextLvlEl) nextLvlEl.innerText = gameState.level + 1;
    
    let reqEl = document.getElementById('expReqText');
    if(reqEl) reqEl.innerText = formatNumber(gameState.maxExp - gameState.exp);
}

// Add event listener for exp container if not already added
if (!window.expEvtAdded) {
    window.addEventListener('DOMContentLoaded', () => {
        let ec = document.getElementById('expContainer');
        if(ec) {
            ec.addEventListener('click', () => {
                let tt = document.getElementById('expTooltip');
                tt.style.display = tt.style.display === 'none' ? 'block' : 'none';
            });
        }
        
        let tlBtn = document.getElementById('trainUnitsLeftBtn');
        if(tlBtn) {
            tlBtn.addEventListener('click', () => {
                let maxLevel = 0;
                for (let e of gameState.entities) {
                    if (e.type === 'barrack' && e.level > maxLevel) maxLevel = e.level;
                }
                if (maxLevel === 0) {
                    alert("Bangun Barrack terlebih dahulu!");
                    return;
                }
                let cost = 100;
                let actualMax = Math.min(10, Math.floor(gameState.gold / cost));
                if (actualMax === 0) {
                    alert("Koin emas tidak cukup!");
                    return;
                }
                let center = Math.floor(GRID_SIZE / 2);
                let found = 0;
                let r = center, c = center, dr = 1, dc = 0, segmentLen = 1, segmentPassed = 0;
                for (let i = 0; i < 1000 && found < actualMax; i++) {
                    if (canPlace(r, c, 1)) {
                        spawnEntity('army', 1, r, c, maxLevel);
                        gameState.gold -= cost;
                        found++;
                    }
                    r += dr; c += dc;
                    segmentPassed++;
                    if (segmentPassed === segmentLen) {
                        segmentPassed = 0;
                        let t = dr; dr = -dc; dc = t;
                        if (dc === 0) segmentLen++;
                    }
                }
                updateHUD();
            });
        }
    });
    window.expEvtAdded = true;
}`);

// 3. pointer down placing entities
code = code.replace(/if \(placingEntity\) \{[\s\S]*?return;\n        \}\n    \}/, 
`if (placingEntities.length > 0) {
        let gridPos = getMouseGrid(x, y);
        let clickedP = placingEntities.find(p => gridPos.r >= p.r && gridPos.r < p.r + p.size && gridPos.c >= p.c && gridPos.c < p.c + p.size);
        if (clickedP) {
            draggedEntity = clickedP;
            dragStartGrid = { r: clickedP.r, c: clickedP.c };
            return;
        }
    }`);

// 4. pointer up placing entities
code = code.replace(/if \(placingEntity && draggedEntity === placingEntity\) \{[\s\S]*?\} else \{/, 
`let isPlacing = placingEntities.find(p => p.id === draggedEntity.id);
            if (isPlacing) {
                let overlap = placingEntities.find(op => op.id !== draggedEntity.id && finalR < op.r + op.size && finalR + size > op.r && finalC < op.c + op.size && finalC + size > op.c);
                if (!overlap && canPlace(finalR, finalC, size, draggedEntity.id)) {
                    isPlacing.r = finalR;
                    isPlacing.c = finalC;
                } else {
                    isPlacing.r = dragStartGrid.r;
                    isPlacing.c = dragStartGrid.c;
                }
            } else {`);

// 5. buyStructure
code = code.replace(/function buyStructure\(type, size, cost\) \{[\s\S]*?alert\("Not enough gold!"\);\n    \}\n\}/, 
`function buyStructure(type, size, cost) {
    document.getElementById('buildMenu').classList.remove('active');
    let maxToBuy = 10;
    let actualMax = Math.min(maxToBuy, Math.floor(gameState.gold / cost));
    if (actualMax === 0) {
        alert("Koin emas tidak cukup!");
        return;
    }
    
    let center = Math.floor(GRID_SIZE / 2);
    let foundArr = [];
    let r = center, c = center, dr = 1, dc = 0, segmentLen = 1, segmentPassed = 0;
    for (let i = 0; i < 400 && foundArr.length < actualMax; i++) {
        if (canPlace(r, c, size)) {
            let overlap = false;
            for (let f of foundArr) {
                if (r < f.r + size && r + size > f.r && c < f.c + size && c + size > f.c) {
                    overlap = true; break;
                }
            }
            if (!overlap) foundArr.push({r, c});
        }
        r += dr; c += dc;
        segmentPassed++;
        if (segmentPassed === segmentLen) {
            segmentPassed = 0;
            let t = dr; dr = -dc; dc = t;
            if (dc === 0) segmentLen++;
        }
    }
    
    if (foundArr.length === 0) {
        alert("Tidak ada lahan kosong!");
        return;
    }
    
    placingEntities = foundArr.map((pos, idx) => ({
        id: 'place_tmp_' + idx,
        type: type,
        size: size,
        cost: cost,
        level: 1,
        r: pos.r,
        c: pos.c
    }));
    
    let cartX = foundArr[0].c * TILE_W;
    let cartY = foundArr[0].r * TILE_H;
    let iso = cartToIso(cartX, cartY);
    camera.x = -iso.x;
    camera.y = -(iso.y + TILE_H*size/2);

    document.getElementById('placementUI').style.display = 'flex';
}`);

// 6. confirmPlaceBtn and cancelPlaceBtn
code = code.replace(/document\.getElementById\('confirmPlaceBtn'\)\.addEventListener\('click', \(\) => \{[\s\S]*?\}\);\n\ndocument\.getElementById\('cancelPlaceBtn'\)\.addEventListener\('click', \(\) => \{[\s\S]*?\}\);/,
`document.getElementById('confirmPlaceBtn').addEventListener('click', () => {
    if (placingEntities.length > 0) {
        let valid = true;
        for (let p of placingEntities) {
            if (!canPlace(p.r, p.c, p.size)) valid = false;
            for (let op of placingEntities) {
                if (p.id !== op.id && p.r < op.r + op.size && p.r + p.size > op.r && p.c < op.c + op.size && p.c + p.size > op.c) valid = false;
            }
        }
        
        if (!valid) {
            alert("Posisi tidak valid!");
            return;
        }
        
        for (let p of placingEntities) {
            gameState.gold -= p.cost;
            spawnEntity(p.type, p.size, p.r, p.c, p.level);
        }
        updateHUD();
        placingEntities = [];
        document.getElementById('placementUI').style.display = 'none';
    }
});

document.getElementById('cancelPlaceBtn').addEventListener('click', () => {
    placingEntities = [];
    document.getElementById('placementUI').style.display = 'none';
});`);

// 7. rendering pre-process
code = code.replace(/let entitiesToDraw = \[\.\.\.gameState\.entities\];\n    if \(placingEntity\) \{\n        entitiesToDraw\.push\(placingEntity\);\n    \}/,
`let entitiesToDraw = [...gameState.entities];
    for (let p of placingEntities) {
        entitiesToDraw.push(p);
    }`);

// 8. rendering drag
code = code.replace(/\/\/ If dragging, smoothly follow the mouse\n        if \(draggedEntity && e\.id === draggedEntity\.id && !placingEntity\) \{[\s\S]*?centerIsoY = iso\.y \+ \(TILE_H\/2 \* e\.size\); \n        \}/,
`// If dragging, smoothly follow the mouse
        if (draggedEntity && e.id === draggedEntity.id) {
            let dx = (mouse.x - startPan.x) / zoom;
            let dy = (mouse.y - startPan.y) / zoom;
            
            centerIsoX += dx;
            centerIsoY += dy;
            iso.x += dx;
            iso.y += dy;
            
            let updatedCart = isoToCart(iso.x, iso.y);
            cartX = updatedCart.x;
            cartY = updatedCart.y;
        }`);

// 9. rendering overlap visualization
code = code.replace(/\/\/ Placement Validation Overlay\n        if \(placingEntity && e\.id === placingEntity\.id\) \{[\s\S]*?ctx\.fillRect\(0, 0, TILE_W \* e\.size, TILE_H \* e\.size\);\n        \}/,
`// Placement Validation Overlay
        let isPlacing = placingEntities.find(p => p.id === e.id);
        if (isPlacing) {
            let checkR = e.r;
            let checkC = e.c;
            if (draggedEntity && draggedEntity.id === e.id) {
                let deltaR = hoveredGrid.r - dragStartMouseGrid.r;
                let deltaC = hoveredGrid.c - dragStartMouseGrid.c;
                checkR = dragStartGrid.r + deltaR;
                checkC = dragStartGrid.c + deltaC;
            }
            let overlap = placingEntities.find(op => op.id !== e.id && checkR < op.r + op.size && checkR + e.size > op.r && checkC < op.c + op.size && checkC + e.size > op.c);
            let valid = !overlap && canPlace(checkR, checkC, e.size, e.id);
            ctx.fillStyle = valid ? 'rgba(0, 255, 0, 0.4)' : 'rgba(255, 0, 0, 0.4)';
            ctx.fillRect(0, 0, TILE_W * e.size, TILE_H * e.size);
        }`);
        
// 10. Placement UI positioning
code = code.replace(/if \(placingEntity && placementUI\.style\.display !== 'none'\) \{[\s\S]*?let cartX = placingEntity\.c \* TILE_W;[\s\S]*?let cartY = placingEntity\.r \* TILE_H;[\s\S]*?let iso = cartToIso\(cartX, cartY\);[\s\S]*?let screenX = \(iso\.x \+ camera\.x\) \* zoom \+ width \/ 2;[\s\S]*?let screenY = \(iso\.y \+ \(TILE_H\/2 \* placingEntity\.size\) \+ camera\.y\) \* zoom \+ height \/ 2;[\s\S]*?placementUI\.style\.left = `\$\{screenX\}px`;[\s\S]*?placementUI\.style\.top = `\$\{screenY \+ 60\}px`;\n    \}/,
`if (placingEntities.length > 0 && placementUI.style.display !== 'none') {
        let firstP = placingEntities[0];
        let cartX = firstP.c * TILE_W;
        let cartY = firstP.r * TILE_H;
        let iso = cartToIso(cartX, cartY);
        let screenX = (iso.x + camera.x) * zoom + width / 2;
        let screenY = (iso.y + (TILE_H/2 * firstP.size) + camera.y) * zoom + height / 2;
        placementUI.style.left = \`\${screenX}px\`;
        placementUI.style.top = \`\${screenY + 60}px\`;
    }`);

fs.writeFileSync('D:/Produk-Sell/games/TopWar-Clone/game.js', code);
console.log("Patched game.js");
