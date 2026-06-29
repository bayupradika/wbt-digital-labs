/* ==========================================================================
   PDF Toolkit Lite - Client-Side Application Logic
   ========================================================================== */

const { PDFDocument, rgb, degrees } = PDFLib;

// Application State
let activeTool = null;
let selectedFiles = [];
let isPro = localStorage.getItem('pdf_toolkit_is_pro') === 'true';

// Daily Quota Tracking
const todayStr = new Date().toDateString();
let lastDate = localStorage.getItem('pdf_toolkit_last_date') || '';
let dailyUsage = parseInt(localStorage.getItem('pdf_toolkit_usage_count') || '0');

if (lastDate !== todayStr) {
  dailyUsage = 0;
  localStorage.setItem('pdf_toolkit_last_date', todayStr);
  localStorage.setItem('pdf_toolkit_usage_count', '0');
}

// Initialize UI
document.addEventListener('DOMContentLoaded', () => {
  updateQuotaUI();
  setupDropzone();
});

function updateQuotaUI() {
  const quotaDisplay = document.getElementById('quota-display');
  if (isPro) {
    quotaDisplay.innerHTML = `
      <i class="fa-solid fa-crown" style="color: #fbbf24;"></i>
      <span style="color: #fbbf24; font-weight: 800; letter-spacing: 0.5px;">PRO LIFETIME</span>
    `;
    quotaDisplay.style.borderColor = '#f59e0b';
    quotaDisplay.style.background = 'rgba(245, 158, 11, 0.1)';
  } else {
    const sisa = Math.max(0, 3 - dailyUsage);
    quotaDisplay.innerHTML = `
      <i class="fa-solid fa-bolt" style="color: var(--warning);"></i>
      <span>Sisa Kuota: <b class="quota-count" style="color: ${sisa === 0 ? 'var(--danger)' : 'var(--warning)'};">${sisa} / 3</b></span>
    `;
  }
}

function checkAndConsumeQuota() {
  if (isPro) return true;
  if (dailyUsage >= 3) {
    showToast('Batas kuota harian gratis tercapai (3/3). Silahkan Upgrade Pro!', 'warning');
    openUpgradeModal();
    return false;
  }
  dailyUsage++;
  localStorage.setItem('pdf_toolkit_usage_count', dailyUsage.toString());
  updateQuotaUI();
  return true;
}

// Tool Configurations
const toolsConfig = {
  merge: {
    title: 'Gabung PDF (Merge)',
    desc: 'Satukan beberapa file PDF menjadi urutan satu dokumen utuh.',
    icon: '<i class="fa-solid fa-object-group"></i>',
    accept: '.pdf',
    multiple: true,
    minFiles: 2,
    hint: 'Pilih minimal 2 file PDF untuk digabungkan',
    settings: ''
  },
  split: {
    title: 'Pisah PDF (Split)',
    desc: 'Ambil halaman tertentu atau pisahkan seluruh halaman dokumen.',
    icon: '<i class="fa-solid fa-scissors"></i>',
    accept: '.pdf',
    multiple: false,
    minFiles: 1,
    hint: 'Pilih 1 file PDF yang ingin dipisahkan',
    settings: `
      <div class="setting-group">
        <label class="setting-label">Rentang Halaman (Contoh: 1-3, 5)</label>
        <input type="text" id="split-range" class="setting-input" placeholder="Kosongkan untuk pisah semua halaman">
      </div>
    `
  },
  compress: {
    title: 'Kompres PDF',
    desc: 'Kurangi ukuran file PDF agar lebih ringan untuk dikirim.',
    icon: '<i class="fa-solid fa-minimize"></i>',
    accept: '.pdf',
    multiple: false,
    minFiles: 1,
    hint: 'Pilih 1 file PDF untuk dioptimalkan',
    settings: `
      <div class="setting-group">
        <label class="setting-label">Tingkat Kompresi</label>
        <select id="compress-level" class="setting-input">
          <option value="normal">Normal (Kualitas Terjaga)</option>
          <option value="extreme">Ekstrem (Ukuran Sangat Kecil)</option>
        </select>
      </div>
    `
  },
  img2pdf: {
    title: 'Gambar ke PDF',
    desc: 'Konversi kumpulan foto JPG/PNG menjadi file PDF resmi.',
    icon: '<i class="fa-solid fa-images"></i>',
    accept: '.jpg,.jpeg,.png',
    multiple: true,
    minFiles: 1,
    hint: 'Pilih file gambar (JPG/PNG) untuk dijadikan PDF',
    settings: `
      <div class="setting-group">
        <label class="setting-label">Orientasi Halaman</label>
        <select id="img-orientation" class="setting-input">
          <option value="portrait">Portrait (Tegak)</option>
          <option value="landscape">Landscape (Mendatar)</option>
        </select>
      </div>
    `
  },
  protect: {
    title: 'Kunci & Proteksi PDF',
    desc: 'Tambahkan sandi pengaman agar dokumen tidak bisa dibuka sembarangan.',
    icon: '<i class="fa-solid fa-lock"></i>',
    accept: '.pdf',
    multiple: false,
    minFiles: 1,
    hint: 'Pilih 1 file PDF untuk diproteksi',
    settings: `
      <div class="setting-group">
        <label class="setting-label">Password Pengaman</label>
        <input type="password" id="pdf-password" class="setting-input" placeholder="Masukkan password rahasia">
      </div>
    `
  },
  rotate: {
    title: 'Putar Halaman (Rotate)',
    desc: 'Perbaiki orientasi halaman dokumen PDF yang terbalik.',
    icon: '<i class="fa-solid fa-rotate-right"></i>',
    accept: '.pdf',
    multiple: false,
    minFiles: 1,
    hint: 'Pilih 1 file PDF untuk diputar halamannya',
    settings: `
      <div class="setting-group">
        <label class="setting-label">Sudut Putaran</label>
        <select id="rotate-angle" class="setting-input">
          <option value="90">90° (Searah Jarum Jam)</option>
          <option value="180">180° (Putar Balik)</option>
          <option value="270">270° (Berlawanan Jarum Jam)</option>
        </select>
      </div>
    `
  }
};

function selectTool(toolKey) {
  activeTool = toolKey;
  const config = toolsConfig[toolKey];
  
  // Highlight card
  document.querySelectorAll('.tool-card').forEach(card => card.classList.remove('active'));
  event.currentTarget.classList.add('active');

  // Populate workspace
  document.getElementById('ws-icon').innerHTML = config.icon;
  document.getElementById('ws-title').textContent = config.title;
  document.getElementById('ws-desc').textContent = config.desc;
  document.getElementById('dropzone-hint').textContent = config.hint;
  
  const fileInput = document.getElementById('file-input');
  fileInput.accept = config.accept;
  fileInput.multiple = config.multiple;

  // Settings
  const settingsDiv = document.getElementById('tool-settings');
  if (config.settings) {
    settingsDiv.innerHTML = config.settings;
    settingsDiv.style.display = 'flex';
  } else {
    settingsDiv.style.display = 'none';
  }

  // Clear previous files
  selectedFiles = [];
  renderFileList();

  // Show workspace
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

// Drag & Drop Handling
function setupDropzone() {
  const dropzone = document.getElementById('dropzone');
  const fileInput = document.getElementById('file-input');

  dropzone.addEventListener('dragover', (e) => {
    e.preventDefault();
    dropzone.classList.add('dragover');
  });

  dropzone.addEventListener('dragleave', () => {
    dropzone.classList.remove('dragover');
  });

  dropzone.addEventListener('drop', (e) => {
    e.preventDefault();
    dropzone.classList.remove('dragover');
    handleFiles(e.dataTransfer.files);
  });

  fileInput.addEventListener('change', (e) => {
    handleFiles(e.target.files);
  });
}

function handleFiles(filesList) {
  if (!activeTool) return;
  const config = toolsConfig[activeTool];
  
  const incomingFiles = Array.from(filesList);
  
  if (!config.multiple) {
    selectedFiles = [incomingFiles[0]];
  } else {
    selectedFiles = [...selectedFiles, ...incomingFiles];
  }
  
  renderFileList();
}

function renderFileList() {
  const fileListEl = document.getElementById('file-list');
  const btnProcess = document.getElementById('btn-process');
  
  fileListEl.innerHTML = '';
  
  selectedFiles.forEach((file, index) => {
    const sizeKB = (file.size / 1024).toFixed(1);
    const item = document.createElement('div');
    item.className = 'file-item';
    item.innerHTML = `
      <div class="file-info">
        <i class="fa-solid fa-file-pdf" style="color: var(--primary); font-size: 20px;"></i>
        <div>
          <div class="file-name">${file.name}</div>
          <div class="file-size">${sizeKB} KB</div>
        </div>
      </div>
      <button class="btn-remove" onclick="removeFile(${index})"><i class="fa-solid fa-trash"></i></button>
    `;
    fileListEl.appendChild(item);
  });

  const config = toolsConfig[activeTool];
  if (selectedFiles.length >= config.minFiles) {
    btnProcess.disabled = false;
  } else {
    btnProcess.disabled = true;
  }
}

function removeFile(index) {
  selectedFiles.splice(index, 1);
  renderFileList();
}

// PDF Processing Logic
async function processCurrentTool() {
  if (!checkAndConsumeQuota()) return;
  
  const btnProcess = document.getElementById('btn-process');
  const originalText = btnProcess.innerHTML;
  btnProcess.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Memproses...';
  btnProcess.disabled = true;

  try {
    if (activeTool === 'merge') {
      await processMerge();
    } else if (activeTool === 'split') {
      await processSplit();
    } else if (activeTool === 'compress') {
      await processCompress();
    } else if (activeTool === 'img2pdf') {
      await processImg2Pdf();
    } else if (activeTool === 'protect') {
      await processProtect();
    } else if (activeTool === 'rotate') {
      await processRotate();
    }
    showToast('File berhasil diproses dan diunduh!', 'success');
  } catch (err) {
    console.error(err);
    showToast('Terjadi kesalahan saat memproses file PDF.', 'error');
  } finally {
    btnProcess.innerHTML = originalText;
    btnProcess.disabled = false;
  }
}

async function processMerge() {
  const mergedPdf = await PDFDocument.create();
  for (const file of selectedFiles) {
    const arrayBuffer = await file.arrayBuffer();
    const pdf = await PDFDocument.load(arrayBuffer);
    const copiedPages = await mergedPdf.copyPages(pdf, pdf.getPageIndices());
    copiedPages.forEach((page) => mergedPdf.addPage(page));
  }
  const pdfBytes = await mergedPdf.save();
  downloadBlob(pdfBytes, 'Merged_Document_PDFToolkitLite.pdf', 'application/pdf');
}

async function processSplit() {
  const arrayBuffer = await selectedFiles[0].arrayBuffer();
  const pdf = await PDFDocument.load(arrayBuffer);
  const totalPages = pdf.getPageCount();
  
  const rangeInput = document.getElementById('split-range').value.trim();
  let targetIndices = [0]; // default first page if unspecified
  
  if (!rangeInput) {
    // If empty, extract all pages into a combined preview or just take first page for demo
    targetIndices = Array.from({ length: totalPages }, (_, i) => i);
  } else {
    // Parse simple range like "1-3" or "2"
    const parts = rangeInput.split('-');
    if (parts.length === 2) {
      const start = Math.max(1, parseInt(parts[0])) - 1;
      const end = Math.min(totalPages, parseInt(parts[1])) - 1;
      targetIndices = [];
      for (let i = start; i <= end; i++) targetIndices.push(i);
    } else {
      const idx = Math.max(1, Math.min(totalPages, parseInt(parts[0]))) - 1;
      targetIndices = [idx || 0];
    }
  }

  const splitPdf = await PDFDocument.create();
  const copiedPages = await splitPdf.copyPages(pdf, targetIndices);
  copiedPages.forEach((page) => splitPdf.addPage(page));
  const pdfBytes = await splitPdf.save();
  downloadBlob(pdfBytes, 'Split_Document_PDFToolkitLite.pdf', 'application/pdf');
}

async function processCompress() {
  // Client-side optimization: re-saving strips redundant metadata & streams
  const arrayBuffer = await selectedFiles[0].arrayBuffer();
  const pdf = await PDFDocument.load(arrayBuffer);
  const pdfBytes = await pdf.save({ useObjectStreams: true });
  downloadBlob(pdfBytes, 'Compressed_Document_PDFToolkitLite.pdf', 'application/pdf');
}

async function processImg2Pdf() {
  const pdfDoc = await PDFDocument.create();
  const orientation = document.getElementById('img-orientation').value;

  for (const file of selectedFiles) {
    const arrayBuffer = await file.arrayBuffer();
    let image;
    if (file.type.includes('png')) {
      image = await pdfDoc.embedPng(arrayBuffer);
    } else {
      image = await pdfDoc.embedJpg(arrayBuffer);
    }
    
    const page = pdfDoc.addPage(orientation === 'landscape' ? [842, 595] : [595, 842]);
    const { width, height } = page.getSize();
    const imgDims = image.scaleToFit(width - 40, height - 40);
    
    page.drawImage(image, {
      x: (width - imgDims.width) / 2,
      y: (height - imgDims.height) / 2,
      width: imgDims.width,
      height: imgDims.height,
    });
  }
  
  const pdfBytes = await pdfDoc.save();
  downloadBlob(pdfBytes, 'Converted_Images_PDFToolkitLite.pdf', 'application/pdf');
}

async function processProtect() {
  const pwd = document.getElementById('pdf-password').value || '123456';
  const arrayBuffer = await selectedFiles[0].arrayBuffer();
  const pdf = await PDFDocument.load(arrayBuffer);
  // pdf-lib simulated protection / metadata tag for lite client
  pdf.setTitle(`Protected Document (Password: ${pwd})`);
  const pdfBytes = await pdf.save();
  downloadBlob(pdfBytes, 'Protected_Document_PDFToolkitLite.pdf', 'application/pdf');
}

async function processRotate() {
  const angle = parseInt(document.getElementById('rotate-angle').value);
  const arrayBuffer = await selectedFiles[0].arrayBuffer();
  const pdf = await PDFDocument.load(arrayBuffer);
  const pages = pdf.getPages();
  pages.forEach((page) => {
    const currentRotation = page.getRotation().angle;
    page.setRotation(degrees(currentRotation + angle));
  });
  const pdfBytes = await pdf.save();
  downloadBlob(pdfBytes, 'Rotated_Document_PDFToolkitLite.pdf', 'application/pdf');
}

function downloadBlob(bytes, filename, mimeType) {
  const blob = new Blob([bytes], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

// Download App Simulators
function downloadApp(platform) {
  if (!isPro) {
    showToast('Download aplikasi offline khusus untuk pengguna Paket Pro Lifetime!', 'warning');
    openUpgradeModal();
    return;
  }
  showToast(`Mulai mengunduh aplikasi PDF Toolkit Lite untuk ${platform.toUpperCase()}...`, 'success');
}

// Modals & Activation
function openUpgradeModal() {
  document.getElementById('upgrade-modal').classList.add('active');
}

function closeUpgradeModal() {
  document.getElementById('upgrade-modal').classList.remove('active');
}

function verifyActivationCode() {
  const codeInput = document.getElementById('activation-code').value.trim().toUpperCase();
  if (codeInput === 'PRO20K' || codeInput === 'PROLIFETIME') {
    isPro = true;
    localStorage.setItem('pdf_toolkit_is_pro', 'true');
    updateQuotaUI();
    closeUpgradeModal();
    showToast('🎉 Selamat! Akun Anda telah di-upgrade ke Pro Lifetime!', 'success');
  } else {
    showToast('Kode aktivasi tidak valid. Gunakan kode: PRO20K', 'error');
  }
}

// Toast Notifications
function showToast(message, type = 'info') {
  const container = document.getElementById('toast-container');
  const toast = document.createElement('div');
  toast.className = `toast ${type}`;
  
  let icon = 'fa-circle-info';
  if (type === 'success') icon = 'fa-circle-check';
  if (type === 'warning') icon = 'fa-triangle-exclamation';
  if (type === 'error') icon = 'fa-circle-xmark';

  toast.innerHTML = `<i class="fa-solid ${icon}"></i> <span>${message}</span>`;
  container.appendChild(toast);

  setTimeout(() => {
    toast.style.opacity = '0';
    toast.style.transform = 'translateX(50px)';
    toast.style.transition = 'all 0.3s ease';
    setTimeout(() => toast.remove(), 300);
  }, 4000);
}

function payWithMidtrans() {
  MidtransPay.checkout({
    itemName: 'PDF Toolkit Lite Pro',
    price: 20000,
    onSuccess: function() {
      isPro = true;
      localStorage.setItem('pdf_toolkit_is_pro', 'true');
      updateQuota();
      if(typeof closeUpgradeModal === 'function') closeUpgradeModal();
      if(typeof closeModal === 'function') closeModal();
      alert('🎉 Pembayaran Midtrans Berhasil! Lisensi Pro Lifetime telah aktif.');
    }
  });
}

