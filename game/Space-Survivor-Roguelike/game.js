const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

let coins = parseInt(localStorage.getItem('space_coins') || '0');
let gems = parseInt(localStorage.getItem('space_gems') || '50');
if (!localStorage.getItem('space_starter_50')) {
  gems = Math.max(gems, 50);
  localStorage.setItem('space_starter_50', 'true');
  localStorage.setItem('space_gems', gems);
}

let score = 0; let gameRunning = false; let animationId;
const player = { x: 250, y: 550, size: 30 };
let meteors = []; let lasers = []; let shootTimer = 0; let spawnTimer = 0;

function updateHUD() {
  document.getElementById('score-display').innerText = Math.floor(score);
  document.getElementById('coins-display').innerText = coins;
  document.getElementById('gems-display').innerText = gems;
  localStorage.setItem('space_coins', coins);
  localStorage.setItem('space_gems', gems);
}

function startGame() {
  document.getElementById('start-screen').classList.add('hidden');
  document.getElementById('gameover-screen').classList.add('hidden');
  score = 0; player.x = 250; player.y = 550; meteors = []; lasers = []; gameRunning = true;
  updateHUD(); cancelAnimationFrame(animationId); loop();
}

function gameOver() {
  gameRunning = false; cancelAnimationFrame(animationId);
  document.getElementById('final-score').innerText = Math.floor(score);
  document.getElementById('gameover-screen').classList.remove('hidden');
}

window.addEventListener('mousemove', (e) => {
  if (!gameRunning) return;
  const rect = canvas.getBoundingClientRect();
  player.x = Math.max(20, Math.min(canvas.width - 20, e.clientX - rect.left));
  player.y = Math.max(20, Math.min(canvas.height - 20, e.clientY - rect.top));
});
canvas.addEventListener('touchmove', (e) => {
  if (!gameRunning) return; e.preventDefault();
  const rect = canvas.getBoundingClientRect();
  player.x = Math.max(20, Math.min(canvas.width - 20, e.touches[0].clientX - rect.left));
  player.y = Math.max(20, Math.min(canvas.height - 20, e.touches[0].clientY - rect.top));
});

function loop() {
  if (!gameRunning) return;
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  // Auto Shoot
  shootTimer++;
  if (shootTimer > 15) {
    lasers.push({ x: player.x, y: player.y - 20, vy: -10 });
    shootTimer = 0;
  }

  // Spawn Meteors
  spawnTimer++;
  if (spawnTimer > Math.max(15, 45 - Math.floor(score/50))) {
    meteors.push({ x: Math.random() * (canvas.width - 40) + 20, y: -20, size: Math.random()*20 + 15, vy: Math.random()*3 + 2 });
    spawnTimer = 0;
  }

  // Draw Lasers
  for (let i = lasers.length - 1; i >= 0; i--) {
    let l = lasers[i]; l.y += l.vy;
    ctx.shadowColor = '#38bdf8'; ctx.shadowBlur = 10; ctx.fillStyle = '#38bdf8';
    ctx.fillRect(l.x - 3, l.y, 6, 15); ctx.shadowBlur = 0;
    if (l.y < 0) lasers.splice(i, 1);
  }

  // Draw Meteors & Collisions
  for (let i = meteors.length - 1; i >= 0; i--) {
    let m = meteors[i]; m.y += m.vy;
    ctx.shadowColor = '#ef4444'; ctx.shadowBlur = 10; ctx.fillStyle = '#ef4444';
    ctx.beginPath(); ctx.arc(m.x, m.y, m.size, 0, Math.PI*2); ctx.fill(); ctx.shadowBlur = 0;

    // Hit player
    let distP = Math.hypot(player.x - m.x, player.y - m.y);
    if (distP < player.size/2 + m.size) { gameOver(); return; }

    // Hit by laser
    for (let j = lasers.length - 1; j >= 0; j--) {
      let l = lasers[j];
      if (Math.hypot(l.x - m.x, l.y - m.y) < m.size + 10) {
        meteors.splice(i, 1); lasers.splice(j, 1);
        score += 10; coins += 2; updateHUD();
        break;
      }
    }
    if (m.y > canvas.height) meteors.splice(i, 1);
  }

  // Draw Spaceship
  ctx.shadowColor = '#a855f7'; ctx.shadowBlur = 15; ctx.fillStyle = '#a855f7';
  ctx.beginPath();
  ctx.moveTo(player.x, player.y - 20);
  ctx.lineTo(player.x - 18, player.y + 15);
  ctx.lineTo(player.x + 18, player.y + 15);
  ctx.closePath(); ctx.fill(); ctx.shadowBlur = 0;

  score += 0.1; updateHUD();
  animationId = requestAnimationFrame(loop);
}

function openTopup() { document.getElementById('topup-modal').classList.add('active'); }
function closeTopup() { document.getElementById('topup-modal').classList.remove('active'); }
function buyGems(itemName, price, amount) {
  MidtransPay.checkout({
    itemName: itemName, price: price,
    onSuccess: function() { gems += amount; updateHUD(); closeTopup(); alert(`🎉 Topup Berhasil! +${amount} Gems telah ditambahkan.`); }
  });
}
