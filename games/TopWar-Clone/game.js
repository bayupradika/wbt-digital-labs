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
window.addEventListener('pointerdown', (e) => {
    // Only initiate canvas interactions if we actually clicked on the canvas
    if (e.target !== canvas) return;
    
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
        // Drop logic
        let dropGrid = getMouseGrid(e.clientX, e.clientY);
        
        // Check if just clicking (didn't move much)
        if (dropGrid.r === dragStartGrid.r && dropGrid.c === dragStartGrid.c) {
            if (draggedEntity.type === 'barrack') {
                showBarrackMenu(e.clientX, e.clientY, draggedEntity);
            }
        } else {
            // Trying to place
            let size = draggedEntity.size || 1;
            
            // Check if it's the placingEntity (we are just moving it before confirming)
            if (placingEntity && draggedEntity === placingEntity) {
                if (canPlace(dropGrid.r, dropGrid.c, size, draggedEntity.id)) {
                    placingEntity.r = dropGrid.r;
                    placingEntity.c = dropGrid.c;
                } else {
                    // Revert to start grid if invalid
                    placingEntity.r = dragStartGrid.r;
                    placingEntity.c = dragStartGrid.c;
                }
            }
            else {
                // Normal entity drop logic
                // Is it merging?
                let targetEnt = getEntityAt(dropGrid.r, dropGrid.c);
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
                    if (canPlace(dropGrid.r, dropGrid.c, size, draggedEntity.id)) {
                        draggedEntity.r = dropGrid.r;
                        draggedEntity.c = dropGrid.c;
                    }
                }
            }
        }
        draggedEntity = null;
    }
});

// --- MENU ACTIONS ---
document.getElementById('buildBtn').addEventListener('click', () => {
    document.getElementById('buildMenu').classList.add('active');
});
document.getElementById('closeBuildBtn').addEventListener('click', () => {
    document.getElementById('buildMenu').classList.remove('active');
});

document.getElementById('buyBarrackBtn').addEventListener('click', () => buyStructure('barrack', 2, 300));
document.getElementById('buyMineBtn').addEventListener('click', () => buyStructure('mine', 2, 500));

let selectedBarrack = null;
function showBarrackMenu(x, y, barrackEnt) {
    selectedBarrack = barrackEnt;
    const menu = document.getElementById('barrackMenu');
    menu.style.display = 'block';
    menu.style.left = x + 'px';
    menu.style.top = y + 'px';
}

document.getElementById('spawnArmyBtn').addEventListener('click', () => {
    if (gameState.gold >= 100 && selectedBarrack) {
        // Find empty adjacent 1x1 spot
        let spawned = false;
        for (let dr = -1; dr <= 2; dr++) {
            for (let dc = -1; dc <= 2; dc++) {
                let checkR = selectedBarrack.r + dr;
                let checkC = selectedBarrack.c + dc;
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
    }
    document.getElementById('barrackMenu').style.display = 'none';
});

let placingEntity = null;
let placementUI = document.getElementById('placementUI');

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
    // Note: The island center is at Cartesian (0,0) which maps to Iso (0,0).
    // But wait, the grid loop is from r=0 to GRID_SIZE. 
    // To allow negative grid coords, let's change the loop to from -GRID_SIZE to GRID_SIZE,
    // OR we shift the island. 
    // Ah, my previous grid loop was from 0 to GRID_SIZE! 
    // If we want the center to be 15,15, we need the island to be at iso mapped from (15,15).
    
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

    // 2. Draw Grid (Only draw tiles that are fully inside the island)
    for (let r = 0; r < GRID_SIZE; r++) {
        for (let c = 0; c < GRID_SIZE; c++) {
            // Check if the 1x1 tile is valid
            let valid = isPointInIsland(c * TILE_W, r * TILE_H) &&
                        isPointInIsland((c+1) * TILE_W, r * TILE_H) &&
                        isPointInIsland(c * TILE_W, (r+1) * TILE_H) &&
                        isPointInIsland((c+1) * TILE_W, (r+1) * TILE_H);
            
            if (valid) {
                let cartX = c * TILE_W;
                let cartY = r * TILE_H;
                
                // Draw tile bounds
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

                // Hover highlight
                if (!draggedEntity && hoveredGrid.r === r && hoveredGrid.c === c) {
                    ctx.fillStyle = 'rgba(255,255,255,0.3)';
                    ctx.fill();
                }
            }
        }
    }
    
    // Draw placement preview if dragging or placing new entity
    let previewEntity = draggedEntity || placingEntity;
    
    if (previewEntity) {
        let cartX = hoveredGrid.c * TILE_W;
        let cartY = hoveredGrid.r * TILE_H;
        
        // Use placingEntity's actual r,c if it is out of bounds or something, 
        // but hoveredGrid is usually fine.
        if (placingEntity) {
            cartX = placingEntity.c * TILE_W;
            cartY = placingEntity.r * TILE_H;
        }

        let size = previewEntity.size || 1;
        
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
        if (canPlace(placingEntity ? placingEntity.r : hoveredGrid.r, placingEntity ? placingEntity.c : hoveredGrid.c, size, ignoreId)) {
            ctx.fillStyle = 'rgba(74, 222, 128, 0.5)'; // Green valid
        } else {
            ctx.fillStyle = 'rgba(239, 68, 68, 0.5)'; // Red invalid
        }
        ctx.fill();
    }

    // Sort entities for pseudo-depth (Y-sorting based on grid row+col)
    let entitiesToDraw = [...gameState.entities];
    if (placingEntity) {
        entitiesToDraw.push(placingEntity);
    }
    let sortedEntities = entitiesToDraw.sort((a,b) => (a.r+a.c) - (b.r+b.c));

    // 3. Draw Entities
    for (let e of sortedEntities) {
        let drawR = e.r;
        let drawC = e.c;
        
        // If dragging, draw at hovered grid (if valid) or follow mouse loosely
        if (draggedEntity && e.id === draggedEntity.id) {
            drawR = hoveredGrid.r;
            drawC = hoveredGrid.c;
        }

        let cartX = drawC * TILE_W;
        let cartY = drawR * TILE_H;
        let iso = cartToIso(cartX, cartY);
        
        // Adjust center based on size (1x1 or 2x2)
        let isoW = TILE_W * e.size * 1.732; // Approx width in iso
        let centerIsoX = iso.x;
        let centerIsoY = iso.y + (TILE_H/2 * e.size); // shift down half

        if (e.type === 'army') {
            // Draw Blue square box
            ctx.fillStyle = '#3b82f6';
            ctx.strokeStyle = '#1d4ed8';
            ctx.lineWidth = 3;
            // Draw a pseudo-3D block
            let w = 40; let h = 40;
            ctx.fillRect(centerIsoX - w/2, centerIsoY - h - 10, w, h);
            ctx.strokeRect(centerIsoX - w/2, centerIsoY - h - 10, w, h);
            
            // Text
            ctx.fillStyle = 'white';
            ctx.font = 'bold 20px Roboto Condensed';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText(e.level, centerIsoX, centerIsoY - h/2 - 10);
            
        } else if (e.type === 'barrack') {
            // Draw 2x2 Barrack (Gray tent)
            ctx.fillStyle = '#64748b';
            ctx.strokeStyle = '#334155';
            let w = 80; let h = 80;
            ctx.fillRect(centerIsoX - w/2, centerIsoY - h - 10, w, h);
            ctx.strokeRect(centerIsoX - w/2, centerIsoY - h - 10, w, h);
            
            ctx.fillStyle = 'white';
            ctx.font = 'bold 16px Roboto Condensed';
            ctx.fillText("BARRACK", centerIsoX, centerIsoY - h/2 - 10);
            ctx.font = '12px Nunito';
            ctx.fillText("Lv." + e.level, centerIsoX, centerIsoY - h/2 + 10);
            
        } else if (e.type === 'mine') {
            // Draw 2x2 Mine (Gold factory)
            ctx.fillStyle = '#f59e0b';
            ctx.strokeStyle = '#b45309';
            let w = 80; let h = 80;
            ctx.fillRect(centerIsoX - w/2, centerIsoY - h - 10, w, h);
            ctx.strokeRect(centerIsoX - w/2, centerIsoY - h - 10, w, h);
            
            ctx.fillStyle = 'white';
            ctx.font = 'bold 16px Roboto Condensed';
            ctx.fillText("MINE", centerIsoX, centerIsoY - h/2 - 10);
            ctx.font = '12px Nunito';
            ctx.fillText("Lv." + e.level, centerIsoX, centerIsoY - h/2 + 10);
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
