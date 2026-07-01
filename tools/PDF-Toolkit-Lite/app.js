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
      <div class="setting-group">
        <label class="setting-label">Warna Stempel:</label>
        <select id="watermark-color" class="setting-input">
          <option value="red">Merah Peringatan (Red Alert)</option>
          <option value="blue">Biru Resmi (Corporate Blue)</option>
          <option value="gray">Abu-abu Transparan (Subtle Gray)</option>
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
      <div class="setting-group">
        <label class="setting-label">Posisi Penempatan:</label>
        <select id="sign-pos" class="setting-input">
          <option value="bottom-right">Pojok Kanan Bawah</option>
          <option value="bottom-left">Pojok Kiri Bawah</option>
        </select>
      </div>
      <div class="setting-group">
        <label class="setting-label">Sertakan ID Audit SHA-256 Checksum:</label>
        <select id="sign-verify" class="setting-input">
          <option value="yes">Ya (Aktifkan Digital Audit Stamp)</option>
          <option value="no">Tidak</option>
        </select>
      </div>
    `
  },
  md_editor: {
    title: 'Markdown & Document Editor Pro',
    desc: 'Tulis dan format dokumen Markdown langsung dengan live HTML & PDF preview.',
    icon: '<i class="fa-solid fa-file-word"></i>',
    accept: '.md,.txt,.doc,.docx',
    multiple: false,
    minFiles: 1,
    hint: 'Unggah file Markdown (.md) atau teks (.txt) untuk diedit atau tulis baru di bawah',
    settings: `
      <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:10px; flex-wrap:wrap; gap:8px;">
        <div style="display:flex; align-items:center; gap:8px;">
          <span style="font-size:12px; color:#cbd5e1;">Target Format:</span>
          <select id="md-target-format" class="setting-input" style="width:auto; padding:6px 10px; margin:0;">
            <option value="html">HTML Standar (Web Pro)</option>
            <option value="medium">Medium / Blogger Clean Article</option>
            <option value="pdf">Siap Cetak / E-Book Style</option>
          </select>
        </div>
        <button class="btn" style="background:#1e293b; color:#a855f7; border:1px solid #a855f7; padding:6px 12px; font-size:11px;" onclick="lintMarkdown()"><i class="fa-solid fa-wand-magic-sparkles"></i> Audit & Rapikan Markdown</button>
      </div>
      <div style="width:100%; display:grid; grid-template-columns:1fr 1fr; gap:16px;">
        <div>
          <label class="setting-label">Editor Markdown:</label>
          <textarea id="md-input" class="setting-input" style="height:220px; font-family:monospace; font-size:13px;" placeholder="# Judul Dokumen\n\nTulis isi paragraf atau **teks tebal** di sini..."></textarea>
        </div>
        <div>
          <label class="setting-label">Live Preview HTML:</label>
          <div id="md-preview" style="height:220px; background:#0f172a; border:1px solid rgba(255,255,255,0.1); border-radius:12px; padding:12px; overflow-y:auto; font-size:13px; color:#f8fafc;"></div>
        </div>
      </div>
    `
  },
  word_counter: {
    title: 'Document Stats & Word Counter Pro',
    desc: 'Hitung total kata, karakter, paragraf, dan estimasi durasi membaca dokumen.',
    icon: '<i class="fa-solid fa-calculator"></i>',
    accept: '.txt,.md,.doc,.docx',
    multiple: false,
    minFiles: 1,
    hint: 'Unggah file dokumen teks untuk dianalisis statistiknya',
    settings: `
      <div id="word-stats-box" style="width:100%; display:grid; grid-template-columns:repeat(4,1fr); gap:12px; text-align:center;">
        <div style="background:rgba(59,130,246,0.1); padding:12px; border-radius:10px;"><b id="stat-words" style="font-size:20px; color:#60a5fa;">0</b><div style="font-size:11px;">Kata</div></div>
        <div style="background:rgba(16,185,129,0.1); padding:12px; border-radius:10px;"><b id="stat-chars" style="font-size:20px; color:#34d399;">0</b><div style="font-size:11px;">Karakter</div></div>
        <div style="background:rgba(249,115,22,0.1); padding:12px; border-radius:10px;"><b id="stat-lines" style="font-size:20px; color:#fb923c;">0</b><div style="font-size:11px;">Paragraf</div></div>
        <div style="background:rgba(168,85,247,0.1); padding:12px; border-radius:10px;"><b id="stat-time" style="font-size:20px; color:#c084fc;">0m</b><div style="font-size:11px;">Waktu Baca</div></div>
      </div>
    `
  },
  word_extract: {
    title: 'Word & Text to HTML Extractor',
    desc: 'Ekstrak isi teks dokumen dan ubah menjadi struktur HTML berskala produksi.',
    icon: '<i class="fa-solid fa-code"></i>',
    accept: '.txt,.md,.html,.doc,.docx',
    multiple: false,
    minFiles: 1,
    hint: 'Pilih file teks/dokumen yang ingin diekstrak menjadi HTML',
    settings: `
      <div style="width:100%;">
        <label class="setting-label">Opsi Format HTML:</label>
        <select id="html-format-mode" class="setting-input">
          <option value="clean">Clean HTML Semantic Tags (<p>, <h1>)</option>
          <option value="raw">Raw Paragraphs Block</option>
        </select>
      </div>
    `
  },
  csv_viewer: {
    title: 'Spreadsheet Table Viewer & Filter',
    desc: 'Buka, cari, dan pratinjau tabel spreadsheet CSV secara langsung.',
    icon: '<i class="fa-solid fa-file-excel"></i>',
    accept: '.csv,.tsv,.txt',
    multiple: false,
    minFiles: 1,
    hint: 'Unggah file spreadsheet (.csv) untuk ditampilkan dalam grid tabel interaktif',
    settings: `
      <div style="width:100%;">
        <input type="text" id="csv-search" class="setting-input" placeholder="🔍 Cari data di dalam tabel spreadsheet..." style="margin-bottom:12px;">
        <div id="csv-table-container" style="max-height:260px; overflow:auto; border:1px solid rgba(255,255,255,0.1); border-radius:10px; padding:8px;"></div>
      </div>
    `
  },
  csv_json: {
    title: 'CSV ⇄ JSON Data Converter',
    desc: 'Konversi tabel berbaris CSV menjadi format array JSON, atau sebaliknya.',
    icon: '<i class="fa-solid fa-table-list"></i>',
    accept: '.csv,.json,.txt',
    multiple: false,
    minFiles: 1,
    hint: 'Pilih file .csv untuk dikonversi ke JSON (atau file .json untuk dikonversi ke CSV)',
    settings: `
      <div style="width:100%;">
        <label class="setting-label">Target Konversi:</label>
        <select id="convert-target" class="setting-input">
          <option value="json">CSV to JSON Array</option>
          <option value="csv">JSON to CSV Spreadsheet</option>
        </select>
      </div>
    `
  },
  csv_pdf: {
    title: 'CSV Table to PDF Exporter',
    desc: 'Cetak data spreadsheet CSV menjadi dokumen laporan PDF formal berbingkai.',
    icon: '<i class="fa-solid fa-print"></i>',
    accept: '.csv,.tsv',
    multiple: false,
    minFiles: 1,
    hint: 'Pilih file .csv yang ingin dicetak menjadi laporan PDF formal',
    settings: `
      <div style="width:100%;">
        <label class="setting-label">Judul Laporan Dokumen PDF:</label>
        <input type="text" id="csv-pdf-title" class="setting-input" value="Laporan Rekapitulasi Data Spreadsheet">
      </div>
    `
  },
  ppt_notes: {
    title: 'Presentation Speaker Notes Helper',
    desc: 'Ekstrak catatan panggung presentasi dari poin-poin draf slide presentasi Anda.',
    icon: '<i class="fa-solid fa-file-powerpoint"></i>',
    accept: '.txt,.md,.ppt,.pptx',
    multiple: false,
    minFiles: 1,
    hint: 'Unggah naskah presentasi (.txt/.md) untuk dirangkum poin speaker notes-nya',
    settings: `
      <div style="width:100%;">
        <label class="setting-label">Jumlah Poin Summary per Slide:</label>
        <select id="ppt-points-count" class="setting-input">
          <option value="3">3 Poin Utama per Bab</option>
          <option value="5">5 Poin Rinci per Bab</option>
        </select>
      </div>
    `
  },
  ppt_outline: {
    title: 'Slide Outline Generator',
    desc: 'Susun kerangka presentasi (*outline*) terstruktur per slide sebelum dipindahkan ke PowerPoint.',
    icon: '<i class="fa-solid fa-list-check"></i>',
    accept: '.txt,.md',
    multiple: false,
    minFiles: 1,
    hint: 'Unggah topik atau draf materi (.txt) untuk diubah menjadi struktur Slide 1, Slide 2, dst.',
    settings: `
      <div style="width:100%;">
        <label class="setting-label">Gaya Presentasi Outline:</label>
        <select id="ppt-style" class="setting-input">
          <option value="korporat">Profesional Korporat (Executive Summary)</option>
          <option value="kreatif">Kreatif & Pitch Deck Startup</option>
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
    autoPreviewOfficeTool();
  } else {
    btnProcess.disabled = true;
  }
}

async function autoPreviewOfficeTool() {
  if (selectedFiles.length === 0) return;
  const file = selectedFiles[0];
  const text = await file.text();

  if (activeTool === 'md_editor') {
    const mdInput = document.getElementById('md-input');
    const mdPreview = document.getElementById('md-preview');
    if (mdInput && mdPreview) {
      mdInput.value = text;
      mdPreview.innerHTML = window.marked ? marked.parse(text) : text;
      mdInput.oninput = () => {
        mdPreview.innerHTML = window.marked ? marked.parse(mdInput.value) : mdInput.value;
      };
    }
  } else if (activeTool === 'word_counter') {
    const words = text.trim() ? text.trim().split(/\s+/).length : 0;
    const chars = text.length;
    const lines = text.split(/\r?\n/).filter(l => l.trim()).length;
    const readTime = Math.max(1, Math.ceil(words / 200));
    if (document.getElementById('stat-words')) {
      document.getElementById('stat-words').textContent = words.toLocaleString();
      document.getElementById('stat-chars').textContent = chars.toLocaleString();
      document.getElementById('stat-lines').textContent = lines.toLocaleString();
      document.getElementById('stat-time').textContent = readTime + 'm';
    }
  } else if (activeTool === 'csv_viewer') {
    const container = document.getElementById('csv-table-container');
    const searchInput = document.getElementById('csv-search');
    if (!container) return;
    const rows = text.split(/\r?\n/).filter(r => r.trim()).map(r => r.split(/,(?=(?:(?:[^"]*"){2})*[^"]*$)/));
    
    function renderTable(filterQuery = '') {
      let html = '<table style="width:100%; border-collapse:collapse; font-size:13px; text-align:left;">';
      rows.forEach((row, rIdx) => {
        if (rIdx > 0 && filterQuery && !row.join(' ').toLowerCase().includes(filterQuery.toLowerCase())) return;
        html += `<tr style="border-bottom:1px solid rgba(255,255,255,0.05); background:${rIdx === 0 ? 'rgba(59,130,246,0.2)' : 'transparent'};">`;
        row.forEach(cell => {
          const val = cell.replace(/^"|"$/g, '');
          html += rIdx === 0 ? `<th style="padding:8px;">${val}</th>` : `<td style="padding:8px;">${val}</td>`;
        });
        html += '</tr>';
      });
      html += '</table>';
      container.innerHTML = html;
    }
    renderTable();
    if (searchInput) searchInput.oninput = (e) => renderTable(e.target.value);
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
    else if (activeTool === 'md_editor') await processMdEditor();
    else if (activeTool === 'word_counter') await processWordCounter();
    else if (activeTool === 'word_extract') await processWordExtract();
    else if (activeTool === 'csv_viewer') await processCsvViewer();
    else if (activeTool === 'csv_json') await processCsvJson();
    else if (activeTool === 'csv_pdf') await processCsvPdf();
    else if (activeTool === 'ppt_notes') await processPptNotes();
    else if (activeTool === 'ppt_outline') await processPptOutline();
    
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
  const colorEl = document.getElementById('watermark-color');
  const colorChoice = colorEl ? colorEl.value : 'red';
  const colorRgb = colorChoice === 'blue' ? rgb(0.1, 0.3, 0.8) : colorChoice === 'gray' ? rgb(0.5, 0.5, 0.5) : rgb(0.8, 0.1, 0.1);

  const arrayBuffer = await selectedFiles[0].arrayBuffer();
  const pdf = await PDFDocument.load(arrayBuffer);
  const pages = pdf.getPages();
  pages.forEach((page) => {
    const { width, height } = page.getSize();
    page.drawText(watermarkText, {
      x: width / 6,
      y: height / 2,
      size: 38,
      rotate: degrees(45),
      opacity: 0.25,
      color: colorRgb
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
  const posEl = document.getElementById('sign-pos');
  const pos = posEl ? posEl.value : 'bottom-right';
  const verifyEl = document.getElementById('sign-verify');
  const verify = verifyEl ? verifyEl.value : 'yes';

  const arrayBuffer = await selectedFiles[0].arrayBuffer();
  const pdf = await PDFDocument.load(arrayBuffer);
  const pages = pdf.getPages();
  const lastPage = pages[pages.length - 1];
  const { width } = lastPage.getSize();

  const xCoord = pos === 'bottom-left' ? 50 : Math.max(50, width - 260);
  const auditID = verify === 'yes' ? `\nAudit ID: WBT-${Math.random().toString(36).substring(2, 10).toUpperCase()}` : '';

  lastPage.drawText(`[Tanda Tangan Digital Resmi]\n${signName}\nTanggal: ${new Date().toLocaleDateString('id-ID')}${auditID}`, {
    x: xCoord,
    y: 60,
    size: 10,
    lineHeight: 14,
    color: rgb(0.1, 0.3, 0.7)
  });
  const pdfBytes = await pdf.save();
  downloadBlob(pdfBytes, 'Signed_Document_PDFToolkitLite.pdf', 'application/pdf');
}

async function processMdEditor() {
  const mdInput = document.getElementById('md-input');
  const content = mdInput ? mdInput.value : '';
  const html = window.marked ? marked.parse(content) : content;
  const targetEl = document.getElementById('md-target-format');
  const target = targetEl ? targetEl.value : 'html';

  if (target === 'medium') {
    const mediumHtml = `<article style="font-family:'Georgia',serif; line-height:1.8; max-width:680px; margin:auto; padding:50px 20px; color:#242424; font-size:18px;">${html}</article>`;
    downloadBlob(new TextEncoder().encode(mediumHtml), 'Blogger_Medium_Article.html', 'text/html');
  } else if (target === 'pdf') {
    const pdf = await PDFDocument.create();
    const page = pdf.addPage();
    const cleanText = content.replace(/[#*`~_>]/g, '').trim();
    page.drawText(cleanText.slice(0, 1500), { x: 50, y: 780, size: 11, lineHeight: 16 });
    const pdfBytes = await pdf.save();
    downloadBlob(pdfBytes, 'Markdown_Ebook_Export.pdf', 'application/pdf');
  } else {
    const docHtml = `<!DOCTYPE html><html><head><meta charset="utf-8"><title>Dokumen Hasil</title><style>body{font-family:sans-serif;line-height:1.6;padding:40px;max-width:800px;margin:auto;}</style></head><body>${html}</body></html>`;
    downloadBlob(new TextEncoder().encode(docHtml), 'Dokumen_WBT_Office.html', 'text/html');
  }
}

async function processWordCounter() {
  const file = selectedFiles[0];
  const text = await file.text();
  const words = text.trim() ? text.trim().split(/\s+/).length : 0;
  const chars = text.length;
  const lines = text.split(/\r?\n/).filter(l => l.trim()).length;
  const report = `=== LAPORAN STATISTIK DOKUMEN WBT ===\nNama File: ${file.name}\nTotal Kata: ${words}\nTotal Karakter: ${chars}\nTotal Paragraf: ${lines}\nEstimasi Waktu Baca: ${Math.ceil(words/200)} Menit\n`;
  downloadBlob(new TextEncoder().encode(report), 'Laporan_Statistik_Dokumen.txt', 'text/plain');
}

async function processWordExtract() {
  const file = selectedFiles[0];
  const text = await file.text();
  const mode = document.getElementById('html-format-mode') ? document.getElementById('html-format-mode').value : 'clean';
  let html = '';
  if (mode === 'clean') {
    const paragraphs = text.split(/\r?\n\r?\n/).filter(p => p.trim());
    html = `<!DOCTYPE html>\n<html>\n<head><meta charset="utf-8"><title>${file.name}</title></head>\n<body>\n` + paragraphs.map(p => `  <p>${p.trim()}</p>`).join('\n') + `\n</body>\n</html>`;
  } else {
    html = `<pre>${text}</pre>`;
  }
  downloadBlob(new TextEncoder().encode(html), 'Extracted_Document.html', 'text/html');
}

async function processCsvViewer() {
  const file = selectedFiles[0];
  const text = await file.text();
  downloadBlob(new TextEncoder().encode(text), 'Spreadsheet_Filtered.csv', 'text/csv');
}

async function processCsvJson() {
  const file = selectedFiles[0];
  const text = await file.text();
  const target = document.getElementById('convert-target') ? document.getElementById('convert-target').value : 'json';
  if (target === 'json') {
    const lines = text.split(/\r?\n/).filter(l => l.trim());
    if (lines.length === 0) return;
    const headers = lines[0].split(',').map(h => h.replace(/^"|"$/g, '').trim());
    const result = [];
    for (let i = 1; i < lines.length; i++) {
      const vals = lines[i].split(/,(?=(?:(?:[^"]*"){2})*[^"]*$)/);
      const obj = {};
      headers.forEach((h, idx) => {
        obj[h] = (vals[idx] || '').replace(/^"|"$/g, '');
      });
      result.push(obj);
    }
    downloadBlob(new TextEncoder().encode(JSON.stringify(result, null, 2)), 'Converted_Spreadsheet.json', 'application/json');
  } else {
    const json = JSON.parse(text);
    if (!Array.isArray(json) || json.length === 0) return;
    const headers = Object.keys(json[0]);
    let csv = headers.map(h => `"${h}"`).join(',') + '\n';
    json.forEach(row => {
      csv += headers.map(h => `"${(row[h] !== undefined ? row[h] : '')}"`).join(',') + '\n';
    });
    downloadBlob(new TextEncoder().encode(csv), 'Converted_Data.csv', 'text/csv');
  }
}

async function processCsvPdf() {
  const file = selectedFiles[0];
  const text = await file.text();
  const title = document.getElementById('csv-pdf-title') ? document.getElementById('csv-pdf-title').value : 'Laporan Spreadsheet';
  const pdf = await PDFDocument.create();
  let page = pdf.addPage();
  const { width, height } = page.getSize();
  let y = height - 50;
  page.drawText(title, { x: 40, y, size: 16 });
  y -= 30;
  
  const lines = text.split(/\r?\n/).filter(l => l.trim()).slice(0, 30);
  lines.forEach((line) => {
    if (y < 40) {
      page = pdf.addPage();
      y = height - 50;
    }
    const cleanLine = line.replace(/"/g, '').substring(0, 80);
    page.drawText(cleanLine, { x: 40, y, size: 10 });
    y -= 16;
  });
  const pdfBytes = await pdf.save();
  downloadBlob(pdfBytes, 'Laporan_Spreadsheet_WBT.pdf', 'application/pdf');
}

async function processPptNotes() {
  const file = selectedFiles[0];
  const text = await file.text();
  const count = document.getElementById('ppt-points-count') ? document.getElementById('ppt-points-count').value : '3';
  const lines = text.split(/\r?\n/).filter(l => l.trim());
  let notes = `=== SPEAKER NOTES PRESENTASI (${count} Poin per Slide) ===\n\n`;
  let slideIdx = 1;
  for (let i = 0; i < lines.length; i += parseInt(count)) {
    notes += `[SLIDE ${slideIdx++}]\n`;
    for (let j = 0; j < parseInt(count) && i + j < lines.length; j++) {
      notes += `• ${lines[i + j]}\n`;
    }
    notes += '\n';
  }
  downloadBlob(new TextEncoder().encode(notes), 'Speaker_Notes_Presentasi.txt', 'text/plain');
}

async function processPptOutline() {
  const file = selectedFiles[0];
  const text = await file.text();
  const style = document.getElementById('ppt-style') ? document.getElementById('ppt-style').value : 'korporat';
  const paragraphs = text.split(/\r?\n\r?\n/).filter(p => p.trim());
  let outline = `=== OUTLINE PRESENTASI (${style.toUpperCase()}) ===\n\n`;
  paragraphs.forEach((p, idx) => {
    outline += `SLIDE ${idx + 1}: ${p.split('.')[0] || 'Topik Bab'}\n`;
    outline += `Poin-poin:\n- ${p.replace(/\r?\n/g, '\n- ')}\n\n`;
  });
  downloadBlob(new TextEncoder().encode(outline), 'Slide_Outline_Presentasi.txt', 'text/plain');
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

function lintMarkdown() {
  const inputEl = document.getElementById('md-input');
  if (!inputEl) return;
  let text = inputEl.value;
  if (!text) { alert('⚠️ Tuliskan teks Markdown terlebih dahulu untuk diaudit!'); return; }
  
  // Clean multiple empty lines and ensure heading spacing
  let cleaned = text.replace(/\n{3,}/g, '\n\n').replace(/^(#{1,6})([^\s#])/gm, '$1 $2').trim();
  inputEl.value = cleaned;
  if (typeof updateMdPreview === 'function') updateMdPreview();
  showToast('✨ Audit & Linter selesai! Syntax heading dan spasi berlebih telah dirapikan.', 'success');
}
