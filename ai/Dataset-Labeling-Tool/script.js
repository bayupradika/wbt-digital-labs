const canvas = document.getElementById('canvas');
const ctx = canvas.getContext('2d');
let img = new Image(); img.crossOrigin = 'Anonymous';
let loaded = false; let boxes = [];
let isDrawing = false; let startX = 0; let startY = 0; let currX = 0; let currY = 0;

document.getElementById('file-input').addEventListener('change', (e) => {
  if (e.target.files && e.target.files[0]) {
    const reader = new FileReader();
    reader.onload = (evt) => { img.src = evt.target.result; };
    reader.readAsDataURL(e.target.files[0]);
  }
});

function loadSample() {
  img.src = 'https://images.unsplash.com/photo-1503376780353-7e6692767b70?auto=format&fit=crop&w=600&q=80';
}

img.onload = () => {
  loaded = true; boxes = [];
  canvas.width = img.width; canvas.height = img.height;
  redraw(); updateList();
};

canvas.addEventListener('mousedown', (e) => {
  if (!loaded) return;
  const rect = canvas.getBoundingClientRect();
  const scaleX = canvas.width / rect.width; const scaleY = canvas.height / rect.height;
  startX = (e.clientX - rect.left) * scaleX; startY = (e.clientY - rect.top) * scaleY;
  isDrawing = true;
});

canvas.addEventListener('mousemove', (e) => {
  if (!isDrawing) return;
  const rect = canvas.getBoundingClientRect();
  const scaleX = canvas.width / rect.width; const scaleY = canvas.height / rect.height;
  currX = (e.clientX - rect.left) * scaleX; currY = (e.clientY - rect.top) * scaleY;
  redraw();
  ctx.strokeStyle = '#fbbf24'; ctx.lineWidth = 3;
  ctx.strokeRect(startX, startY, currX - startX, currY - startY);
});

canvas.addEventListener('mouseup', () => {
  if (!isDrawing) return;
  isDrawing = false;
  let w = currX - startX; let h = currY - startY;
  if (Math.abs(w) > 10 && Math.abs(h) > 10) {
    let rx = w < 0 ? currX : startX; let ry = h < 0 ? currY : startY;
    let cls = document.getElementById('class-name').value.trim() || 'obj';
    boxes.push({ x: rx, y: ry, w: Math.abs(w), h: Math.abs(h), cls: cls });
    updateList();
  }
  redraw();
});

function redraw() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  if (loaded) ctx.drawImage(img, 0, 0);
  boxes.forEach((b, i) => {
    ctx.strokeStyle = '#fbbf24'; ctx.lineWidth = 3;
    ctx.strokeRect(b.x, b.y, b.w, b.h);
    ctx.fillStyle = '#fbbf24'; ctx.fillRect(b.x, b.y - 20, ctx.measureText(b.cls).width + 16, 20);
    ctx.fillStyle = '#0f172a'; ctx.font = 'bold 12px Plus Jakarta Sans';
    ctx.fillText(b.cls, b.x + 6, b.y - 6);
  });
}

function deleteBox(idx) { boxes.splice(idx, 1); redraw(); updateList(); }

function updateList() {
  document.getElementById('box-count').innerText = boxes.length;
  const listEl = document.getElementById('box-list');
  if (boxes.length === 0) {
    listEl.innerHTML = '<p style="color:#64748b; font-size:13px; text-align:center; padding:20px;">Belum ada objek yang ditandai.</p>';
    return;
  }
  listEl.innerHTML = '';
  boxes.forEach((b, i) => {
    const el = document.createElement('div'); el.className = 'box-item';
    el.innerHTML = `<span><b>#${i+1} ${b.cls}</b> (${Math.round(b.w)}x${Math.round(b.h)})</span><button onclick="deleteBox(${i})" style="background:none;border:none;color:#ef4444;cursor:pointer;"><i class="fa-solid fa-trash"></i></button>`;
    listEl.appendChild(el);
  });
}

function exportYOLO() {
  if (boxes.length === 0) { alert('⚠️ Buat minimal 1 bounding box!'); return; }
  if (!MidtransPay.incrementUsage()) return;
  let lines = boxes.map(b => {
    let cx = (b.x + b.w/2) / canvas.width; let cy = (b.y + b.h/2) / canvas.height;
    let nw = b.w / canvas.width; let nh = b.h / canvas.height;
    return `0 ${cx.toFixed(6)} ${cy.toFixed(6)} ${nw.toFixed(6)} ${nh.toFixed(6)}`;
  }).join('\n');
  downloadFile('labels_yolo.txt', lines);
}

function exportVOC() {
  if (boxes.length === 0) { alert('⚠️ Buat minimal 1 bounding box!'); return; }
  if (!MidtransPay.incrementUsage()) return;
  let xml = `<annotation>\n  <size><width>${canvas.width}</width><height>${canvas.height}</height></size>\n` +
    boxes.map(b => `  <object>\n    <name>${b.cls}</name>\n    <bndbox><xmin>${Math.round(b.x)}</xmin><ymin>${Math.round(b.y)}</ymin><xmax>${Math.round(b.x+b.w)}</xmax><ymax>${Math.round(b.y+b.h)}</ymax></bndbox>\n  </object>`).join('\n') + `\n</annotation>`;
  downloadFile('annotation_voc.xml', xml);
}

function downloadFile(name, content) {
  const link = document.createElement('a'); link.download = name;
  link.href = 'data:text/plain;charset=utf-8,' + encodeURIComponent(content); link.click();
}
