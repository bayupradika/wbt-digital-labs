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
    gold: 15055764,
    power: 19.9,
    gems: 21316,
    level: 84,
    // Array of objects. We won't use a strict 1D array to allow 2x2 easier management.
    entities: [] 
};

// --- ISOMETRIC MATH ---
// Top War typically uses an isometric projection where X and Y are rotated 45 degrees, then scaled Y by 0.5.
function cartToIso(x, y) {
    return {
        x: (x - y) * Math.cos(Math.PI / 6),
        y: (x + y) * Math.sin(Math.PI / 6)
    };
}

function isoToCart(isoX, isoY) {
    return {
        x: (isoX / Math.cos(Math.PI / 6) + isoY / Math.sin(Math.PI / 6)) / 2,
        y: (isoY / Math.sin(Math.PI / 6) - isoX / Math.cos(Math.PI / 6)) / 2
    };
}

// --- CAMERA PANNING ---
// Calculate initial center
let initialCenterCartX = (GRID_SIZE/2) * TILE_W;
let initialCenterCartY = (GRID_SIZE/2) * TILE_H;
let initialCenterIso = cartToIso(initialCenterCartX, initialCenterCartY);

let camera = { x: -initialCenterIso.x, y: -initialCenterIso.y };
let zoom = 1.0;
let isPanning = false;
let startPan = { x: 0, y: 0 };
let lastCam = { x: 0, y: 0 };

let mouse = { x: 0, y: 0, isDown: false };
let hoveredGrid = { r: -1, c: -1 };

// Interaction states
let draggedEntity = null;
let dragOffset = { x: 0, y: 0 };
let dragStartGrid = { r: -1, c: -1 };
let dragStartMouseGrid = { r: -1, c: -1 };

function getMouseGrid(clientX, clientY) {
    // 1. Adjust for zoom and camera
    let adjX = (clientX - width / 2) / zoom - camera.x;
    let adjY = (clientY - height / 2) / zoom - camera.y;
    // 2. Convert to Cartesian
    let cart = isoToCart(adjX, adjY);
    // 3. Grid coordinates
    let c = Math.floor(cart.x / TILE_W);
    let r = Math.floor(cart.y / TILE_H);
    return { r, c };
}

function getEntityAt(r, c) {
    // Reverse loop to get top-most entity
    for (let i = gameState.entities.length - 1; i >= 0; i--) {
        let e = gameState.entities[i];
        let size = e.size || 1;
        if (r >= e.r && r < e.r + size && c >= e.c && c < e.c + size) {
            return e;
        }
    }
    return null;
}

function isPointInIsland(cartX, cartY) {
    let iso = cartToIso(cartX, cartY);
    let centerCartX = (GRID_SIZE/2) * TILE_W;
    let centerCartY = (GRID_SIZE/2) * TILE_H;
    let centerIso = cartToIso(centerCartX, centerCartY);

    // We use a radius that defines the green grass.
    // Let's say the grass radius is 20 tiles wide.
    let radiusTiles = 22;
    let a = radiusTiles * TILE_W; 
    let b = radiusTiles * TILE_H / 2;
    
    let dx = iso.x - centerIso.x;
    let dy = iso.y - (centerIso.y - 10);
    
    return (dx * dx) / (a * a) + (dy * dy) / (b * b) <= 1;
}

function canPlace(r, c, size, ignoreEntityId = null) {
    if (r < 0 || c < 0 || r + size > GRID_SIZE || c + size > GRID_SIZE) return false;
    
    // Check all 4 corners of the placement area to ensure it's FULLY inside the island
    if (!isPointInIsland(c * TILE_W, r * TILE_H)) return false; // Top-Left
    if (!isPointInIsland((c + size) * TILE_W, r * TILE_H)) return false; // Top-Right
    if (!isPointInIsland(c * TILE_W, (r + size) * TILE_H)) return false; // Bottom-Left
    if (!isPointInIsland((c + size) * TILE_W, (r + size) * TILE_H)) return false; // Bottom-Right

    for (let e of gameState.entities) {
        if (e.id === ignoreEntityId) continue;
        let eSize = e.size || 1;
        // AABB Collision in grid space
        if (r < e.r + eSize && r + size > e.r && c < e.c + eSize && c + size > e.c) {
            return false;
        }
    }
    return true;
}

// --- EVENT LISTENERS ---
canvas.addEventListener('pointerdown', (e) => {
    // We are listening directly on canvas, so we know this is a canvas click
    // (Clicks on UI buttons don't bubble to canvas because they are in sibling hudLayer)
    e.preventDefault(); // Stop native browser drag/text selection
    
    // Safety check just in case
    if (!e.target || e.target !== canvas) return;
    
    mouse.isDown = true;
    startPan.x = e.clientX;
    startPan.y = e.clientY;
    lastCam.x = camera.x;
    lastCam.y = camera.y;

    // Hide context menu
    document.getElementById('barrackMenu').style.display = 'none';

    // Check if clicking placingEntity
    if (placingEntity) {
        let gridPos = getMouseGrid(e.clientX, e.clientY);
        if (gridPos.r >= placingEntity.r && gridPos.r < placingEntity.r + placingEntity.size &&
            gridPos.c >= placingEntity.c && gridPos.c < placingEntity.c + placingEntity.size) {
            draggedEntity = placingEntity;
            dragStartGrid = { r: placingEntity.r, c: placingEntity.c };
            return;
        }
    }

    let gridPos = getMouseGrid(e.clientX, e.clientY);
    let clickedEnt = getEntityAt(gridPos.r, gridPos.c);
    
    if (clickedEnt) {
        draggedEntity = clickedEnt;
        dragStartGrid = { r: clickedEnt.r, c: clickedEnt.c };
        dragStartMouseGrid = { r: gridPos.r, c: gridPos.c };
    } else {
        isPanning = true;
    }
});

window.addEventListener('pointermove', (e) => {
    mouse.x = e.clientX;
    mouse.y = e.clientY;
    hoveredGrid = getMouseGrid(e.clientX, e.clientY);

    if (isPanning) {
        camera.x = lastCam.x + (e.clientX - startPan.x) / zoom;
        camera.y = lastCam.y + (e.clientY - startPan.y) / zoom;
    }
});

window.addEventListener('wheel', (e) => {
    // e.preventDefault(); // Sometimes wheel is passive, so handle carefully
    zoom += e.deltaY * -0.001;
    zoom = Math.min(Math.max(0.2, zoom), 3.0); // allow more zoom out for the big island
});

window.addEventListener('pointerup', (e) => {
    mouse.isDown = false;
    isPanning = false;

    if (draggedEntity) {
        let dropGrid = getMouseGrid(e.clientX, e.clientY);
        
        // Check if just clicking (didn't move much)
        if (dropGrid.r === dragStartMouseGrid.r && dropGrid.c === dragStartMouseGrid.c) {
            if (draggedEntity.type === 'barrack' || draggedEntity.type === 'mine') {
                showContextMenu(draggedEntity);
            }
        } else {
            // Trying to place
            let size = draggedEntity.size || 1;
            
            // Calculate final dropped position based on relative drag
            let deltaR = dropGrid.r - dragStartMouseGrid.r;
            let deltaC = dropGrid.c - dragStartMouseGrid.c;
            let finalR = dragStartGrid.r + deltaR;
            let finalC = dragStartGrid.c + deltaC;
            
            // Check if it's the placingEntity (we are just moving it before confirming)
            if (placingEntity && draggedEntity === placingEntity) {
                if (canPlace(finalR, finalC, size, draggedEntity.id)) {
                    placingEntity.r = finalR;
                    placingEntity.c = finalC;
                } else {
                    // Revert to start grid if invalid
                    placingEntity.r = dragStartGrid.r;
                    placingEntity.c = dragStartGrid.c;
                }
            }
            else {
                // Normal entity drop logic
                // Is it merging?
                let targetEnt = getEntityAt(finalR, finalC);
                if (targetEnt && targetEnt.id !== draggedEntity.id) {
                    if (targetEnt.type === draggedEntity.type && targetEnt.level === draggedEntity.level) {
                        // MERGE!
                        targetEnt.level++;
                        // Gain gold
                        gameState.gold += (100 * targetEnt.level);
                        updateHUD();
                        
                        // Remove dragged entity
                        gameState.entities = gameState.entities.filter(ent => ent.id !== draggedEntity.id);
                    } else {
                        // Invalid merge, return to start
                    }
                } else {
                    // Moving to empty space
                    if (canPlace(finalR, finalC, size, draggedEntity.id)) {
                        draggedEntity.r = finalR;
                        draggedEntity.c = finalC;
                    }
                }
            }
        }
        draggedEntity = null;
    }
});

// To be absolutely safe against native drags ruining pointer events
canvas.addEventListener('dragstart', (e) => e.preventDefault());

// --- MENU ACTIONS ---
document.getElementById('buildBtn').addEventListener('click', () => {
    document.getElementById('buildMenu').classList.add('active');
});
document.getElementById('closeBuildBtn').addEventListener('click', () => {
    document.getElementById('buildMenu').classList.remove('active');
});

document.getElementById('buyBarrackBtn').addEventListener('click', () => buyStructure('barrack', 2, 300));
document.getElementById('buyMineBtn').addEventListener('click', () => buyStructure('mine', 2, 500));

let placingEntity = null;
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
                    spawnEntity('army', 1, checkR, checkC, 1);
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
    if (gameState.gold >= cost) {
        let center = Math.floor(GRID_SIZE / 2);
        let startR = center; let startC = center;
        
        // Find nearest valid empty spot
        let found = false;
        
        // Let's search spiraling out from center (15, 15).
        let centerR = Math.floor(GRID_SIZE / 2);
        let centerC = Math.floor(GRID_SIZE / 2);
        
        for (let radius = 0; radius < GRID_SIZE; radius++) {
            for (let r = centerR - radius; r <= centerR + radius; r++) {
                for (let c = centerC - radius; c <= centerC + radius; c++) {
                    if (canPlace(r, c, size)) {
                        startR = r;
                        startC = c;
                        found = true;
                        break;
                    }
                }
                if (found) break;
            }
            if (found) break;
        }

        placingEntity = { id: 'place_tmp', type, size, cost, level: 1, r: startR, c: startC };
        placementUI.style.display = 'flex';
        document.getElementById('buildMenu').classList.remove('active');
        
        // Auto-focus camera on the new placing entity
        let cartX = startC * TILE_W;
        let cartY = startR * TILE_H;
        let iso = cartToIso(cartX, cartY);
        // Center the building visually
        camera.x = -iso.x;
        camera.y = -(iso.y + TILE_H*size/2);

    } else {
        alert("Gold tidak cukup!");
    }
}

document.getElementById('confirmPlaceBtn').addEventListener('click', () => {
    if (placingEntity) {
        if (canPlace(placingEntity.r, placingEntity.c, placingEntity.size)) {
            gameState.gold -= placingEntity.cost;
            spawnEntity(placingEntity.type, placingEntity.size, placingEntity.r, placingEntity.c, placingEntity.level);
            updateHUD();
            placingEntity = null;
            placementUI.style.display = 'none';
        } else {
            // Visual feedback for error could go here
            placementUI.style.transform = 'translate(-50%, 20px) scale(1.1)';
            setTimeout(() => placementUI.style.transform = 'translate(-50%, 20px) scale(1)', 200);
        }
    }
});

document.getElementById('cancelPlaceBtn').addEventListener('click', () => {
    placingEntity = null;
    placementUI.style.display = 'none';
});

function spawnEntity(type, size, r, c, level) {
    gameState.entities.push({
        id: 'ent_' + Date.now() + Math.random(),
        type, size, r, c, level
    });
}

function updateHUD() {
    document.getElementById('goldText').innerText = gameState.gold.toLocaleString();
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
    let previewEntity = draggedEntity || placingEntity;
    
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
        if (placingEntity) {
            checkR = placingEntity.r;
            checkC = placingEntity.c;
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
    if (placingEntity) {
        entitiesToDraw.push(placingEntity);
    }
    let sortedEntities = entitiesToDraw.sort((a,b) => (a.r+a.c) - (b.r+b.c));

    // 3. Draw Entities
    for (let e of sortedEntities) {
        let drawR = e.r;
        let drawC = e.c;
        
        // If dragging, compute relative drag so it doesn't jump
        if (draggedEntity && e.id === draggedEntity.id && !placingEntity) {
            let deltaR = hoveredGrid.r - dragStartMouseGrid.r;
            let deltaC = hoveredGrid.c - dragStartMouseGrid.c;
            drawR = dragStartGrid.r + deltaR;
            drawC = dragStartGrid.c + deltaC;
        } else if (placingEntity && e.id === placingEntity.id) {
            drawR = placingEntity.r;
            drawC = placingEntity.c;
        }

        let cartX = drawC * TILE_W;
        let cartY = drawR * TILE_H;
        let iso = cartToIso(cartX, cartY);
        let centerIsoX = iso.x;
        let centerIsoY = iso.y + (TILE_H/2 * e.size); 
        
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
                let w = 80;
                let h = w * (img.naturalHeight / img.naturalWidth);
                ctx.drawImage(img, centerIsoX - w/2, centerIsoY - h + 10, w, h);
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
    if (placingEntity && placementUI.style.display !== 'none') {
        let cartX = placingEntity.c * TILE_W;
        let cartY = placingEntity.r * TILE_H;
        let iso = cartToIso(cartX, cartY);
        // Project center bottom of the building
        let screenX = (iso.x + camera.x) * zoom + width / 2;
        let screenY = (iso.y + (TILE_H/2 * placingEntity.size) + camera.y) * zoom + height / 2;
        
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
