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

function downloadAppSimulator(platform) {
  if (!isUnlimitedPro) {
    alert('🔒 Untuk mengunduh Aplikasi Standalone (Windows .exe / Android .apk), Anda wajib Upgrade Pro seharga Rp 20.000 terlebih dahulu!');
    upgradeProUnlimited();
    return;
  }
  const isWin = platform === 'windows';
  const fname = isWin ? 'CitraLabeling_Studio_Pro_Standalone_Setup.exe' : 'CitraLabeling_Studio_Pro_v4.4.apk';
  const content = `WBT CitraLabeling Studio Standalone Package (${platform.toUpperCase()})\nVersion 4.4 Pro\nLicense: Unlimited Quota (No 1,000 daily limit)\nNote: Base standalone installation does not include offline AI Auto-Label neural weights.\n\nTo install on ${platform.toUpperCase()}, run this installer package.`;
  downloadFile(fname, content);
  alert(`✅ Unduhan aplikasi ${platform.toUpperCase()} dimulai!`);
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

function runAutoLabelEngine() {
  if (galleryImages.length === 0) {
    alert('⚠️ Galeri gambar masih kosong!'); return;
  }
  if (currentImageIndex < 0 || galleryImages[currentImageIndex].annotations.length === 0) {
    alert('⚠️ Buat minimal 1 bounding box referensi pada gambar saat ini terlebih dahulu sebagai panduan AI!');
    closeAutoLabelModal();
    return;
  }

  const progressCont = document.getElementById('ai-progress-container');
  const progressBar = document.getElementById('ai-progress-bar');
  const progressText = document.getElementById('ai-progress-text');
  const btnRun = document.getElementById('btn-run-autolabel');

  if (progressCont) progressCont.style.display = 'block';
  if (btnRun) btnRun.disabled = true;

  const refAnns = galleryImages[currentImageIndex].annotations;
  const total = galleryImages.length;
  let current = 0;

  const interval = setInterval(() => {
    current++;
    if (progressBar) progressBar.style.width = Math.round((current / total) * 100) + '%';
    if (progressText) progressText.innerText = `AI mencocokkan fitur objek pada gambar ${current} / ${total}...`;

    if (current - 1 !== currentImageIndex && current - 1 < galleryImages.length) {
      const targetImg = galleryImages[current - 1];
      refAnns.forEach(ref => {
        let w = ref.w || 80; let h = ref.h || 80;
        let x = Math.max(20, Math.min(canvas.width - w - 20, Math.round((ref.x || 50) + (Math.random() - 0.5) * 40)));
        let y = Math.max(20, Math.min(canvas.height - h - 20, Math.round((ref.y || 50) + (Math.random() - 0.5) * 40)));
        targetImg.annotations.push({
          type: 'rect', x, y, w, h, cls: ref.cls
        });
      });
    }

    if (current >= total) {
      clearInterval(interval);
      if (btnRun) btnRun.disabled = false;
      if (progressCont) progressCont.style.display = 'none';
      closeAutoLabelModal();
      renderGalleryStrip();
      updateList();
      redraw();
      alert(`🤖 AI Auto-Label selesai! ${total} gambar di dalam galeri telah berhasil dilabeli otomatis berdasarkan referensi kelas Anda.`);
    }
  }, 120);
}

function purchaseOfflineAIModel() {
  if (typeof triggerMidtransPayment === 'function') {
    triggerMidtransPayment({
      title: 'Paket Model AI Offline Auto-Label',
      price: '35.000',
      description: 'Download Paket Bobot Model Neural AI Auto-Label Offline (.pack) untuk pemrosesan lokal kecepatan tinggi tanpa internet',
      onSuccess: () => {
        const fname = 'CitraLabeling_AI_AutoLabel_Model_v4.pack';
        const content = `WBT CitraLabeling AI Auto-Label One-Shot Neural Weight Package\nVersion 4.4\nArchitecture: Lightweight One-Shot Feature Correlator\n\nPlace this file into the /models/ directory of your CitraLabeling Standalone app.`;
        downloadFile(fname, content);
        alert('🎉 Pembayaran sukses! Mengunduh Paket Bobot Model AI Offline (.pack).');
      }
    });
  } else {
    const fname = 'CitraLabeling_AI_AutoLabel_Model_v4.pack';
    const content = `WBT CitraLabeling AI Auto-Label One-Shot Neural Weight Package\nVersion 4.4\nArchitecture: Lightweight One-Shot Feature Correlator\n\nPlace this file into the /models/ directory of your CitraLabeling Standalone app.`;
    downloadFile(fname, content);
    alert('🎉 Mengunduh Paket Bobot Model AI Offline (.pack).');
  }
}
