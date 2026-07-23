const GRID_SIZE = 15;
const CELL_SIZE = 60; // 60px per cell

let gameState = {
    gold: 15055764,
    power: 19.9,
    gems: 21316,
    level: 84,
    grid: Array(GRID_SIZE * GRID_SIZE).fill(null), // Holds {id, type, level}
    entities: {} // Maps id -> DOM element
};

// --- MAP PANNING LOGIC ---
const mapContainer = document.getElementById('mapContainer');
const mapPanArea = document.getElementById('mapPanArea');

let isPanning = false;
let startX, startY;
let panX = 0, panY = 0; // Current translation

mapContainer.addEventListener('mousedown', (e) => {
    // Only pan if we click on the map, not on a unit
    if(e.target.closest('.entity') || e.target.closest('#hudLayer') || e.target.closest('.build-menu-sheet')) return;
    isPanning = true;
    startX = e.clientX - panX;
    startY = e.clientY - panY;
});

window.addEventListener('mousemove', (e) => {
    if (!isPanning) return;
    panX = e.clientX - startX;
    panY = e.clientY - startY;
    mapPanArea.style.transform = `translate(${panX}px, ${panY}px)`;
});

window.addEventListener('mouseup', () => {
    isPanning = false;
});

// Touch support for map panning
mapContainer.addEventListener('touchstart', (e) => {
    if(e.target.closest('.entity') || e.target.closest('#hudLayer') || e.target.closest('.build-menu-sheet')) return;
    isPanning = true;
    startX = e.touches[0].clientX - panX;
    startY = e.touches[0].clientY - panY;
});

window.addEventListener('touchmove', (e) => {
    if (!isPanning) return;
    panX = e.touches[0].clientX - startX;
    panY = e.touches[0].clientY - startY;
    mapPanArea.style.transform = `translate(${panX}px, ${panY}px)`;
});

window.addEventListener('touchend', () => {
    isPanning = false;
});


// --- GRID GENERATION ---
const gridBoard = document.getElementById('gridBoard');
const cellsDOM = [];

for (let i = 0; i < GRID_SIZE * GRID_SIZE; i++) {
    let cell = document.createElement('div');
    cell.className = 'grid-cell';
    cell.dataset.index = i;
    
    // Drag and Drop listeners
    cell.addEventListener('dragover', onDragOver);
    cell.addEventListener('dragleave', onDragLeave);
    cell.addEventListener('drop', onDrop);
    
    gridBoard.appendChild(cell);
    cellsDOM.push(cell);
}


// --- BUILD MENU ---
const buildBtn = document.getElementById('buildBtn');
const buildMenu = document.getElementById('buildMenu');
const closeBuildBtn = document.getElementById('closeBuildBtn');

buildBtn.addEventListener('click', () => {
    buildMenu.classList.add('active');
});
closeBuildBtn.addEventListener('click', () => {
    buildMenu.classList.remove('active');
});


// --- UNIT SPAWNING & DRAGGING ---
let draggedEntityId = null;
let draggedStartIndex = null;

function spawnUnit(type, level) {
    // Find empty cell near center
    let emptyIdx = gameState.grid.findIndex(c => c === null);
    if(emptyIdx === -1) {
        alert("Peta penuh!");
        return;
    }
    
    let id = 'u_' + Date.now() + Math.floor(Math.random()*1000);
    gameState.grid[emptyIdx] = { id, type, level };
    
    let ent = document.createElement('div');
    ent.className = 'entity';
    ent.draggable = true;
    ent.dataset.id = id;
    
    let box = document.createElement('div');
    box.className = `unit-box ${type === 'mine' ? 'mine' : ''}`;
    
    if(type === 'mine') {
        box.innerHTML = `<i class="fa-solid fa-industry"></i>`;
    } else {
        box.innerText = level;
    }
    
    ent.appendChild(box);
    
    ent.addEventListener('dragstart', onDragStart);
    ent.addEventListener('dragend', onDragEnd);
    
    gameState.entities[id] = ent;
    gridBoard.appendChild(ent);
    
    updateUnitPosition(id, emptyIdx);
}

function updateUnitPosition(id, gridIndex) {
    let ent = gameState.entities[id];
    let row = Math.floor(gridIndex / GRID_SIZE);
    let col = gridIndex % GRID_SIZE;
    
    // Position within the grid Board
    ent.style.left = (col * CELL_SIZE) + 'px';
    ent.style.top = (row * CELL_SIZE) + 'px';
}

function onDragStart(e) {
    draggedEntityId = e.target.dataset.id;
    // Find where it currently is
    draggedStartIndex = gameState.grid.findIndex(c => c && c.id === draggedEntityId);
    
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', draggedEntityId);
    
    setTimeout(() => {
        e.target.classList.add('dragging');
    }, 0);
}

function onDragEnd(e) {
    e.target.classList.remove('dragging');
    cellsDOM.forEach(c => c.classList.remove('highlight'));
    draggedEntityId = null;
    draggedStartIndex = null;
}

function onDragOver(e) {
    e.preventDefault();
    if(draggedEntityId) {
        e.currentTarget.classList.add('highlight');
    }
}

function onDragLeave(e) {
    e.currentTarget.classList.remove('highlight');
}

function onDrop(e) {
    e.preventDefault();
    e.currentTarget.classList.remove('highlight');
    
    if(!draggedEntityId) return;
    
    let targetIndex = parseInt(e.currentTarget.dataset.index);
    if(targetIndex === draggedStartIndex) return; // Dropped on same spot
    
    let sourceData = gameState.grid[draggedStartIndex];
    let targetData = gameState.grid[targetIndex];
    
    if(!targetData) {
        // Move
        gameState.grid[targetIndex] = sourceData;
        gameState.grid[draggedStartIndex] = null;
        updateUnitPosition(draggedEntityId, targetIndex);
    } else {
        // Try merge
        if(sourceData.type === targetData.type && sourceData.level === targetData.level) {
            // MERGE SUCCESS!
            targetData.level++;
            
            // Remove old entity visually
            let oldEnt = gameState.entities[sourceData.id];
            oldEnt.remove();
            delete gameState.entities[sourceData.id];
            
            gameState.grid[draggedStartIndex] = null;
            
            // Update target visual
            let targetEnt = gameState.entities[targetData.id];
            targetEnt.classList.add('anim-merge');
            setTimeout(() => targetEnt.classList.remove('anim-merge'), 300);
            
            if(targetData.type === 'army') {
                targetEnt.querySelector('.unit-box').innerText = targetData.level;
            }
            
            // Gain Gold effect
            gameState.gold += (100 * targetData.level);
            document.getElementById('goldText').innerText = gameState.gold.toLocaleString();
            
        } else {
            // Swap
            gameState.grid[targetIndex] = sourceData;
            gameState.grid[draggedStartIndex] = targetData;
            updateUnitPosition(sourceData.id, targetIndex);
            updateUnitPosition(targetData.id, draggedStartIndex);
        }
    }
}

// Purchasing
document.getElementById('buyArmyBtn').addEventListener('click', () => {
    if(gameState.gold >= 100) {
        gameState.gold -= 100;
        document.getElementById('goldText').innerText = gameState.gold.toLocaleString();
        spawnUnit('army', 1);
    }
});

document.getElementById('buyMineBtn').addEventListener('click', () => {
    if(gameState.gold >= 500) {
        gameState.gold -= 500;
        document.getElementById('goldText').innerText = gameState.gold.toLocaleString();
        spawnUnit('mine', 1);
    }
});

// Initial Spawn
setTimeout(() => {
    // Spawn some initial units in middle
    spawnUnit('army', 84);
    spawnUnit('army', 84);
    spawnUnit('mine', 10);
}, 500);

// Fake Chat Rotator
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
