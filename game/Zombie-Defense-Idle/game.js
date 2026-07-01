const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

// Game Persistent State & Story Lore
let gold = parseInt(localStorage.getItem('outpost_gold') || '150');
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
let turretLvl = parseInt(localStorage.getItem('outpost_turret_lvl') || '0');
let survivorLvl = parseInt(localStorage.getItem('outpost_survivor_lvl') || '1');

let maxHp = 100 + (wallLvl - 1) * 50;
let hp = maxHp;
let gameRunning = false;
let animationId;
let isSimulating1900 = false;

// Dynamic Mouse/Touch Player Position in Safe Zone
let playerX = 190;
let activeStationTarget = null; // 'weapon', 'stone', or 'turret'

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
    spawnFloatingText(playerX, 240, '⚠️ GELOMBANG HORDE 19:00 WIB TIBA!', '#ef4444');
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
  localStorage.setItem('outpost_turret_lvl', turretLvl);
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
  playerX = 190;
  gameRunning = true;
  updateHUD();
  // Spawn initial enemy immediately so user sees them right away
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
  document.getElementById('lockout-desc').innerText = `Tugu Batu Core Stone direbut oleh musuh Fase ${currentPhase}! Anda memerlukan ${cost} Permata untuk menebus dan mengakses kembali permainan. Mainkan mini-game atau topup untuk menebusnya!`;
  
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

// Mouse / Touch Hover Movement & Aiming
canvas.addEventListener('mousemove', e => {
  if (!gameRunning) return;
  const rect = canvas.getBoundingClientRect();
  playerX = Math.max(35, Math.min(canvas.width - 35, e.clientX - rect.left));
  checkStationProximity();
});

canvas.addEventListener('touchmove', e => {
  if (!gameRunning) return;
  const rect = canvas.getBoundingClientRect();
  playerX = Math.max(35, Math.min(canvas.width - 35, e.touches[0].clientX - rect.left));
  checkStationProximity();
});

// Click / Tap to Shoot Pistol from Player Position
canvas.addEventListener('mousedown', e => {
  if (!gameRunning) return;
  const rect = canvas.getBoundingClientRect();
  firePlayerPistol(e.clientX - rect.left, e.clientY - rect.top);
});

canvas.addEventListener('touchstart', e => {
  if (!gameRunning) return;
  const rect = canvas.getBoundingClientRect();
  firePlayerPistol(e.touches[0].clientX - rect.left, e.touches[0].clientY - rect.top);
});

function firePlayerPistol(tx, ty) {
  pistolRecoilAnim = 12;
  muzzleFlash = 5;
  screenShake = 2;

  let dmg = pistolLvl * 22;
  let startX = playerX + 22;
  let startY = 445;
  let angle = Math.atan2(ty - startY, tx - startX);
  bullets.push({
    x: startX, y: startY,
    vx: Math.cos(angle) * 18, vy: Math.sin(angle) * 18,
    dmg: dmg
  });
  spawnParticle(startX, startY, '#fbbf24', 4);
}

function triggerKnifeMelee(targetEnemy) {
  knifeStabAnim = 15;
  let dmg = knifeLvl * 45;
  targetEnemy.hp -= dmg;
  spawnParticle(targetEnemy.x, targetEnemy.y, '#ef4444', 8);
  spawnFloatingText(targetEnemy.x, targetEnemy.y - 15, `🗡️ -${dmg}`, '#ef4444');
  if (targetEnemy.hp <= 0) killEnemy(targetEnemy);
}

// Check proximity to stations in safe zone (y = 420-480)
function checkStationProximity() {
  const box = document.getElementById('action-box');
  if (!box) return;

  if (Math.abs(playerX - 70) < 45) {
    activeStationTarget = 'weapon';
    document.getElementById('action-title').innerText = `🛠️ Upgrade Pisau & Pistol (Lv.${knifeLvl})`;
    document.getElementById('action-cost').innerText = `Biaya: ${knifeLvl * 50} 🪙`;
    box.classList.remove('hidden');
  } else if (Math.abs(playerX - 190) < 45) {
    activeStationTarget = 'stone';
    document.getElementById('action-title').innerText = `💠 Perkuat Energi Core Stone (Lv.${wallLvl})`;
    document.getElementById('action-cost').innerText = `Biaya: ${wallLvl * 40} 🪙`;
    box.classList.remove('hidden');
  } else if (Math.abs(playerX - 310) < 45) {
    activeStationTarget = 'turret';
    document.getElementById('action-title').innerText = `🤖 Pasang Turret & Panggil Tank`;
    document.getElementById('action-cost').innerText = `Biaya: ${(turretLvl + 1) * 150} 🪙`;
    box.classList.remove('hidden');
  } else {
    activeStationTarget = null;
    box.classList.add('hidden');
  }
}

function triggerHoverUpgrade() {
  if (!activeStationTarget) return;
  if (activeStationTarget === 'weapon') {
    let cost = knifeLvl * 50;
    if (gold < cost) { openTopup(); return; }
    gold -= cost;
    knifeLvl++; pistolLvl++;
    spawnFloatingText(playerX, 420, '🛠️ SENJATA DIUPGRADE!', '#fbbf24');
  } else if (activeStationTarget === 'stone') {
    let cost = wallLvl * 40;
    if (gold < cost) { openTopup(); return; }
    gold -= cost;
    wallLvl++; maxHp += 50; hp = maxHp;
    spawnFloatingText(playerX, 420, '💠 CORE STONE DIPERKUAT!', '#38bdf8');
  } else if (activeStationTarget === 'turret') {
    let cost = (turretLvl + 1) * 150;
    if (gold >= cost) {
      gold -= cost; turretLvl++;
      spawnFloatingText(playerX, 420, '🤖 TURRET AKTIF!', '#10b981');
    } else if (gold >= 200) {
      gold -= 200;
      tanks.push({ x: 190, y: 400 });
      tanks.push({ x: 120, y: 430 });
      tanks.push({ x: 260, y: 430 });
      screenShake = 6;
      spawnFloatingText(playerX, 420, '🚜 PELETON TANK TIBA!', '#10b981');
    } else {
      openTopup(); return;
    }
  }
  updateHUD();
  checkStationProximity();
}

function spawnEnemy() {
  const now = new Date();
  const isNightHorde = isSimulating1900 || now.getHours() === 19;

  let baseHp = (25 + survivorLvl * 15) * (currentPhase === 2 ? 1.8 : (currentPhase === 3 ? 2.6 : 1));
  let speed = 0.4 + Math.random() * 0.3;
  let spawnX = 80 + Math.random() * 220;

  if (Math.random() < 0.18 && isNightHorde) {
    if (currentPhase === 1) {
      enemies.push({ name: '🦹 BOS PEMIMPIN GENG', x: spawnX, y: 80, hp: baseHp * 4, maxHp: baseHp * 4, speed: speed * 0.6, size: 38, reward: 50, color: '#f59e0b', isBoss: true });
    } else if (currentPhase === 2) {
      enemies.push({ name: '🧪 ILMUWAN SETENGAH MUTAN', x: spawnX, y: 80, hp: baseHp * 5, maxHp: baseHp * 5, speed: speed * 0.7, size: 42, reward: 80, color: '#a855f7', isBoss: true });
    } else {
      enemies.push({ name: '🧟 ILMUWAN ZOMBIE BERPIKIR', x: spawnX, y: 80, hp: baseHp * 6, maxHp: baseHp * 6, speed: speed * 0.8, size: 45, reward: 120, color: '#10b981', isBoss: true });
    }
  } else {
    let icon = currentPhase === 1 ? '🦹' : (currentPhase === 2 ? '🧪' : '🧟');
    enemies.push({
      name: `${icon} Pasukan Sindikat`,
      x: spawnX, y: 80,
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

  // 1. Render 3D Perspective Environment
  render3DEnvironment();

  // 2. Continuous Enemy Spawning
  const now = new Date();
  const isNightHorde = isSimulating1900 || now.getHours() === 19;
  spawnTimer++;
  let spawnInterval = isNightHorde ? 30 : 65; // Fast continuous march
  if (spawnTimer >= spawnInterval) {
    spawnEnemy();
    spawnTimer = 0;
  }

  // 3. Auto Turret
  if (turretLvl > 0) {
    autoShootTimer++;
    if (autoShootTimer > Math.max(10, 45 - turretLvl * 3)) {
      if (enemies.length > 0) {
        let target = enemies[0];
        bullets.push({ x: 310, y: 390, vx: (target.x - 310) * 0.08, vy: (target.y - 390) * 0.08, dmg: turretLvl * 15 });
      }
      autoShootTimer = 0;
    }
  }

  // 4. Update Tanks
  for (let i = tanks.length - 1; i >= 0; i--) {
    let t = tanks[i];
    t.y -= 2.5;
    ctx.font = '32px sans-serif';
    ctx.fillText('🛡️🚜', t.x, t.y);
    enemies.forEach(e => {
      if (Math.hypot(t.x - e.x, t.y - e.y) < 40) {
        e.hp -= 200;
        spawnParticle(e.x, e.y, '#fbbf24', 10);
        if (e.hp <= 0) killEnemy(e);
      }
    });
    if (t.y < 80) tanks.splice(i, 1);
  }

  // 5. Update Bullets
  for (let i = bullets.length - 1; i >= 0; i--) {
    let b = bullets[i];
    b.x += b.vx; b.y += b.vy;
    ctx.fillStyle = '#fbbf24';
    ctx.beginPath(); ctx.arc(b.x, b.y, 4, 0, Math.PI * 2); ctx.fill();
    if (b.y < 80 || b.x < 0 || b.x > canvas.width || b.y > canvas.height) {
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

  // 6. Update Enemies
  for (let i = enemies.length - 1; i >= 0; i--) {
    let e = enemies[i];
    e.y += e.speed;
    let depthProgress = Math.max(0, Math.min(1, (e.y - 80) / 320));
    let scale = 0.4 + depthProgress * 0.8;

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

    // When enemy touches Barricade Wall (y >= 380)
    if (e.y >= 380) {
      // Check if player is nearby with Knife (within 60px)
      if (Math.abs(playerX - e.x) < 65 && knifeStabAnim === 0 && gameTick % 20 === 0) {
        triggerKnifeMelee(e);
      }
      hp -= 0.3 * currentPhase;
      screenShake = 1;
      updateHUD();
      if (hp <= 0) { triggerCoreStoneStolen(); return; }
    }
  }

  // 7. Render Interactive Stations, Monolith, Wall & Dynamic Player Character
  renderWorldAndPlayer();

  // 8. Update Particles & Texts
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

function render3DEnvironment() {
  let skyGrad = ctx.createLinearGradient(0, 0, 0, 80);
  skyGrad.addColorStop(0, '#020617'); skyGrad.addColorStop(1, '#1e1b4b');
  ctx.fillStyle = skyGrad; ctx.fillRect(0, 0, canvas.width, 80);

  let groundGrad = ctx.createLinearGradient(0, 80, 0, canvas.height);
  groundGrad.addColorStop(0, '#111827'); groundGrad.addColorStop(1, '#1f2937');
  ctx.fillStyle = groundGrad; ctx.fillRect(0, 80, canvas.width, canvas.height - 80);

  ctx.strokeStyle = 'rgba(255,255,255,0.06)'; ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(190, 80); ctx.lineTo(0, 480);
  ctx.moveTo(190, 80); ctx.lineTo(100, 480);
  ctx.moveTo(190, 80); ctx.lineTo(280, 480);
  ctx.moveTo(190, 80); ctx.lineTo(380, 480);
  ctx.stroke();

  [130, 190, 270, 360].forEach(y => {
    ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(canvas.width, y); ctx.stroke();
  });
}

function renderWorldAndPlayer() {
  // A. Interactive Stations behind fence
  // Station 1: Weapon Workbench (x = 70)
  ctx.fillStyle = 'rgba(255,255,255,0.05)'; ctx.fillRect(40, 415, 60, 40);
  ctx.font = '24px sans-serif'; ctx.fillText('🛠️', 55, 442);
  ctx.font = '10px sans-serif'; ctx.fillStyle = '#94a3b8'; ctx.fillText('Senjata', 53, 460);

  // Station 2: Core Stone Monolith (Center x = 190)
  ctx.save();
  ctx.fillStyle = '#334155'; ctx.fillRect(155, 355, 70, 70);
  ctx.strokeStyle = '#475569'; ctx.lineWidth = 3; ctx.strokeRect(155, 355, 70, 70);
  ctx.shadowColor = '#38bdf8'; ctx.shadowBlur = 18;
  ctx.font = '36px sans-serif'; ctx.fillText('💠', 172, 402);
  ctx.restore();

  // Station 3: Turret & Tank Station (x = 310)
  ctx.fillStyle = 'rgba(255,255,255,0.05)'; ctx.fillRect(280, 415, 60, 40);
  ctx.font = '24px sans-serif'; ctx.fillText('🤖🚀', 293, 442);
  ctx.font = '10px sans-serif'; ctx.fillStyle = '#94a3b8'; ctx.fillText('Turret/Tank', 285, 460);

  // B. Wooden Barricade Fence
  ctx.fillStyle = '#3e2723'; ctx.fillRect(0, 420, canvas.width, 22);
  ctx.font = '20px sans-serif';
  for (let x = 8; x < canvas.width; x += 32) {
    ctx.fillText('🪵', x, 438);
  }

  // C. Dynamic Player 3D Hands moving with mouse/touch (playerX)
  ctx.save();
  // Left Hand: Survival Knife
  let knifeOffset = knifeStabAnim > 0 ? -28 : 0;
  ctx.font = '42px sans-serif';
  ctx.fillText('🗡️', playerX - 35, 470 + knifeOffset);

  // Right Hand: Tactical Pistol
  let pistolOffset = pistolRecoilAnim > 0 ? 12 : 0;
  ctx.fillText('🔫', playerX + 8, 465 + pistolOffset);
  if (muzzleFlash > 0) {
    ctx.font = '28px sans-serif';
    ctx.fillText('💥', playerX - 5, 440);
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
