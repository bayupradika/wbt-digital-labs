const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

let coins = parseInt(localStorage.getItem('tower_coins') || '0');
let gems = parseInt(localStorage.getItem('tower_gems') || '50');
if (!localStorage.getItem('tower_starter_50')) {
  gems = Math.max(gems, 50);
  localStorage.setItem('tower_starter_50', 'true');
  localStorage.setItem('tower_gems', gems);
}

let score = 0; let gameRunning = false; let animationId;
let blocks = []; let currentBlock = null; let direction = 1; let speed = 4;

function updateHUD() {
  document.getElementById('score-display').innerText = score;
  document.getElementById('coins-display').innerText = coins;
  document.getElementById('gems-display').innerText = gems;
  localStorage.setItem('tower_coins', coins);
  localStorage.setItem('tower_gems', gems);
}

function startGame() {
  document.getElementById('start-screen').classList.add('hidden');
  document.getElementById('gameover-screen').classList.add('hidden');
  score = 0; speed = 4;
  blocks = [{ x: 140, y: 580, width: 200, height: 35, color: '#38bdf8' }];
  spawnNextBlock(); gameRunning = true; updateHUD();
  cancelAnimationFrame(animationId); loop();
}

function spawnNextBlock() {
  const prev = blocks[blocks.length - 1];
  const colors = ['#f43f5e', '#fbbf24', '#10b981', '#a855f7', '#38bdf8'];
  currentBlock = {
    x: 0, y: prev.y - 35, width: prev.width, height: 35,
    color: colors[score % colors.length]
  };
  direction = 1; speed = 4 + Math.min(6, score / 5);
}

function dropBlock() {
  if (!gameRunning || !currentBlock) return;
  const prev = blocks[blocks.length - 1];
  let diff = currentBlock.x - prev.x;

  if (Math.abs(diff) >= currentBlock.width) { gameOver(); return; }

  if (diff > 0) {
    currentBlock.width -= diff;
  } else if (diff < 0) {
    currentBlock.width += diff;
    currentBlock.x = prev.x;
  }

  blocks.push(currentBlock);
  score++; coins += 5;

  if (Math.abs(diff) < 5) {
    coins += 10; // Perfect bonus!
  }

  // Camera scroll
  if (currentBlock.y < 300) {
    blocks.forEach(b => b.y += 35);
  } else {
    spawnNextBlock();
  }
  if (currentBlock.y >= 300) spawnNextBlock();
  updateHUD();
}

window.addEventListener('keydown', (e) => { if (e.code === 'Space') dropBlock(); });
canvas.addEventListener('mousedown', dropBlock);
canvas.addEventListener('touchstart', (e) => { e.preventDefault(); dropBlock(); });

function gameOver() {
  gameRunning = false; cancelAnimationFrame(animationId);
  document.getElementById('final-score').innerText = score;
  document.getElementById('gameover-screen').classList.remove('hidden');
}

function loop() {
  if (!gameRunning) return;
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  // Background gradient
  ctx.fillStyle = '#0f172a'; ctx.fillRect(0, 0, canvas.width, canvas.height);

  // Move current block
  if (currentBlock) {
    currentBlock.x += speed * direction;
    if (currentBlock.x + currentBlock.width > canvas.width || currentBlock.x < 0) direction *= -1;

    ctx.shadowColor = currentBlock.color; ctx.shadowBlur = 10; ctx.fillStyle = currentBlock.color;
    ctx.fillRect(currentBlock.x, currentBlock.y, currentBlock.width, currentBlock.height); ctx.shadowBlur = 0;
  }

  // Draw stacked blocks
  blocks.forEach(b => {
    ctx.fillStyle = b.color; ctx.fillRect(b.x, b.y, b.width, b.height);
    ctx.strokeStyle = 'rgba(255,255,255,0.3)'; ctx.strokeRect(b.x, b.y, b.width, b.height);
  });

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
