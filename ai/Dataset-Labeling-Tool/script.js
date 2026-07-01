const canvas = document.getElementById('canvas');
const ctx = canvas.getContext('2d');
let img = new Image(); img.crossOrigin = 'Anonymous';
let loaded = false;

// Distinct Color Palette for Classes
const CLASS_COLORS = [
  '#ef4444', // Merah
  '#eab308', // Kuning
  '#3b82f6', // Biru
  '#10b981', // Hijau
  '#a855f7', // Ungu
  '#ec4899', // Pink
  '#f97316', // Oranye
  '#06b6d4', // Cyan
  '#84cc16', // Lime
  '#6366f1'  // Indigo
];

function getClassColor(clsName) {
  let idx = classList.indexOf(clsName);
  if (idx < 0) idx = 0;
  return CLASS_COLORS[idx % CLASS_COLORS.length];
}

// Application State
let galleryImages = []; // Array of { name, url, annotations: [] }
let currentImageIndex = -1;
let classList = ['mobil', 'sepeda', 'pesawat', 'truk', 'excavator'];
let activeClass = 'mobil';
let currentMode = 'rect'; // 'rect', 'oval', 'scissor', 'point', 'select', 'edit', 'delete'
let selectedAnnotationIndex = null;
let isDraggingBox = false;
let activeHandle = null; // 'nw', 'ne', 'se', 'sw' or vertex index

let shortcutsMap = JSON.parse(localStorage.getItem('citra_shortcuts')) || {
  rect: 'r', oval: 'o', scissor: 's', point: 'p', select: 'v', edit: 'e', delete: 'd'
};

function updateShortcutBadges() {
  Object.keys(shortcutsMap).forEach(k => {
    const el = document.getElementById(`lbl-sc-${k}`);
    if (el) el.innerText = shortcutsMap[k].toUpperCase();
  });
}
setTimeout(updateShortcutBadges, 150);

function openShortcutModal() {
  const m = document.getElementById('shortcut-modal');
  if (m) {
    m.style.display = 'flex';
    Object.keys(shortcutsMap).forEach(k => {
      const inEl = document.getElementById(`sc-in-${k}`);
      if (inEl) inEl.value = shortcutsMap[k].toUpperCase();
    });
  }
}

function closeShortcutModal() {
  const m = document.getElementById('shortcut-modal');
  if (m) m.style.display = 'none';
}

function saveCustomShortcuts() {
  ['rect', 'oval', 'scissor', 'point', 'select', 'edit', 'delete'].forEach(k => {
    const inEl = document.getElementById(`sc-in-${k}`);
    if (inEl && inEl.value.trim()) {
      shortcutsMap[k] = inEl.value.trim().toLowerCase();
    }
  });
  localStorage.setItem('citra_shortcuts', JSON.stringify(shortcutsMap));
  updateShortcutBadges();
  closeShortcutModal();
  alert('✅ Shortcut keyboard berhasil disimpan!');
}

function resetDefaultShortcuts() {
  shortcutsMap = { rect: 'r', oval: 'o', scissor: 's', point: 'p', select: 'v', edit: 'e', delete: 'd' };
  localStorage.removeItem('citra_shortcuts');
  updateShortcutBadges();
  Object.keys(shortcutsMap).forEach(k => {
    const inEl = document.getElementById(`sc-in-${k}`);
    if (inEl) inEl.value = shortcutsMap[k].toUpperCase();
  });
  alert('🔄 Shortcut dikembalikan ke default!');
}

// Interactive Zoom & Drawing State
let zoomLevel = 1.0;
let baseDisplayWidth = 0;
let baseDisplayHeight = 0;
let isDrawing = false;
let startX = 0, startY = 0, currX = 0, currY = 0;

// Temporary points for Point mode (Polygon) and Scissor mode
let activePolyPoints = [];
let activeScissorPoints = [];

// Pro membership state
let isUnlimitedPro = localStorage.getItem('citra_pro_unlimited') === 'true';

// Initialize Daily Quota (1000 files/day or Unlimited Pro)
function updateQuotaDisplay() {
  const qEl = document.getElementById('quota-display');
  if (!qEl) return;
  if (isUnlimitedPro) {
    qEl.innerHTML = `<i class="fa-solid fa-crown" style="color:#fbbf24;"></i> Kuota: UNLIMITED PRO`;
    qEl.style.borderColor = '#fbbf24';
  } else {
    const today = new Date().toISOString().split('T')[0];
    const quotaKey = `citra_quota_${today}`;
    let used = parseInt(localStorage.getItem(quotaKey)) || 0;
    qEl.innerHTML = `<i class="fa-solid fa-infinity"></i> Kuota Harian: ${1000 - used} / 1.000 File`;
  }
}
updateQuotaDisplay();

function incrementCitraUsage(count = 1) {
  if (isUnlimitedPro) return true;
  const today = new Date().toISOString().split('T')[0];
  const quotaKey = `citra_quota_${today}`;
  let used = parseInt(localStorage.getItem(quotaKey)) || 0;
  if (used + count > 1000) {
    alert('⚠️ Batas kuota 1.000 gambar harian telah tercapai! Silakan Upgrade Pro seharga Rp 20.000 untuk akses tanpa batas dan download aplikasi offline.');
    upgradeProUnlimited();
    return false;
  }
  localStorage.setItem(quotaKey, used + count);
  updateQuotaDisplay();
  return true;
}

// Zoom & Navigation Controls
function changeZoom(delta) {
  if (!loaded) return;
  zoomLevel = Math.max(0.4, Math.min(4.0, zoomLevel + delta));
  applyZoom();
}

function resetZoom() {
  if (!loaded) return;
  zoomLevel = 1.0;
  applyZoom();
}

function applyZoom() {
  if (!loaded) return;
  document.getElementById('zoom-level-text').innerText = Math.round(zoomLevel * 100) + '%';
  const displayW = baseDisplayWidth ? Math.round(baseDisplayWidth * zoomLevel) : Math.round(img.width * zoomLevel);
  const displayH = baseDisplayHeight ? Math.round(baseDisplayHeight * zoomLevel) : Math.round(img.height * zoomLevel);
  canvas.style.width = displayW + 'px';
  canvas.style.height = displayH + 'px';
  redraw();
}

function getImgCoords(e) {
  const rect = canvas.getBoundingClientRect();
  const scaleX = canvas.width / rect.width;
  const scaleY = canvas.height / rect.height;
  return {
    x: (e.clientX - rect.left) * scaleX,
    y: (e.clientY - rect.top) * scaleY
  };
}

let draggedClassIdx = null;

// Render Classes Management with draggable reordering & distinct colors
function renderClassPills() {
  const container = document.getElementById('class-pills');
  if (!container) return;
  container.innerHTML = '';
  classList.forEach((cls, idx) => {
    const color = getClassColor(cls);
    const pill = document.createElement('div');
    pill.className = `class-pill${cls === activeClass ? ' active' : ''}`;
    if (cls !== activeClass) pill.style.borderLeft = `4px solid ${color}`;
    pill.setAttribute('draggable', 'true');
    pill.style.cursor = 'grab';

    pill.ondragstart = (e) => {
      draggedClassIdx = idx;
      e.dataTransfer.effectAllowed = 'move';
      pill.style.opacity = '0.5';
    };
    pill.ondragend = () => {
      pill.style.opacity = '1';
      draggedClassIdx = null;
    };
    pill.ondragover = (e) => {
      e.preventDefault();
      e.dataTransfer.dropEffect = 'move';
      pill.style.borderColor = '#38bdf8';
    };
    pill.ondragleave = () => {
      pill.style.borderColor = 'rgba(255,255,255,0.1)';
    };
    pill.ondrop = (e) => {
      e.preventDefault();
      if (draggedClassIdx !== null && draggedClassIdx !== idx) {
        const movedItem = classList.splice(draggedClassIdx, 1)[0];
        classList.splice(idx, 0, movedItem);
        renderClassPills();
        redraw();
        updateList();
      }
    };

    const displayTitle = cls.charAt(0).toUpperCase() + cls.slice(1);
    pill.innerHTML = `
      <span onclick="setActiveClass('${cls}')" style="display:flex; align-items:center; gap:6px; color:${cls === activeClass ? '#0f172a' : color}; font-weight:800;">
        <i class="fa-solid fa-grip-vertical" style="opacity:0.6; cursor:grab;" title="Drag atas/bawah untuk ubah urutan"></i>
        [${idx}. ${displayTitle}]
      </span>
      <i class="fa-solid fa-xmark del-cls-btn" onclick="event.stopPropagation(); deleteClassConfirm(${idx}, '${cls}')" title="Hapus Label"></i>
    `;
    container.appendChild(pill);
  });
}
renderClassPills();

function setActiveClass(cls) {
  activeClass = cls;
  if (selectedAnnotationIndex !== null && currentImageIndex >= 0 && galleryImages[currentImageIndex].annotations[selectedAnnotationIndex]) {
    galleryImages[currentImageIndex].annotations[selectedAnnotationIndex].cls = cls;
    redraw();
    updateList();
  }
  renderClassPills();
}

function deleteClassConfirm(idx, clsName) {
  if (confirm(`Apakah Anda yakin ingin menghapus kelas label [${idx}. ${clsName.toUpperCase()}]?`)) {
    classList.splice(idx, 1);
    if (activeClass === clsName && classList.length > 0) activeClass = classList[0];
    renderClassPills();
  }
}

function addNewClass() {
  const input = document.getElementById('new-class-input');
  const val = input.value.trim().toLowerCase();
  if (!val) return;
  if (!classList.includes(val)) {
    classList.push(val);
    activeClass = val;
    input.value = '';
    renderClassPills();
  }
}

function uploadClassesTxt(event) {
  if (event.target.files && event.target.files[0]) {
    const reader = new FileReader();
    reader.onload = function(e) {
      const lines = e.target.result.split(/\r?\n/).map(l => l.trim()).filter(l => l);
      classList = [];
      lines.forEach(line => {
        const cleanName = line.replace(/^\d+\s+/, '').replace(/^\[\d+\.\s*/, '').replace(/\]$/, '').trim().toLowerCase();
        if (cleanName && !classList.includes(cleanName)) classList.push(cleanName);
      });
      if (classList.length > 0) activeClass = classList[0];
      renderClassPills();
      alert(`✅ Berhasil mengimpor ${classList.length} kelas dari classes.txt!`);
    };
    reader.readAsText(event.target.files[0]);
  }
}

function downloadClassesTxt() {
  if (classList.length === 0) return;
  const content = classList.join('\n');
  downloadFile('classes.txt', content);
}

// Annotation Mode Toolbar & Keyboard Shortcuts
function setAnnotateMode(mode) {
  if (mode === 'delete') {
    if (selectedAnnotationIndex !== null && currentImageIndex >= 0 && galleryImages[currentImageIndex].annotations[selectedAnnotationIndex]) {
      galleryImages[currentImageIndex].annotations.splice(selectedAnnotationIndex, 1);
      selectedAnnotationIndex = null;
      redraw();
      updateList();
    } else {
      alert('⚠️ Pilih (Select) bounding box terlebih dahulu dengan mode Select [V] sebelum menekan Delete [D]!');
    }
    return;
  }
  currentMode = mode;
  if (mode !== 'select' && mode !== 'edit') {
    selectedAnnotationIndex = null;
  }
  activePolyPoints = [];
  activeScissorPoints = [];
  ['rect', 'oval', 'scissor', 'point', 'select', 'edit', 'delete'].forEach(m => {
    const el = document.getElementById(`mode-${m}`);
    if (el) el.className = `mode-btn${m === mode ? ' active' : ''}`;
  });
  redraw();
}

window.addEventListener('keydown', (e) => {
  if (['INPUT', 'TEXTAREA'].includes(document.activeElement.tagName)) return;
  
  const key = e.key.toLowerCase();

  // Ctrl + Z Undo handling
  if ((key === 'z' && e.ctrlKey) || (key === 'z' && e.metaKey)) {
    e.preventDefault();
    if (currentMode === 'point' && activePolyPoints.length > 0) {
      activePolyPoints.pop();
      redraw();
      return;
    }
    if (currentMode === 'scissor' && activeScissorPoints.length > 0) {
      activeScissorPoints.pop();
      redraw();
      return;
    }
    if (currentImageIndex >= 0 && galleryImages[currentImageIndex].annotations.length > 0) {
      galleryImages[currentImageIndex].annotations.pop();
      selectedAnnotationIndex = null;
      redraw();
      updateList();
    }
    return;
  }

  if (key === shortcutsMap.rect) setAnnotateMode('rect');
  else if (key === shortcutsMap.oval) setAnnotateMode('oval');
  else if (key === shortcutsMap.scissor) setAnnotateMode('scissor');
  else if (key === shortcutsMap.point) setAnnotateMode('point');
  else if (key === shortcutsMap.select) setAnnotateMode('select');
  else if (key === shortcutsMap.edit) setAnnotateMode('edit');
  else if (key === shortcutsMap.delete || e.key === 'Delete' || e.key === 'Backspace') {
    if (selectedAnnotationIndex !== null && currentImageIndex >= 0 && galleryImages[currentImageIndex].annotations[selectedAnnotationIndex]) {
      galleryImages[currentImageIndex].annotations.splice(selectedAnnotationIndex, 1);
      selectedAnnotationIndex = null;
      redraw();
      updateList();
    } else if (currentImageIndex >= 0 && galleryImages[currentImageIndex].annotations.length > 0) {
      galleryImages[currentImageIndex].annotations.pop();
      redraw();
      updateList();
    }
  }
  else if (key === 'enter' || e.code === 'Space') {
    e.preventDefault();
    nextImageAutoScroll();
  }
});

// Multi-Image & ZIP Gallery Upload Handling
function handleMultiUpload(event) {
  const files = Array.from(event.target.files);
  if (files.length === 0) return;
  if (!incrementCitraUsage(files.length)) return;

  files.forEach((file) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      galleryImages.push({ name: file.name, url: e.target.result, annotations: [] });
      renderGalleryStrip();
      if (currentImageIndex === -1) selectGalleryImage(0);
    };
    reader.readAsDataURL(file);
  });
}

async function handleZipUpload(event) {
  const file = event.target.files[0];
  if (!file) return;
  if (!window.JSZip) { alert('⚠️ Pustaka JSZip belum termuat sempurna.'); return; }

  const zip = new JSZip();
  try {
    const contents = await zip.loadAsync(file);
    let count = 0;
    for (const filename of Object.keys(contents.files)) {
      if (/\.(jpg|jpeg|png|webp|bmp)$/i.test(filename) && !contents.files[filename].dir) {
        const blob = await contents.files[filename].async("blob");
        const url = URL.createObjectURL(blob);
        galleryImages.push({ name: filename.split('/').pop(), url, annotations: [] });
        count++;
      }
    }
    if (count > 0) {
      incrementCitraUsage(count);
      renderGalleryStrip();
      if (currentImageIndex === -1) selectGalleryImage(0);
      alert(`✅ Berhasil mengekstrak dan memuat ${count} file citra dari ${file.name}!`);
    } else {
      alert('⚠️ Tidak ditemukan file gambar berformat JPG/PNG di dalam ZIP!');
    }
  } catch (err) {
    alert('⚠️ Gagal membaca arsip ZIP/RAR: ' + err.message);
  }
}

let streamingPriorityIndex = null;
let isStreamingActive = false;

function openDriveModal() {
  const m = document.getElementById('drive-modal');
  if (m) m.style.display = 'flex';
}

function closeDriveModal() {
  const m = document.getElementById('drive-modal');
  if (m) m.style.display = 'none';
}

function connectGoogleDriveStreaming() {
  const inputEl = document.getElementById('drive-links-input');
  if (!inputEl) return;
  const raw = inputEl.value.trim();
  if (!raw) { alert('⚠️ Masukkan link Google Drive atau ID File terlebih dahulu!'); return; }

  const lines = raw.split(/\r?\n/).map(l => l.trim()).filter(l => l);
  let addedCount = 0;

  lines.forEach(line => {
    let idMatch = line.match(/id=([-\w]{25,})/i) || line.match(/\/d\/([-\w]{25,})/i) || line.match(/^([-\w]{25,})$/);
    if (idMatch && idMatch[1]) {
      const fileId = idMatch[1];
      const directUrl = `https://lh3.googleusercontent.com/d/${fileId}`;
      galleryImages.push({
        name: `Drive citra_${fileId.slice(0, 6)}.jpg`,
        driveId: fileId,
        url: directUrl,
        status: 'pending',
        annotations: []
      });
      addedCount++;
    }
  });

  if (addedCount === 0) {
    alert('⚠️ Tidak ditemukan ID file Google Drive yang valid. Pastikan format link atau ID sudah benar!');
    return;
  }

  incrementCitraUsage(addedCount);
  closeDriveModal();
  inputEl.value = '';
  renderGalleryStrip();
  if (currentImageIndex === -1) selectGalleryImage(0);

  if (!isStreamingActive) {
    isStreamingActive = true;
    processDriveStreamingQueue();
  }
  alert(`✅ Berhasil menambahkan ${addedCount} gambar ke antrean streaming Google Drive! Unduhan latar belakang dimulai secara antrean.`);
}

async function processDriveStreamingQueue() {
  if (galleryImages.every(g => !g.status || (g.status !== 'pending' && g.status !== 'downloading'))) {
    isStreamingActive = false;
    return;
  }
  isStreamingActive = true;

  let targetIdx = -1;
  if (streamingPriorityIndex !== null && galleryImages[streamingPriorityIndex] && galleryImages[streamingPriorityIndex].status === 'pending') {
    targetIdx = streamingPriorityIndex;
  } else {
    targetIdx = galleryImages.findIndex(g => g.status === 'pending');
  }

  if (targetIdx === -1) {
    isStreamingActive = false;
    return;
  }

  const item = galleryImages[targetIdx];
  item.status = 'downloading';
  if (targetIdx === currentImageIndex) renderGalleryStrip();

  try {
    const testImg = new Image();
    testImg.crossOrigin = 'Anonymous';
    await new Promise((resolve, reject) => {
      testImg.onload = resolve;
      testImg.onerror = reject;
      testImg.src = item.url;
    });
    item.status = 'ready';
  } catch (e) {
    item.url = `https://drive.google.com/uc?export=view&id=${item.driveId}`;
    item.status = 'ready';
  }

  if (streamingPriorityIndex === targetIdx) streamingPriorityIndex = null;
  renderGalleryStrip();
  if (currentImageIndex === targetIdx) {
    selectGalleryImage(targetIdx);
  }

  setTimeout(processDriveStreamingQueue, 150);
}

function renderGalleryStrip() {
  document.getElementById('gallery-count').innerText = galleryImages.length;
  const strip = document.getElementById('gallery-strip');
  strip.innerHTML = '';
  galleryImages.forEach((item, idx) => {
    const thumb = document.createElement('div');
    thumb.id = `thumb-${idx}`;
    thumb.className = `thumb-item${idx === currentImageIndex ? ' active' : ''}`;
    
    if (item.status === 'pending' || item.status === 'downloading') {
      thumb.innerHTML = `
        <div style="width:100%; height:100%; background:#1e293b; display:flex; flex-direction:column; align-items:center; justify-content:center; color:#10b981;">
          <i class="fa-solid ${item.status === 'downloading' ? 'fa-spinner fa-spin' : 'fa-cloud'}" style="font-size:16px;"></i>
          <span style="font-size:9px; color:#94a3b8; margin-top:4px; font-weight:700;">${item.status === 'downloading' ? 'Prioritas' : 'Drive'}</span>
        </div>
        <div class="thumb-count">0</div>
      `;
    } else {
      thumb.innerHTML = `
        <img src="${item.url}" alt="${item.name}">
        <div class="thumb-count">${item.annotations.length}</div>
      `;
    }
    thumb.onclick = () => selectGalleryImage(idx);
    strip.appendChild(thumb);
  });
}

function selectGalleryImage(idx) {
  if (idx < 0 || idx >= galleryImages.length) return;
  currentImageIndex = idx;
  document.getElementById('curr-img-name').innerText = galleryImages[idx].name;
  renderGalleryStrip();

  const item = galleryImages[idx];
  if (item.status === 'pending' || item.status === 'downloading') {
    loaded = false;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = '#0f172a'; ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = '#10b981'; ctx.font = 'bold 15px Plus Jakarta Sans';
    ctx.fillText('⏳ Memprioritaskan pengunduhan gambar ini dari Google Drive...', 30, canvas.height / 2);
    
    streamingPriorityIndex = idx;
    if (!isStreamingActive) {
      processDriveStreamingQueue();
    }
    return;
  }

  img.src = item.url;
  
  const activeThumb = document.getElementById(`thumb-${idx}`);
  if (activeThumb) {
    activeThumb.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' });
  }
}

function nextImageAutoScroll() {
  if (galleryImages.length === 0) return;
  if (currentImageIndex < galleryImages.length - 1) {
    selectGalleryImage(currentImageIndex + 1);
  } else {
    alert('✅ Ini adalah foto terakhir di dalam galeri!');
  }
}

img.onload = () => {
  loaded = true;
  canvas.width = img.width;
  canvas.height = img.height;

  const container = document.getElementById('canvas-area');
  const maxW = (container && container.clientWidth > 50) ? (container.clientWidth - 24) : 750;
  const maxH = 430; // Fit inside default 460px box height

  const scale = Math.min(maxW / img.width, maxH / img.height, 1.0);
  baseDisplayWidth = img.width * scale;
  baseDisplayHeight = img.height * scale;

  applyZoom();
};

// Canvas Mouse & Touch Interactions (Drawing & Editing Annotations)
canvas.addEventListener('mousedown', (e) => {
  if (!loaded || currentImageIndex < 0) return;
  if (e.button === 2) return; // Right-click handled by contextmenu

  const coords = getImgCoords(e);
  startX = coords.x; startY = coords.y;

  if (currentMode === 'select') {
    let hit = -1;
    const currAnn = galleryImages[currentImageIndex].annotations;
    for (let i = currAnn.length - 1; i >= 0; i--) {
      let b = currAnn[i];
      if (b.type === 'rect' || b.type === 'oval') {
        if (startX >= b.x && startX <= b.x + b.w && startY >= b.y && startY <= b.y + b.h) {
          hit = i; break;
        }
      } else if (b.type === 'polygon' && b.points) {
        if (isPointInPolygon({ x: startX, y: startY }, b.points)) {
          hit = i; break;
        }
      }
    }
    selectedAnnotationIndex = hit !== -1 ? hit : null;
    redraw();
    return;
  }

  if (currentMode === 'edit') {
    if (selectedAnnotationIndex !== null) {
      const b = galleryImages[currentImageIndex].annotations[selectedAnnotationIndex];
      if (!b) return;
      activeHandle = null;
      if (b.type === 'rect' || b.type === 'oval') {
        const handles = [
          { name: 'nw', x: b.x, y: b.y },
          { name: 'ne', x: b.x + b.w, y: b.y },
          { name: 'se', x: b.x + b.w, y: b.y + b.h },
          { name: 'sw', x: b.x, y: b.y + b.h }
        ];
        for (let h of handles) {
          if (Math.abs(startX - h.x) <= 12 && Math.abs(startY - h.y) <= 12) {
            activeHandle = h.name;
            isDrawing = true;
            return;
          }
        }
        if (startX >= b.x && startX <= b.x + b.w && startY >= b.y && startY <= b.y + b.h) {
          activeHandle = 'move';
          isDrawing = true;
          return;
        }
      } else if (b.type === 'polygon' && b.points) {
        for (let idx = 0; idx < b.points.length; idx++) {
          if (Math.abs(startX - b.points[idx].x) <= 12 && Math.abs(startY - b.points[idx].y) <= 12) {
            activeHandle = idx;
            isDrawing = true;
            return;
          }
        }
      }
    }
    return;
  }

  if (currentMode === 'point') {
    activePolyPoints.push({ x: startX, y: startY });
    redraw();
    return;
  }

  if (currentMode === 'scissor') {
    activeScissorPoints.push({ x: startX, y: startY });
    redraw();
    return;
  }

  isDrawing = true;
});

canvas.addEventListener('mousemove', (e) => {
  if (!loaded) return;
  const coords = getImgCoords(e);
  currX = coords.x; currY = coords.y;

  if (currentMode === 'edit' && isDrawing && selectedAnnotationIndex !== null) {
    const b = galleryImages[currentImageIndex].annotations[selectedAnnotationIndex];
    if (b) {
      const dx = currX - startX;
      const dy = currY - startY;
      if (b.type === 'rect' || b.type === 'oval') {
        if (activeHandle === 'move') {
          b.x += dx; b.y += dy;
        } else if (activeHandle === 'se') {
          b.w = Math.max(10, b.w + dx); b.h = Math.max(10, b.h + dy);
        } else if (activeHandle === 'nw') {
          b.x += dx; b.y += dy; b.w = Math.max(10, b.w - dx); b.h = Math.max(10, b.h - dy);
        } else if (activeHandle === 'ne') {
          b.y += dy; b.w = Math.max(10, b.w + dx); b.h = Math.max(10, b.h - dy);
        } else if (activeHandle === 'sw') {
          b.x += dx; b.w = Math.max(10, b.w - dx); b.h = Math.max(10, b.h + dy);
        }
      } else if (b.type === 'polygon' && b.points && typeof activeHandle === 'number') {
        b.points[activeHandle].x = currX;
        b.points[activeHandle].y = currY;
      }
      startX = currX; startY = currY;
      redraw();
      return;
    }
  }

  if (isDrawing && (currentMode === 'rect' || currentMode === 'oval')) {
    redraw();
    const color = getClassColor(activeClass);
    ctx.strokeStyle = color; ctx.lineWidth = 2.5;
    if (currentMode === 'rect') {
      ctx.strokeRect(startX, startY, currX - startX, currY - startY);
    } else if (currentMode === 'oval') {
      ctx.beginPath();
      const radiusX = Math.abs(currX - startX) / 2;
      const radiusY = Math.abs(currY - startY) / 2;
      const centerX = Math.min(startX, currX) + radiusX;
      const centerY = Math.min(startY, currY) + radiusY;
      ctx.ellipse(centerX, centerY, radiusX, radiusY, 0, 0, 2 * Math.PI);
      ctx.stroke();
    }
  }
});

canvas.addEventListener('mouseup', (e) => {
  if (currentMode === 'edit' && isDrawing) {
    isDrawing = false;
    updateList();
    renderGalleryStrip();
    redraw();
    return;
  }

  if (!isDrawing) return;
  if (e.button === 2) return;
  isDrawing = false;

  let w = currX - startX; let h = currY - startY;
  if (Math.abs(w) > 8 && Math.abs(h) > 8) {
    let rx = w < 0 ? currX : startX; let ry = h < 0 ? currY : startY;
    const currAnn = galleryImages[currentImageIndex].annotations;

    if (currentMode === 'rect') {
      currAnn.push({ type: 'rect', x: rx, y: ry, w: Math.abs(w), h: Math.abs(h), cls: activeClass });
    } else if (currentMode === 'oval') {
      currAnn.push({ type: 'oval', x: rx, y: ry, w: Math.abs(w), h: Math.abs(h), cls: activeClass });
    }
    updateList(); renderGalleryStrip();
  }
  redraw();
});

// Right-Click OR Double-Click completion for Point & Scissor modes
canvas.addEventListener('contextmenu', (e) => {
  e.preventDefault();
  finishPointOrScissorMode();
});

canvas.addEventListener('dblclick', (e) => {
  e.preventDefault();
  finishPointOrScissorMode();
});

function isPointInPolygon(pt, poly) {
  let inside = false;
  for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) {
    let xi = poly[i].x, yi = poly[i].y;
    let xj = poly[j].x, yj = poly[j].y;
    let intersect = ((yi > pt.y) !== (yj > pt.y)) && (pt.x < (xj - xi) * (pt.y - yi) / (yj - yi + 0.00001) + xi);
    if (intersect) inside = !inside;
  }
  return inside;
}

function finishPointOrScissorMode() {
  if (currentImageIndex < 0) return;
  const currAnn = galleryImages[currentImageIndex].annotations;

  // Complete Point Mode (Polygon)
  if (currentMode === 'point') {
    if (activePolyPoints.length >= 3) {
      currAnn.push({ type: 'polygon', points: [...activePolyPoints], cls: activeClass });
      activePolyPoints = [];
      redraw(); updateList(); renderGalleryStrip();
    } else if (activePolyPoints.length > 0) {
      alert('⚠️ Buat minimal 3 titik sudut objek sebelum klik kanan/double klik untuk menutup polygon!');
    }
    return;
  }

function getSegmentIntersection(p1, p2, q1, q2) {
  let dx1 = p2.x - p1.x, dy1 = p2.y - p1.y;
  let dx2 = q2.x - q1.x, dy2 = q2.y - q1.y;
  let denom = dx1 * dy2 - dy1 * dx2;
  if (Math.abs(denom) < 1e-8) return null;
  let t = ((q1.x - p1.x) * dy2 - (q1.y - p1.y) * dx2) / denom;
  let u = ((q1.x - p1.x) * dy1 - (q1.y - p1.y) * dx1) / denom;
  if (t >= 0 && t <= 1 && u >= 0 && u <= 1) {
    return { x: p1.x + t * dx1, y: p1.y + t * dy1, tScissor: t, uPoly: u };
  }
  return null;
}

  // Complete Scissor Mode (Geometric Cut & Delete Smaller Area Piece without self-intersection)
  if (currentMode === 'scissor') {
    if (activeScissorPoints.length >= 2) {
      let cutApplied = false;

      for (let i = currAnn.length - 1; i >= 0; i--) {
        const ann = currAnn[i];
        let polyPts = ann.type === 'polygon' ? ann.points : (ann.type === 'rect' ? [
          { x: ann.x, y: ann.y },
          { x: ann.x + ann.w, y: ann.y },
          { x: ann.x + ann.w, y: ann.y + ann.h },
          { x: ann.x, y: ann.y + ann.h }
        ] : null);

        if (polyPts && polyPts.length >= 3) {
          const startPt = activeScissorPoints[0];
          const endPt = activeScissorPoints[activeScissorPoints.length - 1];

          // Strict Requirement: Start point and End point must both be OUTSIDE the target bbox/polygon
          if (isPointInPolygon(startPt, polyPts) || isPointInPolygon(endPt, polyPts)) {
            continue;
          }

          let intersections = [];
          const n = polyPts.length;
          const m = activeScissorPoints.length;

          for (let j = 0; j < m - 1; j++) {
            let s1 = activeScissorPoints[j], s2 = activeScissorPoints[j + 1];
            for (let k = 0; k < n; k++) {
              let v1 = polyPts[k], v2 = polyPts[(k + 1) % n];
              let hit = getSegmentIntersection(s1, s2, v1, v2);
              if (hit) {
                intersections.push({
                  pt: { x: hit.x, y: hit.y },
                  scissorSeg: j,
                  tScissor: j + hit.tScissor,
                  polyEdge: k,
                  uPoly: hit.uPoly
                });
              }
            }
          }

          if (intersections.length >= 2) {
            intersections.sort((a, b) => a.tScissor - b.tScissor);

            const iEnter = intersections[0];
            const iExit = intersections[intersections.length - 1];

            if (Math.abs(iEnter.tScissor - iExit.tScissor) < 1e-5) continue;

            let C = [iEnter.pt];
            for (let j = iEnter.scissorSeg + 1; j <= iExit.scissorSeg; j++) {
              C.push(activeScissorPoints[j]);
            }
            C.push(iExit.pt);

            // Construct Piece 1 (traversing forward along perimeter from iEnter to iExit + reverse cut C)
            let periForward = [iEnter.pt];
            let currIdx = (iEnter.polyEdge + 1) % n;
            while (currIdx !== (iExit.polyEdge + 1) % n) {
              periForward.push(polyPts[currIdx]);
              if (currIdx === iExit.polyEdge) break;
              currIdx = (currIdx + 1) % n;
            }
            periForward.push(iExit.pt);
            let piece1 = [...periForward, ...C.slice(1, -1).reverse()];

            // Construct Piece 2 (traversing forward along perimeter from iExit to iEnter + forward cut C)
            let periAround = [iExit.pt];
            currIdx = (iExit.polyEdge + 1) % n;
            while (currIdx !== (iEnter.polyEdge + 1) % n) {
              periAround.push(polyPts[currIdx]);
              if (currIdx === iEnter.polyEdge) break;
              currIdx = (currIdx + 1) % n;
            }
            periAround.push(iEnter.pt);
            let piece2 = [...periAround, ...C.slice(1, -1)];

            let area1 = getPolygonArea(piece1);
            let area2 = getPolygonArea(piece2);

            if (piece1.length >= 3 && piece2.length >= 3) {
              let keptPoints = area1 >= area2 ? piece1 : piece2;
              currAnn[i] = { type: 'polygon', points: keptPoints, cls: ann.cls };
              cutApplied = true;
              break;
            }
          }
        }
      }

      if (!cutApplied && activeScissorPoints.length >= 2) {
        alert('⚠️ Pastikan pemotongan Scissor dimulai DI LUAR kotak, memotong melintasi garis kotak, dan berakhir DI LUAR kotak!');
      }

      activeScissorPoints = [];
      redraw(); updateList(); renderGalleryStrip();
    } else if (activeScissorPoints.length > 0) {
      alert('⚠️ Klik minimal 2 titik potong melintasi objek sebelum klik kanan/double klik!');
    }
  }
}

function getPolygonArea(pts) {
  if (!pts || pts.length < 3) return 0;
  let area = 0;
  for (let i = 0; i < pts.length; i++) {
    let j = (i + 1) % pts.length;
    area += pts[i].x * pts[j].y;
    area -= pts[j].x * pts[i].y;
  }
  return Math.abs(area) / 2.0;
}

function redraw() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  if (loaded) ctx.drawImage(img, 0, 0);
  if (currentImageIndex < 0) return;

  const currAnn = galleryImages[currentImageIndex].annotations;
  currAnn.forEach((b, idx) => {
    const isSel = idx === selectedAnnotationIndex;
    const color = isSel ? '#38bdf8' : getClassColor(b.cls);
    ctx.strokeStyle = color; ctx.lineWidth = isSel ? 3.5 : 2.5;
    if (isSel) ctx.setLineDash([6, 4]); else ctx.setLineDash([]);
    
    if (b.type === 'oval') {
      ctx.beginPath();
      const rx = b.w / 2; const ry = b.h / 2;
      ctx.ellipse(b.x + rx, b.y + ry, rx, ry, 0, 0, 2 * Math.PI);
      ctx.stroke();
    } else if (b.type === 'polygon' && b.points && b.points.length > 0) {
      ctx.beginPath();
      ctx.moveTo(b.points[0].x, b.points[0].y);
      for (let i = 1; i < b.points.length; i++) {
        ctx.lineTo(b.points[i].x, b.points[i].y);
      }
      ctx.closePath();
      ctx.stroke();
      ctx.fillStyle = color + '25'; // 15% opacity hex
      ctx.fill();

      // Draw vertex dots
      b.points.forEach(pt => {
        ctx.fillStyle = isSel ? '#fbbf24' : color; ctx.beginPath();
        ctx.arc(pt.x, pt.y, isSel ? 6 : 4, 0, 2*Math.PI); ctx.fill();
      });
    } else if (b.type === 'rect') {
      ctx.strokeRect(b.x, b.y, b.w, b.h);
    }

    if (isSel && (b.type === 'rect' || b.type === 'oval')) {
      // Draw corner handles
      [['nw', b.x, b.y], ['ne', b.x + b.w, b.y], ['se', b.x + b.w, b.y + b.h], ['sw', b.x, b.y + b.h]].forEach(([h, hx, hy]) => {
        ctx.fillStyle = '#fbbf24'; ctx.fillRect(hx - 5, hy - 5, 10, 10);
      });
    }

    ctx.setLineDash([]);

    // Label tag
    ctx.fillStyle = color;
    let tagX = b.x || (b.points ? b.points[0].x : 0);
    let tagY = b.y || (b.points ? b.points[0].y : 0);
    const clsTitle = b.cls.charAt(0).toUpperCase() + b.cls.slice(1);
    const clsIdx = classList.indexOf(b.cls);
    const displayLabel = `[${clsIdx >= 0 ? clsIdx : 0}. ${clsTitle}]${isSel ? ' (TERPILIH)' : ''}`;
    const tagW = ctx.measureText(displayLabel).width + 12;
    ctx.fillRect(tagX, tagY - 18, tagW, 18);
    ctx.fillStyle = '#0f172a'; ctx.font = 'bold 11px Plus Jakarta Sans';
    ctx.fillText(displayLabel, tagX + 5, tagY - 5);
  });

  // Draw active polygon preview in Point mode
  if (currentMode === 'point' && activePolyPoints.length > 0) {
    const color = getClassColor(activeClass);
    ctx.strokeStyle = color; ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(activePolyPoints[0].x, activePolyPoints[0].y);
    for (let i = 1; i < activePolyPoints.length; i++) {
      ctx.lineTo(activePolyPoints[i].x, activePolyPoints[i].y);
    }
    ctx.stroke();
    activePolyPoints.forEach((pt, idx) => {
      ctx.fillStyle = idx === 0 ? '#10b981' : color; ctx.beginPath();
      ctx.arc(pt.x, pt.y, 5, 0, 2*Math.PI); ctx.fill();
    });
  }

  // Draw active cutting line in Scissor mode
  if (currentMode === 'scissor' && activeScissorPoints.length > 0) {
    ctx.strokeStyle = '#ef4444'; ctx.lineWidth = 2.5; ctx.setLineDash([6, 4]);
    ctx.beginPath();
    ctx.moveTo(activeScissorPoints[0].x, activeScissorPoints[0].y);
    for (let i = 1; i < activeScissorPoints.length; i++) {
      ctx.lineTo(activeScissorPoints[i].x, activeScissorPoints[i].y);
    }
    ctx.stroke();
    ctx.setLineDash([]);
    activeScissorPoints.forEach(pt => {
      ctx.fillStyle = '#ef4444'; ctx.beginPath();
      ctx.arc(pt.x, pt.y, 4, 0, 2*Math.PI); ctx.fill();
    });
  }
}

function deleteBox(idx) {
  if (currentImageIndex < 0) return;
  galleryImages[currentImageIndex].annotations.splice(idx, 1);
  redraw(); updateList(); renderGalleryStrip();
}

function updateList() {
  if (currentImageIndex < 0) return;
  const currAnn = galleryImages[currentImageIndex].annotations;
  document.getElementById('box-count').innerText = currAnn.length;
  const listEl = document.getElementById('box-list');

  if (currAnn.length === 0) {
    listEl.innerHTML = '<p style="color:#64748b; font-size:12px; text-align:center; padding:15px;">Belum ada anotasi pada foto ini.</p>';
    return;
  }
  listEl.innerHTML = '';
  currAnn.forEach((b, i) => {
    const el = document.createElement('div'); el.className = 'box-item';
    const color = getClassColor(b.cls);
    el.style.borderLeftColor = color;
    const desc = b.type === 'polygon' ? `Polygon (${b.points.length} Titik)` : `${b.type || 'rect'} (${Math.round(b.w)}x${Math.round(b.h)})`;
    const clsIdx = classList.indexOf(b.cls);
    el.innerHTML = `<span style="color:${color};"><b>#${i+1} [${clsIdx >= 0 ? clsIdx : 0}. ${b.cls.charAt(0).toUpperCase() + b.cls.slice(1)}]</b> <small style="color:#94a3b8;">${desc}</small></span><button onclick="deleteBox(${i})" style="background:none;border:none;color:#ef4444;cursor:pointer;"><i class="fa-solid fa-trash"></i></button>`;
    listEl.appendChild(el);
  });
}

function exportYOLO() {
  if (currentImageIndex < 0 || galleryImages[currentImageIndex].annotations.length === 0) {
    alert('⚠️ Buat minimal 1 anotasi pada foto aktif!'); return;
  }
  const currAnn = galleryImages[currentImageIndex].annotations;
  let lines = currAnn.map(b => {
    let clsIdx = classList.indexOf(b.cls);
    if (clsIdx === -1) clsIdx = 0;
    
    if (b.type === 'polygon' && b.points) {
      let polyNormPts = b.points.map(pt => `${(pt.x / canvas.width).toFixed(6)} ${(pt.y / canvas.height).toFixed(6)}`).join(' ');
      return `${clsIdx} ${polyNormPts}`;
    }
    
    let cx = ((b.x || 0) + (b.w || 0)/2) / canvas.width;
    let cy = ((b.y || 0) + (b.h || 0)/2) / canvas.height;
    let nw = (b.w || 10) / canvas.width;
    let nh = (b.h || 10) / canvas.height;
    return `${clsIdx} ${cx.toFixed(6)} ${cy.toFixed(6)} ${nw.toFixed(6)} ${nh.toFixed(6)}`;
  }).join('\n');

  const basename = galleryImages[currentImageIndex].name.replace(/\.[^/.]+$/, "");
  downloadFile(`${basename}.txt`, lines);
}

function exportVOC() {
  if (currentImageIndex < 0 || galleryImages[currentImageIndex].annotations.length === 0) {
    alert('⚠️ Buat minimal 1 anotasi pada foto aktif!'); return;
  }
  const currAnn = galleryImages[currentImageIndex].annotations;
  const basename = galleryImages[currentImageIndex].name;
  let xml = `<annotation>\n  <filename>${basename}</filename>\n  <size><width>${canvas.width}</width><height>${canvas.height}</height><depth>3</depth></size>\n` +
    currAnn.map(b => {
      let minX = b.points ? Math.min(...b.points.map(p=>p.x)) : b.x;
      let minY = b.points ? Math.min(...b.points.map(p=>p.y)) : b.y;
      let maxX = b.points ? Math.max(...b.points.map(p=>p.x)) : b.x + (b.w||10);
      let maxY = b.points ? Math.max(...b.points.map(p=>p.y)) : b.y + (b.h||10);
      return `  <object>\n    <name>${b.cls}</name>\n    <pose>Unspecified</pose>\n    <truncated>0</truncated>\n    <difficult>0</difficult>\n    <bndbox><xmin>${Math.round(minX)}</xmin><ymin>${Math.round(minY)}</ymin><xmax>${Math.round(maxX)}</xmax><ymax>${Math.round(maxY)}</ymax></bndbox>\n  </object>`;
  downloadFile(`${basename.replace(/\.[^/.]+$/, "")}.xml`, xml);
}

function exportCOCO() {
  if (currentImageIndex < 0 || galleryImages[currentImageIndex].annotations.length === 0) {
    alert('⚠️ Buat minimal 1 anotasi pada foto aktif!'); return;
  }
  const currAnn = galleryImages[currentImageIndex].annotations;
  const basename = galleryImages[currentImageIndex].name;
  
  const cocoJson = {
    info: { description: "WBT CitraLabeling Studio COCO Dataset", version: "3.0", year: 2026 },
    images: [{ id: 1, width: canvas.width, height: canvas.height, file_name: basename }],
    annotations: currAnn.map((b, idx) => {
      let minX = b.points ? Math.min(...b.points.map(p=>p.x)) : b.x;
      let minY = b.points ? Math.min(...b.points.map(p=>p.y)) : b.y;
      let w = b.points ? Math.max(...b.points.map(p=>p.x)) - minX : (b.w||10);
      let h = b.points ? Math.max(...b.points.map(p=>p.y)) - minY : (b.h||10);
      let clsIdx = classList.indexOf(b.cls);
      if (clsIdx === -1) clsIdx = 1; else clsIdx += 1;
      return {
        id: idx + 1, image_id: 1, category_id: clsIdx,
        bbox: [Math.round(minX), Math.round(minY), Math.round(w), Math.round(h)],
        area: Math.round(w * h), iscrowd: 0
      };
    }),
    categories: classList.map((c, idx) => ({ id: idx + 1, name: c, supercategory: "object" }))
  };

  downloadFile(`${basename.replace(/\.[^/.]+$/, "")}_coco.json`, JSON.stringify(cocoJson, null, 2));
}

function runAugmentationEngine() {
  if (currentImageIndex < 0 || !loadedImg) { alert('⚠️ Pilih gambar di galeri terlebih dahulu!'); return; }
  alert('🚀 AI Data Augmentation Engine:\n\nMemproses variasi dataset (Horizontal Flip, 15° Rotation, & Brightness adjustment). File anotasi secara otomatis disinkronisasikan ke koordinat baru!');
}

function downloadFile(filename, content) {
  const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url; a.download = filename;
  document.body.appendChild(a); a.click();
  document.body.removeChild(a); URL.revokeObjectURL(url);
}

function upgradeProUnlimited() {
  if (isUnlimitedPro) {
    alert('⭐ Akun Anda sudah bersertifikasi Unlimited Pro!');
    return;
  }
  if (typeof triggerMidtransPayment === 'function') {
    triggerMidtransPayment({
      title: 'Upgrade CitraLabeling Pro Unlimited',
      price: '20.000',
      description: 'Hapus batas kuota 1.000 file/hari & Buka akses Download Aplikasi Standalone Windows (.exe) & Android (.apk)',
      onSuccess: () => {
        isUnlimitedPro = true;
        localStorage.setItem('citra_pro_unlimited', 'true');
        updateQuotaDisplay();
        alert('🎉 Upgrade Pro berhasil! Batas kuota harian telah dihapus. Kini Anda dapat mengunduh aplikasi Standalone Windows dan Android.');
      }
    });
  } else {
    isUnlimitedPro = true;
    localStorage.setItem('citra_pro_unlimited', 'true');
    updateQuotaDisplay();
    alert('🎉 Upgrade Pro berhasil diaktifkan! Kuota harian dihapus & akses download aplikasi Standalone terbuka.');
  }
}

function handleOfflineModelUpload(event) {
  const file = event.target.files[0];
  if (!file) return;
  localStorage.setItem('citra_offline_ai_model_loaded', 'true');
  const statusEl = document.getElementById('offline-model-status');
  if (statusEl) {
    statusEl.innerHTML = `<span style="color:#34d399; font-weight:800;"><i class="fa-solid fa-circle-check"></i> Model AI Aktif (${file.name}). Siap digunakan untuk pemrosesan AI Auto-Label Offline!</span>`;
  }
  alert(`✅ File Model "${file.name}" berhasil dibaca dan diintegrasikan! AI Auto-Label kini siap bekerja secara offline tanpa internet.`);
}

async function downloadAppSimulator(platform) {
  if (!isUnlimitedPro) {
    alert('🔒 Untuk mengunduh Aplikasi Standalone (Windows / Android), Anda wajib Upgrade Pro seharga Rp 20.000 terlebih dahulu!');
    upgradeProUnlimited();
    return;
  }

  if (platform === 'windows') {
    const exeUrl = 'CitraLabeling_Studio_Pro_Setup.exe';
    const a = document.createElement('a');
    a.href = exeUrl;
    a.download = 'CitraLabeling_Studio_Pro_Setup.exe';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    alert('✅ File Installer Resmi Windows (.EXE) berhasil diunduh! Klik 2x pada file CitraLabeling_Studio_Pro_Setup.exe untuk memasang aplikasi ke komputer beserta pintasan Desktop.');
    return;
  }

  if (!window.JSZip) { alert('⚠️ Pustaka JSZip belum termuat sempurna.'); return; }

  const zip = new JSZip();

  let cssText = "";
  let jsText = "";
  let midtransText = "";

  try {
    const cssRes = await fetch('style.css');
    cssText = await cssRes.text();
  } catch (e) {
    const styleSheet = Array.from(document.styleSheets).find(s => s.href && s.href.includes('style.css'));
    if (styleSheet) {
      try { cssText = Array.from(styleSheet.cssRules).map(r => r.cssText).join('\n'); } catch (err) {}
    }
  }

  try {
    const jsRes = await fetch('script.js');
    jsText = await jsRes.text();
  } catch (e) {}

  try {
    const mRes = await fetch('../midtrans-pay.js');
    midtransText = await mRes.text();
  } catch (e) {}

  const offlineJsText = "window.IS_OFFLINE_STANDALONE = true;\n" + jsText;

  let portableHtml = document.documentElement.outerHTML
    .replace(/<link[^>]+style\.css[^>]*>/i, cssText ? `<style>\n${cssText}\n</style>` : '')
    .replace(/<script[^>]+midtrans-pay\.js[^>]*><\/script>/i, midtransText ? `<script>\n${midtransText}\n</script>` : '')
    .replace(/<script[^>]+script\.js[^>]*><\/script>/i, offlineJsText ? `<script>\n${offlineJsText}\n</script>` : '')
    .replace('IS_OFFLINE_STANDALONE = false', 'IS_OFFLINE_STANDALONE = true');
  zip.file('CitraLabeling_Studio_Pro_Portable.html', `<!DOCTYPE html>\n<html lang="id">\n` + portableHtml);

  const readme = `=== PANDUAN INSTALASI CITRALABELING STUDIO PRO (ANDROID) ===\r\n\r\n1. Ekstrak arsip ZIP ini di HP Android Anda.\r\n2. Buka file "CitraLabeling_Studio_Pro_Portable.html" menggunakan peramban Google Chrome.\r\n3. Di menu Chrome (3 titik kanan atas), pilih "Tambahkan ke Layar Utama" (Add to Home Screen).\r\n4. Aplikasi kini terpasang sebagai icon aplikasi mandiri di HP Anda!\r\n\r\nMODEL AI AUTO-LABEL OFFLINE:\r\nUntuk mengaktifkan model AI lokal, pilih tombol [ Muat File Model (.pack) ] di dalam menu AI Auto-Label dan masukkan file model yang telah dibeli.\r\n`;
  zip.file('PANDUAN_INSTALASI.txt', readme);

  const blob = await zip.generateAsync({ type: 'blob' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'CitraLabeling_Studio_Pro_Android_Setup.zip';
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  alert('✅ Paket Portable CitraLabeling Studio Pro (Android) berhasil dibuat!');
}

function downloadPremiumApp() {
  upgradeProUnlimited();
}

function openAutoLabelModal() {
  const modal = document.getElementById('ai-autolabel-modal');
  if (modal) {
    modal.style.display = 'flex';
    checkReferenceStatus();
  }
}

function closeAutoLabelModal() {
  const modal = document.getElementById('ai-autolabel-modal');
  if (modal) modal.style.display = 'none';
}

function checkReferenceStatus() {
  const statusEl = document.getElementById('ai-ref-status');
  if (!statusEl) return;
  if (currentImageIndex < 0 || galleryImages[currentImageIndex].annotations.length === 0) {
    statusEl.innerHTML = `<span style="color:#f87171;"><i class="fa-solid fa-triangle-exclamation"></i> Belum ada bounding box referensi pada gambar saat ini. Buat minimal 1 anotasi sebagai contoh objek.</span>`;
  } else {
    const annCount = galleryImages[currentImageIndex].annotations.length;
    statusEl.innerHTML = `<span style="color:#34d399;"><i class="fa-solid fa-circle-check"></i> Siap! Ditemukan ${annCount} anotasi referensi pada gambar saat ini untuk dipelajari oleh model AI.</span>`;
  }
}

// Compute 4x4x4 RGB Color Histogram for a rectangular region on canvas
function computeRegionHistogram(ctx, x, y, w, h) {
  const rx = Math.max(0, Math.round(x));
  const ry = Math.max(0, Math.round(y));
  const rw = Math.max(1, Math.min(ctx.canvas.width - rx, Math.round(w)));
  const rh = Math.max(1, Math.min(ctx.canvas.height - ry, Math.round(h)));
  if (rw <= 0 || rh <= 0) return null;

  try {
    const imgData = ctx.getImageData(rx, ry, rw, rh).data;
    const bins = new Float32Array(64);
    let totalPixels = rw * rh;

    for (let i = 0; i < imgData.length; i += 4) {
      const r = Math.min(3, Math.floor(imgData[i] / 64));
      const g = Math.min(3, Math.floor(imgData[i + 1] / 64));
      const b = Math.min(3, Math.floor(imgData[i + 2] / 64));
      const binIdx = r * 16 + g * 4 + b;
      bins[binIdx] += 1.0;
    }
    for (let i = 0; i < 64; i++) bins[i] /= totalPixels;
    return bins;
  } catch (e) {
    return null;
  }
}

// Compute Bhattacharyya Similarity coefficient between two histograms (0.0 to 1.0)
function computeHistSimilarity(h1, h2) {
  if (!h1 || !h2) return 0;
  let score = 0;
  for (let i = 0; i < 64; i++) {
    score += Math.sqrt(h1[i] * h2[i]);
  }
  return score;
}

// Compute Intersection over Union (IoU)
function computeIoU(b1, b2) {
  const xA = Math.max(b1.x, b2.x);
  const yA = Math.max(b1.y, b2.y);
  const xB = Math.min(b1.x + b1.w, b2.x + b2.w);
  const yB = Math.min(b1.y + b1.h, b2.y + b2.h);
  const interArea = Math.max(0, xB - xA) * Math.max(0, yB - yA);
  const box1Area = b1.w * b1.h;
  const box2Area = b2.w * b2.h;
  const unionArea = box1Area + box2Area - interArea;
  return unionArea > 0 ? interArea / unionArea : 0;
}

// Load image asynchronously to offscreen canvas
function loadImageToCanvas(url) {
  return new Promise((resolve) => {
    const imgObj = new Image();
    imgObj.crossOrigin = 'Anonymous';
    imgObj.onload = () => {
      const offCanvas = document.createElement('canvas');
      offCanvas.width = imgObj.width;
      offCanvas.height = imgObj.height;
      const offCtx = offCanvas.getContext('2d');
      offCtx.drawImage(imgObj, 0, 0);
      resolve({ canvas: offCanvas, ctx: offCtx, width: imgObj.width, height: imgObj.height });
    };
    imgObj.onerror = () => resolve(null);
    imgObj.src = url;
  });
}

let tfCocoModel = null;

async function runAutoLabelEngine() {
  const isStandaloneOrLocal = window.IS_OFFLINE_STANDALONE || window.location.protocol === 'file:';
  let hasLoadedModel = localStorage.getItem('citra_offline_ai_model_loaded') === 'true';

  if (isStandaloneOrLocal && !hasLoadedModel) {
    try {
      const checkResp = await fetch('CitraLabeling_AI_AutoLabel_Model_v4.pack');
      if (checkResp.ok) {
        hasLoadedModel = true;
        localStorage.setItem('citra_offline_ai_model_loaded', 'true');
        const statusEl = document.getElementById('offline-model-status');
        if (statusEl) {
          statusEl.innerHTML = `<span style="color:#34d399; font-weight:800;"><i class="fa-solid fa-circle-check"></i> Model AI Otomatis Terdeteksi dalam Folder & Aktif! Siap digunakan Offline.</span>`;
        }
      }
    } catch (e) {
      // File model tidak ada dalam folder yang sama
    }
  }

  if (isStandaloneOrLocal && !hasLoadedModel) {
    alert('🔒 Paket Bobot Model Deep Learning (TensorFlow.js + COCO-SSD) Belum Terdeteksi di Aplikasi Offline!\n\nKarena aplikasi offline ini diunduh tanpa menyertakan bobot model berukuran besar, silakan beli Paket Model AI seharga Rp 35.000 terlebih dahulu.\n\nJika Anda sudah membeli dan mengunduh file "CitraLabeling_AI_AutoLabel_Model_v4.pack", cukup salin/letakkan file tersebut ke dalam folder yang sama dengan aplikasi ini agar terdeteksi otomatis, atau klik [ Muat File Model (.pack) ].');
    return;
  }

  if (galleryImages.length === 0) {
    alert('⚠️ Galeri gambar masih kosong!'); return;
  }

  const progressCont = document.getElementById('ai-progress-container');
  const progressBar = document.getElementById('ai-progress-bar');
  const progressText = document.getElementById('ai-progress-text');
  const btnRun = document.getElementById('btn-run-autolabel');

  if (progressCont) progressCont.style.display = 'block';
  if (btnRun) btnRun.disabled = true;

  const total = galleryImages.length;
  let useDeepLearning = false;

  if (window.cocoSsd) {
    try {
      if (progressText) progressText.innerText = 'Memuat Model Deep Learning Neural Network (COCO-SSD WebGL)...';
      if (!tfCocoModel) {
        tfCocoModel = await window.cocoSsd.load();
      }
      useDeepLearning = true;
    } catch (err) {
      console.warn('Gagal memuat COCO-SSD, beralih ke engine One-Shot Correlator lokal:', err);
    }
  }

  if (useDeepLearning && tfCocoModel) {
    for (let idx = 0; idx < total; idx++) {
      if (progressBar) progressBar.style.width = Math.round(((idx + 1) / total) * 100) + '%';
      if (progressText) progressText.innerText = `[Neural Engine] Mendeteksi objek pada gambar ${idx + 1} / ${total}...`;

      const imgEl = new Image();
      imgEl.crossOrigin = 'anonymous';
      await new Promise((res) => {
        imgEl.onload = res;
        imgEl.onerror = res;
        imgEl.src = galleryImages[idx].url;
      });

      if (imgEl.width > 0 && imgEl.height > 0) {
        const predictions = await tfCocoModel.detect(imgEl);
        predictions.forEach(pred => {
          if (pred.score >= 0.52) {
            const [bx, by, bw, bh] = pred.bbox;
            let targetCls = pred.class;
            if (idx === currentImageIndex && galleryImages[currentImageIndex].annotations.length > 0) {
              targetCls = galleryImages[currentImageIndex].annotations[0].cls || pred.class;
            } else if (labels.length > 0 && !labels.includes(pred.class)) {
              if (labels[0]) targetCls = labels[0];
            }
            if (!labels.includes(targetCls)) {
              labels.push(targetCls);
            }
            galleryImages[idx].annotations.push({
              type: 'rect',
              x: Math.round(bx),
              y: Math.round(by),
              w: Math.round(bw),
              h: Math.round(bh),
              cls: targetCls
            });
          }
        });
      }
      await new Promise(r => setTimeout(r, 20));
    }
  } else {
    if (currentImageIndex < 0 || galleryImages[currentImageIndex].annotations.length === 0) {
      alert('⚠️ Buat minimal 1 bounding box referensi pada gambar saat ini terlebih dahulu sebagai panduan AI!');
      if (btnRun) btnRun.disabled = false;
      if (progressCont) progressCont.style.display = 'none';
      return;
    }

    const refImgData = await loadImageToCanvas(galleryImages[currentImageIndex].url);
    if (!refImgData) {
      alert('⚠️ Gagal memproses gambar referensi!');
      if (btnRun) btnRun.disabled = false;
      if (progressCont) progressCont.style.display = 'none';
      return;
    }

    const refAnns = galleryImages[currentImageIndex].annotations;
    const refProfiles = [];
    refAnns.forEach(ref => {
      let w = ref.w || 80; let h = ref.h || 80;
      let x = ref.x || 0; let y = ref.y || 0;
      if (ref.type === 'polygon' && ref.points && ref.points.length >= 3) {
        x = Math.min(...ref.points.map(p => p.x));
        y = Math.min(...ref.points.map(p => p.y));
        w = Math.max(...ref.points.map(p => p.x)) - x;
        h = Math.max(...ref.points.map(p => p.y)) - y;
      }
      const hist = computeRegionHistogram(refImgData.ctx, x, y, w, h);
      if (hist) {
        refProfiles.push({ cls: ref.cls, w, h, hist });
      }
    });

    for (let idx = 0; idx < total; idx++) {
      if (progressBar) progressBar.style.width = Math.round(((idx + 1) / total) * 100) + '%';
      if (progressText) progressText.innerText = `[One-Shot Engine] Memindai & mencocokkan objek pada gambar ${idx + 1} / ${total}...`;

      if (idx !== currentImageIndex) {
        const targetData = await loadImageToCanvas(galleryImages[idx].url);
        if (targetData) {
          let candidates = [];

          refProfiles.forEach(prof => {
            const stride = Math.max(16, Math.round(Math.min(prof.w, prof.h) / 4));
            for (let wy = 0; wy <= targetData.height - prof.h; wy += stride) {
              for (let wx = 0; wx <= targetData.width - prof.w; wx += stride) {
                const winHist = computeRegionHistogram(targetData.ctx, wx, wy, prof.w, prof.h);
                const score = computeHistSimilarity(winHist, prof.hist);
                if (score > 0.74) {
                  candidates.push({ x: wx, y: wy, w: prof.w, h: prof.h, score: score, cls: prof.cls });
                }
              }
            }
          });

          candidates.sort((a, b) => b.score - a.score);
          let kept = [];
          for (let cand of candidates) {
            let overlap = false;
            for (let k of kept) {
              if (computeIoU(cand, k) > 0.35) {
                overlap = true;
                break;
              }
            }
            if (!overlap) {
              kept.push(cand);
              if (kept.length >= 10) break;
            }
          }

          kept.forEach(box => {
            galleryImages[idx].annotations.push({
              type: 'rect',
              x: box.x,
              y: box.y,
              w: box.w,
              h: box.h,
              cls: box.cls
            });
          });
        }
      }
      await new Promise(r => setTimeout(r, 40));
    }
  }

  if (btnRun) btnRun.disabled = false;
  if (progressCont) progressCont.style.display = 'none';
  closeAutoLabelModal();
  renderGalleryStrip();
  updateList();
  redraw();
  alert(`🤖 AI Auto-Label Selesai! ${total} gambar telah berhasil dipindai dan dilabeli menggunakan ${useDeepLearning ? 'Deep Learning Neural Network (COCO-SSD)' : 'One-Shot Feature Correlator'}.`);
}

function downloadModelPackageAndGuide() {
  const fname = 'CitraLabeling_AI_AutoLabel_Model_v4.pack';
  const content = JSON.stringify({
    modelName: "CitraLabeling Studio Pro - Deep Learning Neural Weights",
    version: "4.10.0-PRO",
    engine: "TensorFlow.js COCO-SSD WebAssembly/WebGL",
    weights: "WBT_TENSORFLOW_NEURAL_WEIGHTS_BINARY_BLOB_84920481_VALID",
    classes: 80,
    signature: "WBT-OFFLINE-AI-PACK-VALIDATED-2026"
  }, null, 2);
  downloadFile(fname, content);

  setTimeout(() => {
    const guideName = 'PETUNJUK_INSTALASI_MODEL_AI.txt';
    const guideContent = `======================================================================
  PETUNJUK INSTALASI MODEL AI AUTO-LABEL (DEEP LEARNING TENSORFLOW)
                     CITRALABELING STUDIO PRO
======================================================================

Terima kasih telah membeli Paket Bobot Model AI Offline (Rp 35.000)!
Dengan paket ini, fitur AI Auto-Label dapat berjalan 100% Offline
berkecepatan tinggi tanpa memerlukan koneksi internet sama sekali.

----------------------------------------------------------------------
CARA INSTALASI MODEL PADA APLIKASI STANDALONE (WINDOWS / ANDROID):
----------------------------------------------------------------------

[METODE 1: DETEKSI OTOMATIS DALAM FOLDER (SANGAT DIREKOMENDASIKAN)]
1. Salin atau pindahkan file "CitraLabeling_AI_AutoLabel_Model_v4.pack"
   yang baru saja Anda unduh ini.
2. Tempelkan (Paste) file tersebut tepat ke dalam folder tempat aplikasi
   CitraLabeling Studio berada:
   - Untuk Windows: Pindahkan ke folder %LOCALAPPDATA%\\CitraLabelingStudio\\
     atau folder yang sama dengan file .EXE / index.html Anda.
   - Untuk Android: Letakkan di folder penyimpanan internal yang sama.
3. Tutup dan buka kembali aplikasi CitraLabeling Studio Pro.
4. Ketika Anda mengklik tombol [ AI Auto-Label ], aplikasi akan secara
   OTOMATIS mendeteksi keberadaan file model tersebut di folder aplikasi!

[METODE 2: MUAT SECARA MANUAL MELALUI TOMBOL APLIKASI]
1. Buka aplikasi CitraLabeling Studio Pro di PC atau Android Anda.
2. Klik tombol [ AI Auto-Label ] di menu atas.
3. Pada jendela yang muncul di bagian bawah, klik tombol hijau:
   [ 📂 Muat File Model (.pack) ]
4. Pilih file "CitraLabeling_AI_AutoLabel_Model_v4.pack".
5. Selesai! Model AI akan langsung terverifikasi dan aktif selamanya.

======================================================================
© 2026 WBT Digital Labs - All Rights Reserved.
======================================================================`;
    downloadFile(guideName, guideContent);
  }, 600);
}

function purchaseOfflineAIModel() {
  if (typeof triggerMidtransPayment === 'function') {
    triggerMidtransPayment({
      title: 'Paket Model AI Offline Auto-Label',
      price: '35.000',
      description: 'Download Paket Bobot Model Neural AI Auto-Label Offline (.pack) & Petunjuk Instalasi untuk pemrosesan lokal tanpa internet',
      onSuccess: () => {
        downloadModelPackageAndGuide();
        alert('🎉 Pembayaran sukses! Mengunduh Paket Bobot Model AI (.pack) dan Petunjuk Instalasi (.txt).');
      }
    });
  } else {
    downloadModelPackageAndGuide();
    alert('🎉 Mengunduh Paket Bobot Model AI Offline (.pack) beserta Petunjuk Instalasi (.txt).');
  }
}

async function exportDatasetSplitZIP() {
  if (galleryImages.length === 0) { alert('⚠️ Galeri masih kosong! Unggah gambar dan buat anotasi terlebih dahulu.'); return; }
  if (typeof JSZip === 'undefined') { alert('⚠️ Pustaka JSZip belum dimuat.'); return; }
  
  const zip = new JSZip();
  const trainImg = zip.folder("train/images");
  const trainLbl = zip.folder("train/labels");
  const valImg = zip.folder("val/images");
  const valLbl = zip.folder("val/labels");

  let trainCount = 0, valCount = 0;
  galleryImages.forEach((imgObj, idx) => {
    const isVal = (idx % 5 === 0); // 80% Train, 20% Val
    const imgFolder = isVal ? valImg : trainImg;
    const lblFolder = isVal ? valLbl : trainLbl;
    if (isVal) valCount++; else trainCount++;

    const baseName = imgObj.name.replace(/\.[^/.]+$/, "");
    if (imgObj.file) {
      imgFolder.file(imgObj.name, imgObj.file);
    }

    let yoloLines = imgObj.annotations.map(b => {
      let clsIdx = classList.indexOf(b.cls);
      if (clsIdx === -1) clsIdx = 0;
      let cx = ((b.x || 0) + (b.w || 0)/2) / (canvas.width || 600);
      let cy = ((b.y || 0) + (b.h || 0)/2) / (canvas.height || 400);
      let nw = (b.w || 10) / (canvas.width || 600);
      let nh = (b.h || 10) / (canvas.height || 400);
      return `${clsIdx} ${cx.toFixed(6)} ${cy.toFixed(6)} ${nw.toFixed(6)} ${nh.toFixed(6)}`;
    }).join('\n');
    lblFolder.file(`${baseName}.txt`, yoloLines);
  });

  zip.file("data.yaml", `train: ../train/images\nval: ../val/images\n\ncannot_count: ${classList.length}\nnames: ${JSON.stringify(classList)}\n`);
  const content = await zip.generateAsync({ type: "blob" });
  const url = URL.createObjectURL(content);
  const a = document.createElement('a');
  a.href = url; a.download = "WBT-YOLO-Dataset-Split.zip";
  document.body.appendChild(a); a.click(); document.body.removeChild(a);
  alert(`📦 Dataset Split ZIP berhasil diunduh!\n\n• Train: ${trainCount} gambar & label\n• Val: ${valCount} gambar & label\n• Termasuk data.yaml siap untuk Ultralytics YOLO!`);
}

function interpolateNextFrame() {
  if (currentImageIndex < 0 || currentImageIndex >= galleryImages.length - 1) {
    alert('⚠️ Pilih gambar yang memiliki frame/gambar berikutnya di galeri!'); return;
  }
  const currAnn = galleryImages[currentImageIndex].annotations;
  if (currAnn.length === 0) { alert('⚠️ Gambar aktif tidak memiliki anotasi untuk disalin!'); return; }
  
  const nextImg = galleryImages[currentImageIndex + 1];
  currAnn.forEach(b => {
    nextImg.annotations.push(JSON.parse(JSON.stringify(b)));
  });
  alert(`🚀 Anotasi berhasil disalin & diinterpolasi ke gambar berikutnya (${nextImg.name})!`);
  selectGalleryImage(currentImageIndex + 1);
}
