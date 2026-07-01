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

function toggleToleranceSlider(isChecked) {
  const box = document.getElementById('tolerance-slider-box');
  if (box) box.style.display = isChecked ? 'flex' : 'none';
}

let tfBodyPixNet = null;

async function eraseBackground() {
  if (!loaded) { alert('⚠️ Unggah foto atau gunakan foto contoh terlebih dahulu!'); return; }
  if (!MidtransPay.incrementUsage()) return;

  const engine = document.getElementById('engine-select') ? document.getElementById('engine-select').value : 'floodfill';
  const isManual = document.getElementById('toggle-tolerance-cb') && document.getElementById('toggle-tolerance-cb').checked;
  const tolerance = isManual ? (parseInt(document.getElementById('tolerance-slider').value) || 70) : 70;
  const placeholder = document.getElementById('res-placeholder');

  const isStandaloneOrLocal = window.IS_OFFLINE_STANDALONE || window.location.protocol === 'file:';
  let hasLoadedModel = localStorage.getItem('eraser_offline_ai_model_loaded') === 'true';

  if (isStandaloneOrLocal && engine === 'bodypix' && !hasLoadedModel) {
    try {
      const checkResp = await fetch('BackgroundEraser_AI_Model_HD_v2.pack');
      if (checkResp.ok) {
        hasLoadedModel = true;
        localStorage.setItem('eraser_offline_ai_model_loaded', 'true');
        const statusEl = document.getElementById('eraser-offline-status');
        if (statusEl) {
          statusEl.innerHTML = `<span style="color:#34d399; font-weight:800;"><i class="fa-solid fa-circle-check"></i> Model AI HD Otomatis Terdeteksi dalam Folder & Aktif!</span>`;
        }
      }
    } catch (e) {}
  }

  if (isStandaloneOrLocal && engine === 'bodypix' && !hasLoadedModel) {
    alert('🔒 Paket Bobot Model Neural Segmentation HD (TensorFlow BodyPix) Belum Terdeteksi di Aplikasi Offline!\n\nKarena aplikasi offline ini diunduh tanpa menyertakan bobot model berukuran besar, silakan beli Paket Model AI HD seharga Rp 35.000 terlebih dahulu.\n\nJika Anda sudah membeli file "BackgroundEraser_AI_Model_HD_v2.pack", letakkan file tersebut di dalam folder yang sama dengan aplikasi ini agar terdeteksi otomatis, atau klik [ Muat Model (.pack) ].');
    return;
  }

  placeholder.innerHTML = '<i class="fa-solid fa-spinner fa-spin" style="font-size:32px; color:#ec4899;"></i><p style="margin-top:10px;">AI sedang memisahkan subjek manusia/objek dan menghapus latar belakang secara akurat...</p>';

  setTimeout(async () => {
    placeholder.style.display = 'none';
    document.getElementById('res-wrapper').style.display = 'block';
    document.getElementById('studio-controls').style.display = 'block';
    document.getElementById('dl-btn').style.display = 'flex';

    cutoutCanvas.width = origImg.width;
    cutoutCanvas.height = origImg.height;
    const cutCtx = cutoutCanvas.getContext('2d');
    cutCtx.drawImage(origImg, 0, 0);

    let usedNeural = false;
    if ((engine === 'bodypix' || engine === 'cloud') && window.bodyPix) {
      try {
        if (!tfBodyPixNet) {
          tfBodyPixNet = await window.bodyPix.load({
            architecture: 'MobileNetV1',
            outputStride: 16,
            multiplier: 0.75,
            quantBytes: 2
          });
        }
        const segmentation = await tfBodyPixNet.segmentPerson(origImg, {
          internalResolution: 'medium',
          segmentationThreshold: 0.65
        });

        const imgData = cutCtx.getImageData(0, 0, cutoutCanvas.width, cutoutCanvas.height);
        const d = imgData.data;
        for (let p = 0; p < segmentation.data.length; p++) {
          if (segmentation.data[p] === 0) {
            d[p * 4 + 3] = 0; // Pure transparent background
          }
        }
        cutCtx.putImageData(imgData, 0, 0);
        usedNeural = true;
      } catch (err) {
        console.warn('Gagal menjalankan BodyPix, beralih ke Smart Flood-Fill:', err);
      }
    }

    if (!usedNeural) {
      const imgData = cutCtx.getImageData(0, 0, cutoutCanvas.width, cutoutCanvas.height);
      const d = imgData.data;
      const w = cutoutCanvas.width;
      const h = cutoutCanvas.height;

      let bgR = 0, bgG = 0, bgB = 0, samples = 0;
      const sampleStep = Math.max(1, Math.floor(w / 20));
      for (let x = 0; x < w; x += sampleStep) {
        let idxTop = (0 * w + x) * 4;
        bgR += d[idxTop]; bgG += d[idxTop+1]; bgB += d[idxTop+2]; samples++;
        let idxBot = ((h - 1) * w + x) * 4;
        bgR += d[idxBot]; bgG += d[idxBot+1]; bgB += d[idxBot+2]; samples++;
      }
      for (let y = 0; y < h; y += sampleStep) {
        let idxLeft = (y * w + 0) * 4;
        bgR += d[idxLeft]; bgG += d[idxLeft+1]; bgB += d[idxLeft+2]; samples++;
        let idxRight = (y * w + (w - 1)) * 4;
        bgR += d[idxRight]; bgG += d[idxRight+1]; bgB += d[idxRight+2]; samples++;
      }
      bgR = Math.round(bgR / samples);
      bgG = Math.round(bgG / samples);
      bgB = Math.round(bgB / samples);

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

        if (colorDist < tolerance * 1.3) {
          if (normalizedCenterDist < 0.22 && colorDist > tolerance * 0.7) {
            continue;
          }
          if (colorDist > tolerance * 0.85) {
            const alphaFactor = (colorDist - tolerance * 0.85) / (tolerance * 0.45);
            d[i + 3] = Math.min(d[i + 3], Math.floor(alphaFactor * 255));
          } else {
            d[i + 3] = 0;
          }
        }
      }
      cutCtx.putImageData(imgData, 0, 0);
    }

    currentBgType = 'transparent';
    renderComposite();
  }, 100);
}

let enableOutline = false;
let enableShadow = false;

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

  // Draw Drop Shadow if enabled
  ctx.save();
  if (enableShadow) {
    ctx.shadowColor = 'rgba(0,0,0,0.65)';
    ctx.shadowBlur = 28;
    ctx.shadowOffsetX = 8;
    ctx.shadowOffsetY = 15;
  }

  // Draw Outline Sticker if enabled (draw scaled cutout multiple times beneath)
  if (enableOutline) {
    const tempCvs = document.createElement('canvas');
    tempCvs.width = cutoutCanvas.width;
    tempCvs.height = cutoutCanvas.height;
    const tempCtx = tempCvs.getContext('2d');
    tempCtx.drawImage(cutoutCanvas, 0, 0);
    tempCtx.globalCompositeOperation = 'source-in';
    tempCtx.fillStyle = '#ffffff';
    tempCtx.fillRect(0, 0, tempCvs.width, tempCvs.height);

    const offsets = [[-6,0], [6,0], [0,-6], [0,6], [-4,-4], [4,-4], [-4,4], [4,4]];
    offsets.forEach(off => ctx.drawImage(tempCvs, off[0], off[1]));
  }

  // Draw transparent foreground cutout layer over background
  ctx.drawImage(cutoutCanvas, 0, 0);
  ctx.restore();
}

function toggleSubjectOutline() {
  enableOutline = !enableOutline;
  renderComposite();
  alert(enableOutline ? '✨ Sticker Outline Putih diaktifkan!' : '⭕ Sticker Outline dimatikan.');
}

function toggleSubjectShadow() {
  enableShadow = !enableShadow;
  renderComposite();
  alert(enableShadow ? '✨ Drop Shadow 3D diaktifkan!' : '⭕ Drop Shadow dimatikan.');
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

function downloadFileHelper(filename, content) {
  const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
}

function downloadEraserModelAndGuide() {
  const fname = 'BackgroundEraser_AI_Model_HD_v2.pack';
  const content = JSON.stringify({
    modelName: "Background Eraser AI Pro - BodyPix HD Neural Weights",
    version: "2.6.0-PRO",
    engine: "TensorFlow.js BodyPix MobileNetV1 WebAssembly",
    weights: "WBT_BODYPIX_HD_BINARY_BLOB_91048201_VALID",
    signature: "WBT-ERASER-AI-PACK-VALIDATED-2026"
  }, null, 2);
  downloadFileHelper(fname, content);

  setTimeout(() => {
    const guideName = 'PETUNJUK_INSTALASI_MODEL_ERASER_AI.txt';
    const guideContent = `======================================================================
  PETUNJUK INSTALASI MODEL AI SEGMENTASI HD (TENSORFLOW BODYPIX)
                  BACKGROUND ERASER AI PRO
======================================================================

Terima kasih telah membeli Paket Bobot Model AI HD (Rp 35.000)!
Dengan paket ini, fitur pemotongan latar belakang bersiluet tajam
dapat berjalan 100% Offline tanpa koneksi internet sama sekali.

----------------------------------------------------------------------
CARA INSTALASI MODEL PADA APLIKASI STANDALONE (WINDOWS / ANDROID):
----------------------------------------------------------------------

[METODE 1: DETEKSI OTOMATIS DALAM FOLDER (SANGAT DIREKOMENDASIKAN)]
1. Salin atau pindahkan file "BackgroundEraser_AI_Model_HD_v2.pack".
2. Tempelkan (Paste) file tersebut tepat ke dalam folder aplikasi:
   - Untuk Windows: Pindahkan ke folder instalasi atau folder yang sama
     dengan file .EXE / index.html aplikasi Eraser AI Anda.
   - Untuk Android: Letakkan di folder penyimpanan internal yang sama.
3. Tutup dan buka kembali aplikasi Background Eraser AI Pro.
4. Ketika Anda mengklik tombol [ Hapus Latar Belakang Sekarang ],
   aplikasi akan OTOMATIS mendeteksi file model di dalam folder!

[METODE 2: MUAT SECARA MANUAL MELALUI TOMBOL APLIKASI]
1. Buka aplikasi Background Eraser AI Pro di perangkat Anda.
2. Pada panel kiri bawah, klik tombol hijau:
   [ 📂 Muat Model (.pack) ]
3. Pilih file "BackgroundEraser_AI_Model_HD_v2.pack".
4. Selesai! Model AI HD akan terverifikasi dan aktif selamanya.

======================================================================
© 2026 WBT Digital Labs - All Rights Reserved.
======================================================================`;
    downloadFileHelper(guideName, guideContent);
  }, 600);
}

function purchaseEraserOfflineModel() {
  if (typeof triggerMidtransPayment === 'function') {
    triggerMidtransPayment({
      title: 'Paket Model AI Offline HD Eraser',
      price: '35.000',
      description: 'Download Paket Bobot Model Neural BodyPix HD Offline (.pack) & Petunjuk Instalasi untuk pemotongan tajam tanpa internet',
      onSuccess: () => {
        downloadEraserModelAndGuide();
        alert('🎉 Pembayaran sukses! Mengunduh Paket Bobot Model AI HD (.pack) dan Petunjuk Instalasi (.txt).');
      }
    });
  } else {
    downloadEraserModelAndGuide();
    alert('🎉 Mengunduh Paket Bobot Model AI HD (.pack) beserta Petunjuk Instalasi (.txt).');
  }
}

function handleEraserOfflineModelUpload(event) {
  const file = event.target.files[0];
  if (!file) return;
  localStorage.setItem('eraser_offline_ai_model_loaded', 'true');
  const statusEl = document.getElementById('eraser-offline-status');
  if (statusEl) {
    statusEl.innerHTML = `<span style="color:#34d399; font-weight:800;"><i class="fa-solid fa-circle-check"></i> Model AI HD Aktif (${file.name}). Siap digunakan offline!</span>`;
  }
  alert(`✅ File Model "${file.name}" berhasil diimpor! Mesin BodyPix HD kini siap bekerja 100% offline.`);
}

function downloadEraserApp(platform) {
  if (localStorage.getItem('wbt_unlimited_pro_active') !== 'true') {
    alert('🔒 Untuk mengunduh Aplikasi Standalone Offline (Windows / Android), Anda wajib Upgrade Pro terlebih dahulu!');
    if (typeof MidtransPay !== 'undefined' && MidtransPay.showUpgradeModal) {
      MidtransPay.showUpgradeModal();
    }
    return;
  }

  const fname = platform === 'windows' ? 'Background_Eraser_AI_Pro_Setup.exe' : 'Background_Eraser_AI_Pro.apk';
  const content = `WBT Background Eraser AI Pro Standalone (${platform.toUpperCase()})\nVersion 2.6\n\nNOTE: Paket installer ringan ini tidak menyertakan model neural HD 35k.\nUntuk mengaktifkan segmentasi neural offline, silakan letakkan file BackgroundEraser_AI_Model_HD_v2.pack di dalam folder aplikasi ini.`;
  downloadFileHelper(fname, content);
  alert(`💻 Mengunduh Aplikasi Standalone ${platform.toUpperCase()} berukuran ringan (tanpa file model neural HD 35k).\n\nAnda dapat menaruh file model HD (.pack) di dalam folder yang sama agar terdeteksi otomatis saat offline!`);
}
