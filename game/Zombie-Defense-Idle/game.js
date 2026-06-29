const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

let gold = parseInt(localStorage.getItem('zombie_gold') || '50');
let gems = parseInt(localStorage.getItem('zombie_gems') || '50');
if (!localStorage.getItem('zombie_starter_50')) {
  gems = Math.max(gems, 50);
  localStorage.setItem('zombie_starter_50', 'true');
  localStorage.setItem('zombie_gems', gems);
}
let turretLvl = parseInt(localStorage.getItem('zombie_turret') || '1');
let turretCost = turretLvl * 50;

let hp = 100; let wave = 1; let gameRunning = false; let animationId;
let zombies = []; let bullets = []; let autoShootTimer = 0; let spawnTimer = 0; let zombiesSpawnedThisWave = 0;

function updateHUD() {
  document.getElementById('gold-display').innerText = gold.toLocaleString('id-ID');
  document.getElementById('gem-display').innerText = gems.toLocaleString('id-ID');
  document.getElementById('hp-display').innerText = `${Math.max(0, Math.floor(hp))} / 100`;
  document.getElementById('wave-display').innerText = `Wave ${wave}`;
  turretCost = turretLvl * 50;
  document.getElementById('turret-cost').innerText = `${turretCost} 🪙`;
  localStorage.setItem('zombie_gold', gold);
  localStorage.setItem('zombie_gems', gems);
  localStorage.setItem('zombie_turret', turretLvl);
}

function startGame() {
  document.getElementById('start-screen').classList.add('hidden');
  document.getElementById('gameover-screen').classList.add('hidden');
  hp = 100; wave = 1; zombies = []; bullets = []; zombiesSpawnedThisWave = 0; gameRunning = true;
  updateHUD(); cancelAnimationFrame(animationId); loop();
}

function gameOver() {
  gameRunning = false; cancelAnimationFrame(animationId);
  document.getElementById('final-wave').innerText = `Wave ${wave}`;
  document.getElementById('gameover-screen').classList.remove('hidden');
}

canvas.addEventListener('mousedown', (e) => {
  if (!gameRunning) return;
  const rect = canvas.getBoundingClientRect();
  const tx = e.clientX - rect.left; const ty = e.clientY - rect.top;
  shootBullet(tx, ty, turretLvl * 15);
});
canvas.addEventListener('touchstart', (e) => {
  if (!gameRunning) return; e.preventDefault();
  const rect = canvas.getBoundingClientRect();
  const tx = e.touches[0].clientX - rect.left; const ty = e.touches[0].clientY - rect.top;
  shootBullet(tx, ty, turretLvl * 15);
});

function shootBullet(tx, ty, dmg) {
  let angle = Math.atan2(ty - 175, tx - 30);
  bullets.push({ x: 30, y: 175, vx: Math.cos(angle) * 12, vy: Math.sin(angle) * 12, dmg: dmg });
}

function spawnZombie() {
  zombiesSpawnedThisWave++;
  let speed = 0.5 + Math.min(2, wave * 0.15);
  let maxHp = 20 + wave * 15;
  zombies.push({ x: canvas.width + 20, y: 50 + Math.random() * 250, size: 28, hp: maxHp, maxHp: maxHp, speed: speed });
}

function loop() {
  if (!gameRunning) return;
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  // Bunker line
  ctx.fillStyle = '#261c1c'; ctx.fillRect(0, 0, 40, canvas.height);
  ctx.strokeStyle = '#ef4444'; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(40, 0); ctx.lineTo(40, canvas.height); ctx.stroke();

  // Draw Turret
  ctx.fillStyle = '#fbbf24'; ctx.beginPath(); ctx.arc(30, 175, 18, 0, Math.PI*2); ctx.fill();

  // Auto shoot closest zombie
  autoShootTimer++;
  if (autoShootTimer > Math.max(10, 40 - turretLvl * 3)) {
    if (zombies.length > 0) {
      let closest = zombies[0];
      shootBullet(closest.x, closest.y, turretLvl * 8);
    }
    autoShootTimer = 0;
  }

  // Wave manager
  spawnTimer++;
  if (spawnTimer > Math.max(30, 90 - wave * 5) && zombiesSpawnedThisWave < 10 + wave * 3) {
    spawnZombie(); spawnTimer = 0;
  } else if (zombies.length === 0 && zombiesSpawnedThisWave >= 10 + wave * 3) {
    wave++; zombiesSpawnedThisWave = 0; gold += 50; updateHUD();
    document.getElementById('hint-text').innerText = `🎉 Berhasil masuk Wave ${wave}! +50 Koin Bonus!`;
    document.getElementById('hint-text').style.background = 'rgba(245,158,11,0.25)'; document.getElementById('hint-text').style.borderColor = '#fbbf24';
  }

  // Bullets
  for (let i = bullets.length - 1; i >= 0; i--) {
    let b = bullets[i]; b.x += b.vx; b.y += b.vy;
    ctx.fillStyle = '#fbbf24'; ctx.beginPath(); ctx.arc(b.x, b.y, 4, 0, Math.PI*2); ctx.fill();
    if (b.x > canvas.width || b.x < 0 || b.y > canvas.height || b.y < 0) { bullets.splice(i, 1); continue; }

    for (let j = zombies.length - 1; j >= 0; j--) {
      let z = zombies[j];
      if (Math.hypot(b.x - z.x, b.y - z.y) < z.size) {
        z.hp -= b.dmg; bullets.splice(i, 1);
        if (z.hp <= 0) { zombies.splice(j, 1); gold += 10; updateHUD(); }
        break;
      }
    }
  }

  // Zombies
  for (let i = zombies.length - 1; i >= 0; i--) {
    let z = zombies[i]; z.x -= z.speed;
    ctx.shadowColor = '#10b981'; ctx.shadowBlur = 10; ctx.fillStyle = '#10b981';
    ctx.beginPath(); ctx.arc(z.x, z.y, z.size/2, 0, Math.PI*2); ctx.fill(); ctx.shadowBlur = 0;

    // HP Bar
    ctx.fillStyle = 'rgba(255,255,255,0.2)'; ctx.fillRect(z.x - 15, z.y - 20, 30, 5);
    ctx.fillStyle = '#ef4444'; ctx.fillRect(z.x - 15, z.y - 20, Math.max(0, (z.hp/z.maxHp)*30), 5);

    if (z.x < 40) {
      hp -= 0.15; updateHUD();
      if (hp <= 0) { gameOver(); return; }
    }
  }

  animationId = requestAnimationFrame(loop);
}

function upgradeTurret() {
  if (gold < turretCost) { openTopup(); return; }
  gold -= turretCost; turretLvl++; updateHUD();
  document.getElementById('hint-text').innerText = `💥 Meriam diupgrade ke Lvl ${turretLvl}! Kecepatan & damage meningkat!`;
}

function useAirstrike() {
  if (gems < 10) { openTopup(); return; }
  gems -= 10;
  zombies.forEach(z => { gold += 10; });
  zombies = []; updateHUD();
  document.getElementById('hint-text').innerText = '✈️ SERANGAN UDARA AKTIF! Seluruh zombie di lapangan hangus terbakar!';
  document.getElementById('hint-text').style.background = 'rgba(239,68,68,0.25)'; document.getElementById('hint-text').style.borderColor = '#ef4444';
}

function openTopup() { document.getElementById('topup-modal').classList.add('active'); }
function closeTopup() { document.getElementById('topup-modal').classList.remove('active'); }
function buyGems(itemName, price, amount) {
  MidtransPay.checkout({
    itemName: itemName, price: price,
    onSuccess: function() { gems += amount; updateHUD(); closeTopup(); alert(`🎉 Topup Berhasil! +${amount} Gems telah ditambahkan.`); }
  });
}
