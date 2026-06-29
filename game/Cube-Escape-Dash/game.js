const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

// State Manager
let gems = parseInt(localStorage.getItem('cube_gems') || '0');
let currentSkin = localStorage.getItem('cube_skin') || '#3b82f6';
let ownedSkins = JSON.parse(localStorage.getItem('cube_owned_skins') || '["#3b82f6"]');

document.getElementById('gems-display').innerText = gems;

let score = 0;
let gameRunning = false;
let animationId;
let gameSpeed = 6;
let gravity = 0.6;

// Player Cube
const player = {
  x: 100,
  y: 380,
  size: 40,
  vy: 0,
  jumpStrength: -12,
  grounded: true,
  rotation: 0
};

// Arrays for obstacles and particles
let obstacles = [];
let particles = [];
let spawnTimer = 0;

function updateHUD() {
  document.getElementById('score-display').innerText = Math.floor(score);
  document.getElementById('gems-display').innerText = gems;
}

function startGame() {
  document.getElementById('start-screen').classList.add('hidden');
  document.getElementById('gameover-screen').classList.add('hidden');
  closeModals();
  
  score = 0;
  gameSpeed = 6;
  player.y = 380;
  player.vy = 0;
  player.grounded = true;
  obstacles = [];
  particles = [];
  gameRunning = true;
  
  cancelAnimationFrame(animationId);
  loop();
}

function gameOver() {
  gameRunning = false;
  cancelAnimationFrame(animationId);
  document.getElementById('final-score').innerText = Math.floor(score);
  document.getElementById('gameover-screen').classList.remove('hidden');
  
  // Give gems based on score (1 gem per 50 score)
  const earnedGems = Math.floor(score / 50);
  if (earnedGems > 0) {
    gems += earnedGems;
    localStorage.setItem('cube_gems', gems);
    updateHUD();
  }
}

function jump() {
  if (!gameRunning) return;
  if (player.grounded) {
    player.vy = player.jumpStrength;
    player.grounded = false;
    createParticles(player.x, player.y + player.size, 10, '#ffffff');
  }
}

// Controls
window.addEventListener('keydown', (e) => {
  if (e.code === 'Space' || e.code === 'ArrowUp') {
    e.preventDefault();
    jump();
  }
});
canvas.addEventListener('mousedown', jump);
canvas.addEventListener('touchstart', (e) => { e.preventDefault(); jump(); });

function createParticles(x, y, count, color) {
  for (let i = 0; i < count; i++) {
    particles.push({
      x: x, y: y,
      vx: (Math.random() - 0.5) * 4,
      vy: (Math.random() - 0.5) * 4,
      size: Math.random() * 6 + 2,
      color: color || currentSkin,
      alpha: 1
    });
  }
}

function spawnObstacle() {
  const type = Math.random() > 0.3 ? 'spike' : 'block';
  obstacles.push({
    x: canvas.width,
    y: type === 'spike' ? 420 : 380,
    width: type === 'spike' ? 30 : 40,
    height: type === 'spike' ? 40 : 40,
    type: type
  });
}

function loop() {
  if (!gameRunning) return;
  
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  
  // Draw Background Floor
  ctx.fillStyle = '#1e293b';
  ctx.fillRect(0, 420, canvas.width, 80);
  ctx.strokeStyle = '#3b82f6';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(0, 420); ctx.lineTo(canvas.width, 420);
  ctx.stroke();

  // Physics & Player Movement
  player.vy += gravity;
  player.y += player.vy;
  
  if (player.y >= 380) {
    player.y = 380;
    player.vy = 0;
    player.grounded = true;
    player.rotation = Math.round(player.rotation / (Math.PI/2)) * (Math.PI/2);
  } else {
    player.rotation += 0.08;
  }

  // Draw Player Trail
  if (gameRunning && Math.random() > 0.5) {
    createParticles(player.x, player.y + player.size/2, 1);
  }

  // Update & Draw Particles
  for (let i = particles.length - 1; i >= 0; i--) {
    let p = particles[i];
    p.x += p.vx - gameSpeed;
    p.y += p.vy;
    p.alpha -= 0.03;
    if (p.alpha <= 0) {
      particles.splice(i, 1);
      continue;
    }
    ctx.save();
    ctx.globalAlpha = p.alpha;
    ctx.fillStyle = p.color === 'matrix' ? '#10b981' : p.color;
    ctx.fillRect(p.x, p.y, p.size, p.size);
    ctx.restore();
  }

  // Draw Player Cube
  ctx.save();
  ctx.translate(player.x + player.size/2, player.y + player.size/2);
  ctx.rotate(player.rotation);
  if (currentSkin === 'matrix') {
    ctx.fillStyle = '#10b981';
    ctx.shadowColor = '#10b981';
  } else {
    ctx.fillStyle = currentSkin;
    ctx.shadowColor = currentSkin;
  }
  ctx.shadowBlur = 15;
  ctx.fillRect(-player.size/2, -player.size/2, player.size, player.size);
  ctx.strokeStyle = '#ffffff';
  ctx.lineWidth = 2;
  ctx.strokeRect(-player.size/2, -player.size/2, player.size, player.size);
  ctx.restore();

  // Obstacle Management
  spawnTimer++;
  if (spawnTimer > Math.max(35, 90 - Math.floor(score/100))) {
    spawnObstacle();
    spawnTimer = 0;
  }

  for (let i = obstacles.length - 1; i >= 0; i--) {
    let obs = obstacles[i];
    obs.x -= gameSpeed;

    // Draw Obstacle
    if (obs.type === 'spike') {
      ctx.fillStyle = '#ef4444';
      ctx.shadowColor = '#ef4444';
      ctx.shadowBlur = 10;
      ctx.beginPath();
      ctx.moveTo(obs.x, obs.y);
      ctx.lineTo(obs.x + obs.width/2, obs.y - obs.height);
      ctx.lineTo(obs.x + obs.width, obs.y);
      ctx.closePath();
      ctx.fill();
    } else {
      ctx.fillStyle = '#f97316';
      ctx.shadowColor = '#f97316';
      ctx.shadowBlur = 10;
      ctx.fillRect(obs.x, obs.y, obs.width, obs.height);
    }
    ctx.shadowBlur = 0;

    // Collision Detection (Hitbox tolerance)
    let margin = 6;
    if (player.x + player.size - margin > obs.x &&
        player.x + margin < obs.x + obs.width &&
        player.y + player.size - margin > obs.y - (obs.type === 'spike' ? obs.height : 0) &&
        player.y + margin < obs.y + obs.height) {
      createParticles(player.x, player.y, 30, '#ef4444');
      gameOver();
      return;
    }

    if (obs.x + obs.width < 0) {
      obstacles.splice(i, 1);
    }
  }

  score += 0.2;
  gameSpeed = 6 + Math.min(6, score / 200);
  updateHUD();

  animationId = requestAnimationFrame(loop);
}

// Shop & Topup logic
function openShop() { document.getElementById('shop-modal').classList.add('active'); }
function openTopup() { document.getElementById('topup-modal').classList.add('active'); }
function closeModals() {
  document.getElementById('shop-modal').classList.remove('active');
  document.getElementById('topup-modal').classList.remove('active');
}

function selectSkin(skin) {
  if (!ownedSkins.includes(skin)) {
    alert('Anda belum memiliki skin ini! Silakan beli terlebih dahulu.');
    return;
  }
  currentSkin = skin;
  localStorage.setItem('cube_skin', skin);
  alert('Skin berhasil dipakai!');
  closeModals();
}

function buySkin(skin, price) {
  if (ownedSkins.includes(skin)) {
    selectSkin(skin);
    return;
  }
  if (gems >= price) {
    gems -= price;
    ownedSkins.push(skin);
    localStorage.setItem('cube_gems', gems);
    localStorage.setItem('cube_owned_skins', JSON.stringify(ownedSkins));
    updateHUD();
    selectSkin(skin);
  } else {
    alert('Gems Anda tidak cukup! Silakan Topup Gems terlebih dahulu.');
    closeModals();
    openTopup();
  }
}

function buyGems(itemName, price, amount) {
  MidtransPay.checkout({
    itemName: itemName,
    price: price,
    onSuccess: function() {
      gems += amount;
      localStorage.setItem('cube_gems', gems);
      updateHUD();
      closeModals();
      alert(`🎉 Topup Berhasil! +${amount} Gems telah ditambahkan ke akun Anda.`);
    }
  });
}
