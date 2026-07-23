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
const GRID_SIZE = 30; // 30x30 board
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
let camera = { x: 0, y: -200 };
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
    // 1. Adjust for camera
    let adjX = clientX - width / 2 - camera.x;
    let adjY = clientY - height / 2 - camera.y;
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

function canPlace(r, c, size, ignoreEntityId = null) {
    if (r < 0 || c < 0 || r + size > GRID_SIZE || c + size > GRID_SIZE) return false;
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
canvas.addEventListener('mousedown', (e) => {
    mouse.isDown = true;
    startPan.x = e.clientX;
    startPan.y = e.clientY;
    lastCam.x = camera.x;
    lastCam.y = camera.y;

    // Check if clicking an entity
    let gridPos = getMouseGrid(e.clientX, e.clientY);
    let clickedEnt = getEntityAt(gridPos.r, gridPos.c);
    
    if (clickedEnt) {
        // Start dragging
        draggedEntity = clickedEnt;
        dragStartGrid = { r: clickedEnt.r, c: clickedEnt.c };
        
        // Hide context menu if open
        document.getElementById('barrackMenu').style.display = 'none';
    } else {
        isPanning = true;
        document.getElementById('barrackMenu').style.display = 'none';
    }
});

canvas.addEventListener('mousemove', (e) => {
    mouse.x = e.clientX;
    mouse.y = e.clientY;
    hoveredGrid = getMouseGrid(e.clientX, e.clientY);

    if (isPanning) {
        camera.x = lastCam.x + (e.clientX - startPan.x);
        camera.y = lastCam.y + (e.clientY - startPan.y);
    } else if (draggedEntity) {
        // Dragging logic - visually moves with mouse, snaps internally
        // We just update the hovered grid for preview
    }
});

canvas.addEventListener('mouseup', (e) => {
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
        draggedEntity = null;
    }
});

canvas.addEventListener('touchstart', (e) => { /* Map similar to mouse */ 
    canvas.dispatchEvent(new MouseEvent('mousedown', {clientX: e.touches[0].clientX, clientY: e.touches[0].clientY}));
});
canvas.addEventListener('touchmove', (e) => {
    canvas.dispatchEvent(new MouseEvent('mousemove', {clientX: e.touches[0].clientX, clientY: e.touches[0].clientY}));
});
canvas.addEventListener('touchend', (e) => {
    canvas.dispatchEvent(new MouseEvent('mouseup', {clientX: mouse.x, clientY: mouse.y}));
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

function buyStructure(type, size, cost) {
    if (gameState.gold >= cost) {
        // Find empty spot near center
        let center = Math.floor(GRID_SIZE / 2);
        let placed = false;
        for (let radius = 0; radius < GRID_SIZE; radius++) {
            for (let r = center - radius; r <= center + radius; r++) {
                for (let c = center - radius; c <= center + radius; c++) {
                    if (canPlace(r, c, size)) {
                        spawnEntity(type, size, r, c, 1);
                        gameState.gold -= cost;
                        updateHUD();
                        document.getElementById('buildMenu').classList.remove('active');
                        return;
                    }
                }
            }
        }
    } else {
        alert("Gold tidak cukup!");
    }
}

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
    // Center map on screen + pan offset
    ctx.translate(width / 2 + camera.x, height / 2 + camera.y);

    // 1. Draw Island Base (Circle/Ellipse in Iso)
    ctx.beginPath();
    ctx.ellipse(0, 0, GRID_SIZE*TILE_W, GRID_SIZE*TILE_H/2, 0, 0, Math.PI*2);
    ctx.fillStyle = '#fefae0'; // Sand
    ctx.fill();
    ctx.beginPath();
    ctx.ellipse(0, -10, GRID_SIZE*TILE_W*0.95, GRID_SIZE*TILE_H*0.95/2, 0, 0, Math.PI*2);
    ctx.fillStyle = '#90be6d'; // Grass
    ctx.fill();

    // 2. Draw Grid (Optional, faint lines)
    for (let r = 0; r < GRID_SIZE; r++) {
        for (let c = 0; c < GRID_SIZE; c++) {
            let cartX = c * TILE_W;
            let cartY = r * TILE_H;
            let iso = cartToIso(cartX, cartY);
            
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
    
    // Draw placement preview if dragging
    if (draggedEntity) {
        let cartX = hoveredGrid.c * TILE_W;
        let cartY = hoveredGrid.r * TILE_H;
        let size = draggedEntity.size || 1;
        
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
        
        if (canPlace(hoveredGrid.r, hoveredGrid.c, size, draggedEntity.id)) {
            ctx.fillStyle = 'rgba(74, 222, 128, 0.5)'; // Green valid
        } else {
            ctx.fillStyle = 'rgba(239, 68, 68, 0.5)'; // Red invalid
        }
        ctx.fill();
    }

    // Sort entities for pseudo-depth (Y-sorting based on grid row+col)
    let sortedEntities = [...gameState.entities].sort((a,b) => (a.r+a.c) - (b.r+b.c));

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
    
    // Fake Chat Rotator (Handled in JS logic but we just need to ensure loop runs)
    requestAnimationFrame(render);
}

// Start
spawnEntity('barrack', 2, 14, 14, 1);
spawnEntity('mine', 2, 14, 17, 1);
spawnEntity('army', 1, 16, 14, 84);
spawnEntity('army', 1, 17, 14, 84);
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
