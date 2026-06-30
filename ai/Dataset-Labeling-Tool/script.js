const canvas = document.getElementById('canvas');
const ctx = canvas.getContext('2d');
let img = new Image(); img.crossOrigin = 'Anonymous';
let loaded = false;

// Application State
let galleryImages = []; // Array of { name, url, annotations: [] }
let currentImageIndex = -1;
let classList = ['orang', 'mobil', 'motor', 'kucing', 'anjing'];
let activeClass = 'orang';
let currentMode = 'rect'; // 'rect', 'oval', 'scissor', 'point'

// Drawing State
let isDrawing = false;
let startX = 0, startY = 0, currX = 0, currY = 0;

// Initialize Daily Quota (1000 files/day)
function updateQuotaDisplay() {
  const today = new Date().toISOString().split('T')[0];
  const quotaKey = `citra_quota_${today}`;
  let used = parseInt(localStorage.getItem(quotaKey)) || 0;
  document.getElementById('quota-display').innerHTML = `<i class="fa-solid fa-infinity"></i> Kuota Harian: ${1000 - used} / 1.000 File`;
}
updateQuotaDisplay();

function incrementCitraUsage(count = 1) {
  const today = new Date().toISOString().split('T')[0];
  const quotaKey = `citra_quota_${today}`;
  let used = parseInt(localStorage.getItem(quotaKey)) || 0;
  if (used + count > 1000) {
    alert('⚠️ Batas kuota 1.000 gambar harian telah tercapai!');
    return false;
  }
  localStorage.setItem(quotaKey, used + count);
  updateQuotaDisplay();
  return true;
}

// Render Classes Management
function renderClassPills() {
  const container = document.getElementById('class-pills');
  container.innerHTML = '';
  classList.forEach(cls => {
    const pill = document.createElement('div');
    pill.className = `class-pill${cls === activeClass ? ' active' : ''}`;
    pill.innerHTML = `<i class="fa-solid fa-tag"></i> ${cls}`;
    pill.onclick = () => {
      activeClass = cls;
      renderClassPills();
    };
    container.appendChild(pill);
  });
}
renderClassPills();

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
        // Strip index prefix if formatted as "0 person"
        const cleanName = line.replace(/^\d+\s+/, '').trim().toLowerCase();
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
  currentMode = mode;
  ['rect', 'oval', 'scissor', 'point'].forEach(m => {
    const el = document.getElementById(`mode-${m}`);
    if (el) el.className = `mode-btn${m === mode ? ' active' : ''}`;
  });
}

window.addEventListener('keydown', (e) => {
  // Ignore shortcuts if user is typing in an input field
  if (['INPUT', 'TEXTAREA'].includes(document.activeElement.tagName)) return;
  
  const key = e.key.toLowerCase();
  if (key === 'r') setAnnotateMode('rect');
  else if (key === 'o' || key === 'c') setAnnotateMode('oval');
  else if (key === 's') setAnnotateMode('scissor');
  else if (key === 'p') setAnnotateMode('point');
  else if (e.key === 'Delete' || e.key === 'Backspace') {
    if (currentImageIndex >= 0 && galleryImages[currentImageIndex].annotations.length > 0) {
      galleryImages[currentImageIndex].annotations.pop();
      redraw();
      updateList();
    }
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

function loadSample() {
  galleryImages = [
    { name: 'sample_street_01.jpg', url: 'https://images.unsplash.com/photo-1503376780353-7e6692767b70?auto=format&fit=crop&w=700&q=80', annotations: [] },
    { name: 'sample_traffic_02.jpg', url: 'https://images.unsplash.com/photo-1449965408869-eaa3f722e40d?auto=format&fit=crop&w=700&q=80', annotations: [] }
  ];
  renderGalleryStrip();
  selectGalleryImage(0);
}

function renderGalleryStrip() {
  document.getElementById('gallery-count').innerText = galleryImages.length;
  const strip = document.getElementById('gallery-strip');
  strip.innerHTML = '';
  galleryImages.forEach((item, idx) => {
    const thumb = document.createElement('div');
    thumb.className = `thumb-item${idx === currentImageIndex ? ' active' : ''}`;
    thumb.innerHTML = `
      <img src="${item.url}" alt="${item.name}">
      <div class="thumb-count">${item.annotations.length}</div>
    `;
    thumb.onclick = () => selectGalleryImage(idx);
    strip.appendChild(thumb);
  });
}

function selectGalleryImage(idx) {
  if (idx < 0 || idx >= galleryImages.length) return;
  currentImageIndex = idx;
  document.getElementById('curr-img-name').innerText = galleryImages[idx].name;
  renderGalleryStrip();

  img.src = galleryImages[idx].url;
}

img.onload = () => {
  loaded = true;
  canvas.width = img.width;
  canvas.height = img.height;
  redraw();
  updateList();
};

// Canvas Mouse Interactions (Drawing Annotations)
canvas.addEventListener('mousedown', (e) => {
  if (!loaded || currentImageIndex < 0) return;
  const rect = canvas.getBoundingClientRect();
  const scaleX = canvas.width / rect.width;
  const scaleY = canvas.height / rect.height;
  startX = (e.clientX - rect.left) * scaleX;
  startY = (e.clientY - rect.top) * scaleY;

  if (currentMode === 'point') {
    // Add point annotation directly
    const currAnn = galleryImages[currentImageIndex].annotations;
    currAnn.push({ type: 'point', x: startX, y: startY, cls: activeClass });
    redraw(); updateList(); renderGalleryStrip();
    return;
  }

  if (currentMode === 'scissor') {
    // Check if clicked inside existing box to cut/remove it
    const currAnn = galleryImages[currentImageIndex].annotations;
    for (let i = currAnn.length - 1; i >= 0; i--) {
      const b = currAnn[i];
      if (b.type === 'rect' || !b.type) {
        if (startX >= b.x && startX <= b.x + b.w && startY >= b.y && startY <= b.y + b.h) {
          currAnn.splice(i, 1);
          redraw(); updateList(); renderGalleryStrip();
          return;
        }
      }
    }
  }

  isDrawing = true;
});

canvas.addEventListener('mousemove', (e) => {
  if (!isDrawing) return;
  const rect = canvas.getBoundingClientRect();
  const scaleX = canvas.width / rect.width;
  const scaleY = canvas.height / rect.height;
  currX = (e.clientX - rect.left) * scaleX;
  currY = (e.clientY - rect.top) * scaleY;

  redraw();
  ctx.strokeStyle = '#fbbf24'; ctx.lineWidth = 2.5;

  if (currentMode === 'rect' || currentMode === 'scissor') {
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
});

canvas.addEventListener('mouseup', () => {
  if (!isDrawing) return;
  isDrawing = false;
  let w = currX - startX; let h = currY - startY;

  if (Math.abs(w) > 8 && Math.abs(h) > 8) {
    let rx = w < 0 ? currX : startX; let ry = h < 0 ? currY : startY;
    const currAnn = galleryImages[currentImageIndex].annotations;

    if (currentMode === 'rect') {
      currAnn.push({ type: 'rect', x: rx, y: ry, w: Math.abs(w), h: Math.abs(h), cls: activeClass });
    } else if (currentMode === 'oval') {
      currAnn.push({ type: 'oval', x: rx, y: ry, w: Math.abs(w), h: Math.abs(h), cls: activeClass });
    } else if (currentMode === 'scissor') {
      // Slice existing boxes overlapping drag rect
      for (let i = currAnn.length - 1; i >= 0; i--) {
        const b = currAnn[i];
        if (rx < b.x + (b.w||0) && rx + Math.abs(w) > b.x && ry < b.y + (b.h||0) && ry + Math.abs(h) > b.y) {
          currAnn.splice(i, 1);
        }
      }
    }
    updateList(); renderGalleryStrip();
  }
  redraw();
});

function redraw() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  if (loaded) ctx.drawImage(img, 0, 0);
  if (currentImageIndex < 0) return;

  const currAnn = galleryImages[currentImageIndex].annotations;
  currAnn.forEach((b) => {
    ctx.strokeStyle = '#fbbf24'; ctx.lineWidth = 2.5;
    
    if (b.type === 'oval') {
      ctx.beginPath();
      const rx = b.w / 2; const ry = b.h / 2;
      ctx.ellipse(b.x + rx, b.y + ry, rx, ry, 0, 0, 2 * Math.PI);
      ctx.stroke();
    } else if (b.type === 'point') {
      ctx.fillStyle = '#ef4444';
      ctx.beginPath();
      ctx.arc(b.x, b.y, 6, 0, 2 * Math.PI);
      ctx.fill();
      ctx.strokeStyle = '#ffffff'; ctx.lineWidth = 1.5; ctx.stroke();
    } else {
      ctx.strokeRect(b.x, b.y, b.w, b.h);
    }

    // Label tag
    ctx.fillStyle = '#fbbf24';
    const tagW = ctx.measureText(b.cls).width + 12;
    ctx.fillRect(b.x, b.y - 18, tagW, 18);
    ctx.fillStyle = '#0f172a'; ctx.font = 'bold 11px Plus Jakarta Sans';
    ctx.fillText(b.cls, b.x + 5, b.y - 5);
  });
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
    const desc = b.type === 'point' ? `Point (${Math.round(b.x)}, ${Math.round(b.y)})` : `${b.type || 'rect'} (${Math.round(b.w)}x${Math.round(b.h)})`;
    el.innerHTML = `<span><b>#${i+1} ${b.cls}</b> <small style="color:#94a3b8;">${desc}</small></span><button onclick="deleteBox(${i})" style="background:none;border:none;color:#ef4444;cursor:pointer;"><i class="fa-solid fa-trash"></i></button>`;
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
    currAnn.map(b => `  <object>\n    <name>${b.cls}</name>\n    <pose>Unspecified</pose>\n    <truncated>0</truncated>\n    <difficult>0</difficult>\n    <bndbox><xmin>${Math.round(b.x)}</xmin><ymin>${Math.round(b.y)}</ymin><xmax>${Math.round(b.x+(b.w||10))}</xmax><ymax>${Math.round(b.y+(b.h||10))}</ymax></bndbox>\n  </object>`).join('\n') + `\n</annotation>`;
  downloadFile(`${basename.replace(/\.[^/.]+$/, "")}.xml`, xml);
}

function downloadFile(filename, content) {
  const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url; a.download = filename;
  document.body.appendChild(a); a.click();
  document.body.removeChild(a); URL.revokeObjectURL(url);
}

function downloadAppSimulator(platform) {
  const isWin = platform === 'windows';
  const fname = isWin ? 'CitraLabeling_Studio_Setup_v3.0.exe' : 'CitraLabeling_Studio_v3.0.apk';
  const content = `WBT CitraLabeling Studio Standalone Package (${platform.toUpperCase()})\nVersion 3.0 Pro\nBuild: 2026-06-30\n\nTo install on ${platform.toUpperCase()}, double click or install via package manager.`;
  downloadFile(fname, content);
}
