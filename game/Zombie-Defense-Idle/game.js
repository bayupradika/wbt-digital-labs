const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

// Persistent Game State
let gold = parseInt(localStorage.getItem('zombie_gold') || '100');
let gems = parseInt(localStorage.getItem('zombie_gems') || '50');
if (!localStorage.getItem('zombie_starter_50')) {
  gems = Math.max(gems, 50);
  localStorage.setItem('zombie_starter_50', 'true');
  localStorage.setItem('zombie_gems', gems);
}
let turretLvl = parseInt(localStorage.getItem('zombie_turret') || '1');
let maxHp = parseInt(localStorage.getItem('zombie_max_hp') || '100');
let turretCost = turretLvl * 50;
let repairCost = 40;

let activeWeapon = 'gatling'; // 'gatling', 'plasma', 'mortar'
let hp = maxHp;
let wave = 1;
let gameRunning = false;
let animationId;

let zombies = [];
let bullets = [];
let particles = [];
let floatingTexts = [];
let shellCasings = [];
let bomberJet = null;

let autoShootTimer = 0;
let spawnTimer = 0;
let zombiesSpawnedThisWave = 0;
let gameTick = 0;
let screenShake = 0;

// Offline Idle Earning Check
checkOfflineEarnings();

function checkOfflineEarnings() {
  const lastSeenStr = localStorage.getItem('zombie_last_seen');
  const now = Date.now();
  if (lastSeenStr) {
    const elapsedMinutes = Math.floor((now - parseInt(lastSeenStr, 10)) / 60000);
    if (elapsedMinutes >= 2) {
      const earnedGold = Math.min(600, elapsedMinutes * 6);
      gold += earnedGold;
      localStorage.setItem('zombie_gold', gold);
      setTimeout(() => {
        alert(`🌙 LAPORAN IDLE OFFLINE!\n\nSelama Anda pergi (${elapsedMinutes} menit), meriam pertahanan otomatis tetap menjaga benteng dan berhasil mengumpulkan loot:\n\n💰 +${earnedGold} Koin Emas!`);
        updateHUD();
      }, 800);
    }
  }
  localStorage.setItem('zombie_last_seen', now.toString());
}

function updateHUD() {
  document.getElementById('gold-display').innerText = gold.toLocaleString('id-ID');
  document.getElementById('gem-display').innerText = gems.toLocaleString('id-ID');
  document.getElementById('hp-display').innerText = `${Math.max(0, Math.floor(hp))} / ${maxHp}`;
  document.getElementById('wave-display').innerText = `Wave ${wave}`;
  
  turretCost = turretLvl * 50;
  document.getElementById('turret-cost').innerText = `${turretCost} 🪙`;
  
  const upgTitle = document.getElementById('upg-title');
  if (upgTitle) upgTitle.innerText = `Upgrade ${activeWeapon.toUpperCase()} (Lvl ${turretLvl})`;

  localStorage.setItem('zombie_gold', gold);
  localStorage.setItem('zombie_gems', gems);
  localStorage.setItem('zombie_turret', turretLvl);
  localStorage.setItem('zombie_max_hp', maxHp);
  localStorage.setItem('zombie_last_seen', Date.now().toString());
}

function selectWeapon(wpn) {
  activeWeapon = wpn;
  ['gatling', 'plasma', 'mortar'].forEach(w => {
    const tab = document.getElementById(`tab-${w}`);
    if (tab) tab.className = 'weapon-tab' + (w === wpn ? ' active' : '');
  });
  const titles = { gatling: '🔫 Gatling', plasma: '⚡ Plasma Laser', mortar: '🚀 Mortar Roket' };
  document.getElementById('weapon-display').innerText = titles[wpn] || wpn;
  updateHUD();
}

function startGame() {
  document.getElementById('start-screen').classList.add('hidden');
  document.getElementById('gameover-screen').classList.add('hidden');
  hp = maxHp;
  wave = 1;
  zombies = [];
  bullets = [];
  particles = [];
  floatingTexts = [];
  zombiesSpawnedThisWave = 0;
  gameRunning = true;
  updateHUD();
  cancelAnimationFrame(animationId);
  loop();
}

function gameOver() {
  gameRunning = false;
  cancelAnimationFrame(animationId);
  document.getElementById('final-wave').innerText = `Wave ${wave}`;
  document.getElementById('gameover-screen').classList.remove('hidden');
}

canvas.addEventListener('mousedown', (e) => {
  if (!gameRunning) return;
  const rect = canvas.getBoundingClientRect();
  firePlayerWeapon(e.clientX - rect.left, e.clientY - rect.top);
});

canvas.addEventListener('touchstart', (e) => {
  if (!gameRunning) return;
  e.preventDefault();
  const rect = canvas.getBoundingClientRect();
  firePlayerWeapon(e.touches[0].clientX - rect.left, e.touches[0].clientY - rect.top);
});

function firePlayerWeapon(tx, ty) {
  const angle = Math.atan2(ty - 175, tx - 45);
  let dmg = turretLvl * 15;

  if (activeWeapon === 'gatling') {
    bullets.push({ type: 'gatling', x: 45, y: 175, vx: Math.cos(angle) * 14, vy: Math.sin(angle) * 14, dmg: dmg });
    spawnShellCasing();
    spawnParticle(45, 175, '#fbbf24', 3);
  } else if (activeWeapon === 'plasma') {
    bullets.push({ type: 'plasma', x: 45, y: 175, vx: Math.cos(angle) * 16, vy: Math.sin(angle) * 16, dmg: dmg * 1.4, pierce: 2 });
  } else if (activeWeapon === 'mortar') {
    bullets.push({ type: 'mortar', x: 45, y: 175, targetX: tx, targetY: ty, vx: Math.cos(angle) * 8, vy: Math.sin(angle) * 8, dmg: dmg * 2.2, aoe: 60 });
  }
}

function spawnShellCasing() {
  shellCasings.push({
    x: 45, y: 185,
    vx: -2 + Math.random() * -3, vy: -3 + Math.random() * -2,
    life: 180
  });
}

function spawnParticle(x, y, color, count = 6) {
  for (let i = 0; i < count; i++) {
    particles.push({
      x: x, y: y,
      vx: (Math.random() - 0.5) * 6, vy: (Math.random() - 0.5) * 6 - 1,
      size: 2 + Math.random() * 4,
      color: color,
      life: 25 + Math.random() * 15
    });
  }
}

function spawnFloatingText(x, y, text, color = '#ffffff') {
  floatingTexts.push({ x: x, y: y, text: text, color: color, life: 35, vy: -1.5 });
}

function spawnZombie() {
  zombiesSpawnedThisWave++;
  let speed = 0.45 + Math.min(2, wave * 0.12);
  let baseHp = 25 + wave * 18;
  let y = 60 + Math.random() * 240;

  // Class selection based on wave
  let rand = Math.random();
  if (wave % 5 === 0 && zombiesSpawnedThisWave === 1) {
    // Gargantua Boss Titan
    zombies.push({ type: 'boss', name: '👑 TITAN BOSS', x: canvas.width + 30, y: 175, size: 48, hp: baseHp * 6, maxHp: baseHp * 6, speed: speed * 0.6, walkAnim: 0, reward: 100 });
  } else if (rand < 0.25 && wave >= 2) {
    // Fast Runner
    zombies.push({ type: 'runner', name: '⚡ Pelari', x: canvas.width + 20, y: y, size: 24, hp: baseHp * 0.7, maxHp: baseHp * 0.7, speed: speed * 1.6, walkAnim: Math.random() * 10, reward: 15 });
  } else if (rand < 0.5 && wave >= 3) {
    // Riot Shield
    zombies.push({ type: 'shield', name: '🛡️ Polisi Tameng', x: canvas.width + 20, y: y, size: 30, hp: baseHp * 1.2, maxHp: baseHp * 1.2, shieldHp: baseHp * 1.5, maxShield: baseHp * 1.5, speed: speed * 0.85, walkAnim: Math.random() * 10, reward: 25 });
  } else {
    // Walker
    zombies.push({ type: 'walker', name: '🧟 Pejalan', x: canvas.width + 20, y: y, size: 28, hp: baseHp, maxHp: baseHp, speed: speed, walkAnim: Math.random() * 10, reward: 10 });
  }
}

function loop() {
  if (!gameRunning) return;
  gameTick++;

  ctx.save();
  if (screenShake > 0) {
    ctx.translate((Math.random() - 0.5) * screenShake, (Math.random() - 0.5) * screenShake);
    screenShake--;
  }

  // 1. Draw Apocalyptic Battlefield Background
  drawBattlefield();

  // 2. Draw Fortified Steel Bunker Wall
  drawBunkerWall();

  // 3. Draw Active Weapon Turret
  let targetZombie = zombies.length > 0 ? zombies[0] : null;
  drawActiveTurret(targetZombie);

  // 4. Auto Shoot Logic
  autoShootTimer++;
  let cooldown = activeWeapon === 'gatling' ? Math.max(8, 35 - turretLvl * 2) : (activeWeapon === 'plasma' ? Math.max(15, 50 - turretLvl * 3) : Math.max(25, 75 - turretLvl * 4));
  if (autoShootTimer > cooldown && targetZombie) {
    firePlayerWeapon(targetZombie.x, targetZombie.y);
    autoShootTimer = 0;
  }

  // 5. Wave Manager
  spawnTimer++;
  if (spawnTimer > Math.max(25, 80 - wave * 4) && zombiesSpawnedThisWave < 10 + wave * 3) {
    spawnZombie();
    spawnTimer = 0;
  } else if (zombies.length === 0 && zombiesSpawnedThisWave >= 10 + wave * 3) {
    wave++;
    zombiesSpawnedThisWave = 0;
    gold += 50 + wave * 10;
    updateHUD();
    const hint = document.getElementById('hint-text');
    if (hint) {
      hint.innerText = `🎉 Berhasil masuk Wave ${wave}! Bonus Loot +${50 + wave * 10} 🪙!`;
      hint.style.background = 'rgba(245,158,11,0.25)'; hint.style.borderColor = '#fbbf24';
    }
  }

  // 6. Update Shell Casings
  for (let i = shellCasings.length - 1; i >= 0; i--) {
    let sc = shellCasings[i];
    sc.x += sc.vx; sc.y += sc.vy; sc.vy += 0.3; // gravity
    if (sc.y > 330) { sc.y = 330; sc.vx *= 0.6; sc.vy *= -0.3; }
    sc.life--;
    ctx.fillStyle = '#fbbf24';
    ctx.fillRect(sc.x, sc.y, 4, 2);
    if (sc.life <= 0) shellCasings.splice(i, 1);
  }

  // 7. Update & Draw Bullets
  updateBullets();

  // 8. Update & Draw Zombies
  updateZombies();

  // 9. Update Airstrike Bomber
  if (bomberJet) {
    bomberJet.x += 18;
    ctx.font = '32px sans-serif';
    ctx.fillText('✈️', bomberJet.x, 50);
    if (gameTick % 5 === 0) {
      spawnParticle(bomberJet.x, 60, '#ef4444', 10);
    }
    if (bomberJet.x > canvas.width + 50) {
      // Trigger massive napalm bombs
      zombies.forEach(z => {
        z.hp = 0;
        spawnParticle(z.x, z.y, '#ef4444', 15);
        spawnFloatingText(z.x, z.y, '💥 BOMBED!', '#ef4444');
        gold += z.reward;
      });
      zombies = [];
      screenShake = 15;
      updateHUD();
      bomberJet = null;
    }
  }

  // 10. Update Particles & Floating Text
  updateVFX();

  ctx.restore();
  animationId = requestAnimationFrame(loop);
}

function drawBattlefield() {
  // Dark scorched gradient
  let grad = ctx.createLinearGradient(0, 0, 0, canvas.height);
  grad.addColorStop(0, '#131118');
  grad.addColorStop(1, '#1d1813');
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  // Ground details (cracks & hazard signs)
  ctx.fillStyle = 'rgba(255,255,255,0.04)';
  ctx.fillRect(80, 120, 35, 15);
  ctx.fillRect(220, 240, 50, 20);
  ctx.fillRect(340, 90, 40, 25);

  ctx.font = '14px sans-serif';
  ctx.fillStyle = 'rgba(255,255,255,0.15)';
  ctx.fillText('☠️', 180, 160);
  ctx.fillText('🛢️ BIOHAZARD', 290, 290);
  ctx.fillText('🚧', 380, 180);

  // Animated drifting green toxic smog
  let smogOffset = (gameTick * 0.3) % canvas.width;
  ctx.fillStyle = 'rgba(16,185,129,0.03)';
  ctx.beginPath();
  ctx.arc(canvas.width - smogOffset, 150, 80, 0, Math.PI * 2);
  ctx.arc((canvas.width - smogOffset + 200) % canvas.width, 250, 90, 0, Math.PI * 2);
  ctx.fill();
}

function drawBunkerWall() {
  // Main metallic wall
  ctx.fillStyle = '#221f26';
  ctx.fillRect(0, 0, 45, canvas.height);

  // Steel plate seams
  ctx.strokeStyle = '#38333e';
  ctx.lineWidth = 2;
  for (let y = 0; y < canvas.height; y += 70) {
    ctx.strokeRect(4, y + 4, 37, 62);
  }

  // Hazard warning diagonal stripes along right edge
  ctx.fillStyle = '#fbbf24';
  ctx.fillRect(40, 0, 6, canvas.height);
  ctx.fillStyle = '#000000';
  for (let y = (gameTick % 20); y < canvas.height; y += 20) {
    ctx.fillRect(40, y, 6, 10);
  }

  // Sandbags at base
  ctx.font = '16px sans-serif';
  ctx.fillText('🧱', 35, 300);
  ctx.fillText('🧱', 35, 320);
  ctx.fillText('🧱', 35, 340);

  // Energy shield column if healthy
  if (hp > 30) {
    ctx.fillStyle = `rgba(56,189,248,${0.1 + (hp/maxHp)*0.2})`;
    ctx.fillRect(46, 0, 4, canvas.height);
  }
}

function drawActiveTurret(target) {
  ctx.save();
  ctx.translate(45, 175);
  let angle = target ? Math.atan2(target.y - 175, target.x - 45) : 0;
  ctx.rotate(angle);

  if (activeWeapon === 'gatling') {
    // Dual minigun barrels
    ctx.fillStyle = '#64748b';
    ctx.fillRect(0, -7, 26, 4);
    ctx.fillRect(0, 3, 26, 4);
    // Base dome
    ctx.fillStyle = '#fbbf24';
    ctx.beginPath(); ctx.arc(0, 0, 16, 0, Math.PI*2); ctx.fill();
  } else if (activeWeapon === 'plasma') {
    // High tech laser dish
    ctx.fillStyle = '#38bdf8';
    ctx.fillRect(0, -4, 30, 8);
    ctx.beginPath(); ctx.arc(0, 0, 18, 0, Math.PI*2); ctx.fill();
    ctx.fillStyle = '#ffffff';
    ctx.beginPath(); ctx.arc(6, 0, 6, 0, Math.PI*2); ctx.fill();
  } else if (activeWeapon === 'mortar') {
    // Missile pod launcher
    ctx.fillStyle = '#ef4444';
    ctx.fillRect(0, -10, 22, 20);
    ctx.fillStyle = '#0f172a';
    ctx.fillRect(16, -6, 8, 5);
    ctx.fillRect(16, 2, 8, 5);
  }
  ctx.restore();
}

function updateBullets() {
  for (let i = bullets.length - 1; i >= 0; i--) {
    let b = bullets[i];
    b.x += b.vx; b.y += b.vy;

    // Render bullet
    if (b.type === 'gatling') {
      ctx.fillStyle = '#fbbf24'; ctx.beginPath(); ctx.arc(b.x, b.y, 4, 0, Math.PI*2); ctx.fill();
    } else if (b.type === 'plasma') {
      ctx.strokeStyle = '#38bdf8'; ctx.lineWidth = 3;
      ctx.beginPath(); ctx.moveTo(b.x - b.vx*0.6, b.y - b.vy*0.6); ctx.lineTo(b.x, b.y); ctx.stroke();
    } else if (b.type === 'mortar') {
      ctx.font = '16px sans-serif'; ctx.fillText('🚀', b.x - 8, b.y + 6);
    }

    if (b.x > canvas.width || b.x < 0 || b.y > canvas.height || b.y < 0) {
      bullets.splice(i, 1); continue;
    }

    // Collision check
    for (let j = zombies.length - 1; j >= 0; j--) {
      let z = zombies[j];
      if (Math.hypot(b.x - z.x, b.y - z.y) < z.size) {
        // Hit effect
        spawnParticle(b.x, b.y, '#10b981', 4);

        // Check shield first
        if (z.shieldHp > 0) {
          z.shieldHp -= b.dmg;
          spawnFloatingText(z.x, z.y - 15, '🛡️ BLOCK', '#38bdf8');
          if (z.shieldHp <= 0) spawnParticle(z.x, z.y, '#38bdf8', 12);
        } else {
          z.hp -= b.dmg;
          spawnFloatingText(z.x, z.y - 15, `-${Math.floor(b.dmg)}`, '#ef4444');
        }

        if (b.type === 'mortar' && b.aoe) {
          // Splash damage
          spawnParticle(b.x, b.y, '#ef4444', 15);
          screenShake = 4;
          zombies.forEach(oz => {
            if (Math.hypot(b.x - oz.x, b.y - oz.y) < b.aoe) {
              oz.hp -= b.dmg * 0.6;
            }
          });
        }

        if (b.type !== 'plasma' || (b.pierce && --b.pierce <= 0)) {
          bullets.splice(i, 1);
        }

        if (z.hp <= 0) {
          spawnParticle(z.x, z.y, '#10b981', 12);
          spawnFloatingText(z.x, z.y - 25, `+${z.reward}🪙`, '#fbbf24');
          gold += z.reward;
          zombies.splice(j, 1);
          updateHUD();
        }
        break;
      }
    }
  }
}

function updateZombies() {
  for (let i = zombies.length - 1; i >= 0; i--) {
    let z = zombies[i];
    z.x -= z.speed;
    z.walkAnim += 0.2;

    ctx.save();
    ctx.translate(z.x, z.y);

    // Render character body
    if (z.type === 'boss') {
      if (z.walkAnim % 4 < 2) screenShake = 2; // shaking ground
      ctx.fillStyle = '#064e3b';
      ctx.beginPath(); ctx.arc(0, 0, z.size/2, 0, Math.PI*2); ctx.fill();
      ctx.font = '24px sans-serif'; ctx.fillText('👹', -12, 8);
    } else if (z.type === 'runner') {
      ctx.fillStyle = '#9333ea';
      ctx.beginPath(); ctx.arc(0, 0, z.size/2, 0, Math.PI*2); ctx.fill();
      ctx.font = '16px sans-serif'; ctx.fillText('🧟', -8, 6);
    } else {
      ctx.fillStyle = '#10b981';
      ctx.beginPath(); ctx.arc(0, 0, z.size/2, 0, Math.PI*2); ctx.fill();
      ctx.font = '16px sans-serif'; ctx.fillText('🧟', -8, 6);
    }

    // Render police shield if active
    if (z.shieldHp > 0) {
      ctx.strokeStyle = '#06b6d4'; ctx.lineWidth = 4;
      ctx.beginPath(); ctx.arc(-10, 0, z.size/1.5, -Math.PI/2, Math.PI/2); ctx.stroke();
    }

    ctx.restore();

    // HP Bar
    ctx.fillStyle = 'rgba(255,255,255,0.2)'; ctx.fillRect(z.x - 18, z.y - z.size/2 - 12, 36, 5);
    ctx.fillStyle = '#ef4444'; ctx.fillRect(z.x - 18, z.y - z.size/2 - 12, Math.max(0, (z.hp/z.maxHp)*36), 5);

    // Attack Bunker
    if (z.x < 55) {
      hp -= (z.type === 'boss' ? 0.8 : 0.2);
      screenShake = 2;
      updateHUD();
      if (hp <= 0) { gameOver(); return; }
    }
  }
}

function updateVFX() {
  for (let i = particles.length - 1; i >= 0; i--) {
    let p = particles[i];
    p.x += p.vx; p.y += p.vy; p.life--;
    ctx.fillStyle = p.color;
    ctx.fillRect(p.x, p.y, p.size, p.size);
    if (p.life <= 0) particles.splice(i, 1);
  }

  for (let i = floatingTexts.length - 1; i >= 0; i--) {
    let ft = floatingTexts[i];
    ft.y += ft.vy; ft.life--;
    ctx.font = 'bold 13px Outfit, sans-serif';
    ctx.fillStyle = ft.color;
    ctx.fillText(ft.text, ft.x, ft.y);
    if (ft.life <= 0) floatingTexts.splice(i, 1);
  }
}

function upgradeTurret() {
  if (gold < turretCost) { openTopup(); return; }
  gold -= turretCost;
  turretLvl++;
  updateHUD();
  const hint = document.getElementById('hint-text');
  if (hint) {
    hint.innerText = `💥 Senjata diupgrade ke Lvl ${turretLvl}! Kecepatan tembak & damage bertambah!`;
  }
}

function repairBunker() {
  if (gold < repairCost) {
    alert('⚠️ Koin emas tidak cukup untuk memperbaiki dinding benteng!');
    return;
  }
  if (hp >= maxHp) {
    maxHp += 20;
    hp = maxHp;
  } else {
    hp = Math.min(maxHp, hp + 35);
  }
  gold -= repairCost;
  updateHUD();
  const hint = document.getElementById('hint-text');
  if (hint) {
    hint.innerText = `🛠️ Dinding bunker diperkuat! HP sekarang: ${hp}/${maxHp}`;
  }
}

function useAirstrike() {
  if (gems < 10) { openTopup(); return; }
  gems -= 10;
  updateHUD();
  bomberJet = { x: -50 };
  const hint = document.getElementById('hint-text');
  if (hint) {
    hint.innerText = '✈️ JET BOMBER DIKERAHKAN! Menjatuhkan bom napalm ke seluruh battlefield!';
    hint.style.background = 'rgba(239,68,68,0.25)'; hint.style.borderColor = '#ef4444';
  }
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
      alert(`🎉 Topup Berhasil! +${amount} Gems telah ditambahkan.`);
    }
  });
}
