let gold = parseInt(localStorage.getItem('rpg_gold') || '50');
let gems = parseInt(localStorage.getItem('rpg_gems') || '50');
if (!localStorage.getItem('rpg_starter_50')) {
  gems = Math.max(gems, 50);
  localStorage.setItem('rpg_starter_50', 'true');
  localStorage.setItem('rpg_gems', gems);
}
let hp = 100;
let floor = 1;
let dungeon = [];

function updateHUD() {
  document.getElementById('gold-display').innerText = gold.toLocaleString('id-ID');
  document.getElementById('gem-display').innerText = gems.toLocaleString('id-ID');
  document.getElementById('hp-display').innerText = `${Math.max(0, hp)} / 100`;
  document.getElementById('floor-display').innerText = `Lantai ${floor}`;
  localStorage.setItem('rpg_gold', gold);
  localStorage.setItem('rpg_gems', gems);
}

function generateDungeon() {
  const gridEl = document.getElementById('grid');
  gridEl.innerHTML = '';
  dungeon = [];
  for (let i = 0; i < 25; i++) {
    const r = Math.random();
    let content = 'empty'; // 🪙, 🧪, 💀, 👾, 👑
    if (r < 0.35) content = 'monster';
    else if (r < 0.6) content = 'gold';
    else if (r < 0.7) content = 'potion';

    dungeon.push({ revealed: false, type: content });
    const tile = document.createElement('div');
    tile.className = 'tile';
    tile.innerHTML = '❓';
    tile.addEventListener('click', () => revealTile(i));
    gridEl.appendChild(tile);
  }
}

function revealTile(idx) {
  if (hp <= 0 || dungeon[idx].revealed) return;
  dungeon[idx].revealed = true;
  const tileEl = document.getElementById('grid').children[idx];
  const hint = document.getElementById('hint-text');

  if (dungeon[idx].type === 'monster') {
    const dmg = Math.floor(Math.random() * 15) + 10;
    hp -= dmg;
    tileEl.innerHTML = '👾'; tileEl.style.background = 'rgba(239,68,68,0.2)';
    hint.innerText = `💥 Bertarung dengan Monster Slime! Anda kehilangan -${dmg} HP!`;
    hint.style.background = 'rgba(239,68,68,0.25)'; hint.style.borderColor = '#ef4444';
    if (hp <= 0) gameOver();
  } else if (dungeon[idx].type === 'gold') {
    const found = Math.floor(Math.random() * 30) + 10;
    gold += found;
    tileEl.innerHTML = '🪙'; tileEl.style.background = 'rgba(245,158,11,0.2)';
    hint.innerText = `🎉 Menemukan Peti Harta Karun! +${found} Koin Emas!`;
    hint.style.background = 'rgba(245,158,11,0.25)'; hint.style.borderColor = '#fbbf24';
  } else if (dungeon[idx].type === 'potion') {
    hp = Math.min(100, hp + 20);
    tileEl.innerHTML = '🧪'; tileEl.style.background = 'rgba(16,185,129,0.2)';
    hint.innerText = '✨ Menemukan Ramuan Penyembuh kecil! +20 HP dipulihkan!';
    hint.style.background = 'rgba(16,185,129,0.25)'; hint.style.borderColor = '#10b981';
  } else {
    tileEl.innerHTML = '🐾'; tileEl.style.background = '#1e1a33';
    hint.innerText = 'Lantai kosong dan aman. Lanjutkan eksplorasi!';
    hint.style.background = 'rgba(168,85,247,0.15)'; hint.style.borderColor = '#a855f7';
  }
  updateHUD();
}

function usePotion() {
  if (hp >= 100) { document.getElementById('hint-text').innerText = '❤️ HP Anda sudah penuh maksimal!'; return; }
  if (gems < 10) { openTopup(); return; }
  gems -= 10; hp = Math.min(100, hp + 50); updateHUD();
  document.getElementById('hint-text').innerText = '🧪 Ramuan Nyawa diminum! +50 HP berhasil dipulihkan.';
  document.getElementById('hint-text').style.background = 'rgba(16,185,129,0.25)'; document.getElementById('hint-text').style.borderColor = '#10b981';
}

function nextFloor() {
  floor++; generateDungeon(); updateHUD();
  document.getElementById('hint-text').innerText = `⚔️ Memasuki Lantai ${floor}! Monster semakin menantang.`;
}

function startGame() {
  document.getElementById('start-screen').classList.add('hidden');
  document.getElementById('gameover-screen').classList.add('hidden');
  hp = 100; floor = 1; generateDungeon(); updateHUD();
}

function gameOver() {
  document.getElementById('final-floor').innerText = floor;
  document.getElementById('gameover-screen').classList.remove('hidden');
}

function openTopup() { document.getElementById('topup-modal').classList.add('active'); }
function closeTopup() { document.getElementById('topup-modal').classList.remove('active'); }
function buyGems(itemName, price, amount) {
  MidtransPay.checkout({
    itemName: itemName, price: price,
    onSuccess: function() { gems += amount; updateHUD(); closeTopup(); alert(`🎉 Topup Berhasil! +${amount} Gems telah ditambahkan.`); }
  });
}
