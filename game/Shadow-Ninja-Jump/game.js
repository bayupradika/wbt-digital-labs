const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

let coins = parseInt(localStorage.getItem('ninja_coins') || '0');
let gems = parseInt(localStorage.getItem('ninja_gems') || '50');
if (!localStorage.getItem('ninja_starter_50')) {
  gems = Math.max(gems, 50);
  localStorage.setItem('ninja_starter_50', 'true');
  localStorage.setItem('ninja_gems', gems);
}

let score = 0; let highestY = 0; let gameRunning = false; let animationId;
const player = { x: 200, y: 400, width: 35, height: 45, vy: 0 };
let platforms = [];

function updateHUD() {
  document.getElementById('score-display').innerText = Math.floor(score);
  document.getElementById('coins-display').innerText = coins;
  document.getElementById('gems-display').innerText = gems;
  localStorage.setItem('ninja_coins', coins);
  localStorage.setItem('ninja_gems', gems);
}

function initPlatforms() {
  platforms = [];
  for (let i = 0; i < 8; i++) {
    platforms.push({ x: Math.random() * 370, y: 600 - i * 85, width: 80, height: 16 });
  }
}

function startGame() {
  document.getElementById('start-screen').classList.add('hidden');
  document.getElementById('gameover-screen').classList.add('hidden');
  score = 0; highestY = 400; player.x = 200; player.y = 400; player.vy = -12; gameRunning = true;
  initPlatforms(); updateHUD();
  cancelAnimationFrame(animationId); loop();
}

function gameOver() {
  gameRunning = false; cancelAnimationFrame(animationId);
  document.getElementById('final-score').innerText = Math.floor(score);
  document.getElementById('gameover-screen').classList.remove('hidden');
}

window.addEventListener('mousemove', (e) => {
  if (!gameRunning) return;
  const rect = canvas.getBoundingClientRect();
  player.x = Math.max(0, Math.min(canvas.width - player.width, e.clientX - rect.left - player.width/2));
});
canvas.addEventListener('touchmove', (e) => {
  if (!gameRunning) return; e.preventDefault();
  const rect = canvas.getBoundingClientRect();
  player.x = Math.max(0, Math.min(canvas.width - player.width, e.touches[0].clientX - rect.left - player.width/2));
});

function loop() {
  if (!gameRunning) return;
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  // Background
  ctx.fillStyle = '#111827'; ctx.fillRect(0, 0, canvas.width, canvas.height);

  // Physics
  player.vy += 0.45; player.y += player.vy;

  // Scroll camera upward
  if (player.y < 300) {
    let diff = 300 - player.y;
    player.y = 300; score += diff / 10;
    platforms.forEach(p => {
      p.y += diff;
      if (p.y > canvas.height) {
        p.y = -20; p.x = Math.random() * (canvas.width - 80);
        if (Math.random() > 0.6) coins += 5;
      }
    });
    updateHUD();
  }

  // Draw Platforms
  platforms.forEach(p => {
    ctx.shadowColor = '#6366f1'; ctx.shadowBlur = 10; ctx.fillStyle = '#6366f1';
    ctx.fillRect(p.x, p.y, p.width, p.height); ctx.shadowBlur = 0;

    // Platform bounce collision
    if (player.vy > 0 && player.x + player.width > p.x && player.x < p.x + p.width &&
        player.y + player.height >= p.y && player.y + player.height <= p.y + p.height + 10) {
      player.vy = -13;
    }
  });

  // Draw Ninja
  ctx.shadowColor = '#fbbf24'; ctx.shadowBlur = 12; ctx.fillStyle = '#fbbf24';
  ctx.fillRect(player.x, player.y, player.width, player.height); ctx.shadowBlur = 0;

  if (player.y > canvas.height) gameOver();
  else animationId = requestAnimationFrame(loop);
}

function openTopup() { document.getElementById('topup-modal').classList.add('active'); }
function closeTopup() { document.getElementById('topup-modal').classList.remove('active'); }
function buyGems(itemName, price, amount) {
  MidtransPay.checkout({
    itemName: itemName, price: price,
    onSuccess: function() { gems += amount; updateHUD(); closeTopup(); alert(`🎉 Topup Berhasil! +${amount} Gems telah ditambahkan.`); }
  });
}
