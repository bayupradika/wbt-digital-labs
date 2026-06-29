const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

let coins = parseInt(localStorage.getItem('race_coins') || '0');
let gems = parseInt(localStorage.getItem('race_gems') || '50');
if (!localStorage.getItem('race_starter_50')) {
  gems = Math.max(gems, 50);
  localStorage.setItem('race_starter_50', 'true');
  localStorage.setItem('race_gems', gems);
}

let score = 0;
let gameRunning = false;
let animationId;
let speed = 6;
let roadOffset = 0;

const player = { x: 220, y: 520, width: 40, height: 70 };
let traffic = [];
let roadCoins = [];
let spawnTimer = 0;

function updateHUD() {
  document.getElementById('score-display').innerText = Math.floor(score);
  document.getElementById('coins-display').innerText = coins;
  document.getElementById('gems-display').innerText = gems;
  localStorage.setItem('race_coins', coins);
  localStorage.setItem('race_gems', gems);
}

function startGame() {
  document.getElementById('start-screen').classList.add('hidden');
  document.getElementById('gameover-screen').classList.add('hidden');
  score = 0; speed = 6; player.x = 220; traffic = []; roadCoins = []; gameRunning = true;
  cancelAnimationFrame(animationId);
  loop();
}

function gameOver() {
  gameRunning = false; cancelAnimationFrame(animationId);
  document.getElementById('final-score').innerText = Math.floor(score);
  document.getElementById('gameover-screen').classList.remove('hidden');
}

window.addEventListener('mousemove', (e) => {
  if (!gameRunning) return;
  const rect = canvas.getBoundingClientRect();
  player.x = Math.max(40, Math.min(400, e.clientX - rect.left - player.width/2));
});
canvas.addEventListener('touchmove', (e) => {
  if (!gameRunning) return;
  e.preventDefault();
  const rect = canvas.getBoundingClientRect();
  player.x = Math.max(40, Math.min(400, e.touches[0].clientX - rect.left - player.width/2));
});

function spawnEntities() {
  if (Math.random() > 0.4) {
    const lanes = [60, 160, 260, 360];
    traffic.push({
      x: lanes[Math.floor(Math.random() * lanes.length)],
      y: -80, width: 40, height: 70,
      color: Math.random() > 0.5 ? '#ef4444' : '#fbbf24',
      speed: Math.random() * 2 + 2
    });
  } else {
    roadCoins.push({ x: 60 + Math.random() * 320, y: -30, size: 20 });
  }
}

function loop() {
  if (!gameRunning) return;
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  // Draw Road
  ctx.fillStyle = '#18182f'; ctx.fillRect(40, 0, 400, canvas.height);
  ctx.strokeStyle = '#3b82f6'; ctx.lineWidth = 4;
  ctx.beginPath(); ctx.moveTo(40, 0); ctx.lineTo(40, canvas.height); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(440, 0); ctx.lineTo(440, canvas.height); ctx.stroke();

  // Draw Dashed Lane Lines
  ctx.strokeStyle = 'rgba(255,255,255,0.2)'; ctx.lineWidth = 2; ctx.setLineDash([30, 30]);
  roadOffset = (roadOffset + speed) % 60;
  ctx.lineDashOffset = -roadOffset;
  for (let l of [140, 240, 340]) {
    ctx.beginPath(); ctx.moveTo(l, 0); ctx.lineTo(l, canvas.height); ctx.stroke();
  }
  ctx.setLineDash([]);

  // Player Car
  ctx.shadowColor = '#38bdf8'; ctx.shadowBlur = 15; ctx.fillStyle = '#38bdf8';
  ctx.fillRect(player.x, player.y, player.width, player.height);
  ctx.fillStyle = '#0f172a'; ctx.fillRect(player.x + 5, player.y + 15, player.width - 10, 20);
  ctx.shadowBlur = 0;

  spawnTimer++;
  if (spawnTimer > Math.max(25, 60 - Math.floor(score/100))) { spawnEntities(); spawnTimer = 0; }

  // Traffic
  for (let i = traffic.length - 1; i >= 0; i--) {
    let t = traffic[i];
    t.y += (speed - t.speed);
    ctx.shadowColor = t.color; ctx.shadowBlur = 10; ctx.fillStyle = t.color;
    ctx.fillRect(t.x, t.y, t.width, t.height); ctx.shadowBlur = 0;

    // Collision
    if (player.x < t.x + t.width - 4 && player.x + player.width > t.x + 4 &&
        player.y < t.y + t.height - 4 && player.y + player.height > t.y + 4) {
      gameOver(); return;
    }
    if (t.y > canvas.height) traffic.splice(i, 1);
  }

  // Coins
  for (let i = roadCoins.length - 1; i >= 0; i--) {
    let c = roadCoins[i]; c.y += speed;
    ctx.shadowColor = '#fbbf24'; ctx.shadowBlur = 10; ctx.fillStyle = '#fbbf24';
    ctx.beginPath(); ctx.arc(c.x, c.y, c.size/2, 0, Math.PI*2); ctx.fill(); ctx.shadowBlur = 0;

    if (player.x < c.x + c.size && player.x + player.width > c.x - c.size &&
        player.y < c.y + c.size && player.y + player.height > c.y - c.size) {
      coins += 10; roadCoins.splice(i, 1);
    } else if (c.y > canvas.height) { roadCoins.splice(i, 1); }
  }

  score += 0.3; speed = 6 + Math.min(8, score / 150); updateHUD();
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
