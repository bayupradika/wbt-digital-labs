const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

let width, height;
function resize() {
    width = window.innerWidth;
    height = window.innerHeight;
    canvas.width = width;
    canvas.height = height;
}
window.addEventListener('resize', resize);
resize();

// --- GAME STATE ---
const GRID_SIZE = 60; // Larger board so we can carve a circle out of it
const TILE_W = 60; // Base width of a tile in cartesian
const TILE_H = 60;

// --- ASSETS ---
const ASSETS = {
    barrack: new Image(),
    mine: new Image(),
    soldier: new Image()
};
ASSETS.barrack.src = 'assets/barrack.png';
ASSETS.mine.src = 'assets/goldmine.png';
ASSETS.soldier.src = 'assets/soldier.jpg';

let gameState = {
    gold: 50000,
    gems: 100000,
    level: 5,
    exp: 4650,
    maxExp: 6570,
    power: 3235,
    entities: []
};
let placingEntities = [];
let placementUI = document.getElementById('placementUI');
let selectedEntity = null;

function showContextMenu(ent) {
    selectedEntity = ent;
    const menu = document.getElementById('contextMenu');
    const btn = document.getElementById('contextActionBtn');
    
    if (ent.type === 'barrack') {
        btn.innerHTML = '<i class="fa-solid fa-plus"></i> Latih (100 Gold)';
        btn.onclick = () => recruitArmy(ent);
        menu.style.display = 'block';
    } else if (ent.type === 'mine') {
        btn.innerHTML = '<i class="fa-solid fa-coins"></i> Kumpulkan';
        btn.onclick = () => collectGold(ent);
        menu.style.display = 'block';
    } else {
        menu.style.display = 'none';
    }
}

function recruitArmy(barrack) {
    if (gameState.gold >= 100) {
        // Find empty adjacent 1x1 spot
        let spawned = false;
        for (let dr = -1; dr <= 2; dr++) {
            for (let dc = -1; dc <= 2; dc++) {
                let checkR = barrack.r + dr;
                let checkC = barrack.c + dc;
                if (canPlace(checkR, checkC, 1)) {
                    spawnEntity('army', 1, checkR, checkC, barrack.level);
                    gameState.gold -= 100;
                    updateHUD();
                    spawned = true;
                    break;
                }
            }
            if(spawned) break;
        }
        if(!spawned) alert("Tidak ada ruang kosong di sekitar Barrack!");
    } else {
        alert("Gold tidak cukup!");
    }
    document.getElementById('contextMenu').style.display = 'none';
    selectedEntity = null;
}

function collectGold(mine) {
    let amount = 50 * mine.level;
    gameState.gold += amount;
    updateHUD();
    document.getElementById('contextMenu').style.display = 'none';
    selectedEntity = null;
}


function buyStructure(type, size, cost) {
    document.getElementById('buildMenu').classList.remove('active');
    
    let maxToBuy = 10;
    let actualMax = Math.min(maxToBuy, Math.floor(gameState.gold / cost));
    
    if (actualMax === 0) {
        alert("Not enough gold!");
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
        alert("No empty space!");
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
}

document.getElementById('confirmPlaceBtn').addEventListener('click', () => {
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
});

function spawnEntity(type, size, r, c, level) {
    gameState.entities.push({
        id: 'ent_' + Date.now() + Math.random(),
        type, size, r, c, level
    });
}

function formatNumber(num) {
    if (num >= 1000000) return (num / 1000000).toFixed(1).replace(/\.0$/, '') + 'M';
    if (num >= 1000) return (num / 1000).toFixed(2).replace(/\.00$/, '').replace(/0$/, '') + 'K';
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
}

// --- RENDER LOOP ---

function drawTile(isoX, isoY, w, h, color, outlineColor) {
    ctx.beginPath();
    ctx.moveTo(isoX, isoY - h/2);
    ctx.lineTo(isoX + w/2, isoY);
    ctx.lineTo(isoX, isoY + h/2);
    ctx.lineTo(isoX - w/2, isoY);
    ctx.closePath();
    ctx.fillStyle = color;
    ctx.fill();
    ctx.strokeStyle = outlineColor;
    ctx.stroke();
}

function render() {
    ctx.clearRect(0, 0, width, height);
    
    ctx.save();
    // Center map on screen, apply zoom, then pan offset
    ctx.translate(width / 2, height / 2);
    ctx.scale(zoom, zoom);
    ctx.translate(camera.x, camera.y);

    // 1. Draw Island Base (Circle/Ellipse in Iso)
    let centerCartX = (GRID_SIZE/2) * TILE_W;
    let centerCartY = (GRID_SIZE/2) * TILE_H;
    let centerIso = cartToIso(centerCartX, centerCartY);

    let radiusTiles = 22;
    let a = radiusTiles * TILE_W; 
    let b = radiusTiles * TILE_H / 2;

    ctx.beginPath();
    ctx.ellipse(centerIso.x, centerIso.y, a * 1.1, b * 1.1, 0, 0, Math.PI*2);
    ctx.fillStyle = '#fefae0'; // Sand
    ctx.fill();
    ctx.beginPath();
    ctx.ellipse(centerIso.x, centerIso.y - 10, a, b, 0, 0, Math.PI*2);
    ctx.fillStyle = '#90be6d'; // Grass
    ctx.fill();

    // 2. Draw Grid
    for (let r = 0; r < GRID_SIZE; r++) {
        for (let c = 0; c < GRID_SIZE; c++) {
            let valid = isPointInIsland(c * TILE_W, r * TILE_H) &&
                        isPointInIsland((c+1) * TILE_W, r * TILE_H) &&
                        isPointInIsland(c * TILE_W, (r+1) * TILE_H) &&
                        isPointInIsland((c+1) * TILE_W, (r+1) * TILE_H);
            
            if (valid) {
                let cartX = c * TILE_W;
                let cartY = r * TILE_H;
                
                ctx.beginPath();
                let p1 = cartToIso(cartX, cartY);
                let p2 = cartToIso(cartX + TILE_W, cartY);
                let p3 = cartToIso(cartX + TILE_W, cartY + TILE_H);
                let p4 = cartToIso(cartX, cartY + TILE_H);
                
                ctx.moveTo(p1.x, p1.y);
                ctx.lineTo(p2.x, p2.y);
                ctx.lineTo(p3.x, p3.y);
                ctx.lineTo(p4.x, p4.y);
                ctx.closePath();
                
                ctx.strokeStyle = 'rgba(255,255,255,0.05)';
                ctx.stroke();

                if (!draggedEntity && hoveredGrid.r === r && hoveredGrid.c === c) {
                    ctx.fillStyle = 'rgba(255,255,255,0.3)';
                    ctx.fill();
                }
            }
        }
    }
    
    // Draw placement preview
    let previewEntity = draggedEntity || (placingEntities.length > 0 ? placingEntities[0] : null);
    
    if (previewEntity) {
        let size = previewEntity.size || 1;
        let checkR = hoveredGrid.r;
        let checkC = hoveredGrid.c;
        if (draggedEntity) {
            let deltaR = hoveredGrid.r - dragStartMouseGrid.r;
            let deltaC = hoveredGrid.c - dragStartMouseGrid.c;
            checkR = dragStartGrid.r + deltaR;
            checkC = dragStartGrid.c + deltaC;
        }
        if (placingEntities.length > 0) {
            checkR = placingEntities[0].r;
            checkC = placingEntities[0].c;
        }

        let cartX = checkC * TILE_W;
        let cartY = checkR * TILE_H;

        ctx.beginPath();
        let p1 = cartToIso(cartX, cartY);
        let p2 = cartToIso(cartX + TILE_W * size, cartY);
        let p3 = cartToIso(cartX + TILE_W * size, cartY + TILE_H * size);
        let p4 = cartToIso(cartX, cartY + TILE_H * size);
        
        ctx.moveTo(p1.x, p1.y);
        ctx.lineTo(p2.x, p2.y);
        ctx.lineTo(p3.x, p3.y);
        ctx.lineTo(p4.x, p4.y);
        ctx.closePath();
        
        let ignoreId = draggedEntity ? draggedEntity.id : null;
        if (canPlace(checkR, checkC, size, ignoreId)) {
            ctx.fillStyle = 'rgba(74, 222, 128, 0.5)';
        } else {
            ctx.fillStyle = 'rgba(239, 68, 68, 0.5)';
        }
        ctx.fill();
    }

    // Sort entities
    let entitiesToDraw = [...gameState.entities];
    for (let p of placingEntities) {
        entitiesToDraw.push(p);
    }
    let sortedEntities = entitiesToDraw.sort((a,b) => (a.r+a.c) - (b.r+b.c));

    // 3. Draw Entities
    for (let e of sortedEntities) {
        let drawR = e.r;
        let drawC = e.c;
        
        let cartX = drawC * TILE_W;
        let cartY = drawR * TILE_H;
        let iso = cartToIso(cartX, cartY);
        let centerIsoX = iso.x;
        let centerIsoY = iso.y + (TILE_H/2 * e.size); 
        
        // If dragging, smoothly follow the mouse
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
        }
        
        // Draw Selection Highlight
        if (selectedEntity && e.id === selectedEntity.id) {
            ctx.beginPath();
            let p1 = cartToIso(cartX, cartY);
            let p2 = cartToIso(cartX + TILE_W * e.size, cartY);
            let p3 = cartToIso(cartX + TILE_W * e.size, cartY + TILE_H * e.size);
            let p4 = cartToIso(cartX, cartY + TILE_H * e.size);
            ctx.moveTo(p1.x, p1.y);
            ctx.lineTo(p2.x, p2.y);
            ctx.lineTo(p3.x, p3.y);
            ctx.lineTo(p4.x, p4.y);
            ctx.closePath();
            ctx.lineWidth = 3;
            ctx.strokeStyle = '#fbbf24'; 
            ctx.stroke();
            ctx.fillStyle = 'rgba(251, 191, 36, 0.2)';
            ctx.fill();
        }

        if (e.type === 'army') {
            let img = ASSETS.soldier;
            if (img.complete && img.naturalWidth !== 0) {
                let side = TILE_W * e.size;
                ctx.save();
                ctx.translate(iso.x, iso.y);
                let cos30 = Math.cos(Math.PI/6);
                let sin30 = Math.sin(Math.PI/6);
                ctx.transform(cos30, sin30, -cos30, sin30, 0, 0);
                ctx.drawImage(img, 0, 0, side, side);
                ctx.restore();
            } else {
                ctx.fillStyle = '#3b82f6';
                ctx.strokeStyle = '#1d4ed8';
                ctx.lineWidth = 3;
                let w = 40; let h = 40;
                ctx.fillRect(centerIsoX - w/2, centerIsoY - h - 10, w, h);
                ctx.strokeRect(centerIsoX - w/2, centerIsoY - h - 10, w, h);
            }
            // Level Badge
            ctx.fillStyle = 'rgba(0, 0, 0, 0.6)';
            ctx.beginPath();
            ctx.arc(centerIsoX, centerIsoY - 10, 12, 0, Math.PI*2);
            ctx.fill();
            ctx.fillStyle = 'white';
            ctx.font = 'bold 14px Roboto Condensed';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText(e.level, centerIsoX, centerIsoY - 10);
            
        } else if (e.type === 'barrack') {
            let img = ASSETS.barrack;
            if (img.complete && img.naturalWidth !== 0) {
                let side = TILE_W * e.size;
                ctx.save();
                ctx.translate(iso.x, iso.y);
                // Apply isometric matrix projection to warp the square image into a rhombus
                let cos30 = Math.cos(Math.PI/6);
                let sin30 = Math.sin(Math.PI/6);
                ctx.transform(cos30, sin30, -cos30, sin30, 0, 0);
                // Draw the flat image
                ctx.drawImage(img, 0, 0, side, side);
                ctx.restore();
            } else {
                // Fallback while loading
                ctx.fillStyle = '#64748b';
                let w = 80; let h = 80;
                ctx.fillRect(centerIsoX - w/2, centerIsoY - h - 10, w, h);
            }
            
            // Level Badge
            ctx.fillStyle = 'rgba(0, 0, 0, 0.6)';
            ctx.beginPath();
            ctx.arc(centerIsoX, centerIsoY - 10, 12, 0, Math.PI*2);
            ctx.fill();
            ctx.fillStyle = 'white';
            ctx.font = 'bold 14px Roboto Condensed';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText(e.level, centerIsoX, centerIsoY - 10);
            
        } else if (e.type === 'mine') {
            let img = ASSETS.mine;
            if (img.complete && img.naturalWidth !== 0) {
                let side = TILE_W * e.size;
                ctx.save();
                ctx.translate(iso.x, iso.y);
                let cos30 = Math.cos(Math.PI/6);
                let sin30 = Math.sin(Math.PI/6);
                ctx.transform(cos30, sin30, -cos30, sin30, 0, 0);
                ctx.drawImage(img, 0, 0, side, side);
                ctx.restore();
            } else {
                // Fallback while loading
                ctx.fillStyle = '#f59e0b';
                let w = 80; let h = 80;
                ctx.fillRect(centerIsoX - w/2, centerIsoY - h - 10, w, h);
            }
            
            // Level Badge
            ctx.fillStyle = 'rgba(0, 0, 0, 0.6)';
            ctx.beginPath();
            ctx.arc(centerIsoX, centerIsoY - 10, 12, 0, Math.PI*2);
            ctx.fill();
            ctx.fillStyle = 'white';
            ctx.font = 'bold 14px Roboto Condensed';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText(e.level, centerIsoX, centerIsoY - 10);
        }
    }

    ctx.restore();
    
    // Update Placement UI DOM position
    if (placingEntities.length > 0 && placementUI.style.display !== 'none') {
        let firstP = placingEntities[0];
        let cartX = firstP.c * TILE_W;
        let cartY = firstP.r * TILE_H;
        let iso = cartToIso(cartX, cartY);
        // Project center bottom of the building
        let screenX = (iso.x + camera.x) * zoom + width / 2;
        let screenY = (iso.y + (TILE_H/2 * firstP.size) + camera.y) * zoom + height / 2;
        
        placementUI.style.left = screenX + 'px';
        placementUI.style.top = screenY + 'px';
    }
    
    // Update Context Menu UI DOM position
    let menu = document.getElementById('contextMenu');
    if (selectedEntity && menu.style.display !== 'none') {
        let cartX = selectedEntity.c * TILE_W;
        let cartY = selectedEntity.r * TILE_H;
        let iso = cartToIso(cartX, cartY);
        // Project center top of the building
        let screenX = (iso.x + camera.x) * zoom + width / 2;
        let screenY = (iso.y - 40 + camera.y) * zoom + height / 2;
        
        menu.style.left = screenX + 'px';
        menu.style.top = screenY + 'px';
    }

    // Fake Chat Rotator (Handled in JS logic but we just need to ensure loop runs)
    requestAnimationFrame(render);
}

// Start (Empty Island)
requestAnimationFrame(render);

// FAKE CHAT
const chatLines = [
    "<span>Bayu:</span> wow game wbt mantap!",
    "<span>Commander:</span> joint aliansi kami",
    "<span>Player99:</span> cara naik level gmn?",
    "<span>System:</span> [Event] Serangan Boss!",
    "<span>Yountry:</span> hallo",
    "<span>Jonas:</span> hi"
];
const chatPanel = document.querySelector('.chat-panel');
setInterval(() => {
    chatPanel.removeChild(chatPanel.firstChild);
    let line = document.createElement('div');
    line.className = 'chat-line';
    line.innerHTML = chatLines[Math.floor(Math.random() * chatLines.length)];
    chatPanel.appendChild(line);
}, 3000);
