const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

// Game Persistent State & Story Lore
let gold = parseInt(localStorage.getItem('outpost_gold') || '250');
let gems = parseInt(localStorage.getItem('outpost_gems') || '50');
let currentPhase = parseInt(localStorage.getItem('corestone_phase') || '1');
let isLockedOut = localStorage.getItem('corestone_locked') === 'true';

if (!localStorage.getItem('outpost_init_starter')) {
  gems = Math.max(gems, 50);
  localStorage.setItem('outpost_init_starter', 'true');
  localStorage.setItem('outpost_gems', gems);
}

// Infinite Upgrade Levels
let knifeLvl = parseInt(localStorage.getItem('outpost_knife_lvl') || '1');
let pistolLvl = parseInt(localStorage.getItem('outpost_pistol_lvl') || '1');
let wallLvl = parseInt(localStorage.getItem('outpost_wall_lvl') || '1');
let survivorLvl = parseInt(localStorage.getItem('outpost_survivor_lvl') || '1');

let maxHp = 100 + (wallLvl - 1) * 50;
let hp = maxHp;
let gameRunning = false;
let animationId;
let isSimulating1900 = false;

// 8 Columns x 4 Rows Grid System behind front wall (y = 360 to 520)
// Grid cell width = 380 / 8 = 47.5px. Grid cell height = 40px.
// gridY = 0 is row closest to enemies/wall (y=360..400)
// gridY = 3 is bottom back row (y=480..520)
const GRID_COLS = 8;
const GRID_ROWS = 4;
let grid = Array(GRID_ROWS).fill(null).map(() => Array(GRID_COLS).fill(null));

// Player position in Grid (1x1 collider)
let playerCol = 3;
let playerRow = 2;
let mouseX = 190;
let mouseY = 200;

// Towers array stored in Grid
let towers = [];

// Initialize Core Stone occupying 2 columns x 1 row at bottom center back (col 3 & 4, row 3)
function initGrid() {
  grid = Array(GRID_ROWS).fill(null).map(() => Array(GRID_COLS).fill(null));
  grid[3][3] = { type: 'stone', name: 'Core Stone' };
  grid[3][4] = { type: 'stone', name: 'Core Stone' };
  towers.forEach(t => {
    if (t.col >= 0 && t.col < GRID_COLS && t.row >= 0 && t.row < GRID_ROWS) {
      grid[t.row][t.col] = t;
    }
  });
}
initGrid();

// Entities & Combat VFX
let enemies = [];
let bullets = [];
let particles = [];
let floatingTexts = [];
let tanks = [];

let autoShootTimer = 0;
let spawnTimer = 0;
let gameTick = 0;
let screenShake = 0;
let knifeStabAnim = 0;
let pistolRecoilAnim = 0;
let muzzleFlash = 0;

// Update Live Clock & HUD on launch
setInterval(updateClock, 1000);
updateClock();
updateHUD();

if (isLockedOut) {
  setTimeout(() => triggerCoreStoneStolen(), 300);
}

function updateClock() {
  const now = new Date();
  const timeStr = now.toLocaleTimeString('id-ID', { hour12: false });
  const clockEl = document.getElementById('clock-display');
  if (clockEl) clockEl.innerText = `🕒 WIB ${timeStr}`;

  const isNightHorde = isSimulating1900 || now.getHours() === 19;
  const statusEl = document.getElementById('horde-status');
  if (statusEl) {
    if (isNightHorde) {
      statusEl.innerText = '🔥 HORDE 19:00 WIB (Siaga 1)';
      statusEl.style.color = '#ef4444';
    } else {
      statusEl.innerText = '🛡️ Patroli Biasa (Siang)';
      statusEl.style.color = '#10b981';
    }
  }
}

function toggleSimulate1900() {
  isSimulating1900 = !isSimulating1900;
  const btn = document.getElementById('sim-horde-btn');
  if (btn) {
    btn.style.background = isSimulating1900 ? '#ef4444' : 'rgba(17,24,39,0.85)';
    btn.style.color = 'white';
    btn.innerHTML = `<i class="fa-solid fa-clock"></i> Tes Jam 19:00: ${isSimulating1900 ? 'AKTIF 🔥' : 'OFF'}`;
  }
  updateClock();
  if (isSimulating1900 && gameRunning) {
    spawnFloatingText(190, 240, '⚠️ GELOMBANG HORDE 19:00 WIB TIBA!', '#ef4444');
    screenShake = 12;
  }
}

function updateHUD() {
  document.getElementById('gold-display').innerText = gold.toLocaleString('id-ID');
  document.getElementById('gem-display').innerText = gems.toLocaleString('id-ID');
  document.getElementById('hp-display').innerText = `${Math.max(0, Math.floor(hp))} / ${maxHp}`;

  const phaseNames = {
    1: 'Fase 1: Pemimpin Geng',
    2: 'Fase 2: Ilmuwan Setengah Mutan',
    3: 'Fase 3: Ilmuwan Zombie Berpikir'
  };
  const pEl = document.getElementById('phase-display');
  if (pEl) pEl.innerText = phaseNames[currentPhase] || `Fase ${currentPhase}`;

  localStorage.setItem('outpost_gold', gold);
  localStorage.setItem('outpost_gems', gems);
  localStorage.setItem('outpost_knife_lvl', knifeLvl);
  localStorage.setItem('outpost_pistol_lvl', pistolLvl);
  localStorage.setItem('outpost_wall_lvl', wallLvl);
  localStorage.setItem('outpost_survivor_lvl', survivorLvl);
  localStorage.setItem('corestone_phase', currentPhase);
}

function startGame() {
  if (isLockedOut) {
    triggerCoreStoneStolen();
    return;
  }
  document.getElementById('start-screen').classList.add('hidden');
  document.getElementById('lockout-screen').classList.add('hidden');
  hp = maxHp;
  enemies = [];
  bullets = [];
  particles = [];
  floatingTexts = [];
  tanks = [];
  towers = [];
  playerCol = 3;
  playerRow = 2;
  initGrid();
  gameRunning = true;
  updateHUD();
  spawnEnemy();
  cancelAnimationFrame(animationId);
  loop();
}

function triggerCoreStoneStolen() {
  gameRunning = false;
  cancelAnimationFrame(animationId);
  isLockedOut = true;
  localStorage.setItem('corestone_locked', 'true');

  const penalties = { 1: 100, 2: 300, 3: 500 };
  const cost = penalties[currentPhase] || 100;

  document.getElementById('lockout-cost').innerText = `💎 ${cost} Permata`;
  document.getElementById('lockout-desc').innerText = `Tugu Batu Core Stone direbut oleh musuh Fase ${currentPhase}! Anda memerlukan ${cost} Permata untuk menebus dan mengakses kembali permainan.`;
  
  document.getElementById('start-screen').classList.add('hidden');
  document.getElementById('lockout-screen').classList.remove('hidden');
}

function payRansom() {
  const penalties = { 1: 100, 2: 300, 3: 500 };
  const cost = penalties[currentPhase] || 100;
  if (gems < cost) {
    alert(`⚠️ Permata Anda tidak cukup (${gems}/${cost} 💎).\n\nSilakan klik tombol "MAINKAN MINI-GAME" untuk mendapatkan Permata gratis atau Topup!`);
    return;
  }
  gems -= cost;
  isLockedOut = false;
  localStorage.setItem('corestone_locked', 'false');
  updateHUD();
  alert('🎉 TEBUSAN BERHASIL! Tugu Batu Core Stone telah dipulihkan.');
  startGame();
}

// Track Mouse / Cursor Position for Facing Direction
canvas.addEventListener('mousemove', e => {
  const rect = canvas.getBoundingClientRect();
  mouseX = e.clientX - rect.left;
  mouseY = e.clientY - rect.top;
});

// Click / Tap to Shoot Pistol
canvas.addEventListener('mousedown', e => {
  if (!gameRunning) return;
  const rect = canvas.getBoundingClientRect();
  firePlayerPistol(e.clientX - rect.left, e.clientY - rect.top);
});

function firePlayerPistol(tx, ty) {
  pistolRecoilAnim = 12;
  muzzleFlash = 5;
  screenShake = 2;

  let cellW = canvas.width / GRID_COLS;
  let startX = playerCol * cellW + cellW / 2;
  let startY = 360 + playerRow * 40 + 20;

  let angle = Math.atan2(ty - startY, tx - startX);
  bullets.push({
    x: startX, y: startY,
    vx: Math.cos(angle) * 18, vy: Math.sin(angle) * 18,
    dmg: pistolLvl * 25
  });
  spawnParticle(startX, startY, '#fbbf24', 4);
}

// Keyboard Shortcuts: W, A, S, D for Grid Movement, T for Tower, U for Upgrade
window.addEventListener('keydown', e => {
  if (!gameRunning) return;
  const key = e.key.toUpperCase();

  let targetCol = playerCol;
  let targetRow = playerRow;

  if (key === 'W' || key === 'ARROWUP') targetRow--;
  else if (key === 'S' || key === 'ARROWDOWN') targetRow++;
  else if (key === 'A' || key === 'ARROWLEFT') targetCol--;
  else if (key === 'D' || key === 'ARROWRIGHT') targetCol++;
  else if (key === 'T') {
    tryBuildTower();
    return;
  } else if (key === 'U') {
    tryProximityUpgrade();
    return;
  }

  // Check Grid Movement Bounds & Colliders (Cannot walk into Core Stone or Tower)
  if (targetCol !== playerCol || targetRow !== playerRow) {
    if (targetCol >= 0 && targetCol < GRID_COLS && targetRow >= 0 && targetRow < GRID_ROWS) {
      // Check solid collider in cell
      if (grid[targetRow][targetCol] === null) {
        playerCol = targetCol;
        playerRow = targetRow;
        checkProximityPrompt();
      } else {
        // Bump animation / floating feedback
        let obj = grid[targetRow][targetCol];
        let cellW = canvas.width / GRID_COLS;
        spawnFloatingText(targetCol * cellW + 20, 360 + targetRow * 40, `🧱 Objek: ${obj.name || 'Menghalangi'}`, '#fca5a5');
      }
    }
  }
});

function tryBuildTower() {
  // Build tower on the empty grid cell right in front of player (row - 1) or closest adjacent
  let frontRow = playerRow - 1;
  if (frontRow < 0) {
    alert('⚠️ Tidak bisa membangun tower di luar garis pagar depan!');
    return;
  }
  if (grid[frontRow][playerCol] !== null) {
    alert('⚠️ Petak grid di depan Anda sudah terisi objek lain!');
    return;
  }
  if (gold < 100) {
    alert('⚠️ Koin Emas tidak cukup untuk membangun Tower (Butuh: 100 🪙)');
    openTopup();
    return;
  }

  gold -= 100;
  let newTower = { type: 'tower', name: 'Tower Pertahanan', col: playerCol, row: frontRow, lvl: 1 };
  towers.push(newTower);
  grid[frontRow][playerCol] = newTower;
  updateHUD();
  let cellW = canvas.width / GRID_COLS;
  spawnParticle(playerCol * cellW + cellW / 2, 360 + frontRow * 40 + 20, '#38bdf8', 12);
  spawnFloatingText(playerCol * cellW + cellW / 2, 360 + frontRow * 40, '🤖 TOWER DIBANGUN!', '#38bdf8');
  checkProximityPrompt();
}

function tryProximityUpgrade() {
  // Check adjacent cells (including same cell / front boundary)
  let upgradedAny = false;
  let cellW = canvas.width / GRID_COLS;
  let px = playerCol * cellW + cellW / 2;
  let py = 360 + playerRow * 40 + 20;

  // 1. Check if adjacent to Front Wall (playerRow === 0)
  if (playerRow === 0) {
    let cost = wallLvl * 40;
    if (gold >= cost) {
      gold -= cost; wallLvl++; maxHp += 50; hp = maxHp;
      spawnFloatingText(px, py - 30, '💠 PAGAR & TUGU DIPERKUAT!', '#38bdf8');
      upgradedAny = true;
    } else {
      openTopup(); return;
    }
  }

  // 2. Check adjacent grid cells for Core Stone or Tower
  for (let r = Math.max(0, playerRow - 1); r <= Math.min(GRID_ROWS - 1, playerRow + 1); r++) {
    for (let c = Math.max(0, playerCol - 1); c <= Math.min(GRID_COLS - 1, playerCol + 1); c++) {
      let obj = grid[r][c];
      if (obj && obj.type === 'stone' && !upgradedAny) {
        let cost = wallLvl * 40;
        if (gold >= cost) {
          gold -= cost; wallLvl++; maxHp += 50; hp = maxHp;
          spawnFloatingText(px, py - 30, '💠 ENERGI CORE STONE NAIK!', '#38bdf8');
          upgradedAny = true;
        }
      } else if (obj && obj.type === 'tower' && !upgradedAny) {
        let cost = obj.lvl * 100;
        if (gold >= cost) {
          gold -= cost; obj.lvl++;
          spawnFloatingText(c * cellW + 20, 360 + r * 40, `🤖 TOWER LV.${obj.lvl}!`, '#10b981');
          upgradedAny = true;
        }
      }
    }
  }

  // 3. If no adjacent object, upgrade player weapons
  if (!upgradedAny) {
    let cost = knifeLvl * 50;
    if (gold >= cost) {
      gold -= cost; knifeLvl++; pistolLvl++;
      spawnFloatingText(px, py - 30, `🛠️ SENJATA LV.${knifeLvl}!`, '#fbbf24');
      upgradedAny = true;
    } else {
      openTopup(); return;
    }
  }

  updateHUD();
  checkProximityPrompt();
}

function checkProximityPrompt() {
  const prompt = document.getElementById('prox-prompt');
  const title = document.getElementById('prox-title');
  if (!prompt || !title) return;

  if (playerRow === 0) {
    title.innerText = `Mepet Pagar Barikade (Biaya: ${wallLvl * 40} 🪙)`;
    prompt.classList.remove('hidden');
    return;
  }

  for (let r = Math.max(0, playerRow - 1); r <= Math.min(GRID_ROWS - 1, playerRow + 1); r++) {
    for (let c = Math.max(0, playerCol - 1); c <= Math.min(GRID_COLS - 1, playerCol + 1); c++) {
      let obj = grid[r][c];
      if (obj) {
        if (obj.type === 'stone') {
          title.innerText = `Mepet Core Stone (Biaya: ${wallLvl * 40} 🪙)`;
          prompt.classList.remove('hidden');
          return;
        } else if (obj.type === 'tower') {
          title.innerText = `Mepet Tower Lv.${obj.lvl} (Biaya: ${obj.lvl * 100} 🪙)`;
          prompt.classList.remove('hidden');
          return;
        }
      }
    }
  }

  title.innerText = `Senjata Karakter (Biaya: ${knifeLvl * 50} 🪙)`;
  prompt.classList.remove('hidden');
}

function triggerKnifeMelee(targetEnemy) {
  knifeStabAnim = 15;
  let dmg = knifeLvl * 50;
  targetEnemy.hp -= dmg;
  spawnParticle(targetEnemy.x, targetEnemy.y, '#ef4444', 8);
  spawnFloatingText(targetEnemy.x, targetEnemy.y - 15, `🗡️ -${dmg}`, '#ef4444');
  if (targetEnemy.hp <= 0) killEnemy(targetEnemy);
}

function spawnEnemy() {
  const now = new Date();
  const isNightHorde = isSimulating1900 || now.getHours() === 19;

  let baseHp = (25 + survivorLvl * 15) * (currentPhase === 2 ? 1.8 : (currentPhase === 3 ? 2.6 : 1));
  let speed = 0.45 + Math.random() * 0.3;
  let spawnX = 40 + Math.random() * 300;

  if (Math.random() < 0.18 && isNightHorde) {
    if (currentPhase === 1) {
      enemies.push({ name: '🦹 BOS PEMIMPIN GENG', x: spawnX, y: 70, hp: baseHp * 4, maxHp: baseHp * 4, speed: speed * 0.6, size: 38, reward: 50, color: '#f59e0b', isBoss: true });
    } else if (currentPhase === 2) {
      enemies.push({ name: '🧪 ILMUWAN SETENGAH MUTAN', x: spawnX, y: 70, hp: baseHp * 5, maxHp: baseHp * 5, speed: speed * 0.7, size: 42, reward: 80, color: '#a855f7', isBoss: true });
    } else {
      enemies.push({ name: '🧟 ILMUWAN ZOMBIE BERPIKIR', x: spawnX, y: 70, hp: baseHp * 6, maxHp: baseHp * 6, speed: speed * 0.8, size: 45, reward: 120, color: '#10b981', isBoss: true });
    }
  } else {
    let icon = currentPhase === 1 ? '🦹' : (currentPhase === 2 ? '🧪' : '🧟');
    enemies.push({
      name: `${icon} Pasukan Sindikat`,
      x: spawnX, y: 70,
      hp: baseHp, maxHp: baseHp,
      speed: speed * (isNightHorde ? 1.4 : 1.0),
      size: 28,
      reward: 15 * currentPhase,
      color: currentPhase === 1 ? '#38bdf8' : (currentPhase === 2 ? '#c084fc' : '#34d399')
    });
  }
}

function killEnemy(enemy) {
  const index = enemies.indexOf(enemy);
  if (index !== -1) {
    enemies.splice(index, 1);
    gold += enemy.reward;
    survivorLvl = Math.floor(gold / 150) + 1;
    updateHUD();
    spawnParticle(enemy.x, enemy.y, enemy.color, 15);
    spawnFloatingText(enemy.x, enemy.y - 25, `+${enemy.reward}🪙`, '#fbbf24');

    if (enemy.isBoss) {
      if (currentPhase < 3) {
        currentPhase++;
        alert(`💥 BOS DIKALAHKAN!\n\nMemasuki Fase ${currentPhase}!\nIlmuwan Jahat mengambil alih bereksperimen dengan setengah mutan!`);
      } else {
        alert(`🏆 LUAR BIASA!\n\nIlmuwan Zombie Berpikir berhasil dipukul mundur! Ia kabur untuk berevolusi menjadi Kaiju Raksasa!`);
      }
      updateHUD();
    }
  }
}

function spawnParticle(x, y, color, count = 6) {
  for (let i = 0; i < count; i++) {
    particles.push({
      x: x, y: y,
      vx: (Math.random() - 0.5) * 6, vy: (Math.random() - 0.5) * 6 - 1,
      size: 2 + Math.random() * 4,
      color: color,
      life: 20 + Math.random() * 15
    });
  }
}

function spawnFloatingText(x, y, text, color = '#ffffff') {
  floatingTexts.push({ x: x, y: y, text: text, color: color, life: 35, vy: -1.5 });
}

function loop() {
  if (!gameRunning) return;
  gameTick++;

  ctx.save();
  if (screenShake > 0) {
    ctx.translate((Math.random() - 0.5) * screenShake, (Math.random() - 0.5) * screenShake);
    screenShake--;
  }

  // 1. Render Environment & Grid Zone
  renderEnvironmentAndGrid();

  // 2. Continuous Enemy Spawning
  const now = new Date();
  const isNightHorde = isSimulating1900 || now.getHours() === 19;
  spawnTimer++;
  let spawnInterval = isNightHorde ? 28 : 60;
  if (spawnTimer >= spawnInterval) {
    spawnEnemy();
    spawnTimer = 0;
  }

  // 3. Automated Towers Shooting
  autoShootTimer++;
  if (autoShootTimer > 35) {
    towers.forEach(t => {
      if (enemies.length > 0) {
        let target = enemies[0];
        let cellW = canvas.width / GRID_COLS;
        let tx = t.col * cellW + cellW / 2;
        let ty = 360 + t.row * 40 + 20;
        bullets.push({ x: tx, y: ty, vx: (target.x - tx) * 0.09, vy: (target.y - ty) * 0.09, dmg: t.lvl * 20 });
      }
    });
    autoShootTimer = 0;
  }

  // 4. Update Bullets
  for (let i = bullets.length - 1; i >= 0; i--) {
    let b = bullets[i];
    b.x += b.vx; b.y += b.vy;
    ctx.fillStyle = '#fbbf24';
    ctx.beginPath(); ctx.arc(b.x, b.y, 4, 0, Math.PI * 2); ctx.fill();
    if (b.y < 70 || b.x < 0 || b.x > canvas.width || b.y > canvas.height) {
      bullets.splice(i, 1); continue;
    }
    for (let j = enemies.length - 1; j >= 0; j--) {
      let e = enemies[j];
      if (Math.hypot(b.x - e.x, b.y - e.y) < e.size) {
        e.hp -= b.dmg;
        bullets.splice(i, 1);
        spawnParticle(b.x, b.y, '#fbbf24', 4);
        spawnFloatingText(e.x, e.y - 15, `-${Math.floor(b.dmg)}`, '#fbbf24');
        if (e.hp <= 0) killEnemy(e);
        break;
      }
    }
  }

  // 5. Update Enemies
  for (let i = enemies.length - 1; i >= 0; i--) {
    let e = enemies[i];
    e.y += e.speed;
    let depthProgress = Math.max(0, Math.min(1, (e.y - 70) / 290));
    let scale = 0.45 + depthProgress * 0.75;

    ctx.save();
    ctx.translate(e.x, e.y);
    ctx.scale(scale, scale);

    ctx.shadowColor = e.color; ctx.shadowBlur = 12;
    ctx.fillStyle = e.color;
    ctx.beginPath(); ctx.arc(0, 0, e.size / 2, 0, Math.PI * 2); ctx.fill();
    ctx.shadowBlur = 0;
    ctx.font = '22px sans-serif';
    ctx.fillText(e.name.slice(0, 2), -11, 7);

    ctx.restore();

    ctx.fillStyle = 'rgba(255,255,255,0.2)'; ctx.fillRect(e.x - 20, e.y - (e.size * scale) / 2 - 12, 40, 5);
    ctx.fillStyle = '#ef4444'; ctx.fillRect(e.x - 20, e.y - (e.size * scale) / 2 - 12, Math.max(0, (e.hp / e.maxHp) * 40), 5);

    // When enemy touches Front Wall boundary (y >= 355)
    if (e.y >= 355) {
      let cellW = canvas.width / GRID_COLS;
      let px = playerCol * cellW + cellW / 2;
      if (playerRow === 0 && Math.abs(px - e.x) < 70 && knifeStabAnim === 0 && gameTick % 20 === 0) {
        triggerKnifeMelee(e);
      }
      hp -= 0.35 * currentPhase;
      screenShake = 1;
      updateHUD();
      if (hp <= 0) { triggerCoreStoneStolen(); return; }
    }
  }

  // 6. Update Particles & Texts
  for (let i = particles.length - 1; i >= 0; i--) {
    let p = particles[i];
    p.x += p.vx; p.y += p.vy; p.life--;
    ctx.fillStyle = p.color; ctx.fillRect(p.x, p.y, p.size, p.size);
    if (p.life <= 0) particles.splice(i, 1);
  }
  for (let i = floatingTexts.length - 1; i >= 0; i--) {
    let ft = floatingTexts[i];
    ft.y += ft.vy; ft.life--;
    ctx.font = 'bold 13px Outfit, sans-serif'; ctx.fillStyle = ft.color; ctx.fillText(ft.text, ft.x, ft.y);
    if (ft.life <= 0) floatingTexts.splice(i, 1);
  }

  if (knifeStabAnim > 0) knifeStabAnim--;
  if (pistolRecoilAnim > 0) pistolRecoilAnim--;
  if (muzzleFlash > 0) muzzleFlash--;

  ctx.restore();
  animationId = requestAnimationFrame(loop);
}

function renderEnvironmentAndGrid() {
  // A. Sky & Ground
  let skyGrad = ctx.createLinearGradient(0, 0, 0, 70);
  skyGrad.addColorStop(0, '#020617'); skyGrad.addColorStop(1, '#1e1b4b');
  ctx.fillStyle = skyGrad; ctx.fillRect(0, 0, canvas.width, 70);

  ctx.fillStyle = '#0f172a'; ctx.fillRect(0, 70, canvas.width, 290);

  // B. Front Barricade Wall Boundary (y = 355 to 360)
  ctx.fillStyle = '#3e2723'; ctx.fillRect(0, 355, canvas.width, 10);
  ctx.font = '18px sans-serif';
  for (let x = 6; x < canvas.width; x += 30) {
    ctx.fillText('🪵', x, 364);
  }

  // C. 8x4 Grid Zone behind Front Wall (y = 360 to 520)
  let cellW = canvas.width / GRID_COLS;
  let cellH = 40;
  for (let r = 0; r < GRID_ROWS; r++) {
    for (let c = 0; c < GRID_COLS; c++) {
      let x = c * cellW;
      let y = 360 + r * cellH;

      ctx.strokeStyle = 'rgba(56,189,248,0.15)';
      ctx.lineWidth = 1;
      ctx.strokeRect(x, y, cellW, cellH);

      // Render Grid Objects
      let obj = grid[r][c];
      if (obj) {
        if (obj.type === 'stone') {
          ctx.fillStyle = '#1e293b';
          ctx.fillRect(x + 2, y + 2, cellW - 4, cellH - 4);
          if (c === 3) {
            ctx.shadowColor = '#38bdf8'; ctx.shadowBlur = 15;
            ctx.font = '28px sans-serif';
            ctx.fillText('💠', x + 20, y + 30);
            ctx.shadowBlur = 0;
          }
        } else if (obj.type === 'tower') {
          ctx.fillStyle = '#1e3a8a';
          ctx.fillRect(x + 4, y + 4, cellW - 8, cellH - 8);
          ctx.font = '22px sans-serif';
          ctx.fillText('🤖', x + 10, y + 28);
          ctx.font = '9px sans-serif'; ctx.fillStyle = '#38bdf8';
          ctx.fillText(`Lv.${obj.lvl}`, x + 10, y + 38);
        }
      }
    }
  }

  // D. Render 3D Player Character on Grid Cell (playerCol, playerRow) facing mouse direction
  let px = playerCol * cellW + cellW / 2;
  let py = 360 + playerRow * cellH + cellH / 2;

  // Highlight player grid cell
  ctx.fillStyle = 'rgba(251,191,36,0.2)';
  ctx.fillRect(playerCol * cellW, 360 + playerRow * cellH, cellW, cellH);

  // Calculate facing rotation angle towards mouse
  let angle = Math.atan2(mouseY - py, mouseX - px);

  ctx.save();
  ctx.translate(px, py);
  ctx.rotate(angle + Math.PI / 2); // Rotate hands to face cursor

  // Player body circle
  ctx.fillStyle = '#38bdf8';
  ctx.beginPath(); ctx.arc(0, 0, 14, 0, Math.PI * 2); ctx.fill();

  // Left Hand Knife
  let kOffset = knifeStabAnim > 0 ? -16 : 0;
  ctx.font = '26px sans-serif';
  ctx.fillText('🗡️', -25, -6 + kOffset);

  // Right Hand Pistol
  let pOffset = pistolRecoilAnim > 0 ? 8 : 0;
  ctx.fillText('🔫', 6, -6 + pOffset);
  if (muzzleFlash > 0) {
    ctx.font = '20px sans-serif';
    ctx.fillText('💥', 6, -26);
  }

  ctx.restore();
}

// Target Practice Mini-Game
let mgTimerInterval;
function openMiniGame() { document.getElementById('minigame-modal').classList.add('active'); }
function closeMiniGame() { clearInterval(mgTimerInterval); document.getElementById('minigame-modal').classList.remove('active'); }
function startMiniGameRound() {
  const area = document.getElementById('mg-area');
  area.innerHTML = '';
  let timeLeft = 15;
  let score = 0;
  document.getElementById('mg-timer').innerText = timeLeft;
  document.getElementById('mg-score').innerText = score;
  document.getElementById('mg-start-btn').disabled = true;

  const spawnTarget = () => {
    if (timeLeft <= 0) return;
    const t = document.createElement('div');
    t.className = 'mg-target';
    t.innerHTML = '🎯';
    t.style.left = Math.floor(Math.random() * 280) + 'px';
    t.style.top = Math.floor(Math.random() * 160) + 'px';
    t.onclick = () => {
      score += 5; gems += 5;
      document.getElementById('mg-score').innerText = score;
      updateHUD();
      t.remove();
      spawnTarget();
    };
    area.appendChild(t);
  };

  spawnTarget(); spawnTarget();
  mgTimerInterval = setInterval(() => {
    timeLeft--;
    document.getElementById('mg-timer').innerText = timeLeft;
    if (timeLeft <= 0) {
      clearInterval(mgTimerInterval);
      area.innerHTML = `<div style="color:#fbbf24; padding-top:80px; font-weight:800;">Waktu Habis!<br>Total Hadiah: +${score} 💎</div>`;
      document.getElementById('mg-start-btn').disabled = false;
      updateHUD();
    }
  }, 1000);
}

function openTopup() { document.getElementById('topup-modal').classList.add('active'); }
function closeTopup() { document.getElementById('topup-modal').classList.remove('active'); }
function buyGems(itemName, price, amount) {
  MidtransPay.checkout({
    itemName: itemName, price: price,
    onSuccess: function() {
      gems += amount;
      updateHUD();
      closeTopup();
      alert(`🎉 Topup Berhasil! +${amount} Gems ditambahkan.`);
    }
  });
}
