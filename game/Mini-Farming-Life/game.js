let gold = parseInt(localStorage.getItem('farm_gold') || '100');
let gems = parseInt(localStorage.getItem('farm_gems') || '50');
if (!localStorage.getItem('farm_starter_50')) {
  gems = Math.max(gems, 50);
  localStorage.setItem('farm_starter_50', 'true');
  localStorage.setItem('farm_gems', gems);
}
let plots = JSON.parse(localStorage.getItem('farm_plots') || '[null,null,null,null,null,null,null,null,null]');
let activeTool = 'wheat';

const CROPS = {
  wheat: { name: 'Gandum', cost: 10, time: 5, reward: 25, icon: '🌾' },
  corn: { name: 'Jagung', cost: 30, time: 12, reward: 85, icon: '🌽' },
  strawberry: { name: 'Stroberi', cost: 80, time: 25, reward: 260, icon: '🍓' }
};

function updateHUD() {
  document.getElementById('gold-display').innerText = gold.toLocaleString('id-ID');
  document.getElementById('gem-display').innerText = gems.toLocaleString('id-ID');
  localStorage.setItem('farm_gold', gold);
  localStorage.setItem('farm_gems', gems);
  localStorage.setItem('farm_plots', JSON.stringify(plots));
}

function initGrid() {
  const gridEl = document.getElementById('grid');
  gridEl.innerHTML = '';
  for (let i = 0; i < 9; i++) {
    const p = document.createElement('div');
    p.className = 'plot';
    p.addEventListener('click', () => handlePlotClick(i));
    gridEl.appendChild(p);
  }
  renderPlots();
}

function renderPlots() {
  const plotEls = document.querySelectorAll('.plot');
  const now = Date.now();
  plotEls.forEach((el, i) => {
    const data = plots[i];
    if (!data) {
      el.innerHTML = `<div style="color:rgba(255,255,255,0.2); font-size:28px;">🌱</div>`;
    } else {
      const crop = CROPS[data.type];
      const elapsed = Math.floor((now - data.plantedAt) / 1000);
      const remaining = crop.time - elapsed;
      if (remaining <= 0) {
        el.innerHTML = `<div class="plot-icon" style="animation: bounce 1s infinite;">✨${crop.icon}✨</div><div class="plot-timer" style="background:#fbbf24; color:#0f172a;">PANEN!</div>`;
      } else {
        el.innerHTML = `<div class="plot-icon" style="opacity:0.6;">🌱</div><div class="plot-timer">${remaining}s lagi</div>`;
      }
    }
  });
}

function selectTool(t) {
  activeTool = t;
  document.querySelectorAll('.tool-btn').forEach(b => b.classList.remove('active'));
  event.currentTarget.classList.add('active');
  const hint = document.getElementById('hint-text');
  if (t === 'water') {
    hint.innerText = '💧 Klik petak tanaman yang sedang tumbuh untuk langsung panen instan (Biaya: 5 Gems)!';
    hint.style.background = 'rgba(56,189,248,0.2)'; hint.style.borderColor = '#38bdf8';
  } else {
    hint.innerText = `🌱 Terpilih: ${CROPS[t].name}. Klik petak tanah kosong untuk menanam!`;
    hint.style.background = 'rgba(74,222,128,0.15)'; hint.style.borderColor = '#4ade80';
  }
}

function handlePlotClick(idx) {
  const data = plots[idx];
  const hint = document.getElementById('hint-text');
  if (data) {
    const crop = CROPS[data.type];
    const elapsed = Math.floor((Date.now() - data.plantedAt) / 1000);
    if (elapsed >= crop.time) {
      gold += crop.reward;
      plots[idx] = null;
      renderPlots(); updateHUD();
      hint.innerText = `🎉 Berhasil memanen ${crop.name}! +${crop.reward} Koin Emas masuk kantong!`;
      hint.style.background = 'rgba(245,158,11,0.25)'; hint.style.borderColor = '#fbbf24';
    } else if (activeTool === 'water') {
      if (gems < 5) { openTopup(); return; }
      gems -= 5;
      data.plantedAt = Date.now() - (crop.time * 1000);
      renderPlots(); updateHUD();
      hint.innerText = '✨ Pupuk Ajaib disiramkan! Tanaman langsung siap dipanen!';
    } else {
      hint.innerText = `⏳ Tanaman ${crop.name} belum siap panen! Tunggu beberapa detik lagi atau siram pupuk.`;
    }
  } else {
    if (activeTool === 'water') { hint.innerText = '⚠️ Tanam benih terlebih dahulu sebelum menyiram pupuk!'; return; }
    const crop = CROPS[activeTool];
    if (gold < crop.cost) { hint.innerText = '🪙 Koin emas Anda tidak cukup untuk membeli bibit ini!'; return; }
    gold -= crop.cost;
    plots[idx] = { type: activeTool, plantedAt: Date.now() };
    renderPlots(); updateHUD();
    hint.innerText = `🌱 Bibit ${crop.name} berhasil ditanam!`;
  }
}

setInterval(() => { renderPlots(); }, 1000);

function startGame() { document.getElementById('start-screen').classList.add('hidden'); initGrid(); updateHUD(); }
function openTopup() { document.getElementById('topup-modal').classList.add('active'); }
function closeTopup() { document.getElementById('topup-modal').classList.remove('active'); }
function buyGems(itemName, price, amount) {
  MidtransPay.checkout({
    itemName: itemName, price: price,
    onSuccess: function() { gems += amount; updateHUD(); closeTopup(); alert(`🎉 Topup Berhasil! +${amount} Gems telah ditambahkan.`); }
  });
}
