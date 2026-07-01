const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

// Game Persistent State (Infinite RPG Scaling)
let gold = parseInt(localStorage.getItem('outpost_gold') || '150');
let gems = parseInt(localStorage.getItem('outpost_gems') || '50');
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

let maxHp = 100 + (wallLvl - 1) * 40;
let hp = maxHp;
let gameRunning = false;
let animationId;
let isSimulating1900 = false;

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

function updateClock() {
  const now = new Date();
  const timeStr = now.toLocaleTimeString('id-ID', { hour12: false });
  const clockEl = document.getElementById('clock-display');
  if (clockEl) clockEl.innerText = `🕒 WIB ${timeStr}`;

  // Check if Real-Time WIB is around 19:00 (19:00 to 19:59) or Simulated
  const isNightHorde = isSimulating1900 || now.getHours() === 19;
  const statusEl = document.getElementById('horde-status');
  if (statusEl) {
    if (isNightHorde) {
      statusEl.innerText = '🔥 HORDE 19:00 WIB (Siaga 1)';
      statusEl.style.color = '#ef4444';
    } else {
      statusEl.innerText = '🛡️ Patroli Biasa (Aman)';
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
    btn.innerHTML = `<i class="fa-solid fa-clock"></i> Simulasi Jam 19:00: ${isSimulating1900 ? 'AKTIF 🔥' : 'NONAKTIF'}`;
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
  document.getElementById('level-display').innerText = `Lv. ${survivorLvl}`;

  // Update Upgrade Costs & Labels
  const kCost = knifeLvl * 50;
  const pCost = pistolLvl * 50;
  const wCost = wallLvl * 40;
  const tCost = (turretLvl + 1) * 150;

  document.getElementById('upg-knife-title').innerText = `🗡️ Pisau Tangan Kiri (Lv.${knifeLvl})`;
  document.getElementById('upg-knife-cost').innerText = `${kCost} 🪙`;

  document.getElementById('upg-pistol-title').innerText = `🔫 Pistol Tangan Kanan (Lv.${pistolLvl})`;
  document.getElementById('upg-pistol-cost').innerText = `${pCost} 🪙`;

  document.getElementById('upg-wall-title').innerText = `🧱 Tembok Kayu Barikade (Lv.${wallLvl})`;
  document.getElementById('upg-wall-cost').innerText = `${wCost} 🪙`;

  document.getElementById('upg-turret-title').innerText = `🤖 Senjata Otomatis (Lv.${turretLvl})`;
  document.getElementById('upg-turret-cost').innerText = `${tCost} 🪙`;

  localStorage.setItem('outpost_gold', gold);
  localStorage.setItem('outpost_gems', gems);
  localStorage.setItem('outpost_knife_lvl', knifeLvl);
  localStorage.setItem('outpost_pistol_lvl', pistolLvl);
  localStorage.setItem('outpost_wall_lvl', wallLvl);
  localStorage.setItem('outpost_turret_lvl', turretLvl);
  localStorage.setItem('outpost_survivor_lvl', survivorLvl);
}

function startGame() {
  document.getElementById('start-screen').classList.add('hidden');
  document.getElementById('gameover-screen').classList.add('hidden');
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

function gameOver() {
  gameRunning = false;
  cancelAnimationFrame(animationId);
  document.getElementById('final-score').innerText = `Lv.${survivorLvl} (${gold} 🪙)`;
  document.getElementById('gameover-screen').classList.remove('hidden');
}

// Manual Tap / Click to Shoot Pistol at 3D perspective target
canvas.addEventListener('mousedown', (e) => {
  if (!gameRunning) return;
  const rect = canvas.getBoundingClientRect();
  firePlayerPistol(e.clientX - rect.left, e.clientY - rect.top);
});

canvas.addEventListener('touchstart', (e) => {
  if (!gameRunning) return;
  e.preventDefault();
  const rect = canvas.getBoundingClientRect();
  firePlayerPistol(e.touches[0].clientX - rect.left, e.touches[0].clientY - rect.top);
});

function firePlayerPistol(tx, ty) {
  pistolRecoilAnim = 12;
  muzzleFlash = 5;
  screenShake = 2;

  let dmg = pistolLvl * 18;
  // Create 3D perspective bullet traveling from bottom-right pistol (x=280, y=440) toward target
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
  let dmg = knifeLvl * 35;
  targetEnemy.hp -= dmg;
  spawnParticle(targetEnemy.x, targetEnemy.y, '#ef4444', 8);
  spawnFloatingText(targetEnemy.x, targetEnemy.y - 15, `🗡️ -${dmg}`, '#ef4444');
  if (targetEnemy.hp <= 0) killEnemy(targetEnemy);
}

function spawnEnemy() {
  const now = new Date();
  const isNightHorde = isSimulating1900 || now.getHours() === 19;

  let baseHp = 30 + survivorLvl * 15;
  let speed = 0.35 + Math.random() * 0.25;
  // Enemies spawn far at horizon (y = 100) and travel toward barricade wall (y = 400)
  let spawnX = 140 + Math.random() * 100;

  if (isNightHorde) {
    // Fast syndicate raiders & heavy mutants
    let isHeavy = Math.random() < 0.3;
    enemies.push({
      name: isHeavy ? '👹 MUTAN SINDIKAT' : '🧟 PERAMPOK MALAM',
      x: spawnX, y: 100,
      hp: isHeavy ? baseHp * 2.5 : baseHp,
      maxHp: isHeavy ? baseHp * 2.5 : baseHp,
      speed: isHeavy ? speed * 0.7 : speed * 1.4,
      size: isHeavy ? 36 : 24,
      reward: isHeavy ? 25 : 12,
      color: isHeavy ? '#dc2626' : '#a855f7'
    });
  } else {
    // Normal sparse patrol enemies
    enemies.push({
      name: '🧟 Patroli Sindikat',
      x: spawnX, y: 100,
      hp: baseHp, maxHp: baseHp,
      speed: speed,
      size: 26,
      reward: 10,
      color: '#10b981'
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

  // 2. Spawn Enemies based on Real-Time WIB Clock
  const now = new Date();
  const isNightHorde = isSimulating1900 || now.getHours() === 19;
  spawnTimer++;
  let spawnInterval = isNightHorde ? 40 : 120; // Fast waves during 19:00 WIB
  if (spawnTimer >= spawnInterval) {
    spawnEnemy();
    spawnTimer = 0;
  }

  // 3. Automated Turret Defense (If upgraded)
  if (turretLvl > 0) {
    autoShootTimer++;
    if (autoShootTimer > Math.max(10, 45 - turretLvl * 3)) {
      if (enemies.length > 0) {
        let target = enemies[0];
        let dmg = turretLvl * 12;
        bullets.push({ x: 190, y: 400, vx: (target.x - 190) * 0.08, vy: (target.y - 400) * 0.08, dmg: dmg });
      }
      autoShootTimer = 0;
    }
  }

  // 4. Update & Render Tanks Platoon
  for (let i = tanks.length - 1; i >= 0; i--) {
    let t = tanks[i];
    t.y -= 2.5; // roll toward horizon
    ctx.font = '32px sans-serif';
    ctx.fillText('🛡️🚜', t.x, t.y);
    // Crush enemies in path
    enemies.forEach(e => {
      if (Math.hypot(t.x - e.x, t.y - e.y) < 40) {
        e.hp -= 150;
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

  // 6. Update & Render Enemies with 3D Depth Scaling
  for (let i = enemies.length - 1; i >= 0; i--) {
    let e = enemies[i];
    e.y += e.speed;

    // Calculate 3D perspective scale factor based on distance from horizon (y=100) to wall (y=400)
    let depthProgress = Math.max(0, Math.min(1, (e.y - 100) / 300));
    let scale = 0.35 + depthProgress * 0.85;

    ctx.save();
    ctx.translate(e.x, e.y);
    ctx.scale(scale, scale);

    // Render 3D shaded enemy character sprite
    ctx.shadowColor = e.color; ctx.shadowBlur = 12;
    ctx.fillStyle = e.color;
    ctx.beginPath(); ctx.arc(0, 0, e.size / 2, 0, Math.PI * 2); ctx.fill();
    ctx.shadowBlur = 0;
    ctx.font = '20px sans-serif';
    ctx.fillText('🧟', -10, 6);

    ctx.restore();

    // HP Bar above head
    ctx.fillStyle = 'rgba(255,255,255,0.2)'; ctx.fillRect(e.x - 18, e.y - (e.size * scale) / 2 - 10, 36, 4);
    ctx.fillStyle = '#ef4444'; ctx.fillRect(e.x - 18, e.y - (e.size * scale) / 2 - 10, Math.max(0, (e.hp / e.maxHp) * 36), 4);

    // Melee Knife Engagement when enemy touches Barricade Wall (y >= 380)
    if (e.y >= 380) {
      if (knifeStabAnim === 0 && gameTick % 25 === 0) {
        triggerKnifeMelee(e);
      }
      hp -= 0.15;
      screenShake = 1;
      updateHUD();
      if (hp <= 0) { gameOver(); return; }
    }
  }

  // 7. Render Barricade Wall & First Person Dual-Wield HUD
  renderBarricadeAndFPSHUD();

  // 8. Update Particles & Floating Text
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
  // Sky Horizon Gradient
  let skyGrad = ctx.createLinearGradient(0, 0, 0, 100);
  skyGrad.addColorStop(0, '#020617'); skyGrad.addColorStop(1, '#1e1b4b');
  ctx.fillStyle = skyGrad; ctx.fillRect(0, 0, canvas.width, 100);

  // Ground 3D Corridor Perspective
  let groundGrad = ctx.createLinearGradient(0, 100, 0, canvas.height);
  groundGrad.addColorStop(0, '#111827'); groundGrad.addColorStop(1, '#1f2937');
  ctx.fillStyle = groundGrad; ctx.fillRect(0, 100, canvas.width, canvas.height - 100);

  // Perspective grid corridor lines converging toward vanishing point (x=190, y=100)
  ctx.strokeStyle = 'rgba(255,255,255,0.06)'; ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(190, 100); ctx.lineTo(0, 480);
  ctx.moveTo(190, 100); ctx.lineTo(100, 480);
  ctx.moveTo(190, 100); ctx.lineTo(280, 480);
  ctx.moveTo(190, 100); ctx.lineTo(380, 480);
  ctx.stroke();

  // Horizontal depth lines
  [140, 200, 280, 370].forEach(y => {
    ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(canvas.width, y); ctx.stroke();
  });
}

function renderBarricadeAndFPSHUD() {
  // Barricade Wall at bottom (y = 400 to 430)
  ctx.fillStyle = '#3e2723';
  ctx.fillRect(0, 400, canvas.width, 30);
  ctx.strokeStyle = '#6d4c41'; ctx.lineWidth = 3;
  ctx.beginPath(); ctx.moveTo(0, 400); ctx.lineTo(canvas.width, 400); ctx.stroke();

  ctx.font = '22px sans-serif';
  for (let x = 10; x < canvas.width; x += 35) {
    ctx.fillText('🪵', x, 422);
  }

  // Left Hand: Survival Combat Knife HUD (Stabs forward when knifeStabAnim > 0)
  ctx.save();
  let knifeOffset = knifeStabAnim > 0 ? -25 : 0;
  ctx.translate(60, 460 + knifeOffset);
  ctx.font = '45px sans-serif';
  ctx.fillText('🗡️', 0, 0);
  ctx.restore();

  // Right Hand: Tactical Pistol HUD (Recoils backward when pistolRecoilAnim > 0)
  ctx.save();
  let pistolOffset = pistolRecoilAnim > 0 ? 12 : 0;
  ctx.translate(270, 450 + pistolOffset);
  ctx.font = '45px sans-serif';
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
    gold -= cost; wallLvl++; maxHp += 40; hp = maxHp;
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

function openTopup() { document.getElementById('topup-modal').classList.add('active'); }
function closeTopup() { document.getElementById('topup-modal').classList.remove('active'); }
function buyGems(itemName, price, amount) {
  MidtransPay.checkout({
    itemName: itemName, price: price,
    onSuccess: function() {
      gems += amount;
      gold += amount * 5; // converting gems into massive gold booster
      updateHUD();
      closeTopup();
      alert(`🎉 Topup Logistik Berhasil! +${amount} Gems & +${amount * 5} Koin Emas ditambahkan.`);
    }
  });
}
