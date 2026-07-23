import os

js_path = r'D:\Produk-Sell\games\TopWar-Clone\game.js'

additional_logic = """
// --- DECORATION SYSTEM ---
const DECORATIONS = [
    { id: 'statue', name: 'Hero Statue', icon: 'fa-monument', cost: 1000, buffType: 'atk', buffAmount: 0.1, desc: '+10% All ATK' },
    { id: 'fountain', name: 'Healing Fountain', icon: 'fa-faucet-drip', cost: 1200, buffType: 'hp', buffAmount: 0.1, desc: '+10% All HP' },
    { id: 'bank', name: 'Central Bank', icon: 'fa-building-columns', cost: 1500, buffType: 'gold', buffAmount: 0.15, desc: '+15% Gold Income' }
];

const elDecorModal = document.getElementById('decorModal');
const elModalOverlay = document.getElementById('modalOverlay');
const elDecorShopList = document.getElementById('decorShopList');

document.getElementById('decorShopBtn').addEventListener('click', () => {
    elModalOverlay.classList.add('active');
    elDecorModal.style.display = 'block';
    document.getElementById('battleResultModal').style.display = 'none';
    renderDecorShop();
});

document.getElementById('closeDecorBtn').addEventListener('click', () => {
    elModalOverlay.classList.remove('active');
    elDecorModal.style.display = 'none';
});

function renderDecorShop() {
    elDecorShopList.innerHTML = '';
    
    DECORATIONS.forEach(decor => {
        // Count how many we own
        let owned = gameState.decorations[decor.id] || 0;
        let currentCost = Math.floor(decor.cost * Math.pow(1.5, owned));
        
        const itemDiv = document.createElement('div');
        itemDiv.className = 'decor-item';
        
        const info = document.createElement('div');
        info.className = 'decor-info';
        info.innerHTML = `
            <h4><i class="fa-solid ${decor.icon}"></i> ${decor.name} (Owned: ${owned})</h4>
            <p>${decor.desc}</p>
        `;
        
        const buyBtn = document.createElement('button');
        buyBtn.className = 'action-btn';
        buyBtn.style.flex = '0 0 auto';
        buyBtn.style.padding = '6px 12px';
        buyBtn.innerHTML = `Buy <div class="cost"><i class="fa-solid fa-coins"></i> ${currentCost}</div>`;
        
        if (gameState.gold < currentCost) {
            buyBtn.style.opacity = '0.5';
        } else {
            buyBtn.onclick = () => buyDecor(decor, currentCost);
        }
        
        itemDiv.appendChild(info);
        itemDiv.appendChild(buyBtn);
        elDecorShopList.appendChild(itemDiv);
    });
}

function buyDecor(decor, cost) {
    if (gameState.gold >= cost) {
        gameState.gold -= cost;
        gameState.decorations[decor.id] = (gameState.decorations[decor.id] || 0) + 1;
        
        // Apply buff
        if (decor.buffType === 'atk') gameState.decorations.atkBuff += decor.buffAmount;
        if (decor.buffType === 'hp') gameState.decorations.hpBuff += decor.buffAmount;
        if (decor.buffType === 'gold') gameState.decorations.goldBuff += decor.buffAmount;
        
        // Visual feedback (Spawn a tiny decor on the base)
        const decorLayer = document.getElementById('decorationsLayer');
        const dIcon = document.createElement('i');
        dIcon.className = `fa-solid ${decor.icon} anim-spawn`;
        dIcon.style.position = 'absolute';
        dIcon.style.color = 'var(--text-muted)';
        dIcon.style.opacity = '0.5';
        dIcon.style.fontSize = '20px';
        dIcon.style.left = Math.random() * 80 + 10 + '%';
        dIcon.style.top = Math.random() * 80 + 10 + '%';
        decorLayer.appendChild(dIcon);
        
        saveGame();
        updateHUD();
        renderDecorShop();
    }
}


// --- BATTLE SYSTEM ---
const elBaseScreen = document.getElementById('baseScreen');
const elBattleScreen = document.getElementById('battleScreen');
const elStartBattleBtn = document.getElementById('startBattleBtn');
const elPlayerBattleGrid = document.getElementById('playerBattleGrid');
const elEnemyBattleGrid = document.getElementById('enemyBattleGrid');
const elBattleLogs = document.getElementById('battleLogs');

let battleInterval = null;
let currentBattle = null;

elStartBattleBtn.addEventListener('click', startBattleSetup);

document.getElementById('returnBaseBtn').addEventListener('click', () => {
    elModalOverlay.classList.remove('active');
    elBaseScreen.classList.add('active');
    elBattleScreen.classList.remove('active');
    elStartBattleBtn.style.display = 'flex';
});

function logBattle(msg, type = '') {
    const p = document.createElement('div');
    p.className = `log-entry ${type}`;
    p.innerText = msg;
    elBattleLogs.appendChild(p);
    elBattleLogs.scrollTop = elBattleLogs.scrollHeight;
}

function startBattleSetup() {
    elBaseScreen.classList.remove('active');
    elBattleScreen.classList.add('active');
    elStartBattleBtn.style.display = 'none';
    
    document.getElementById('stageText').innerText = gameState.stage;
    elBattleLogs.innerHTML = '';
    logBattle(`--- STAGE ${gameState.stage} INITIATED ---`, 'victory');
    
    // Pick top 9 soldiers from base to bring to battle
    let availableSoldiers = gameState.baseGrid.filter(u => u && u.type === 'soldier').sort((a,b) => b.level - a.level).slice(0, 9);
    
    if (availableSoldiers.length === 0) {
        logBattle("No soldiers available! Recruit some from the base.", 'damage');
        setTimeout(() => document.getElementById('returnBaseBtn').click(), 2000);
        return;
    }

    // Generate Enemy Wave based on Stage
    let enemyCount = Math.min(9, Math.ceil(gameState.stage / 2) + 2);
    let enemyLevel = Math.max(1, gameState.stage - 1);
    // Boss stage every 5
    if (gameState.stage % 5 === 0) {
        enemyCount = 1;
        enemyLevel = gameState.stage + 2;
    }
    
    currentBattle = {
        player: [],
        enemy: []
    };
    
    // Populate Player
    elPlayerBattleGrid.innerHTML = '';
    availableSoldiers.forEach((s, idx) => {
        let stats = getUnitStats(s.level, 'soldier');
        let hp = Math.floor(stats.hp * (1 + gameState.decorations.hpBuff));
        let atk = Math.floor(stats.atk * (1 + gameState.decorations.atkBuff));
        
        let unit = { id: `p_${idx}`, team: 'player', level: s.level, maxHp: hp, hp: hp, atk: atk, el: null };
        currentBattle.player.push(unit);
        
        unit.el = createBattleEntityUI(unit);
        elPlayerBattleGrid.appendChild(unit.el);
    });
    
    // Populate Enemy
    elEnemyBattleGrid.innerHTML = '';
    for(let i=0; i<enemyCount; i++) {
        let stats = getUnitStats(enemyLevel, 'soldier');
        let unit = { id: `e_${i}`, team: 'enemy', level: enemyLevel, maxHp: stats.hp, hp: stats.hp, atk: stats.atk, el: null };
        if (gameState.stage % 5 === 0) {
            unit.maxHp *= 5; unit.hp *= 5; unit.atk *= 2; // Boss multiplier
        }
        currentBattle.enemy.push(unit);
        
        unit.el = createBattleEntityUI(unit);
        elEnemyBattleGrid.appendChild(unit.el);
    }
    
    // Start Auto-Battle Loop
    setTimeout(processBattleTurn, 1000);
}

function createBattleEntityUI(unit) {
    const entDiv = document.createElement('div');
    entDiv.className = `entity`;
    if(unit.team === 'enemy') entDiv.style.backgroundColor = '#ef4444';
    
    const lvlBadge = document.createElement('div');
    lvlBadge.className = 'entity-level';
    lvlBadge.innerText = `Lv.${unit.level}`;
    
    const icon = document.createElement('i');
    icon.className = 'fa-solid ' + (unit.team === 'player' ? 'fa-person-rifle' : 'fa-skull');
    icon.style.color = 'white';
    icon.style.fontSize = '24px';
    
    const hpBarCont = document.createElement('div');
    hpBarCont.className = 'hp-bar-container';
    const hpFill = document.createElement('div');
    hpFill.className = 'hp-bar-fill';
    hpFill.id = `hp_${unit.id}`;
    if(unit.team === 'enemy') hpFill.style.backgroundColor = '#f87171';
    hpBarCont.appendChild(hpFill);
    
    entDiv.appendChild(lvlBadge);
    entDiv.appendChild(icon);
    entDiv.appendChild(hpBarCont);
    return entDiv;
}

function processBattleTurn() {
    if (!currentBattle) return;
    
    let alivePlayers = currentBattle.player.filter(u => u.hp > 0);
    let aliveEnemies = currentBattle.enemy.filter(u => u.hp > 0);
    
    if (aliveEnemies.length === 0) {
        // Victory
        let reward = gameState.stage * 150;
        gameState.gold += reward;
        gameState.stage++;
        saveGame();
        updateHUD();
        
        document.getElementById('battleResultTitle').innerText = 'VICTORY!';
        document.getElementById('battleResultTitle').style.color = '#4ade80';
        document.getElementById('battleRewardText').innerText = reward;
        
        elModalOverlay.classList.add('active');
        document.getElementById('battleResultModal').style.display = 'block';
        document.getElementById('decorModal').style.display = 'none';
        return;
    }
    
    if (alivePlayers.length === 0) {
        // Defeat
        document.getElementById('battleResultTitle').innerText = 'DEFEAT!';
        document.getElementById('battleResultTitle').style.color = '#ef4444';
        document.getElementById('battleRewardText').innerText = '0';
        
        elModalOverlay.classList.add('active');
        document.getElementById('battleResultModal').style.display = 'block';
        document.getElementById('decorModal').style.display = 'none';
        return;
    }
    
    // Simple turn logic: All alive players attack random enemy, then all alive enemies attack random player
    alivePlayers.forEach(p => {
        if(aliveEnemies.length === 0) return;
        let target = aliveEnemies[Math.floor(Math.random() * aliveEnemies.length)];
        target.hp -= p.atk;
        
        // Anim
        p.el.style.transform = 'translateY(-10px)';
        setTimeout(() => p.el.style.transform = 'translateY(0)', 150);
        
        if (target.hp <= 0) {
            target.hp = 0;
            target.el.style.opacity = '0.2';
            target.el.style.filter = 'grayscale(1)';
            logBattle(`Player Lv.${p.level} killed Enemy Lv.${target.level}!`, 'kill');
            aliveEnemies = aliveEnemies.filter(e => e.hp > 0);
        }
        document.getElementById(`hp_${target.id}`).style.width = (target.hp / target.maxHp * 100) + '%';
    });
    
    aliveEnemies.forEach(e => {
        if(alivePlayers.length === 0) return;
        let target = alivePlayers[Math.floor(Math.random() * alivePlayers.length)];
        target.hp -= e.atk;
        
        e.el.style.transform = 'translateY(10px)';
        setTimeout(() => e.el.style.transform = 'translateY(0)', 150);
        
        if (target.hp <= 0) {
            target.hp = 0;
            target.el.style.opacity = '0.2';
            target.el.style.filter = 'grayscale(1)';
            logBattle(`Enemy Lv.${e.level} killed Player Lv.${target.level}!`, 'damage');
            alivePlayers = alivePlayers.filter(p => p.hp > 0);
        }
        document.getElementById(`hp_${target.id}`).style.width = (target.hp / target.maxHp * 100) + '%';
    });
    
    setTimeout(processBattleTurn, 800);
}
"""

with open(js_path, 'a', encoding='utf-8') as f:
    f.write(additional_logic)
