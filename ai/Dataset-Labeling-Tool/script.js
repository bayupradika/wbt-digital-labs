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
let currentMode = 'rect'; // 'rect', 'oval', 'scissor', 'point'

// Interactive Zoom & Drawing State
let zoomLevel = 1.0;
let baseDisplayWidth = 0;
let baseDisplayHeight = 0;
let isDrawing = false;
let startX = 0, startY = 0, currX = 0, currY = 0;

// Temporary points for Point mode (Polygon) and Scissor mode
let activePolyPoints = [];
let activeScissorPoints = [];

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
    alert('⚠️ Batas kuota 1.000 gambar harian telah tercapai! Gunakan Aplikasi Premium untuk akses tanpa batas.');
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

// Render Classes Management with distinct colors
function renderClassPills() {
  const container = document.getElementById('class-pills');
  container.innerHTML = '';
  classList.forEach((cls, idx) => {
    const color = getClassColor(cls);
    const pill = document.createElement('div');
    pill.className = `class-pill${cls === activeClass ? ' active' : ''}`;
    if (cls !== activeClass) pill.style.borderLeft = `4px solid ${color}`;
    const displayTitle = cls.charAt(0).toUpperCase() + cls.slice(1);
    pill.innerHTML = `
      <span onclick="setActiveClass('${cls}')" style="color:${cls === activeClass ? '#0f172a' : color};">[${idx}. ${displayTitle}]</span>
      <i class="fa-solid fa-xmark del-cls-btn" onclick="event.stopPropagation(); deleteClassConfirm(${idx}, '${cls}')" title="Hapus Label"></i>
    `;
    container.appendChild(pill);
  });
}
renderClassPills();

function setActiveClass(cls) {
  activeClass = cls;
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
  currentMode = mode;
  activePolyPoints = [];
  activeScissorPoints = [];
  ['rect', 'oval', 'scissor', 'point'].forEach(m => {
    const el = document.getElementById(`mode-${m}`);
    if (el) el.className = `mode-btn${m === mode ? ' active' : ''}`;
  });
  redraw();
}

window.addEventListener('keydown', (e) => {
  if (['INPUT', 'TEXTAREA'].includes(document.activeElement.tagName)) return;
  
  const key = e.key.toLowerCase();
  if (key === 'r') setAnnotateMode('rect');
  else if (key === 'o' || key === 'c') setAnnotateMode('oval');
  else if (key === 's') setAnnotateMode('scissor');
  else if (key === 'p') setAnnotateMode('point');
  else if (key === 'enter' || e.code === 'Space') {
    e.preventDefault();
    nextImageAutoScroll();
  }
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
    { name: 'jalan_raya_01.jpg', url: 'https://images.unsplash.com/photo-1503376780353-7e6692767b70?auto=format&fit=crop&w=800&q=80', annotations: [] },
    { name: 'lalu_lintas_02.jpg', url: 'https://images.unsplash.com/photo-1449965408869-eaa3f722e40d?auto=format&fit=crop&w=800&q=80', annotations: [] }
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
    thumb.id = `thumb-${idx}`;
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
  
  // Auto-scroll selected thumbnail horizontally into center view
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

// Canvas Mouse & Touch Interactions (Drawing Annotations)
canvas.addEventListener('mousedown', (e) => {
  if (!loaded || currentImageIndex < 0) return;
  if (e.button === 2) return; // Right-click handled by contextmenu

  const coords = getImgCoords(e);
  startX = coords.x; startY = coords.y;

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

  // Complete Scissor Mode (Geometric Cut & Delete Smaller Area Piece)
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

          // Check if any scissor segment intersects polygon
          // Cut divides polygon vertices into two geometric half-planes relative to cut vector
          let cutVecX = endPt.x - startPt.x;
          let cutVecY = endPt.y - startPt.y;

          let leftSide = [];
          let rightSide = [];
          polyPts.forEach(pt => {
            let cross = cutVecX * (pt.y - startPt.y) - cutVecY * (pt.x - startPt.x);
            if (cross >= 0) leftSide.push(pt);
            else rightSide.push(pt);
          });

          // Form two closed candidate polygonal pieces bounded by the cut line
          let pieceA = [...leftSide, ...activeScissorPoints];
          let pieceB = [...rightSide, ...activeScissorPoints];

          let areaA = getPolygonArea(pieceA);
          let areaB = getPolygonArea(pieceB);

          // Keep the piece with LARGER area and delete smaller cut area!
          if (leftSide.length >= 1 && rightSide.length >= 1) {
            let keptPoints = areaA >= areaB ? pieceA : pieceB;
            currAnn[i] = { type: 'polygon', points: keptPoints, cls: ann.cls };
            cutApplied = true;
            break;
          }
        }
      }

      if (!cutApplied && activeScissorPoints.length >= 2) {
        // If start/end point was inside, guide user with prompt rule
        alert('⚠️ Syarat Mode Scissor: Titik awal klik dan titik akhir klik harus berada DI LUAR area bounding box yang dipotong!');
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
  currAnn.forEach((b) => {
    const color = getClassColor(b.cls);
    ctx.strokeStyle = color; ctx.lineWidth = 2.5;
    
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
        ctx.fillStyle = color; ctx.beginPath();
        ctx.arc(pt.x, pt.y, 4, 0, 2*Math.PI); ctx.fill();
      });
    } else if (b.type === 'rect') {
      ctx.strokeRect(b.x, b.y, b.w, b.h);
    }

    // Label tag
    ctx.fillStyle = color;
    let tagX = b.x || (b.points ? b.points[0].x : 0);
    let tagY = b.y || (b.points ? b.points[0].y : 0);
    const clsTitle = b.cls.charAt(0).toUpperCase() + b.cls.slice(1);
    const clsIdx = classList.indexOf(b.cls);
    const displayLabel = `[${clsIdx >= 0 ? clsIdx : 0}. ${clsTitle}]`;
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
    }).join('\n') + `\n</annotation>`;
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
  const fname = isWin ? 'CitraLabeling_Studio_Setup_v4.0.exe' : 'CitraLabeling_Studio_v4.0.apk';
  const content = `WBT CitraLabeling Studio Standalone Package (${platform.toUpperCase()})\nVersion 4.0 Pro\nBuild: 2026-07-01\n\nTo install on ${platform.toUpperCase()}, double click or install via package manager.`;
  downloadFile(fname, content);
}

function downloadPremiumApp() {
  const fname = 'CitraLabeling_Studio_Unlimited_Premium_Setup.exe';
  const content = `WBT CitraLabeling Studio Unlimited Premium Standalone Edition\nLicense: Unlimited (Offline Mode)\nNo 1,000 files/day limitation.\n\nReady for local deployment.`;
  downloadFile(fname, content);
  alert('⭐ Mengunduh Paket Instalasi CitraLabeling Premium Standalone (Tanpa Batasan Kuota)!');
}
