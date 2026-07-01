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
let wave = 1;

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

// If locked out on reload, show lockout screen
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

  // Update Costs
  const kCost = knifeLvl * 50;
  const pCost = pistolLvl * 50;
  const wCost = wallLvl * 40;
  const tCost = (turretLvl + 1) * 150;

  document.getElementById('upg-knife-title').innerText = `🗡️ Pisau Tangan Kiri (Lv.${knifeLvl})`;
  document.getElementById('upg-knife-cost').innerText = `${kCost} 🪙`;

  document.getElementById('upg-pistol-title').innerText = `🔫 Pistol Tangan Kanan (Lv.${pistolLvl})`;
  document.getElementById('upg-pistol-cost').innerText = `${pCost} 🪙`;

  document.getElementById('upg-wall-title').innerText = `💠 Energi Core Stone (Lv.${wallLvl})`;
  document.getElementById('upg-wall-cost').innerText = `${wCost} 🪙`;

  document.getElementById('upg-turret-title').innerText = `🤖 Senjata Turret Otomatis (Lv.${turretLvl})`;
  document.getElementById('upg-turret-cost').innerText = `${tCost} 🪙`;

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
  document.getElementById('gameover-screen').classList.add('hidden');
  document.getElementById('lockout-screen').classList.add('hidden');
  hp = maxHp;
  enemies = [];
  bullets = [];
  particles = [];
  floatingTexts = [];
  tanks = [];
  gameRunning = true;
  updateHUD();
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
  document.getElementById('lockout-desc').innerText = `Tugu Batu Core Stone direbut oleh bos musuh Fase ${currentPhase}! Anda memerlukan ${cost} Permata untuk menebus dan mengakses kembali permainan. Mainkan mini-game atau topup untuk menebusnya!`;
  
  document.getElementById('start-screen').classList.add('hidden');
  document.getElementById('gameover-screen').classList.add('hidden');
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
  alert('🎉 TEBUSAN BERHASIL! Tugu Batu Core Stone telah dipulihkan. Anda siap bertempur kembali!');
  startGame();
}

// Manual Tap to Shoot
canvas.addEventListener('mousedown', e => {
  if (!gameRunning) return;
  const rect = canvas.getBoundingClientRect();
  firePlayerPistol(e.clientX - rect.left, e.clientY - rect.top);
});
canvas.addEventListener('touchstart', e => {
  if (!gameRunning) return;
  e.preventDefault();
  const rect = canvas.getBoundingClientRect();
  firePlayerPistol(e.touches[0].clientX - rect.left, e.touches[0].clientY - rect.top);
});

function firePlayerPistol(tx, ty) {
  pistolRecoilAnim = 12;
  muzzleFlash = 5;
  screenShake = 2;

  let dmg = pistolLvl * 20;
  let angle = Math.atan2(ty - 440, tx - 280);
  bullets.push({
    x: 280, y: 440,
    vx: Math.cos(angle) * 18, vy: Math.sin(angle) * 18,
    dmg: dmg
  });
  spawnParticle(280, 440, '#fbbf24', 4);
}

function triggerKnifeMelee(targetEnemy) {
  knifeStabAnim = 15;
  let dmg = knifeLvl * 40;
  targetEnemy.hp -= dmg;
  spawnParticle(targetEnemy.x, targetEnemy.y, '#ef4444', 8);
  spawnFloatingText(targetEnemy.x, targetEnemy.y - 15, `🗡️ -${dmg}`, '#ef4444');
  if (targetEnemy.hp <= 0) killEnemy(targetEnemy);
}

function spawnEnemy() {
  const now = new Date();
  const isNightHorde = isSimulating1900 || now.getHours() === 19;

  let baseHp = (25 + survivorLvl * 15) * (currentPhase === 2 ? 1.8 : (currentPhase === 3 ? 2.6 : 1));
  let speed = 0.35 + Math.random() * 0.25;
  let spawnX = 140 + Math.random() * 100;

  // Boss Check every 15 enemies killed / wave progress
  if (Math.random() < 0.15 && isNightHorde) {
    if (currentPhase === 1) {
      enemies.push({ name: '🦹 BOS PEMIMPIN GENG', x: spawnX, y: 100, hp: baseHp * 4, maxHp: baseHp * 4, speed: speed * 0.6, size: 38, reward: 50, color: '#f59e0b', isBoss: true });
    } else if (currentPhase === 2) {
      enemies.push({ name: '🧪 ILMUWAN SETENGAH MUTAN', x: spawnX, y: 100, hp: baseHp * 5, maxHp: baseHp * 5, speed: speed * 0.7, size: 42, reward: 80, color: '#a855f7', isBoss: true });
    } else {
      enemies.push({ name: '🧟 ILMUWAN ZOMBIE BERPIKIR', x: spawnX, y: 100, hp: baseHp * 6, maxHp: baseHp * 6, speed: speed * 0.8, size: 45, reward: 120, color: '#10b981', isBoss: true });
    }
  } else {
    let icon = currentPhase === 1 ? '🦹' : (currentPhase === 2 ? '🧪' : '🧟');
    enemies.push({
      name: `${icon} Pasukan Sindikat`,
      x: spawnX, y: 100,
      hp: baseHp, maxHp: baseHp,
      speed: speed * (isNightHorde ? 1.4 : 1.0),
      size: 26,
      reward: 12 * currentPhase,
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
        alert(`💥 BOS DIKALAHKAN!\n\nMemasuki Fase ${currentPhase}!\nIlmuwan Jahat mengambil alih eksperimen dan pasukan musuh kini bertambah kuat!`);
      } else {
        alert(`🏆 LUAR BIASA!\n\nIlmuwan Zombie Berpikir berhasil dipukul mundur! Dia melarikan diri ke pulau lain untuk berevolusi menjadi Monster Raksasa!`);
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

  // 2. Spawn Enemies
  const now = new Date();
  const isNightHorde = isSimulating1900 || now.getHours() === 19;
  spawnTimer++;
  let spawnInterval = isNightHorde ? 40 : 120;
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
        bullets.push({ x: 190, y: 390, vx: (target.x - 190) * 0.08, vy: (target.y - 390) * 0.08, dmg: turretLvl * 15 });
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
    if (b.y < 90 || b.x < 0 || b.x > canvas.width || b.y > canvas.height) {
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
    let depthProgress = Math.max(0, Math.min(1, (e.y - 100) / 280));
    let scale = 0.35 + depthProgress * 0.85;

    ctx.save();
    ctx.translate(e.x, e.y);
    ctx.scale(scale, scale);

    ctx.shadowColor = e.color; ctx.shadowBlur = 12;
    ctx.fillStyle = e.color;
    ctx.beginPath(); ctx.arc(0, 0, e.size / 2, 0, Math.PI * 2); ctx.fill();
    ctx.shadowBlur = 0;
    ctx.font = '20px sans-serif';
    ctx.fillText(e.name.slice(0, 2), -10, 6);

    ctx.restore();

    ctx.fillStyle = 'rgba(255,255,255,0.2)'; ctx.fillRect(e.x - 18, e.y - (e.size * scale) / 2 - 10, 36, 4);
    ctx.fillStyle = '#ef4444'; ctx.fillRect(e.x - 18, e.y - (e.size * scale) / 2 - 10, Math.max(0, (e.hp / e.maxHp) * 36), 4);

    if (e.y >= 370) {
      if (knifeStabAnim === 0 && gameTick % 25 === 0) triggerKnifeMelee(e);
      hp -= 0.25 * currentPhase;
      screenShake = 1;
      updateHUD();
      if (hp <= 0) { triggerCoreStoneStolen(); return; }
    }
  }

  // 7. Render Core Stone Monolith & FPS HUD
  renderCoreStoneAndFPSHUD();

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
  let skyGrad = ctx.createLinearGradient(0, 0, 0, 100);
  skyGrad.addColorStop(0, '#020617'); skyGrad.addColorStop(1, '#1e1b4b');
  ctx.fillStyle = skyGrad; ctx.fillRect(0, 0, canvas.width, 100);

  let groundGrad = ctx.createLinearGradient(0, 100, 0, canvas.height);
  groundGrad.addColorStop(0, '#111827'); groundGrad.addColorStop(1, '#1f2937');
  ctx.fillStyle = groundGrad; ctx.fillRect(0, 100, canvas.width, canvas.height - 100);

  ctx.strokeStyle = 'rgba(255,255,255,0.06)'; ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(190, 100); ctx.lineTo(0, 480);
  ctx.moveTo(190, 100); ctx.lineTo(100, 480);
  ctx.moveTo(190, 100); ctx.lineTo(280, 480);
  ctx.moveTo(190, 100); ctx.lineTo(380, 480);
  ctx.stroke();

  [140, 200, 280, 370].forEach(y => {
    ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(canvas.width, y); ctx.stroke();
  });
}

function renderCoreStoneAndFPSHUD() {
  // 1. Giant Core Stone Monolith (2x character height behind fence)
  ctx.save();
  ctx.fillStyle = '#334155';
  ctx.fillRect(155, 360, 70, 70);
  ctx.strokeStyle = '#475569'; ctx.lineWidth = 3;
  ctx.strokeRect(155, 360, 70, 70);

  // Glowing Core Runic Logo in Center
  ctx.shadowColor = '#38bdf8'; ctx.shadowBlur = 18;
  ctx.font = '36px sans-serif';
  ctx.fillText('💠', 170, 405);
  ctx.restore();

  // 2. Wooden Barricade Fence in front of stone
  ctx.fillStyle = '#3e2723';
  ctx.fillRect(0, 420, canvas.width, 25);
  ctx.font = '22px sans-serif';
  for (let x = 10; x < canvas.width; x += 35) {
    ctx.fillText('🪵', x, 440);
  }

  // 3. Left Hand Knife
  ctx.save();
  let knifeOffset = knifeStabAnim > 0 ? -25 : 0;
  ctx.translate(60, 455 + knifeOffset);
  ctx.font = '44px sans-serif';
  ctx.fillText('🗡️', 0, 0);
  ctx.restore();

  // 4. Right Hand Pistol
  ctx.save();
  let pistolOffset = pistolRecoilAnim > 0 ? 12 : 0;
  ctx.translate(270, 445 + pistolOffset);
  ctx.font = '44px sans-serif';
  ctx.fillText('🔫', 0, 0);
  if (muzzleFlash > 0) {
    ctx.font = '28px sans-serif';
    ctx.fillText('💥', -15, -20);
  }
  ctx.restore();
}

function upgradeItem(type) {
  let cost = 0;
  if (type === 'knife') {
    cost = knifeLvl * 50;
    if (gold < cost) { openTopup(); return; }
    gold -= cost; knifeLvl++;
  } else if (type === 'pistol') {
    cost = pistolLvl * 50;
    if (gold < cost) { openTopup(); return; }
    gold -= cost; pistolLvl++;
  } else if (type === 'wall') {
    cost = wallLvl * 40;
    if (gold < cost) { openTopup(); return; }
    gold -= cost; wallLvl++; maxHp += 50; hp = maxHp;
  } else if (type === 'turret') {
    cost = (turretLvl + 1) * 150;
    if (gold < cost) { openTopup(); return; }
    gold -= cost; turretLvl++;
  }
  updateHUD();
}

function summonTankPlatoon() {
  if (gold < 200) { openTopup(); return; }
  gold -= 200;
  tanks.push({ x: 190, y: 400 });
  tanks.push({ x: 120, y: 430 });
  tanks.push({ x: 260, y: 430 });
  updateHUD();
  screenShake = 6;
}

// Target Practice Mini-Game for Redemption
let mgTimerInterval;
function openMiniGame() {
  document.getElementById('minigame-modal').classList.add('active');
}
function closeMiniGame() {
  clearInterval(mgTimerInterval);
  document.getElementById('minigame-modal').classList.remove('active');
}
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
      score += 5;
      gems += 5;
      document.getElementById('mg-score').innerText = score;
      updateHUD();
      t.remove();
      spawnTarget();
    };
    area.appendChild(t);
  };

  spawnTarget();
  spawnTarget();

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
      alert(`🎉 Topup Logistik Berhasil! +${amount} Gems ditambahkan.`);
    }
  });
}
