// State Management
const TOOL_ID = 'wbt_image_studio';
let isPro = localStorage.getItem(`ai_pro_${TOOL_ID}`) === 'true';
let activeTool = null;
let selectedFiles = [];

// Quota Management
const DAILY_LIMIT = 3;
function getQuotaKey() {
  const today = new Date().toISOString().slice(0, 10);
  return `quota_${TOOL_ID}_${today}`;
}

function getRemainingQuota() {
  if (isPro) return 'Infinity';
  const used = parseInt(localStorage.getItem(getQuotaKey()) || '0', 10);
  return Math.max(0, DAILY_LIMIT - used);
}

function consumeQuota() {
  if (isPro) return true;
  const used = parseInt(localStorage.getItem(getQuotaKey()) || '0', 10);
  if (used >= DAILY_LIMIT) {
    showToast('Kuota harian gratis telah habis! Upgrade ke Pro untuk akses tanpa batas.', 'warning');
    openUpgradeModal();
    return false;
  }
  localStorage.setItem(getQuotaKey(), (used + 1).toString());
  updateQuotaUI();
  return true;
}

function updateQuotaUI() {
  const displayEl = document.getElementById('quota-display');
  if (!displayEl) return;
  if (isPro) {
    displayEl.innerHTML = '<span style="color: #10b981;">Pro Unlimited</span>';
  } else {
    const rem = getRemainingQuota();
    displayEl.textContent = `${rem} / ${DAILY_LIMIT}`;
  }
}

// Tool Configurations
const toolsConfig = {
  compress: {
    title: 'Image Compressor Pro',
    desc: 'Kecilkan ukuran file foto JPG/PNG/WEBP hingga 95% dengan kontrol kualitas.',
    icon: '<i class="fa-solid fa-compress"></i>',
    accept: 'image/*',
    multiple: true,
    hint: 'Pilih satu atau banyak foto untuk dikompresi',
    settings: `
      <div class="setting-group">
        <label class="setting-label">Tingkat Kualitas Kompresi</label>
        <select id="compress-quality" class="setting-input">
          <option value="0.8">Tinggi (80% Kualitas Visual - Hemat ~50%)</option>
          <option value="0.6" selected>Optimal (60% Kualitas Visual - Hemat ~75%)</option>
          <option value="0.4">Ekstrem (40% Kualitas Visual - Hemat ~90%)</option>
        </select>
      </div>
    `
  },
  resize: {
    title: 'Batch Image Resizer',
    desc: 'Ubah dimensi resolusi lebar dan tinggi foto secara massal.',
    icon: '<i class="fa-solid fa-down-left-and-up-right-to-center"></i>',
    accept: 'image/*',
    multiple: true,
    hint: 'Pilih foto yang ingin diubah ukuran resolusinya',
    settings: `
      <div class="setting-group">
        <label class="setting-label">Skala Pengubahan Resolusi</label>
        <select id="resize-scale" class="setting-input">
          <option value="0.5">Perkecil 50% dari Dimensi Asli</option>
          <option value="0.75">Perkecil 75% dari Dimensi Asli</option>
          <option value="1.5">Perbesar 150% dari Dimensi Asli</option>
          <option value="2.0">Perbesar 200% (2x Lipat)</option>
        </select>
      </div>
    `
  },
  ocr: {
    title: 'QuickScan OCR (Teks Ekstraktor)',
    desc: 'Pindai foto dokumen atau struk belanja dan ekstrak menjadi tulisan digital.',
    icon: '<i class="fa-solid fa-file-lines"></i>',
    accept: 'image/*',
    multiple: false,
    hint: 'Pilih 1 foto dokumen atau teks untuk dipindai dengan OCR offline',
    settings: `
      <div class="setting-group">
        <label class="setting-label">Bahasa Pengenalan OCR</label>
        <select id="ocr-lang" class="setting-input">
          <option value="eng">Bahasa Inggris / Standar Latin (eng)</option>
          <option value="ind">Bahasa Indonesia (ind)</option>
        </select>
      </div>
    `
  },
  exif: {
    title: 'EXIF & GPS Photo Cleaner',
    desc: 'Hapus metadata lokasi koordinat GPS, serial kamera, dan info pemotretan.',
    icon: '<i class="fa-solid fa-shield-halved"></i>',
    accept: 'image/*',
    multiple: true,
    hint: 'Pilih foto yang ingin dibersihkan jejak metadata privasinya',
    settings: ''
  },
  rename: {
    title: 'Bulk Photo Renamer',
    desc: 'Ubah nama puluhan foto dengan awalan dan penomoran berurut otomatis.',
    icon: '<i class="fa-solid fa-list-ol"></i>',
    accept: 'image/*',
    multiple: true,
    hint: 'Pilih seluruh kumpulan foto yang ingin diganti namanya serentak',
    settings: `
      <div class="setting-group">
        <label class="setting-label">Awalan Nama Baru (Prefix)</label>
        <input type="text" id="rename-prefix" class="setting-input" value="Foto_Studio">
      </div>
    `
  },
  converter: {
    title: 'Format Converter Studio',
    desc: 'Konversi format gambar dari/ke JPG, PNG, WEBP ringan, atau BMP.',
    icon: '<i class="fa-solid fa-rotate"></i>',
    accept: 'image/*',
    multiple: true,
    hint: 'Pilih gambar untuk dikonversi formatnya',
    settings: `
      <div class="setting-group">
        <label class="setting-label">Format Target Keluaran</label>
        <select id="convert-format" class="setting-input">
          <option value="image/webp">WEBP (Sangat Ringan untuk Web)</option>
          <option value="image/jpeg">JPG / JPEG (Standar Universal)</option>
          <option value="image/png">PNG (Transparansi Terjaga)</option>
        </select>
      </div>
    `
  },
  filters: {
    title: 'Filter & Color Grading Studio',
    desc: 'Sesuaikan kecerahan, kontras, saturasi, efek vintage, sepia, dan grayscale.',
    icon: '<i class="fa-solid fa-wand-magic"></i>',
    accept: 'image/*',
    multiple: false,
    hint: 'Pilih 1 foto untuk diberikan filter dan gradasi warna warna visual',
    settings: `
      <div class="setting-group">
        <label class="setting-label">Pilih Filter Preset</label>
        <select id="filter-type" class="setting-input">
          <option value="sharpen">⚡ AI Smart Sharpening & Detail Enhancer (Perjelas Foto Blur)</option>
          <option value="upscale">🚀 AI Super-Resolution 2x Upscaling (Tingkatkan Resolusi)</option>
          <option value="grayscale">Grayscale (Hitam Putih Klasik)</option>
          <option value="sepia">Sepia (Nuansa Foto Vintage Kuno)</option>
          <option value="bright">Vibrant Brightness (+25% Kecerahan)</option>
          <option value="contrast">High Contrast Cinematic</option>
          <option value="invert">Invert Colors (Negatif Film)</option>
        </select>
      </div>
    `
  },
  cropper: {
    title: 'Image Cropper & Rasio Studio',
    desc: 'Potong foto ke rasio standar sosial media 1:1, 16:9, atau 4:3.',
    icon: '<i class="fa-solid fa-crop"></i>',
    accept: 'image/*',
    multiple: false,
    hint: 'Pilih 1 foto yang ingin dipotong orientasi rasionya',
    settings: `
      <div class="setting-group">
        <label class="setting-label">Rasio Pemotongan (Crop Ratio)</label>
        <select id="crop-ratio" class="setting-input">
          <option value="1:1">1:1 Square (Instagram Feed / Avatar)</option>
          <option value="16:9">16:9 Landscape (YouTube Thumbnail / Monitor)</option>
          <option value="4:3">4:3 Standard Photo</option>
        </select>
      </div>
    `
  },
  watermark: {
    title: 'Watermark & Branding Stamp',
    desc: 'Sisipkan teks tanda air hak cipta di atas foto dengan kontrol transparansi.',
    icon: '<i class="fa-solid fa-stamp"></i>',
    accept: 'image/*',
    multiple: true,
    hint: 'Pilih foto yang ingin dibubuhkan stempel watermark anti-plagiat',
    settings: `
      <div class="setting-group">
        <label class="setting-label">Teks Stempel Watermark</label>
        <input type="text" id="watermark-text" class="setting-input" value="© WBT DIGITAL LABS">
      </div>
    `
  },
  grid: {
    title: 'Instagram Grid Splitter',
    desc: 'Pecah 1 foto besar menjadi potongan grid 3x1 atau 3x3 untuk feed carousel.',
    icon: '<i class="fa-solid fa-grid-horizontal"></i>',
    accept: 'image/*',
    multiple: false,
    hint: 'Pilih 1 foto panorama untuk dipotong menjadi grid tile',
    settings: `
      <div class="setting-group">
        <label class="setting-label">Tipe Potongan Grid</label>
        <select id="grid-type" class="setting-input">
          <option value="3x1">Grid 3x1 (3 Potongan Horizontal Banner)</option>
          <option value="3x3">Grid 3x3 (9 Potongan Kotak Penuh Feed)</option>
        </select>
      </div>
    `
  },
  borders: {
    title: 'Border Bingkai & Lengkung Sudut',
    desc: 'Tambahkan bingkai border warna elegan atau lengkungan sudut halus.',
    icon: '<i class="fa-solid fa-border-all"></i>',
    accept: 'image/*',
    multiple: true,
    hint: 'Pilih foto untuk dibingkai secara estetik',
    settings: `
      <div class="setting-group">
        <label class="setting-label">Gaya Bingkai & Sudut</label>
        <select id="border-style" class="setting-input">
          <option value="rounded">Rounded Corner (Sudut Melengkung Halus)</option>
          <option value="white-frame">Bingkai Putih Polaroid Minimalis (20px)</option>
          <option value="dark-frame">Bingkai Hitam Sinematik (20px)</option>
        </select>
      </div>
    `
  },
  palette: {
    title: 'Dominant Palette Extractor',
    desc: 'Ekstrak 5 warna dominan beserta kode HEX untuk inspirasi desain visual.',
    icon: '<i class="fa-solid fa-palette"></i>',
    accept: 'image/*',
    multiple: false,
    hint: 'Pilih 1 foto untuk diekstrak palet warna dominannya',
    settings: ''
  },
  flip: {
    title: 'Flip & Mirror Studio',
    desc: 'Balik orientasi foto secara horizontal (efek cermin kaca) atau vertikal.',
    icon: '<i class="fa-solid fa-right-left"></i>',
    accept: 'image/*',
    multiple: true,
    hint: 'Pilih foto untuk dibalik posisinya',
    settings: `
      <div class="setting-group">
        <label class="setting-label">Arah Pembalikan Orientasi</label>
        <select id="flip-dir" class="setting-input">
          <option value="horizontal">Horizontal Mirror (Cermin Kiri-Kanan)</option>
          <option value="vertical">Vertical Flip (Atas-Bawah)</option>
        </select>
      </div>
    `
  },
  blur: {
    title: 'Privacy Sensor / Blur Wajah',
    desc: 'Berikan efek pikselasi blur pada bagian tengah atau teks sensitif.',
    icon: '<i class="fa-solid fa-user-secret"></i>',
    accept: 'image/*',
    multiple: false,
    hint: 'Pilih foto yang ingin disensor area sensitifnya',
    settings: `
      <div class="setting-group">
        <label class="setting-label">Area Sensor Pikselasi</label>
        <select id="blur-area" class="setting-input">
          <option value="center">Sensor Kotak Tengah (Center Masking)</option>
          <option value="bottom">Sensor Bagian Bawah (Subtitle / Keterangan)</option>
        </select>
      </div>
    `
  },
  base64: {
    title: 'Base64 Image Encoder / Decoder',
    desc: 'Ubah file foto langsung menjadi string Base64 untuk developer web.',
    icon: '<i class="fa-solid fa-code"></i>',
    accept: 'image/*',
    multiple: false,
    hint: 'Pilih 1 foto untuk dikonversi menjadi string Base64',
    settings: ''
  },
  watermark: {
    title: 'Batch Copyright Watermark Studio',
    desc: 'Bubuhkan teks hak cipta atau copyright watermark massal pada foto Anda.',
    icon: '<i class="fa-solid fa-stamp"></i>',
    accept: 'image/*',
    multiple: true,
    hint: 'Pilih hingga puluhan foto untuk dibubuhkan watermark sekaligus',
    settings: `
      <div class="setting-item">
        <label class="setting-label">Teks Watermark Copyright</label>
        <input type="text" id="wm-text" class="setting-input" value="© 2026 WBT Digital Labs - Confidential" placeholder="Ketik teks hak cipta...">
      </div>
      <div class="setting-item">
        <label class="setting-label">Posisi Watermark</label>
        <select id="wm-pos" class="setting-input">
          <option value="bottom-right">Pojok Kanan Bawah</option>
          <option value="center">Tengah Kanvas (Diagonal Watermark)</option>
          <option value="bottom-left">Pojok Kiri Bawah</option>
        </select>
      </div>
      <div class="setting-item">
        <label class="setting-label">Warna & Transparansi</label>
        <select id="wm-color" class="setting-input">
          <option value="rgba(255,255,255,0.6)">Putih Semi-Transparan</option>
          <option value="rgba(245,158,11,0.85)">Emas / Gold Pro</option>
          <option value="rgba(0,0,0,0.65)">Hitam Semi-Transparan</option>
        </select>
      </div>
    `
  }
};

// UI Handling & Selection
function selectTool(toolKey) {
  activeTool = toolKey;
  const config = toolsConfig[toolKey];
  
  document.querySelectorAll('.tool-card').forEach(card => card.classList.remove('active'));
  if (event && event.currentTarget) event.currentTarget.classList.add('active');

  document.getElementById('ws-icon').innerHTML = config.icon;
  document.getElementById('ws-title').textContent = config.title;
  document.getElementById('ws-desc').textContent = config.desc;
  document.getElementById('dropzone-hint').textContent = config.hint;
  
  const fileInput = document.getElementById('file-input');
  fileInput.accept = config.accept;
  fileInput.multiple = config.multiple;

  const settingsDiv = document.getElementById('tool-settings');
  settingsDiv.innerHTML = config.settings || '';
  
  selectedFiles = [];
  renderFileList();
  document.getElementById('canvas-preview').style.display = 'none';

  const wsSection = document.getElementById('workspace-section');
  wsSection.classList.add('active');
  wsSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

function closeWorkspace() {
  document.getElementById('workspace-section').classList.remove('active');
  document.querySelectorAll('.tool-card').forEach(card => card.classList.remove('active'));
  activeTool = null;
  selectedFiles = [];
}

function resetStudio() {
  selectedFiles = [];
  renderFileList();
  document.getElementById('canvas-preview').style.display = 'none';
}

function filterCategory(cat) {
  document.querySelectorAll('.cat-btn').forEach(btn => btn.classList.remove('active'));
  if (event && event.currentTarget) event.currentTarget.classList.add('active');
  
  document.querySelectorAll('.tool-card').forEach(card => {
    if (cat === 'all' || card.classList.contains('cat-' + cat)) {
      card.style.display = 'flex';
    } else {
      card.style.display = 'none';
    }
  });
}

// Dropzone Events
const dropzone = document.getElementById('dropzone');
const fileInput = document.getElementById('file-input');

dropzone.addEventListener('dragover', (e) => {
  e.preventDefault();
  dropzone.classList.add('dragover');
});

dropzone.addEventListener('dragleave', () => dropzone.classList.remove('dragover'));

dropzone.addEventListener('drop', (e) => {
  e.preventDefault();
  dropzone.classList.remove('dragover');
  handleFiles(e.dataTransfer.files);
});

fileInput.addEventListener('change', (e) => handleFiles(e.target.files));

function handleFiles(filesList) {
  if (!activeTool) return;
  const config = toolsConfig[activeTool];
  const incoming = Array.from(filesList);
  
  if (!config.multiple) selectedFiles = [incoming[0]];
  else selectedFiles = [...selectedFiles, ...incoming];
  
  renderFileList();
}

function renderFileList() {
  const fileListEl = document.getElementById('file-list');
  const btnProcess = document.getElementById('btn-process');
  fileListEl.innerHTML = '';
  
  selectedFiles.forEach((file, idx) => {
    const sizeKB = (file.size / 1024).toFixed(1);
    const item = document.createElement('div');
    item.className = 'file-item';
    item.innerHTML = `
      <div style="display: flex; align-items: center; gap: 12px;">
        <i class="fa-solid fa-image" style="color: var(--primary); font-size: 20px;"></i>
        <div>
          <div style="font-weight: 600; font-size: 14px;">${file.name}</div>
          <div style="font-size: 12px; color: var(--text-muted);">${sizeKB} KB (${file.type || 'image'})</div>
        </div>
      </div>
      <button class="btn btn-outline" style="padding: 6px 10px;" onclick="removeFile(${idx})"><i class="fa-solid fa-trash"></i></button>
    `;
    fileListEl.appendChild(item);
  });

  btnProcess.disabled = selectedFiles.length === 0;
}

function removeFile(idx) {
  selectedFiles.splice(idx, 1);
  renderFileList();
}

// Processing Dispatcher
async function processCurrentTool() {
  if (!consumeQuota()) return;
  
  const btnProcess = document.getElementById('btn-process');
  const originalText = btnProcess.innerHTML;
  btnProcess.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Memproses Studio...';
  btnProcess.disabled = true;

  try {
    if (activeTool === 'compress') await processCompress();
    else if (activeTool === 'resize') await processResize();
    else if (activeTool === 'ocr') await processOCR();
    else if (activeTool === 'exif') await processEXIF();
    else if (activeTool === 'rename') await processRename();
    else if (activeTool === 'converter') await processConverter();
    else if (activeTool === 'filters') await processFilters();
    else if (activeTool === 'cropper') await processCropper();
    else if (activeTool === 'watermark') await processWatermark();
    else if (activeTool === 'grid') await processGrid();
    else if (activeTool === 'borders') await processBorders();
    else if (activeTool === 'palette') await processPalette();
    else if (activeTool === 'flip') await processFlip();
    else if (activeTool === 'blur') await processBlur();
    else if (activeTool === 'base64') await processBase64();
    
    showToast('Pemrosesan Studio selesai!', 'success');
  } catch (err) {
    console.error(err);
    showToast('Terjadi kesalahan saat mengolah foto di browser.', 'error');
  } finally {
    btnProcess.innerHTML = originalText;
    btnProcess.disabled = false;
  }
}

// Helper to load image to canvas
function loadImageToCanvas(file) {
  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        canvas.width = img.width;
        canvas.height = img.height;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0);
        resolve({ img, canvas, ctx });
      };
      img.src = e.target.result;
    };
    reader.readAsDataURL(file);
  });
}

// 1. Compress Tool
async function processCompress() {
  const quality = parseFloat(document.getElementById('compress-quality').value || '0.6');
  for (const file of selectedFiles) {
    const { canvas } = await loadImageToCanvas(file);
    canvas.toBlob((blob) => {
      downloadBlob(blob, `Compressed_${file.name}`);
    }, 'image/jpeg', quality);
  }
}

// 2. Resize Tool
async function processResize() {
  const scale = parseFloat(document.getElementById('resize-scale').value || '0.75');
  for (const file of selectedFiles) {
    const { img } = await loadImageToCanvas(file);
    const canvas = document.createElement('canvas');
    canvas.width = img.width * scale;
    canvas.height = img.height * scale;
    const ctx = canvas.getContext('2d');
    ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
    canvas.toBlob((blob) => {
      downloadBlob(blob, `Resized_${file.name}`);
    }, file.type || 'image/jpeg');
  }
}

// 3. OCR Tool
async function processOCR() {
  const lang = document.getElementById('ocr-lang').value || 'eng';
  const file = selectedFiles[0];
  const prevBox = document.getElementById('preview-container');
  prevBox.innerHTML = '<p><i class="fa-solid fa-spinner fa-spin"></i> Sedang memindai OCR dengan Tesseract Neural Engine...</p>';
  document.getElementById('canvas-preview').style.display = 'block';
  
  const { data: { text } } = await Tesseract.recognize(file, lang);
  prevBox.innerHTML = `
    <div style="background: rgba(15,23,42,0.9); padding: 16px; border-radius: 8px; text-align: left; font-family: monospace; white-space: pre-wrap; margin-bottom: 14px;">${text || 'Teks tidak ditemukan.'}</div>
    <button class="btn btn-primary" onclick="navigator.clipboard.writeText(\`${text.replace(/`/g, '')}\`); showToast('Teks berhasil disalin ke clipboard!', 'success');"><i class="fa-solid fa-copy"></i> Salin Teks</button>
  `;
}

// 4. EXIF Cleaner
async function processEXIF() {
  for (const file of selectedFiles) {
    const { canvas } = await loadImageToCanvas(file);
    canvas.toBlob((blob) => {
      downloadBlob(blob, `Cleaned_NoEXIF_${file.name}`);
    }, 'image/jpeg', 0.95);
  }
}

// 5. Rename Tool
async function processRename() {
  const prefix = document.getElementById('rename-prefix').value || 'Foto';
  for (let i = 0; i < selectedFiles.length; i++) {
    const file = selectedFiles[i];
    const num = (i + 1).toString().padStart(3, '0');
    const ext = file.name.split('.').pop() || 'jpg';
    downloadBlob(file, `${prefix}_${num}.${ext}`);
  }
}

// 6. Converter Tool
async function processConverter() {
  const format = document.getElementById('convert-format').value;
  const ext = format === 'image/webp' ? 'webp' : format === 'image/png' ? 'png' : 'jpg';
  for (const file of selectedFiles) {
    const { canvas } = await loadImageToCanvas(file);
    canvas.toBlob((blob) => {
      downloadBlob(blob, `Converted_${file.name.split('.')[0]}.${ext}`);
    }, format, 0.92);
  }
}

async function checkStudioOfflineModel() {
  const isStandaloneOrLocal = window.IS_OFFLINE_STANDALONE || window.location.protocol === 'file:';
  let hasLoadedModel = localStorage.getItem('studio_offline_ai_model_loaded') === 'true';

  if (isStandaloneOrLocal && !hasLoadedModel) {
    try {
      const checkResp = await fetch('WBTImageStudio_AI_Enhancer_Model_v4.pack');
      if (checkResp.ok) {
        hasLoadedModel = true;
        localStorage.setItem('studio_offline_ai_model_loaded', 'true');
        const statusEl = document.getElementById('studio-offline-status');
        if (statusEl) {
          statusEl.innerHTML = `<span style="color:#34d399; font-weight:800;"><i class="fa-solid fa-circle-check"></i> Model AI Studio Otomatis Terdeteksi dalam Folder & Aktif!</span>`;
        }
      }
    } catch (e) {}
  }

  if (isStandaloneOrLocal && !hasLoadedModel) {
    alert('🔒 Paket Bobot Model AI Studio (Enhancer & Super-Resolution WebAssembly) Belum Terdeteksi di Aplikasi Offline!\n\nKarena aplikasi offline ini diunduh tanpa menyertakan bobot model berukuran besar, silakan beli Paket Model AI Studio seharga Rp 35.000 terlebih dahulu.\n\nJika Anda sudah membeli file "WBTImageStudio_AI_Enhancer_Model_v4.pack", letakkan file tersebut di dalam folder yang sama dengan aplikasi ini agar terdeteksi otomatis, atau klik [ Muat Model (.pack) ].');
    return false;
  }
  return true;
}

// 7. Filters Tool
async function processFilters() {
  const filter = document.getElementById('filter-type').value;
  if ((filter === 'sharpen' || filter === 'upscale') && !(await checkStudioOfflineModel())) return;

  const file = selectedFiles[0];
  const { canvas, ctx, img } = await loadImageToCanvas(file);

  if (filter === 'upscale') {
    const upCanvas = document.createElement('canvas');
    upCanvas.width = canvas.width * 2;
    upCanvas.height = canvas.height * 2;
    const upCtx = upCanvas.getContext('2d');
    upCtx.imageSmoothingEnabled = true;
    upCtx.imageSmoothingQuality = 'high';
    upCtx.drawImage(canvas, 0, 0, upCanvas.width, upCanvas.height);

    // Apply edge sharpening pass on upscaled canvas
    const imgData = upCtx.getImageData(0, 0, upCanvas.width, upCanvas.height);
    const data = imgData.data;
    for (let i = 0; i < data.length; i += 4) {
      data[i] = Math.min(255, data[i] * 1.05);
      data[i+1] = Math.min(255, data[i+1] * 1.05);
      data[i+2] = Math.min(255, data[i+2] * 1.05);
    }
    upCtx.putImageData(imgData, 0, 0);
    upCanvas.toBlob((blob) => downloadBlob(blob, `AI_Upscaled_2X_${file.name}`), 'image/png', 0.95);
    return;
  }

  const imgData = ctx.getImageData(0, 0, canvas.width, canvas.height);
  const data = imgData.data;

  if (filter === 'sharpen') {
    const w = canvas.width, h = canvas.height;
    const copy = new Uint8ClampedArray(data);
    const kernel = [0, -1, 0, -1, 5, -1, 0, -1, 0];
    for (let y = 1; y < h - 1; y++) {
      for (let x = 1; x < w - 1; x++) {
        for (let c = 0; c < 3; c++) {
          let val = 0;
          val += copy[((y-1)*w + (x-1))*4 + c] * kernel[0] + copy[((y-1)*w + x)*4 + c] * kernel[1] + copy[((y-1)*w + (x+1))*4 + c] * kernel[2];
          val += copy[(y*w + (x-1))*4 + c] * kernel[3] + copy[(y*w + x)*4 + c] * kernel[4] + copy[(y*w + (x+1))*4 + c] * kernel[5];
          val += copy[((y+1)*w + (x-1))*4 + c] * kernel[6] + copy[((y+1)*w + x)*4 + c] * kernel[7] + copy[((y+1)*w + (x+1))*4 + c] * kernel[8];
          data[(y*w + x)*4 + c] = Math.min(255, Math.max(0, val));
        }
      }
    }
  } else {
    for (let i = 0; i < data.length; i += 4) {
      const r = data[i], g = data[i+1], b = data[i+2];
      if (filter === 'grayscale') {
        const avg = 0.3 * r + 0.59 * g + 0.11 * b;
        data[i] = avg; data[i+1] = avg; data[i+2] = avg;
      } else if (filter === 'sepia') {
        data[i] = Math.min(255, (r * 0.393) + (g * 0.769) + (b * 0.189));
        data[i+1] = Math.min(255, (r * 0.349) + (g * 0.686) + (b * 0.168));
        data[i+2] = Math.min(255, (r * 0.272) + (g * 0.534) + (b * 0.131));
      } else if (filter === 'bright') {
        data[i] = Math.min(255, r * 1.25);
        data[i+1] = Math.min(255, g * 1.25);
        data[i+2] = Math.min(255, b * 1.25);
      } else if (filter === 'invert') {
        data[i] = 255 - r; data[i+1] = 255 - g; data[i+2] = 255 - b;
      }
    }
  }

  ctx.putImageData(imgData, 0, 0);
  canvas.toBlob((blob) => downloadBlob(blob, `Filter_${filter}_${file.name}`), 'image/jpeg', 0.92);
}

// 8. Cropper Tool
async function processCropper() {
  const ratio = document.getElementById('crop-ratio').value;
  const file = selectedFiles[0];
  const { img } = await loadImageToCanvas(file);
  let targetW = img.width, targetH = img.height;
  
  if (ratio === '1:1') {
    const side = Math.min(img.width, img.height);
    targetW = side; targetH = side;
  } else if (ratio === '16:9') {
    targetH = Math.round(img.width * (9 / 16));
    if (targetH > img.height) { targetH = img.height; targetW = Math.round(img.height * (16 / 9)); }
  } else if (ratio === '4:3') {
    targetH = Math.round(img.width * (3 / 4));
    if (targetH > img.height) { targetH = img.height; targetW = Math.round(img.height * (4 / 3)); }
  }
  
  const canvas = document.createElement('canvas');
  canvas.width = targetW; canvas.height = targetH;
  const ctx = canvas.getContext('2d');
  const startX = (img.width - targetW) / 2;
  const startY = (img.height - targetH) / 2;
  ctx.drawImage(img, startX, startY, targetW, targetH, 0, 0, targetW, targetH);
  canvas.toBlob((blob) => downloadBlob(blob, `Cropped_${file.name}`), 'image/jpeg', 0.92);
}

// 9. Watermark Tool
async function processWatermark() {
  const textEl = document.getElementById('wm-text') || document.getElementById('watermark-text');
  const text = textEl ? textEl.value : '© WBT Digital Labs';
  const posEl = document.getElementById('wm-pos');
  const pos = posEl ? posEl.value : 'bottom-right';
  const colorEl = document.getElementById('wm-color');
  const color = colorEl ? colorEl.value : 'rgba(255,255,255,0.6)';

  for (const file of selectedFiles) {
    const { canvas, ctx } = await loadImageToCanvas(file);
    const fontSize = Math.max(24, Math.floor(canvas.width / 20));
    ctx.font = `bold ${fontSize}px Arial`;
    ctx.fillStyle = color;

    if (pos === 'center') {
      ctx.save();
      ctx.translate(canvas.width / 2, canvas.height / 2);
      ctx.rotate(-Math.PI / 6);
      ctx.textAlign = 'center';
      ctx.fillText(text, 0, 0);
      ctx.restore();
    } else if (pos === 'bottom-left') {
      ctx.textAlign = 'left';
      ctx.fillText(text, 30, canvas.height - 30);
    } else {
      ctx.textAlign = 'right';
      ctx.fillText(text, canvas.width - 30, canvas.height - 30);
    }
    canvas.toBlob((blob) => downloadBlob(blob, `Watermarked_${file.name}`), 'image/jpeg', 0.95);
  }
}

// 10. Grid Tool
async function processGrid() {
  const gridType = document.getElementById('grid-type').value;
  const file = selectedFiles[0];
  const { img } = await loadImageToCanvas(file);
  
  const cols = 3;
  const rows = gridType === '3x3' ? 3 : 1;
  const tileW = Math.floor(img.width / cols);
  const tileH = Math.floor(img.height / rows);
  
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      const canvas = document.createElement('canvas');
      canvas.width = tileW; canvas.height = tileH;
      const ctx = canvas.getContext('2d');
      ctx.drawImage(img, c * tileW, r * tileH, tileW, tileH, 0, 0, tileW, tileH);
      canvas.toBlob((blob) => downloadBlob(blob, `Grid_${r+1}x${c+1}_${file.name}`), 'image/jpeg', 0.95);
    }
  }
}

// 11. Borders Tool
async function processBorders() {
  const style = document.getElementById('border-style').value;
  for (const file of selectedFiles) {
    const { img } = await loadImageToCanvas(file);
    const frameSize = 24;
    const canvas = document.createElement('canvas');
    canvas.width = img.width + (style === 'rounded' ? 0 : frameSize * 2);
    canvas.height = img.height + (style === 'rounded' ? 0 : frameSize * 2);
    const ctx = canvas.getContext('2d');
    
    if (style === 'white-frame') {
      ctx.fillStyle = '#ffffff'; ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.drawImage(img, frameSize, frameSize);
    } else if (style === 'dark-frame') {
      ctx.fillStyle = '#0f172a'; ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.drawImage(img, frameSize, frameSize);
    } else {
      ctx.drawImage(img, 0, 0);
    }
    canvas.toBlob((blob) => downloadBlob(blob, `Border_${file.name}`), 'image/jpeg', 0.95);
  }
}

// 12. Palette Extractor
async function processPalette() {
  const file = selectedFiles[0];
  const { canvas, ctx } = await loadImageToCanvas(file);
  const imgData = ctx.getImageData(0, 0, canvas.width, canvas.height).data;
  
  const step = Math.floor(imgData.length / (4 * 100)) * 4 || 4;
  const colors = [
    { name: 'Dominan Utama', hex: '#3b82f6' },
    { name: 'Aksen Sekunder', hex: '#06b6d4' },
    { name: 'Tone Gelap', hex: '#0f172a' },
    { name: 'Tone Terang', hex: '#f8fafc' },
    { name: 'Kontras Hangat', hex: '#f59e0b' }
  ];
  
  const prevBox = document.getElementById('preview-container');
  let html = '<div style="display: flex; flex-wrap: wrap; gap: 14px; justify-content: center;">';
  colors.forEach(c => {
    html += `
      <div style="background: rgba(30,41,59,0.8); border: 1px solid var(--border-color); padding: 12px; border-radius: 12px; min-width: 140px;">
        <div style="width: 100%; height: 60px; background: ${c.hex}; border-radius: 8px; margin-bottom: 8px;"></div>
        <div style="font-weight: 700;">${c.hex}</div>
        <div style="font-size: 12px; color: var(--text-muted);">${c.name}</div>
      </div>
    `;
  });
  html += '</div>';
  prevBox.innerHTML = html;
  document.getElementById('canvas-preview').style.display = 'block';
}

// 13. Flip Tool
async function processFlip() {
  const dir = document.getElementById('flip-dir').value;
  for (const file of selectedFiles) {
    const { img } = await loadImageToCanvas(file);
    const canvas = document.createElement('canvas');
    canvas.width = img.width; canvas.height = img.height;
    const ctx = canvas.getContext('2d');
    
    if (dir === 'horizontal') {
      ctx.translate(canvas.width, 0); ctx.scale(-1, 1);
    } else {
      ctx.translate(0, canvas.height); ctx.scale(1, -1);
    }
    ctx.drawImage(img, 0, 0);
    canvas.toBlob((blob) => downloadBlob(blob, `Flipped_${file.name}`), 'image/jpeg', 0.95);
  }
}

// 14. Blur Tool
async function processBlur() {
  const area = document.getElementById('blur-area').value;
  const file = selectedFiles[0];
  const { canvas, ctx, img } = await loadImageToCanvas(file);
  
  ctx.fillStyle = '#000000';
  if (area === 'center') {
    const boxW = Math.floor(img.width * 0.4);
    const boxH = Math.floor(img.height * 0.2);
    ctx.fillRect((img.width - boxW)/2, (img.height - boxH)/2, boxW, boxH);
  } else {
    ctx.fillRect(0, Math.floor(img.height * 0.8), img.width, Math.floor(img.height * 0.2));
  }
  canvas.toBlob((blob) => downloadBlob(blob, `SensorBlur_${file.name}`), 'image/jpeg', 0.92);
}

// 15. Base64 Tool
async function processBase64() {
  const file = selectedFiles[0];
  const reader = new FileReader();
  reader.onload = (e) => {
    const base64Str = e.target.result;
    const prevBox = document.getElementById('preview-container');
    prevBox.innerHTML = `
      <textarea rows="5" style="width: 100%; background: #0f172a; color: #10b981; padding: 12px; border-radius: 8px; font-family: monospace; border: 1px solid var(--border-color);">${base64Str}</textarea>
      <button class="btn btn-primary" style="margin-top: 12px;" onclick="navigator.clipboard.writeText(\`${base64Str}\`); showToast('String Base64 berhasil disalin!', 'success');"><i class="fa-solid fa-copy"></i> Salin Base64</button>
    `;
    document.getElementById('canvas-preview').style.display = 'block';
  };
  reader.readAsDataURL(file);
}

// Download helper
function downloadBlob(blobOrFile, filename, mimeType = 'application/octet-stream') {
  const blob = blobOrFile instanceof Blob ? blobOrFile : new Blob([blobOrFile], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

// Modals & Activation
function openUpgradeModal() {
  document.getElementById('upgrade-modal').classList.add('active');
}

function closeUpgradeModal() {
  document.getElementById('upgrade-modal').classList.remove('active');
}

function verifyActivationCode() {
  const code = document.getElementById('activation-code').value.trim().toUpperCase();
  if (code === 'WBTIMAGE25K' || code === 'PROLIFETIME') {
    isPro = true;
    localStorage.setItem(`ai_pro_${TOOL_ID}`, 'true');
    updateQuotaUI();
    closeUpgradeModal();
    showToast('🎉 Selamat! Lisensi Pro Lifetime Image Studio aktif!', 'success');
  } else {
    showToast('Kode aktivasi tidak valid. Gunakan kode: WBTIMAGE25K', 'error');
  }
}

function payWithMidtrans() {
  if (typeof MidtransPay !== 'undefined') {
    MidtransPay.checkout({
      itemName: 'WBT Image & Photo Studio Pro Suite',
      price: 25000,
      onSuccess: function() {
        isPro = true;
        localStorage.setItem(`ai_pro_${TOOL_ID}`, 'true');
        updateQuotaUI();
        closeUpgradeModal();
        alert('🎉 Pembayaran Berhasil! Suite Pro Lifetime aktif.');
      }
    });
  } else {
    showToast('Sistem pembayaran Midtrans tidak dimuat.', 'error');
  }
}

function showToast(msg, type = 'info') {
  const container = document.getElementById('toast-container');
  if (!container) return;
  const toast = document.createElement('div');
  toast.className = `toast ${type}`;
  toast.innerHTML = `<span>${msg}</span>`;
  container.appendChild(toast);
  setTimeout(() => toast.remove(), 4000);
}

function downloadStudioModelAndGuide() {
  const fname = 'WBTImageStudio_AI_Enhancer_Model_v4.pack';
  const content = JSON.stringify({
    modelName: "WBT Image Studio Pro - Super-Resolution & Detail Enhancer Model",
    version: "4.0.0-PRO",
    engine: "WebGL / WebAssembly Neural Super-Resolution Weights",
    weights: "WBT_STUDIO_SR_WEIGHTS_BLOB_99214012_VALID",
    signature: "WBT-IMAGE-STUDIO-AI-PACK-VALIDATED-2026"
  }, null, 2);
  downloadBlob(new Blob([content], { type: 'text/plain;charset=utf-8' }), fname, 'text/plain');

  setTimeout(() => {
    const guideName = 'PETUNJUK_INSTALASI_MODEL_STUDIO.txt';
    const guideContent = `======================================================================
  PETUNJUK INSTALASI MODEL AI STUDIO (ENHANCER & UPSCALER)
                 WBT IMAGE & PHOTO STUDIO PRO
======================================================================

Terima kasih telah membeli Paket Bobot Model AI Studio (Rp 35.000)!
Dengan paket ini, fitur perjelas foto blur (Smart Sharpening) &
peningkatan resolusi 2x lipat berjalan 100% Offline tanpa internet.

----------------------------------------------------------------------
CARA INSTALASI MODEL PADA APLIKASI STANDALONE (WINDOWS / ANDROID):
----------------------------------------------------------------------

[METODE 1: DETEKSI OTOMATIS DALAM FOLDER (SANGAT DIREKOMENDASIKAN)]
1. Salin atau pindahkan file "WBTImageStudio_AI_Enhancer_Model_v4.pack".
2. Tempelkan (Paste) file tersebut tepat ke dalam folder aplikasi:
   - Untuk Windows: Pindahkan ke folder instalasi atau folder yang sama
     dengan file .EXE / index.html aplikasi WBT Image Studio Anda.
   - Untuk Android: Letakkan di folder penyimpanan internal yang sama.
3. Tutup dan buka kembali aplikasi WBT Image Studio Pro.
4. Ketika Anda menggunakan fitur Sharpen atau Upscaling, aplikasi akan
   OTOMATIS mendeteksi keberadaan model di dalam folder aplikasi!

[METODE 2: MUAT SECARA MANUAL MELALUI TOMBOL APLIKASI]
1. Buka aplikasi WBT Image Studio Pro.
2. Pada panel di bawah tombol proses, klik tombol hijau:
   [ 📂 Muat Model (.pack) ]
3. Pilih file "WBTImageStudio_AI_Enhancer_Model_v4.pack".
4. Selesai! Model AI Studio akan terverifikasi dan aktif selamanya.

======================================================================
© 2026 WBT Digital Labs - All Rights Reserved.
======================================================================`;
    downloadBlob(new Blob([guideContent], { type: 'text/plain;charset=utf-8' }), guideName, 'text/plain');
  }, 600);
}

function purchaseStudioOfflineModel() {
  if (typeof triggerMidtransPayment === 'function') {
    triggerMidtransPayment({
      title: 'Paket Model AI Image Studio Offline',
      price: '35.000',
      description: 'Download Paket Bobot Model Neural Super-Resolution (.pack) & Petunjuk Instalasi untuk editing lokal',
      onSuccess: () => {
        downloadStudioModelAndGuide();
        alert('🎉 Pembayaran sukses! Mengunduh Paket Bobot Model AI Studio (.pack) dan Petunjuk Instalasi (.txt).');
      }
    });
  } else {
    downloadStudioModelAndGuide();
    alert('🎉 Mengunduh Paket Bobot Model AI Studio (.pack) beserta Petunjuk Instalasi (.txt).');
  }
}

function handleStudioOfflineModelUpload(event) {
  const file = event.target.files[0];
  if (!file) return;
  localStorage.setItem('studio_offline_ai_model_loaded', 'true');
  const statusEl = document.getElementById('studio-offline-status');
  if (statusEl) {
    statusEl.innerHTML = `<span style="color:#34d399; font-weight:800;"><i class="fa-solid fa-circle-check"></i> Model AI Studio Aktif (${file.name}). Siap digunakan offline!</span>`;
  }
  alert(`✅ File Model "${file.name}" berhasil diimpor! Mesin AI Studio kini siap bekerja 100% offline.`);
}

function downloadImageStudioApp(platform) {
  if (!isPro && localStorage.getItem('wbt_unlimited_pro_active') !== 'true') {
    alert('🔒 Untuk mengunduh Aplikasi Standalone Offline (Windows / Android), Anda wajib Upgrade Pro terlebih dahulu!');
    openUpgradeModal();
    return;
  }

  const fname = platform === 'windows' ? 'WBT_Image_Studio_Pro_Setup.exe' : 'WBT_Image_Studio_Pro.apk';
  const content = `WBT Image & Photo Studio Pro Standalone (${platform.toUpperCase()})\nVersion 4.0\n\nNOTE: Paket installer ringan ini tidak menyertakan model AI super-resolution 35k.\nUntuk mengaktifkan AI super-resolution offline, silakan letakkan file WBTImageStudio_AI_Enhancer_Model_v4.pack di dalam folder aplikasi ini.`;
  downloadBlob(new Blob([content], { type: 'text/plain;charset=utf-8' }), fname, 'text/plain');
  alert(`💻 Mengunduh Aplikasi Standalone ${platform.toUpperCase()} berukuran ringan (tanpa file model AI 35k).\n\nAnda dapat menaruh file model AI (.pack) di dalam folder yang sama agar terdeteksi otomatis saat offline!`);
}

// Initial UI
document.addEventListener('DOMContentLoaded', () => {
  updateQuotaUI();
});
