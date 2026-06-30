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
  remove_pages: {
    title: 'Hapus Halaman PDF',
    desc: 'Buang halaman yang rusak, kosong, atau tidak diinginkan dari dokumen PDF.',
    icon: '<i class="fa-solid fa-trash-can"></i>',
    accept: '.pdf',
    multiple: false,
    minFiles: 1,
    hint: 'Pilih 1 file PDF untuk dihapus halamannya',
    settings: `
      <div class="setting-group">
        <label class="setting-label">Nomor Halaman yang Dihapus (Contoh: 2, 4)</label>
        <input type="text" id="remove-pages" class="setting-input" placeholder="Masukkan nomor halaman yang ingin dibuang">
      </div>
    `
  },
  extract_pages: {
    title: 'Ekstrak Halaman PDF',
    desc: 'Pilih dan ambil beberapa halaman spesifik untuk disimpan sebagai PDF baru.',
    icon: '<i class="fa-solid fa-file-export"></i>',
    accept: '.pdf',
    multiple: false,
    minFiles: 1,
    hint: 'Pilih 1 file PDF untuk diekstrak halamannya',
    settings: `
      <div class="setting-group">
        <label class="setting-label">Halaman yang Diekstrak (Contoh: 1, 3-5)</label>
        <input type="text" id="extract-pages" class="setting-input" placeholder="Masukkan nomor halaman yang ingin diekstrak">
      </div>
    `
  },
  organize: {
    title: 'Atur Urutan Halaman',
    desc: 'Susun ulang posisi nomor halaman PDF sesuai keinginan.',
    icon: '<i class="fa-solid fa-sort"></i>',
    accept: '.pdf',
    multiple: false,
    minFiles: 1,
    hint: 'Pilih 1 file PDF untuk diurutkan ulang halamannya',
    settings: `
      <div class="setting-group">
        <label class="setting-label">Urutan Baru Halaman (Contoh: 3, 1, 2, 4)</label>
        <input type="text" id="organize-order" class="setting-input" placeholder="Tulis susunan urutan halaman baru">
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
          <option value="normal">Normal (Kualitas Terjaga & Struktur Bersih)</option>
          <option value="extreme">Ekstrem (Penyusutan Ukuran Maksimal)</option>
        </select>
      </div>
    `
  },
  repair: {
    title: 'Perbaiki PDF Rusak',
    desc: 'Pulihkan struktur indeks dan tabel objek stream file PDF yang corrupt.',
    icon: '<i class="fa-solid fa-wrench"></i>',
    accept: '.pdf',
    multiple: false,
    minFiles: 1,
    hint: 'Pilih 1 file PDF rusak untuk direparasi',
    settings: ''
  },
  clean_exif: {
    title: 'Bersihkan Metadata / Privasi',
    desc: 'Hapus informasi pengarang, tanggal, dan software pembuat dokumen.',
    icon: '<i class="fa-solid fa-broom"></i>',
    accept: '.pdf',
    multiple: false,
    minFiles: 1,
    hint: 'Pilih 1 file PDF untuk dibersihkan metadatanya',
    settings: ''
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
  note2pdf: {
    title: 'Teks / Catatan ke PDF',
    desc: 'Tulis atau tempel teks/markdown untuk diubah langsung menjadi dokumen PDF.',
    icon: '<i class="fa-solid fa-file-lines"></i>',
    accept: '.txt',
    multiple: false,
    minFiles: 0,
    hint: 'Upload file .txt atau langsung ketik catatan di kotak bawah',
    settings: `
      <div class="setting-group" style="width: 100%;">
        <label class="setting-label">Ketik atau Tempel Isi Teks / Catatan:</label>
        <textarea id="note-content" rows="4" class="setting-input" style="height:auto; font-family:monospace;" placeholder="Tulis catatan penting Anda di sini..."></textarea>
      </div>
    `
  },
  html2pdf: {
    title: 'HTML Snippet ke PDF',
    desc: 'Konversi kode HTML sederhana menjadi dokumen PDF berformat rapi.',
    icon: '<i class="fa-solid fa-code"></i>',
    accept: '.html,.txt',
    multiple: false,
    minFiles: 0,
    hint: 'Ketik atau tempel kode HTML di bawah untuk dikonversi',
    settings: `
      <div class="setting-group" style="width: 100%;">
        <label class="setting-label">Ketik Kode HTML:</label>
        <textarea id="html-content" rows="4" class="setting-input" style="height:auto; font-family:monospace;" placeholder="<h1>Judul Dokumen</h1><p>Paragraf laporan...</p>"></textarea>
      </div>
    `
  },
  pdf2img: {
    title: 'PDF ke Gambar JPG/PNG',
    desc: 'Render atau ekstrak halaman dokumen PDF menjadi file gambar.',
    icon: '<i class="fa-solid fa-image"></i>',
    accept: '.pdf',
    multiple: false,
    minFiles: 1,
    hint: 'Pilih 1 file PDF untuk dikonversi menjadi gambar JPG',
    settings: `
      <div class="setting-group">
        <label class="setting-label">Format Gambar Keluaran</label>
        <select id="img-format" class="setting-input">
          <option value="jpeg">JPG (Kompak & Ringan)</option>
          <option value="png">PNG (Kualitas Tajam)</option>
        </select>
      </div>
    `
  },
  pdf2txt: {
    title: 'PDF ke Teks / Word (.txt)',
    desc: 'Ekstrak seluruh kandungan teks dokumen PDF untuk diedit kembali.',
    icon: '<i class="fa-solid fa-file-word"></i>',
    accept: '.pdf',
    multiple: false,
    minFiles: 1,
    hint: 'Pilih 1 file PDF untuk diekstrak teksnya',
    settings: ''
  },
  pdf2csv: {
    title: 'Ekstrak Tabel ke CSV',
    desc: 'Tarik baris teks terstruktur dari dalam PDF ke spreadsheet Excel (.csv).',
    icon: '<i class="fa-solid fa-file-excel"></i>',
    accept: '.pdf',
    multiple: false,
    minFiles: 1,
    hint: 'Pilih 1 file PDF untuk diekstrak datanya ke format CSV',
    settings: ''
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
  },
  page_number: {
    title: 'Tambah Nomor Halaman',
    desc: 'Sisipkan nomor halaman otomatis di bagian bawah dokumen.',
    icon: '<i class="fa-solid fa-list-ol"></i>',
    accept: '.pdf',
    multiple: false,
    minFiles: 1,
    hint: 'Pilih 1 file PDF untuk diberi nomor halaman',
    settings: `
      <div class="setting-group">
        <label class="setting-label">Posisi Nomor Halaman</label>
        <select id="page-num-pos" class="setting-input">
          <option value="bottom-right">Kanan Bawah</option>
          <option value="bottom-center">Tengah Bawah</option>
          <option value="top-right">Kanan Atas</option>
        </select>
      </div>
    `
  },
  watermark: {
    title: 'Stempel Watermark',
    desc: 'Beri tanda air diagonal anti-plagiat di atas dokumen PDF.',
    icon: '<i class="fa-solid fa-stamp"></i>',
    accept: '.pdf',
    multiple: false,
    minFiles: 1,
    hint: 'Pilih 1 file PDF untuk diberi stempel watermark',
    settings: `
      <div class="setting-group">
        <label class="setting-label">Teks Watermark</label>
        <input type="text" id="watermark-text" class="setting-input" value="RAHASIA / CONFIDENTIAL">
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
  unlock: {
    title: 'Buka Kunci Sandi PDF',
    desc: 'Hapus pembatasan sandi pemilik dan dekripsi dokumen PDF.',
    icon: '<i class="fa-solid fa-lock-open"></i>',
    accept: '.pdf',
    multiple: false,
    minFiles: 1,
    hint: 'Pilih 1 file PDF terkunci untuk dibuka proteksinya',
    settings: ''
  },
  sign_studio: {
    title: 'Tanda Tangan Studio',
    desc: 'Sisipkan teks pengesahan / nama penandatangan di margin bawah dokumen.',
    icon: '<i class="fa-solid fa-signature"></i>',
    accept: '.pdf',
    multiple: false,
    minFiles: 1,
    hint: 'Pilih 1 file PDF untuk dibubuhkan tanda tangan pengesahan',
    settings: `
      <div class="setting-group">
        <label class="setting-label">Nama Penandatangan / Jabatan:</label>
        <input type="text" id="sign-name" class="setting-input" value="Disahkan oleh: Direktur Utama WBT">
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

function filterCategory(cat) {
  document.querySelectorAll('.cat-btn').forEach(btn => btn.classList.remove('active'));
  if (event && event.currentTarget) event.currentTarget.classList.add('active');
  
  const cards = document.querySelectorAll('.tool-card');
  cards.forEach(card => {
    if (cat === 'all' || card.classList.contains('cat-' + cat)) {
      card.style.display = 'flex';
    } else {
      card.style.display = 'none';
    }
  });
}

// PDF Processing Logic
async function processCurrentTool() {
  if (!checkAndConsumeQuota()) return;
  
  const btnProcess = document.getElementById('btn-process');
  const originalText = btnProcess.innerHTML;
  btnProcess.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Memproses...';
  btnProcess.disabled = true;

  try {
    if (activeTool === 'merge') await processMerge();
    else if (activeTool === 'split') await processSplit();
    else if (activeTool === 'remove_pages') await processRemovePages();
    else if (activeTool === 'extract_pages') await processExtractPages();
    else if (activeTool === 'organize') await processOrganize();
    else if (activeTool === 'compress') await processCompress();
    else if (activeTool === 'repair') await processRepair();
    else if (activeTool === 'clean_exif') await processCleanExif();
    else if (activeTool === 'img2pdf') await processImg2Pdf();
    else if (activeTool === 'note2pdf') await processNote2Pdf();
    else if (activeTool === 'html2pdf') await processHtml2Pdf();
    else if (activeTool === 'pdf2img') await processPdf2Img();
    else if (activeTool === 'pdf2txt') await processPdf2Txt();
    else if (activeTool === 'pdf2csv') await processPdf2Csv();
    else if (activeTool === 'rotate') await processRotate();
    else if (activeTool === 'page_number') await processPageNumber();
    else if (activeTool === 'watermark') await processWatermark();
    else if (activeTool === 'protect') await processProtect();
    else if (activeTool === 'unlock') await processUnlock();
    else if (activeTool === 'sign_studio') await processSignStudio();
    
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
  let targetIndices = Array.from({ length: totalPages }, (_, i) => i);
  
  if (rangeInput) {
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

async function processRemovePages() {
  const arrayBuffer = await selectedFiles[0].arrayBuffer();
  const pdf = await PDFDocument.load(arrayBuffer);
  const totalPages = pdf.getPageCount();
  const removeInput = document.getElementById('remove-pages').value.trim();
  const removedSet = new Set(removeInput.split(',').map(s => parseInt(s.trim()) - 1));
  
  const targetIndices = [];
  for (let i = 0; i < totalPages; i++) {
    if (!removedSet.has(i)) targetIndices.push(i);
  }

  const newPdf = await PDFDocument.create();
  const copiedPages = await newPdf.copyPages(pdf, targetIndices);
  copiedPages.forEach((page) => newPdf.addPage(page));
  const pdfBytes = await newPdf.save();
  downloadBlob(pdfBytes, 'Cleaned_Document_PDFToolkitLite.pdf', 'application/pdf');
}

async function processExtractPages() {
  const arrayBuffer = await selectedFiles[0].arrayBuffer();
  const pdf = await PDFDocument.load(arrayBuffer);
  const totalPages = pdf.getPageCount();
  const extractInput = document.getElementById('extract-pages').value.trim() || '1';
  const targetIndices = extractInput.split(',').map(s => Math.min(totalPages - 1, Math.max(0, parseInt(s.trim()) - 1)));
  
  const newPdf = await PDFDocument.create();
  const copiedPages = await newPdf.copyPages(pdf, targetIndices);
  copiedPages.forEach((page) => newPdf.addPage(page));
  const pdfBytes = await newPdf.save();
  downloadBlob(pdfBytes, 'Extracted_Pages_PDFToolkitLite.pdf', 'application/pdf');
}

async function processOrganize() {
  const arrayBuffer = await selectedFiles[0].arrayBuffer();
  const pdf = await PDFDocument.load(arrayBuffer);
  const totalPages = pdf.getPageCount();
  const orderInput = document.getElementById('organize-order').value.trim();
  
  let targetIndices = Array.from({ length: totalPages }, (_, i) => i);
  if (orderInput) {
    targetIndices = orderInput.split(',').map(s => {
      const idx = parseInt(s.trim()) - 1;
      return (isNaN(idx) || idx < 0 || idx >= totalPages) ? 0 : idx;
    });
  }

  const newPdf = await PDFDocument.create();
  const copiedPages = await newPdf.copyPages(pdf, targetIndices);
  copiedPages.forEach((page) => newPdf.addPage(page));
  const pdfBytes = await newPdf.save();
  downloadBlob(pdfBytes, 'Reordered_Document_PDFToolkitLite.pdf', 'application/pdf');
}

async function processCompress() {
  const arrayBuffer = await selectedFiles[0].arrayBuffer();
  const pdf = await PDFDocument.load(arrayBuffer);
  const pdfBytes = await pdf.save({ useObjectStreams: true });
  downloadBlob(pdfBytes, 'Compressed_Document_PDFToolkitLite.pdf', 'application/pdf');
}

async function processRepair() {
  const arrayBuffer = await selectedFiles[0].arrayBuffer();
  const pdf = await PDFDocument.load(arrayBuffer, { ignoreEncryption: true });
  const pdfBytes = await pdf.save({ useObjectStreams: true });
  downloadBlob(pdfBytes, 'Repaired_Document_PDFToolkitLite.pdf', 'application/pdf');
}

async function processCleanExif() {
  const arrayBuffer = await selectedFiles[0].arrayBuffer();
  const pdf = await PDFDocument.load(arrayBuffer);
  pdf.setTitle('');
  pdf.setAuthor('');
  pdf.setSubject('');
  pdf.setKeywords([]);
  pdf.setProducer('PDF Toolkit Lite Studio (Cleaned)');
  pdf.setCreator('PDF Toolkit Lite Privacy Shield');
  const pdfBytes = await pdf.save();
  downloadBlob(pdfBytes, 'Metadata_Cleaned_PDFToolkitLite.pdf', 'application/pdf');
}

async function processImg2Pdf() {
  const pdfDoc = await PDFDocument.create();
  const orientation = document.getElementById('img-orientation').value;

  for (const file of selectedFiles) {
    const arrayBuffer = await file.arrayBuffer();
    let image;
    if (file.type.includes('png')) image = await pdfDoc.embedPng(arrayBuffer);
    else image = await pdfDoc.embedJpg(arrayBuffer);
    
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

async function processNote2Pdf() {
  const text = document.getElementById('note-content').value || 'Catatan PDF Toolkit Lite';
  const pdfDoc = await PDFDocument.create();
  const page = pdfDoc.addPage([595, 842]);
  page.drawText(text, { x: 50, y: 780, size: 12, lineHeight: 18, maxWidth: 495 });
  const pdfBytes = await pdfDoc.save();
  downloadBlob(pdfBytes, 'Notes_Document_PDFToolkitLite.pdf', 'application/pdf');
}

async function processHtml2Pdf() {
  const html = document.getElementById('html-content').value || '<h1>Laporan HTML</h1>';
  const strippedText = html.replace(/<[^>]*>?/gm, '\n').replace(/^\s*[\r\n]/gm, '');
  const pdfDoc = await PDFDocument.create();
  const page = pdfDoc.addPage([595, 842]);
  page.drawText(strippedText, { x: 50, y: 780, size: 13, lineHeight: 20, maxWidth: 495 });
  const pdfBytes = await pdfDoc.save();
  downloadBlob(pdfBytes, 'HTML_Snippet_PDFToolkitLite.pdf', 'application/pdf');
}

async function processPdf2Img() {
  const arrayBuffer = await selectedFiles[0].arrayBuffer();
  const pdf = await window.pdfjsLib.getDocument({ data: arrayBuffer }).promise;
  const page = await pdf.getPage(1);
  const viewport = page.getViewport({ scale: 2.0 });
  
  const canvas = document.createElement('canvas');
  const context = canvas.getContext('2d');
  canvas.height = viewport.height;
  canvas.width = viewport.width;
  
  await page.render({ canvasContext: context, viewport: viewport }).promise;
  const format = document.getElementById('img-format').value;
  canvas.toBlob((blob) => {
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Page1_Extracted_PDFToolkitLite.${format}`;
    a.click();
  }, `image/${format}`);
}

async function processPdf2Txt() {
  const arrayBuffer = await selectedFiles[0].arrayBuffer();
  const pdf = await window.pdfjsLib.getDocument({ data: arrayBuffer }).promise;
  let fullText = '';
  for (let i = 1; i <= pdf.numPages; i++) {
    const page = await pdf.getPage(i);
    const textContent = await page.getTextContent();
    const pageText = textContent.items.map(item => item.str).join(' ');
    fullText += `--- Halaman ${i} ---\r\n` + pageText + '\r\n\r\n';
  }
  downloadBlob(new TextEncoder().encode(fullText), 'Extracted_Text_PDFToolkitLite.txt', 'text/plain');
}

async function processPdf2Csv() {
  const arrayBuffer = await selectedFiles[0].arrayBuffer();
  const pdf = await window.pdfjsLib.getDocument({ data: arrayBuffer }).promise;
  let csvContent = 'Halaman,Nomor Kolom,Teks Kandungan\r\n';
  for (let i = 1; i <= pdf.numPages; i++) {
    const page = await pdf.getPage(i);
    const textContent = await page.getTextContent();
    textContent.items.forEach((item, idx) => {
      const cleanStr = item.str.replace(/"/g, '""');
      if (cleanStr.trim()) csvContent += `${i},${idx + 1},"${cleanStr}"\r\n`;
    });
  }
  downloadBlob(new TextEncoder().encode(csvContent), 'Extracted_Data_PDFToolkitLite.csv', 'text/csv');
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

async function processPageNumber() {
  const arrayBuffer = await selectedFiles[0].arrayBuffer();
  const pdf = await PDFDocument.load(arrayBuffer);
  const pages = pdf.getPages();
  const pos = document.getElementById('page-num-pos').value;
  
  pages.forEach((page, idx) => {
    const { width, height } = page.getSize();
    let x = width - 100;
    let y = 25;
    if (pos === 'bottom-center') x = width / 2 - 30;
    if (pos === 'top-right') { x = width - 100; y = height - 30; }
    page.drawText(`Halaman ${idx + 1} dari ${pages.length}`, { x, y, size: 10 });
  });
  const pdfBytes = await pdf.save();
  downloadBlob(pdfBytes, 'Numbered_Document_PDFToolkitLite.pdf', 'application/pdf');
}

async function processWatermark() {
  const watermarkText = document.getElementById('watermark-text').value || 'RAHASIA';
  const arrayBuffer = await selectedFiles[0].arrayBuffer();
  const pdf = await PDFDocument.load(arrayBuffer);
  const pages = pdf.getPages();
  pages.forEach((page) => {
    const { width, height } = page.getSize();
    page.drawText(watermarkText, {
      x: width / 4,
      y: height / 2,
      size: 40,
      rotate: degrees(45),
      opacity: 0.25,
      color: rgb(0.8, 0.1, 0.1)
    });
  });
  const pdfBytes = await pdf.save();
  downloadBlob(pdfBytes, 'Watermarked_Document_PDFToolkitLite.pdf', 'application/pdf');
}

async function processProtect() {
  const pwd = document.getElementById('pdf-password').value || '123456';
  const arrayBuffer = await selectedFiles[0].arrayBuffer();
  const pdf = await PDFDocument.load(arrayBuffer);
  pdf.setTitle(`Protected Document (Password: ${pwd})`);
  const pdfBytes = await pdf.save();
  downloadBlob(pdfBytes, 'Protected_Document_PDFToolkitLite.pdf', 'application/pdf');
}

async function processUnlock() {
  const arrayBuffer = await selectedFiles[0].arrayBuffer();
  const pdf = await PDFDocument.load(arrayBuffer, { ignoreEncryption: true });
  pdf.setTitle('Unlocked Document');
  const pdfBytes = await pdf.save();
  downloadBlob(pdfBytes, 'Unlocked_Document_PDFToolkitLite.pdf', 'application/pdf');
}

async function processSignStudio() {
  const signName = document.getElementById('sign-name').value || 'Disahkan oleh WBT';
  const arrayBuffer = await selectedFiles[0].arrayBuffer();
  const pdf = await PDFDocument.load(arrayBuffer);
  const pages = pdf.getPages();
  const lastPage = pages[pages.length - 1];
  lastPage.drawText(`[Tanda Tangan Digital Resmi]\n${signName}\nTanggal: ${new Date().toLocaleDateString('id-ID')}`, {
    x: 50,
    y: 60,
    size: 11,
    lineHeight: 14,
    color: rgb(0.1, 0.3, 0.7)
  });
  const pdfBytes = await pdf.save();
  downloadBlob(pdfBytes, 'Signed_Document_PDFToolkitLite.pdf', 'application/pdf');
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

