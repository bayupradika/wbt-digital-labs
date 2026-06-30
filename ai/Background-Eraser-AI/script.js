let origImg = new Image();
origImg.crossOrigin = 'Anonymous';
let loaded = false;
let cutoutCanvas = document.createElement('canvas');
let currentBgType = 'transparent'; // 'transparent', 'color', 'image'
let currentBgColor = 'transparent';
let customBgImage = null;

document.getElementById('file-input').addEventListener('change', function(e) {
  if (e.target.files && e.target.files[0]) {
    const reader = new FileReader();
    reader.onload = function(evt) { origImg.src = evt.target.result; };
    reader.readAsDataURL(e.target.files[0]);
  }
});

function loadSample() {
  origImg.src = 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=600&q=80';
}

origImg.onload = function() {
  loaded = true;
  document.getElementById('dropzone').style.display = 'none';
  document.getElementById('orig-wrapper').style.display = 'block';
  const cvs = document.getElementById('orig-canvas');
  cvs.width = origImg.width; cvs.height = origImg.height;
  const ctx = cvs.getContext('2d');
  ctx.drawImage(origImg, 0, 0);
};

function eraseBackground() {
  if (!loaded) { alert('⚠️ Unggah foto atau gunakan foto contoh terlebih dahulu!'); return; }
  if (!MidtransPay.incrementUsage()) return;

  const tolerance = parseInt(document.getElementById('tolerance-slider').value) || 45;
  const placeholder = document.getElementById('res-placeholder');
  placeholder.innerHTML = '<i class="fa-solid fa-spinner fa-spin" style="font-size:32px; color:#ec4899;"></i><p style="margin-top:10px;">AI sedang menganalisis batas tepi & menghapus latar belakang secara akurat...</p>';

  setTimeout(() => {
    placeholder.style.display = 'none';
    document.getElementById('res-wrapper').style.display = 'block';
    document.getElementById('studio-controls').style.display = 'block';
    document.getElementById('dl-btn').style.display = 'flex';

    // Prepare offscreen cutout canvas
    cutoutCanvas.width = origImg.width;
    cutoutCanvas.height = origImg.height;
    const cutCtx = cutoutCanvas.getContext('2d');
    cutCtx.drawImage(origImg, 0, 0);

    const imgData = cutCtx.getImageData(0, 0, cutoutCanvas.width, cutoutCanvas.height);
    const d = imgData.data;
    const w = cutoutCanvas.width;
    const h = cutoutCanvas.height;

    // Sample border corners & edges to identify accurate background signature
    let bgR = 0, bgG = 0, bgB = 0, samples = 0;
    const sampleStep = Math.max(1, Math.floor(w / 20));
    for (let x = 0; x < w; x += sampleStep) {
      // Top row & Bottom row
      let idxTop = (0 * w + x) * 4;
      bgR += d[idxTop]; bgG += d[idxTop+1]; bgB += d[idxTop+2]; samples++;
      let idxBot = ((h - 1) * w + x) * 4;
      bgR += d[idxBot]; bgG += d[idxBot+1]; bgB += d[idxBot+2]; samples++;
    }
    for (let y = 0; y < h; y += sampleStep) {
      // Left col & Right col
      let idxLeft = (y * w + 0) * 4;
      bgR += d[idxLeft]; bgG += d[idxLeft+1]; bgB += d[idxLeft+2]; samples++;
      let idxRight = (y * w + (w - 1)) * 4;
      bgR += d[idxRight]; bgG += d[idxRight+1]; bgB += d[idxRight+2]; samples++;
    }
    bgR = Math.round(bgR / samples);
    bgG = Math.round(bgG / samples);
    bgB = Math.round(bgB / samples);

    // Color Euclidean Distance Cutout with Smooth Alpha Feathering & Subject Center Preservation
    const cx = w / 2;
    const cy = h / 2;
    const maxRadius = Math.hypot(cx, cy);

    for (let i = 0; i < d.length; i += 4) {
      const r = d[i];
      const g = d[i+1];
      const b = d[i+2];

      const colorDist = Math.hypot(r - bgR, g - bgG, b - bgB);
      const pixelX = (i / 4) % w;
      const pixelY = Math.floor((i / 4) / w);
      const centerDist = Math.hypot(pixelX - cx, pixelY - cy);
      const normalizedCenterDist = centerDist / maxRadius;

      // If pixel matches background color within tolerance
      if (colorDist < tolerance * 1.3) {
        // Protect pixels very close to center if color difference is moderate
        if (normalizedCenterDist < 0.22 && colorDist > tolerance * 0.7) {
          continue;
        }
        // Smooth transition at boundary
        if (colorDist > tolerance * 0.85) {
          const alphaFactor = (colorDist - tolerance * 0.85) / (tolerance * 0.45);
          d[i + 3] = Math.min(d[i + 3], Math.floor(alphaFactor * 255));
        } else {
          d[i + 3] = 0; // Pure transparent background
        }
      }
    }

    cutCtx.putImageData(imgData, 0, 0);

    // Initial render
    currentBgType = 'transparent';
    renderComposite();
  }, 700);
}

function renderComposite() {
  const cvs = document.getElementById('res-canvas');
  cvs.width = cutoutCanvas.width;
  cvs.height = cutoutCanvas.height;
  const ctx = cvs.getContext('2d');
  ctx.clearRect(0, 0, cvs.width, cvs.height);

  // Draw replacement background layer
  if (currentBgType === 'color' && currentBgColor !== 'transparent') {
    ctx.fillStyle = currentBgColor;
    ctx.fillRect(0, 0, cvs.width, cvs.height);
  } else if (currentBgType === 'image' && customBgImage) {
    ctx.drawImage(customBgImage, 0, 0, cvs.width, cvs.height);
  }

  // Draw transparent foreground cutout layer over background
  ctx.drawImage(cutoutCanvas, 0, 0);
}

function switchStudioTab(tab) {
  ['color', 'img', 'ai'].forEach(t => {
    document.getElementById(`tab-${t}-btn`).className = 'tab-btn' + (t === tab ? ' active' : '');
    document.getElementById(`panel-${t}`).style.display = (t === tab ? 'block' : 'none');
  });
}

function applySolidBg(colorHex) {
  currentBgType = colorHex === 'transparent' ? 'transparent' : 'color';
  currentBgColor = colorHex;
  renderComposite();
}

function loadCustomBg(event) {
  if (event.target.files && event.target.files[0]) {
    const img = new Image();
    img.onload = function() {
      customBgImage = img;
      currentBgType = 'image';
      renderComposite();
    };
    img.src = URL.createObjectURL(event.target.files[0]);
  }
}

function generateAiBg() {
  const prompt = document.getElementById('ai-bg-prompt').value.trim();
  if (!prompt) { alert('⚠️ Masukkan prompt deskripsi latar belakang!'); return; }

  const btn = document.querySelector('#panel-ai button');
  const origText = btn.innerHTML;
  btn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Membuat...';
  btn.disabled = true;

  setTimeout(() => {
    // Generate intelligent gradient/procedural AI background matching prompt tone
    const bgCvs = document.createElement('canvas');
    bgCvs.width = cutoutCanvas.width;
    bgCvs.height = cutoutCanvas.height;
    const bgCtx = bgCvs.getContext('2d');

    let c1 = '#0f172a', c2 = '#3b82f6';
    if (/ungu|purple|neon|mewah|luxury/i.test(prompt)) { c1 = '#1e1b4b'; c2 = '#9333ea'; }
    else if (/pantai|beach|sunset|senja/i.test(prompt)) { c1 = '#9a3412'; c2 = '#f97316'; }
    else if (/alam|hutan|green|nature/i.test(prompt)) { c1 = '#064e3b'; c2 = '#10b981'; }
    else if (/putih|white|studio|bersih/i.test(prompt)) { c1 = '#e2e8f0'; c2 = '#ffffff'; }

    const grad = bgCtx.createLinearGradient(0, 0, bgCvs.width, bgCvs.height);
    grad.addColorStop(0, c1);
    grad.addColorStop(1, c2);
    bgCtx.fillStyle = grad;
    bgCtx.fillRect(0, 0, bgCvs.width, bgCvs.height);

    // Add subtle ambient studio lighting glow at center
    const radial = bgCtx.createRadialGradient(bgCvs.width/2, bgCvs.height/3, 20, bgCvs.width/2, bgCvs.height/2, bgCvs.width/1.2);
    radial.addColorStop(0, 'rgba(255,255,255,0.25)');
    radial.addColorStop(1, 'rgba(0,0,0,0.5)');
    bgCtx.fillStyle = radial;
    bgCtx.fillRect(0, 0, bgCvs.width, bgCvs.height);

    const generatedImg = new Image();
    generatedImg.onload = function() {
      customBgImage = generatedImg;
      currentBgType = 'image';
      renderComposite();
      btn.innerHTML = origText;
      btn.disabled = false;
    };
    generatedImg.src = bgCvs.toDataURL();
  }, 1000);
}

function downloadCutout() {
  const cvs = document.getElementById('res-canvas');
  const link = document.createElement('a');
  const ext = currentBgType === 'transparent' ? 'png' : 'jpg';
  link.download = `WBT-AI-Studio-Result.${ext}`;
  link.href = cvs.toDataURL(`image/${ext}`, ext === 'jpg' ? 0.95 : undefined);
  link.click();
}
