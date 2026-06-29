let coins = parseInt(localStorage.getItem('block_coins') || '50');
let highScore = parseInt(localStorage.getItem('block_highscore') || '0');
let score = 0;
let grid = Array(8).fill(null).map(() => Array(8).fill(0));
let selectedTrayIndex = -1;
let currentPieces = [];
let boosterMode = null; // null, 'hammer'

document.getElementById('coins-display').innerText = coins;
document.getElementById('high-score').innerText = highScore;

const SHAPES = [
  { shape: [[1]], color: '#f43f5e', name: 'Titik 1' },
  { shape: [[1, 1]], color: '#38bdf8', name: 'Garis 2' },
  { shape: [[1], [1]], color: '#38bdf8', name: 'Garis 2 Vertikal' },
  { shape: [[1, 1, 1]], color: '#fbbf24', name: 'Garis 3' },
  { shape: [[1], [1], [1]], color: '#fbbf24', name: 'Garis 3 Vertikal' },
  { shape: [[1, 1], [1, 1]], color: '#a855f7', name: 'Kotak 2x2' },
  { shape: [[1, 1, 1], [0, 1, 0]], color: '#10b981', name: 'Bentuk T' },
  { shape: [[1, 0], [1, 1]], color: '#ec4899', name: 'Sudut L' }
];

function updateHUD() {
  document.getElementById('current-score').innerText = score;
  document.getElementById('coins-display').innerText = coins;
  if (score > highScore) {
    highScore = score;
    localStorage.setItem('block_highscore', highScore);
    document.getElementById('high-score').innerText = highScore;
  }
}

function initGrid() {
  const gridEl = document.getElementById('grid');
  gridEl.innerHTML = '';
  for (let r = 0; r < 8; r++) {
    for (let c = 0; c < 8; c++) {
      const cell = document.createElement('div');
      cell.className = 'cell';
      cell.dataset.row = r;
      cell.dataset.col = c;
      
      cell.addEventListener('click', () => handleCellClick(r, c));
      cell.addEventListener('mouseenter', () => handleCellHover(r, c));
      cell.addEventListener('mouseleave', clearPreview);

      gridEl.appendChild(cell);
    }
  }
  renderGrid();
}

function renderGrid() {
  const cells = document.querySelectorAll('.cell');
  cells.forEach(c => {
    const r = parseInt(c.dataset.row);
    const col = parseInt(c.dataset.col);
    if (grid[r][col] !== 0) {
      c.style.background = grid[r][col];
      c.classList.add('filled');
    } else {
      c.style.background = '#1e293b';
      c.classList.remove('filled');
    }
  });
}

function spawnPieces() {
  currentPieces = [];
  const tray = document.getElementById('tray');
  tray.innerHTML = '';
  for (let i = 0; i < 3; i++) {
    const randomShape = SHAPES[Math.floor(Math.random() * SHAPES.length)];
    currentPieces.push(randomShape);
    
    const pEl = document.createElement('div');
    pEl.className = 'piece';
    pEl.style.gridTemplateColumns = `repeat(${randomShape.shape[0].length}, 22px)`;
    pEl.dataset.index = i;
    pEl.addEventListener('click', () => selectTrayPiece(i));
    
    randomShape.shape.forEach(row => {
      row.forEach(val => {
        const c = document.createElement('div');
        if (val) {
          c.className = 'piece-cell';
          c.style.background = randomShape.color;
        }
        pEl.appendChild(c);
      });
    });
    tray.appendChild(pEl);
  }
}

function selectTrayPiece(idx) {
  if (!currentPieces[idx]) return;
  boosterMode = null;
  document.querySelectorAll('.piece').forEach(p => p.classList.remove('selected'));
  
  if (selectedTrayIndex === idx) {
    selectedTrayIndex = -1;
    document.getElementById('hint-text').innerText = '👉 Klik salah satu balok di bawah, lalu klik kotak di grid!';
    document.getElementById('hint-text').style.background = 'rgba(59,130,246,0.15)';
    document.getElementById('hint-text').style.borderColor = '#3b82f6';
    return;
  }

  selectedTrayIndex = idx;
  const pEl = document.querySelector(`.piece[data-index="${idx}"]`);
  if (pEl) pEl.classList.add('selected');
  
  document.getElementById('hint-text').innerText = `✨ Terpilih: ${currentPieces[idx].name}. Klik posisi di grid untuk meletakkan!`;
  document.getElementById('hint-text').style.background = 'rgba(245,158,11,0.2)';
  document.getElementById('hint-text').style.borderColor = '#fbbf24';
}

function clearPreview() {
  if (boosterMode === 'hammer') return;
  renderGrid();
}

function handleCellHover(startRow, startCol) {
  if (boosterMode === 'hammer') {
    const cellEl = document.querySelector(`.cell[data-row="${startRow}"][data-col="${startCol}"]`);
    if (grid[startRow][startCol] !== 0 && cellEl) {
      cellEl.style.background = '#ef4444';
    }
    return;
  }

  if (selectedTrayIndex === -1 || !currentPieces[selectedTrayIndex]) return;
  const piece = currentPieces[selectedTrayIndex];
  
  clearPreview();
  if (canPlace(piece, startRow, startCol)) {
    for (let r = 0; r < piece.shape.length; r++) {
      for (let c = 0; c < piece.shape[r].length; c++) {
        if (piece.shape[r][c]) {
          const targetEl = document.querySelector(`.cell[data-row="${startRow + r}"][data-col="${startCol + c}"]`);
          if (targetEl) {
            targetEl.style.background = piece.color;
            targetEl.style.opacity = '0.5';
          }
        }
      }
    }
  }
}

function canPlace(piece, startRow, startCol) {
  for (let r = 0; r < piece.shape.length; r++) {
    for (let c = 0; c < piece.shape[r].length; c++) {
      if (piece.shape[r][c]) {
        let targetRow = startRow + r;
        let targetCol = startCol + c;
        if (targetRow >= 8 || targetCol >= 8 || grid[targetRow][targetCol] !== 0) {
          return false;
        }
      }
    }
  }
  return true;
}

function handleCellClick(startRow, startCol) {
  if (boosterMode === 'hammer') {
    if (grid[startRow][startCol] !== 0) {
      grid[startRow][startCol] = 0;
      coins -= 50; localStorage.setItem('block_coins', coins);
      boosterMode = null;
      document.getElementById('hint-text').innerText = '👉 Klik salah satu balok di bawah, lalu klik kotak di grid!';
      document.getElementById('hint-text').style.background = 'rgba(59,130,246,0.15)';
      document.getElementById('hint-text').style.borderColor = '#3b82f6';
      renderGrid(); updateHUD();
      alert('💥 Blok berhasil dihancurkan dengan Palu!');
    } else {
      alert('Pilih kotak yang ada balok warna untuk dihancurkan!');
    }
    return;
  }

  if (selectedTrayIndex === -1 || !currentPieces[selectedTrayIndex]) {
    alert('⚠️ Pilih (klik) balok dari rak bawah terlebih dahulu sebelum meletakkan ke papan!');
    return;
  }

  const piece = currentPieces[selectedTrayIndex];
  
  if (canPlace(piece, startRow, startCol)) {
    for (let r = 0; r < piece.shape.length; r++) {
      for (let c = 0; c < piece.shape[r].length; c++) {
        if (piece.shape[r][c]) {
          grid[startRow + r][startCol + c] = piece.color;
        }
      }
    }
    score += 15;
    
    currentPieces[selectedTrayIndex] = null;
    const pEl = document.querySelector(`.piece[data-index="${selectedTrayIndex}"]`);
    if (pEl) pEl.style.visibility = 'hidden';
    selectedTrayIndex = -1;
    
    document.getElementById('hint-text').innerText = '👉 Klik salah satu balok di bawah, lalu klik kotak di grid!';
    document.getElementById('hint-text').style.background = 'rgba(59,130,246,0.15)';
    document.getElementById('hint-text').style.borderColor = '#3b82f6';

    checkLines();
    renderGrid();
    updateHUD();

    if (currentPieces.every(p => p === null)) {
      spawnPieces();
    } else {
      checkGameOver();
    }
  } else {
    alert('❌ Balok tidak muat di posisi ini! Pilih posisi lain yang kosong.');
  }
}

function checkLines() {
  let rowsToClear = [];
  let colsToClear = [];

  for (let r = 0; r < 8; r++) {
    if (grid[r].every(val => val !== 0)) rowsToClear.push(r);
  }
  for (let c = 0; c < 8; c++) {
    let full = true;
    for (let r = 0; r < 8; r++) { if (grid[r][c] === 0) full = false; }
    if (full) colsToClear.push(c);
  }

  rowsToClear.forEach(r => {
    for (let c = 0; c < 8; c++) grid[r][c] = 0;
  });
  colsToClear.forEach(c => {
    for (let r = 0; r < 8; r++) grid[r][c] = 0;
  });

  const linesCleared = rowsToClear.length + colsToClear.length;
  if (linesCleared > 0) {
    score += linesCleared * 100 * linesCleared;
    coins += linesCleared * 10;
    localStorage.setItem('block_coins', coins);
  }
}

function checkGameOver() {
  let canMoveAny = false;
  currentPieces.forEach(p => {
    if (p) {
      for (let r = 0; r < 8; r++) {
        for (let c = 0; c < 8; c++) {
          if (canPlace(p, r, c)) canMoveAny = true;
        }
      }
    }
  });
  if (!canMoveAny) {
    document.getElementById('final-score').innerText = score;
    document.getElementById('gameover-screen').classList.remove('hidden');
  }
}

function startGame() {
  document.getElementById('start-screen').classList.add('hidden');
  document.getElementById('gameover-screen').classList.add('hidden');
  grid = Array(8).fill(null).map(() => Array(8).fill(0));
  score = 0;
  selectedTrayIndex = -1;
  boosterMode = null;
  initGrid();
  spawnPieces();
  updateHUD();
}

function useBooster(type) {
  if (type === 'hammer') {
    if (coins < 50) { openTopup(); return; }
    boosterMode = 'hammer';
    document.getElementById('hint-text').innerText = '🔨 MODE PALU AKTIF: Klik salah satu balok di papan grid untuk menghancurkannya!';
    document.getElementById('hint-text').style.background = 'rgba(244,63,94,0.2)';
    document.getElementById('hint-text').style.borderColor = '#f43f5e';
  } else if (type === 'shuffle') {
    if (coins < 30) { openTopup(); return; }
    coins -= 30; localStorage.setItem('block_coins', coins);
    spawnPieces(); updateHUD();
    alert('🔄 Balok berhasil diacak!');
  } else if (type === 'clear') {
    if (coins < 100) { openTopup(); return; }
    coins -= 100; localStorage.setItem('block_coins', coins);
    for (let c = 0; c < 8; c++) grid[7][c] = 0;
    renderGrid(); updateHUD(); checkGameOver();
    alert('✨ Sapujagat aktif! Baris paling bawah berhasil dibersihkan.');
  }
}

function openTopup() { document.getElementById('topup-modal').classList.add('active'); }
function closeTopup() { document.getElementById('topup-modal').classList.remove('active'); }

function buyCoins(itemName, price, amount) {
  MidtransPay.checkout({
    itemName: itemName,
    price: price,
    onSuccess: function() {
      coins += amount;
      localStorage.setItem('block_coins', coins);
      updateHUD();
      closeTopup();
      alert(`🎉 Topup Berhasil! +${amount} Koin telah ditambahkan ke akun Anda.`);
    }
  });
}
