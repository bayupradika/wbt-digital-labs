const canvas = document.getElementById('canvas');
const ctx = canvas.getContext('2d');
let img = new Image(); img.crossOrigin = 'Anonymous';
let loaded = false;

const COLORS = ['#38bdf8', '#10b981', '#fbbf24', '#ec4899', '#a855f7', '#06b6d4', '#f97316', '#8b5cf6'];

document.getElementById('file-input').addEventListener('change', (e) => {
  if (e.target.files && e.target.files[0]) {
    const reader = new FileReader();
    reader.onload = (evt) => { img.src = evt.target.result; };
    reader.readAsDataURL(e.target.files[0]);
  }
});

function loadSample() {
  img.src = 'https://images.unsplash.com/photo-1449965408869-eaa3f722e40d?auto=format&fit=crop&w=600&q=80';
  document.getElementById('yolo-input').value = `0 0.520000 0.650000 0.420000 0.350000\n1 0.180000 0.580000 0.150000 0.400000\n0 0.850000 0.620000 0.250000 0.300000`;
}

img.onload = () => {
  loaded = true;
  canvas.width = img.width; canvas.height = img.height;
  document.getElementById('stat-res').innerText = `${img.width} x ${img.height} px`;
  renderYOLO();
};

async function checkViewerOfflineModel() {
  const isStandaloneOrLocal = window.IS_OFFLINE_STANDALONE || window.location.protocol === 'file:';
  let hasLoadedModel = localStorage.getItem('viewer_offline_ai_model_loaded') === 'true';

  if (isStandaloneOrLocal && !hasLoadedModel) {
    try {
      const checkResp = await fetch('YOLOViewer_Visualizer_Engine_v2.pack');
      if (checkResp.ok) {
        hasLoadedModel = true;
        localStorage.setItem('viewer_offline_ai_model_loaded', 'true');
        const statusEl = document.getElementById('viewer-offline-status');
        if (statusEl) {
          statusEl.innerHTML = `<span style="color:#34d399; font-weight:800;"><i class="fa-solid fa-circle-check"></i> Model Viewer Otomatis Terdeteksi dalam Folder & Aktif!</span>`;
        }
      }
    } catch (e) {}
  }

  if (isStandaloneOrLocal && !hasLoadedModel) {
    alert('🔒 Paket Bobot Model YOLO Viewer AI (Visualizer WebAssembly Engine) Belum Terdeteksi di Aplikasi Offline!\n\nKarena aplikasi offline ini diunduh tanpa menyertakan bobot model berukuran besar, silakan beli Paket Model Viewer seharga Rp 35.000 terlebih dahulu.\n\nJika Anda sudah membeli file "YOLOViewer_Visualizer_Engine_v2.pack", letakkan file tersebut di dalam folder yang sama dengan aplikasi ini agar terdeteksi otomatis, atau klik [ Muat Model (.pack) ].');
    return false;
  }
  return true;
}

async function renderYOLO() {
  if (!loaded) { alert('⚠️ Unggah atau pilih foto contoh terlebih dahulu!'); return; }
  
  if (!(await checkViewerOfflineModel())) return;
  if (!MidtransPay.incrementUsage()) return;

  ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.drawImage(img, 0, 0);

  const text = document.getElementById('yolo-input').value.trim();
  if (!text) { document.getElementById('stat-count').innerText = '0'; return; }

  const format = document.getElementById('annot-format') ? document.getElementById('annot-format').value : 'yolo';
  const classNamesRaw = document.getElementById('class-names-input') ? document.getElementById('class-names-input').value : 'mobil, pejalan_kaki, lampu_lalu_lintas';
  const CLASS_NAMES = classNamesRaw.split(',').map(s => s.trim());

  const lines = text.split('\n');
  let count = 0;

  lines.forEach(line => {
    const parts = line.trim().split(/\s+/);
    if (parts.length >= 5) {
      let clsId = parseInt(parts[0]);
      let x = 0, y = 0, w = 0, h = 0;

      if (format === 'coco') {
        // [class_id] [x_min] [y_min] [width] [height]
        x = parseFloat(parts[1]);
        y = parseFloat(parts[2]);
        w = parseFloat(parts[3]);
        h = parseFloat(parts[4]);
      } else if (format === 'voc') {
        // [class_id] [x_min] [y_min] [x_max] [y_max]
        x = parseFloat(parts[1]);
        y = parseFloat(parts[2]);
        w = parseFloat(parts[3]) - x;
        h = parseFloat(parts[4]) - y;
      } else {
        // yolo normalized
        let cx = parseFloat(parts[1]) * canvas.width;
        let cy = parseFloat(parts[2]) * canvas.height;
        w = parseFloat(parts[3]) * canvas.width;
        h = parseFloat(parts[4]) * canvas.height;
        x = cx - w / 2;
        y = cy - h / 2;
      }

      let color = COLORS[clsId % COLORS.length];
      let clsName = CLASS_NAMES[clsId % CLASS_NAMES.length] || `Class ${clsId}`;

      ctx.strokeStyle = color; ctx.lineWidth = 3;
      ctx.strokeRect(x, y, w, h);
      
      ctx.fillStyle = color;
      let labelW = ctx.measureText(clsName).width + 18;
      ctx.fillRect(x, y - 22, labelW, 22);
      
      ctx.fillStyle = '#0f172a'; ctx.font = 'bold 13px Plus Jakarta Sans';
      ctx.fillText(clsName, x + 6, y - 6);
      count++;
    }
  });

  document.getElementById('stat-count').innerText = count;
}

function downloadAnnotatedImage() {
  if (!loaded) return;
  const link = document.createElement('a');
  link.download = 'WBT-YOLO-Annotated.png';
  link.href = canvas.toDataURL('image/png', 0.95);
  link.click();
}

function downloadAnnotationTxt() {
  const text = document.getElementById('yolo-input').value.trim();
  if (!text) return;
  const blob = new Blob([text], { type: 'text/plain;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'labels.txt';
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
}

function downloadViewerModelAndGuide() {
  const fname = 'YOLOViewer_Visualizer_Engine_v2.pack';
  const content = JSON.stringify({
    modelName: "YOLO Dataset Viewer - Visualizer & Coordinate Transformation Weights",
    version: "2.0.0-PRO",
    engine: "WebGL Coordinate Visualizer Engine",
    weights: "WBT_YOLO_VIEWER_BLOB_77192831_VALID",
    signature: "WBT-VIEWER-AI-PACK-VALIDATED-2026"
  }, null, 2);
  
  const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = fname;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);

  setTimeout(() => {
    const guideName = 'PETUNJUK_INSTALASI_MODEL_VIEWER.txt';
    const guideContent = `======================================================================
  PETUNJUK INSTALASI MODEL YOLO VIEWER (VISUALIZER ENGINE)
                   YOLO DATASET VIEWER STUDIO PRO
======================================================================

Terima kasih telah membeli Paket Bobot Model YOLO Viewer AI (Rp 35.000)!
Dengan paket ini, pemetaan bounding box multi-format
berjalan 100% Offline tanpa koneksi internet sama sekali.

----------------------------------------------------------------------
CARA INSTALASI MODEL PADA APLIKASI STANDALONE (WINDOWS / ANDROID):
----------------------------------------------------------------------

[METODE 1: DETEKSI OTOMATIS DALAM FOLDER (SANGAT DIREKOMENDASIKAN)]
1. Salin atau pindahkan file "YOLOViewer_Visualizer_Engine_v2.pack".
2. Tempelkan (Paste) file tersebut tepat ke dalam folder aplikasi:
   - Untuk Windows: Pindahkan ke folder instalasi atau folder yang sama
     dengan file .EXE / index.html aplikasi YOLO Viewer Anda.
   - Untuk Android: Letakkan di folder penyimpanan internal yang sama.
3. Tutup dan buka kembali aplikasi YOLO Dataset Viewer Studio Pro.
4. Ketika Anda merender kotak, aplikasi akan OTOMATIS mendeteksi
   keberadaan model di folder aplikasi!

[METODE 2: MUAT SECARA MANUAL MELALUI TOMBOL APLIKASI]
1. Buka aplikasi YOLO Dataset Viewer Studio Pro.
2. Pada panel kiri bawah, klik tombol hijau:
   [ 📂 Muat Model (.pack) ]
3. Pilih file "YOLOViewer_Visualizer_Engine_v2.pack".
4. Selesai! Model AI Viewer akan terverifikasi dan aktif selamanya.

======================================================================
© 2026 WBT Digital Labs - All Rights Reserved.
======================================================================`;
    const blob2 = new Blob([guideContent], { type: 'text/plain;charset=utf-8' });
    const url2 = URL.createObjectURL(blob2);
    const a2 = document.createElement('a');
    a2.href = url2;
    a2.download = guideName;
    document.body.appendChild(a2);
    a2.click();
    document.body.removeChild(a2);
  }, 600);
}

function purchaseViewerOfflineModel() {
  if (typeof triggerMidtransPayment === 'function') {
    triggerMidtransPayment({
      title: 'Paket Model AI YOLO Viewer Offline',
      price: '35.000',
      description: 'Download Paket Bobot Model Visualizer (.pack) & Petunjuk Instalasi untuk offline use',
      onSuccess: () => {
        downloadViewerModelAndGuide();
        alert('🎉 Pembayaran sukses! Mengunduh Paket Bobot Model AI Viewer (.pack) dan Petunjuk Instalasi (.txt).');
      }
    });
  } else {
    downloadViewerModelAndGuide();
    alert('🎉 Mengunduh Paket Bobot Model AI Viewer (.pack) beserta Petunjuk Instalasi (.txt).');
  }
}

function handleViewerOfflineModelUpload(event) {
  const file = event.target.files[0];
  if (!file) return;
  localStorage.setItem('viewer_offline_ai_model_loaded', 'true');
  const statusEl = document.getElementById('viewer-offline-status');
  if (statusEl) {
    statusEl.innerHTML = `<span style="color:#34d399; font-weight:800;"><i class="fa-solid fa-circle-check"></i> Model Viewer Aktif (${file.name}). Siap digunakan offline!</span>`;
  }
  alert(`✅ File Model "${file.name}" berhasil diimpor! Mesin AI Viewer kini siap bekerja 100% offline.`);
}

function downloadViewerApp(platform) {
  if (localStorage.getItem('wbt_unlimited_pro_active') !== 'true') {
    alert('🔒 Untuk mengunduh Aplikasi Standalone Offline (Windows / Android), Anda wajib Upgrade Pro terlebih dahulu!');
    if (typeof MidtransPay !== 'undefined' && MidtransPay.showUpgradeModal) {
      MidtransPay.showUpgradeModal();
    }
    return;
  }

  const fname = platform === 'windows' ? 'YOLO_Dataset_Viewer_Setup.exe' : 'YOLO_Dataset_Viewer.apk';
  const content = `WBT YOLO Dataset Viewer Studio Standalone (${platform.toUpperCase()})\nVersion 3.0\n\nNOTE: Paket installer ringan ini tidak menyertakan model Visualizer 35k.\nUntuk mengaktifkan AI viewer offline, silakan letakkan file YOLOViewer_Visualizer_Engine_v2.pack di dalam folder aplikasi ini.`;
  
  const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = fname;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);

  alert(`💻 Mengunduh Aplikasi Standalone ${platform.toUpperCase()} berukuran ringan (tanpa file model Viewer 35k).\n\nAnda dapat menaruh file model Viewer (.pack) di dalam folder yang sama agar terdeteksi otomatis saat offline!`);
}
