let gold = Math.floor(parseFloat(localStorage.getItem('merge_gold') || '50'));
let gems = parseInt(localStorage.getItem('merge_gems') || '50');
if (!localStorage.getItem('merge_starter_50')) {
  gems = Math.max(gems, 50);
  localStorage.setItem('merge_starter_50', 'true');
  localStorage.setItem('merge_gems', gems);
}
let grid = JSON.parse(localStorage.getItem('merge_grid') || '[1, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0]');
let selectedIndex = -1;
let spawnCost = 20;

const BUILDINGS = [
  { lvl: 0, name: 'Kosong', icon: '', mps: 0 },
  { lvl: 1, name: 'Tenda Kayu', icon: '⛺', mps: 1 },
  { lvl: 2, name: 'Gubuk Batu', icon: '🏡', mps: 3 },
  { lvl: 3, name: 'Barak Prajurit', icon: '🛡️', mps: 8 },
  { lvl: 4, name: 'Kastil Menara', icon: '🏰', mps: 20 },
  { lvl: 5, name: 'Istana Kerajaan', icon: '👑', mps: 50 },
  { lvl: 6, name: 'Benteng Kaisar', icon: '🏛️', mps: 130 },
  { lvl: 7, name: 'Menara Langit', icon: '🌟', mps: 350 },
  { lvl: 8, name: 'Keajaiban Dunia', icon: '🪐', mps: 1000 }
];

function updateHUD() {
  document.getElementById('gold-display').innerText = Math.floor(gold).toLocaleString('id-ID');
  document.getElementById('gem-display').innerText = gems.toLocaleString('id-ID');
  
  // Calculate total MPS & highest level
  let totalMps = 0;
  let highest = 1;
  grid.forEach(lvl => {
    if (lvl > 0 && BUILDINGS[lvl]) {
      totalMps += BUILDINGS[lvl].mps;
      if (lvl > highest) highest = lvl;
    }
  });
  document.getElementById('mps-display').innerText = totalMps;
  document.getElementById('highest-lvl').innerText = `Lvl ${highest}`;
  
  // Update spawn cost based on grid density
  const count = grid.filter(x => x > 0).length;
  spawnCost = Math.floor(20 * Math.pow(1.15, count));
  document.getElementById('spawn-cost').innerText = `${spawnCost} 🪙`;

  localStorage.setItem('merge_gold', gold);
  localStorage.setItem('merge_gems', gems);
  localStorage.setItem('merge_grid', JSON.stringify(grid));
}

function initGrid() {
  const gridEl = document.getElementById('grid');
  gridEl.innerHTML = '';
  for (let i = 0; i < 16; i++) {
    const tile = document.createElement('div');
    tile.className = 'tile';
    tile.dataset.index = i;
    tile.addEventListener('click', () => handleTileClick(i));
    gridEl.appendChild(tile);
  }
  renderGrid();
}

function renderGrid() {
  const tiles = document.querySelectorAll('.tile');
  tiles.forEach((t, i) => {
    const lvl = grid[i];
    t.classList.remove('selected');
    if (selectedIndex === i) t.classList.add('selected');

    if (lvl > 0 && BUILDINGS[lvl]) {
      t.innerHTML = `
        <div class="tile-icon">${BUILDINGS[lvl].icon}</div>
        <div class="tile-lvl">Lvl ${lvl}</div>
        <div class="tile-mps">+${BUILDINGS[lvl].mps}/s</div>
      `;
    } else {
      t.innerHTML = `<div style="color: #334155; font-size: 24px;">➕</div>`;
    }
  });
}

function handleTileClick(idx) {
  if (selectedIndex === -1) {
    if (grid[idx] > 0) {
      selectedIndex = idx;
      renderGrid();
      document.getElementById('hint-text').innerText = `✨ Terpilih: ${BUILDINGS[grid[idx]].name} (Lvl ${grid[idx]}). Klik bangunan Lvl ${grid[idx]} lain untuk Merge, atau klik kotak kosong untuk memindahkan!`;
      document.getElementById('hint-text').style.background = 'rgba(245,158,11,0.2)';
      document.getElementById('hint-text').style.borderColor = '#fbbf24';
    } else {
      // Empty tile clicked -> attempt spawn
      useBooster('spawn');
    }
  } else {
    if (selectedIndex === idx) {
      // Deselect
      selectedIndex = -1;
      renderGrid();
      resetHint();
    } else if (grid[idx] === 0) {
      // Move building to empty tile
      grid[idx] = grid[selectedIndex];
      grid[selectedIndex] = 0;
      selectedIndex = -1;
      renderGrid(); updateHUD(); resetHint();
    } else if (grid[idx] === grid[selectedIndex]) {
      // MERGE SUCCESS!
      const currentLvl = grid[idx];
      if (currentLvl < BUILDINGS.length - 1) {
        grid[idx] = currentLvl + 1;
        grid[selectedIndex] = 0;
        selectedIndex = -1;
        renderGrid(); updateHUD();
        const hint = document.getElementById('hint-text');
        hint.innerText = `🎉 MERGE BERHASIL! Naik ke ${BUILDINGS[grid[idx]].name} (Lvl ${grid[idx]})! +${BUILDINGS[grid[idx]].mps * 5} Koin Bonus!`;
        hint.style.background = 'rgba(245,158,11,0.25)';
        hint.style.borderColor = '#fbbf24';
      } else {
        const hint = document.getElementById('hint-text');
        hint.innerText = '🌟 Bangunan ini sudah mencapai level maksimal tertinggi!';
        hint.style.background = 'rgba(168,85,247,0.25)';
        hint.style.borderColor = '#a855f7';
        selectedIndex = -1; renderGrid();
      }
    } else {
      // Different level clicked -> swap selection
      selectedIndex = idx;
      renderGrid();
      document.getElementById('hint-text').innerText = `✨ Terpilih: ${BUILDINGS[grid[idx]].name} (Lvl ${grid[idx]}). Klik bangunan Lvl ${grid[idx]} lain untuk Merge!`;
    }
  }
}

function resetHint() {
  document.getElementById('hint-text').innerText = '👑 Klik Bangunan yang sama untuk menggabungkannya (Merge) menjadi level lebih tinggi!';
  document.getElementById('hint-text').style.background = 'rgba(16,185,129,0.15)';
  document.getElementById('hint-text').style.borderColor = '#10b981';
}

function useBooster(type) {
  if (type === 'spawn') {
    const emptyIndices = [];
    grid.forEach((v, i) => { if (v === 0) emptyIndices.push(i); });
    if (emptyIndices.length === 0) {
      alert('⚠️ Papan Kerajaan sudah penuh! Gabungkan (Merge) beberapa bangunan terlebih dahulu.');
      return;
    }
    if (gold < spawnCost) {
      alert('🪙 Koin emas tidak cukup! Tunggu beberapa detik atau Topup Gems untuk tukar koin.');
      openTopup();
      return;
    }
    gold -= spawnCost;
    const targetIdx = emptyIndices[Math.floor(Math.random() * emptyIndices.length)];
    grid[targetIdx] = 1;
    renderGrid(); updateHUD();
  } else if (type === 'automerge') {
    if (gems < 10) { openTopup(); return; }
    let mergedAny = false;
    for (let i = 0; i < 16; i++) {
      for (let j = i + 1; j < 16; j++) {
        if (grid[i] > 0 && grid[i] === grid[j] && grid[i] < BUILDINGS.length - 1) {
          grid[j] = grid[i] + 1;
          grid[i] = 0;
          mergedAny = true;
          break;
        }
      }
    }
    if (mergedAny) {
      gems -= 10;
      renderGrid(); updateHUD();
      const hint = document.getElementById('hint-text');
      hint.innerText = '✨ Auto-Merge Berhasil! Semua pasangan bangunan yang identik telah digabungkan.';
      hint.style.background = 'rgba(56,189,248,0.25)';
      hint.style.borderColor = '#38bdf8';
    } else {
      const hint = document.getElementById('hint-text');
      hint.innerText = '⚠️ Tidak ada pasangan bangunan dengan level yang sama saat ini!';
      hint.style.background = 'rgba(239,68,68,0.25)';
      hint.style.borderColor = '#ef4444';
    }
  } else if (type === 'timewarp') {
    if (gems < 25) { openTopup(); return; }
    let totalMps = 0;
    grid.forEach(lvl => { if (lvl > 0 && BUILDINGS[lvl]) totalMps += BUILDINGS[lvl].mps; });
    const earnedGold = Math.max(500, totalMps * 3600);
    gems -= 25;
    gold += earnedGold;
    updateHUD();
    const hint = document.getElementById('hint-text');
    hint.innerText = `⏳ TIME WARP 1 JAM BERHASIL! Kerajaan mendapatkan +${earnedGold.toLocaleString('id-ID')} Koin secara instan!`;
    hint.style.background = 'rgba(168,85,247,0.25)';
    hint.style.borderColor = '#a855f7';
  }
}

// Idle loop (1 second interval)
setInterval(() => {
  let totalMps = 0;
  grid.forEach(lvl => { if (lvl > 0 && BUILDINGS[lvl]) totalMps += BUILDINGS[lvl].mps; });
  if (totalMps > 0) {
    gold += totalMps;
    updateHUD();
  }
}, 1000);

function startGame() {
  document.getElementById('start-screen').classList.add('hidden');
  initGrid();
  updateHUD();
}

function openTopup() { document.getElementById('topup-modal').classList.add('active'); }
function closeTopup() { document.getElementById('topup-modal').classList.remove('active'); }

function buyGems(itemName, price, amount) {
  MidtransPay.checkout({
    itemName: itemName,
    price: price,
    onSuccess: function() {
      gems += amount;
      updateHUD();
      closeTopup();
      alert(`🎉 Topup Berhasil! +${amount} Gems telah ditambahkan ke perbendaharaan Kerajaan.`);
    }
  });
}
