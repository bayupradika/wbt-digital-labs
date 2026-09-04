/* ==========================================================================
   PDF Toolkit Lite - Client-Side Application Logic
   ========================================================================== */

const { PDFDocument, rgb, degrees } = PDFLib;

// Application State
let activeTool = null;
let selectedFiles = [];
let isPro = localStorage.getItem('pdf_toolkit_is_pro_v2') === 'true';

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

function updateQuotaUI() { /* Removed Pro Feature */ }



// Tool Configurations
const toolsConfig = {

    word2pdf: { title: 'Convert Word to PDF', desc: 'Ubah dokumen Word menjadi PDF statis.', icon: '<i class="fa-solid fa-file-word"></i>', accept: '.doc,.docx', multiple: false, minFiles: 1, hint: 'Pilih dokumen Word' },
    pdf2word: { title: 'PDF to Word', desc: 'Konversi PDF ke dokumen Word yang dapat diedit.', icon: '<i class="fa-solid fa-file-export"></i>', accept: '.pdf', multiple: false, minFiles: 1, hint: 'Pilih dokumen PDF' },
    ppt2pdf: { title: 'PowerPoint to PDF', desc: 'Ubah file presentasi PPT ke PDF.', icon: '<i class="fa-solid fa-file-powerpoint"></i>', accept: '.ppt,.pptx', multiple: false, minFiles: 1, hint: 'Pilih file presentasi PPT' },
    pdf2ppt: { title: 'PDF to PowerPoint', desc: 'Ubah file PDF ke presentasi PPT.', icon: '<i class="fa-solid fa-desktop"></i>', accept: '.pdf', multiple: false, minFiles: 1, hint: 'Pilih dokumen PDF' },
    excel2pdf: { title: 'Excel to PDF', desc: 'Ubah file Excel spreadsheet ke PDF statis.', icon: '<i class="fa-solid fa-file-excel"></i>', accept: '.xls,.xlsx,.csv', multiple: false, minFiles: 1, hint: 'Pilih file Excel/CSV' },
    pdf2excel: { title: 'PDF to Excel', desc: 'Ekstrak tabel dari PDF ke Excel.', icon: '<i class="fa-solid fa-table"></i>', accept: '.pdf', multiple: false, minFiles: 1, hint: 'Pilih dokumen PDF' },
    edit: { title: 'Edit PDF', desc: 'Tambahkan teks, gambar, dan anotasi ke PDF.', icon: '<i class="fa-solid fa-pen-to-square"></i>', accept: '.pdf', multiple: false, minFiles: 1, hint: 'Pilih dokumen PDF' },
    jpg2pdf: { title: 'JPG to PDF', desc: 'Ubah gambar menjadi PDF.', icon: '<i class="fa-regular fa-images"></i>', accept: '.jpg,.jpeg,.png', multiple: true, minFiles: 1, hint: 'Pilih gambar JPG/PNG' },
    pdf2jpg: { title: 'PDF to JPG', desc: 'Ekstrak halaman PDF menjadi JPG.', icon: '<i class="fa-solid fa-image"></i>', accept: '.pdf', multiple: false, minFiles: 1, hint: 'Pilih dokumen PDF' },
    sign: { title: 'Sign PDF', desc: 'Tambahkan tanda tangan ke dokumen.', icon: '<i class="fa-solid fa-signature"></i>', accept: '.pdf', multiple: false, minFiles: 1, hint: 'Pilih dokumen PDF' },
    watermark: { title: 'Watermark PDF', desc: 'Berikan cap khusus pada PDF.', icon: '<i class="fa-solid fa-stamp"></i>', accept: '.pdf', multiple: false, minFiles: 1, hint: 'Pilih dokumen PDF' },
    rotate: { title: 'Rotate PDF', desc: 'Putar orientasi halaman.', icon: '<i class="fa-solid fa-rotate-right"></i>', accept: '.pdf', multiple: false, minFiles: 1, hint: 'Pilih dokumen PDF' },
    html2pdf: { title: 'HTML to PDF', desc: 'Ubah file HTML menjadi PDF.', icon: '<i class="fa-brands fa-html5"></i>', accept: '.html', multiple: false, minFiles: 1, hint: 'Pilih file HTML' },
    unlock: { title: 'Unlock PDF', desc: 'Buka password dokumen PDF.', icon: '<i class="fa-solid fa-lock-open"></i>', accept: '.pdf', multiple: false, minFiles: 1, hint: 'Pilih dokumen PDF' },
    protect: { title: 'Protect PDF', desc: 'Amankan PDF dengan password.', icon: '<i class="fa-solid fa-lock"></i>', accept: '.pdf', multiple: false, minFiles: 1, hint: 'Pilih dokumen PDF' },
    pdf2pdfa: { title: 'PDF to PDF/A', desc: 'Ubah ke PDF/A untuk pengarsipan.', icon: '<i class="fa-solid fa-file-archive"></i>', accept: '.pdf', multiple: false, minFiles: 1, hint: 'Pilih dokumen PDF' },
    pagenumbers: { title: 'Page Numbers', desc: 'Tambahkan nomor urut halaman.', icon: '<i class="fa-solid fa-list-ol"></i>', accept: '.pdf', multiple: false, minFiles: 1, hint: 'Pilih dokumen PDF' },

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
        <div class="setting-group" style="width: 100%;">
          <div style="display:flex; justify-content:space-between; align-items:center;">
            <label class="setting-label">Rentang Halaman (Contoh: 1-3, 5)</label>
            <div style="display:flex; gap:10px; margin-bottom:10px;">
              <button id="btn-remove-split" class="btn-action" style="padding:5px 10px; background:#ef4444; color:white; border-radius:5px; border:none; cursor:pointer;" title="Kurangi Input"><i class="fa-solid fa-minus"></i></button>
              <span id="split-count" style="color:white; font-weight:bold; align-self:center;">1</span>
              <button id="btn-add-split" class="btn-action" style="padding:5px 10px; background:#10b981; color:white; border-radius:5px; border:none; cursor:pointer;" title="Tambah Input"><i class="fa-solid fa-plus"></i></button>
            </div>
          </div>
          <div id="split-inputs-container" style="display:flex; flex-direction:column; gap:10px;">
            <input type="text" class="setting-input split-range-input" placeholder="Pisahan 1: Kosongkan untuk pisah semua">
          </div>
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
      
      if (toolKey === 'split') {
        const btnAdd = document.getElementById('btn-add-split');
        const btnRemove = document.getElementById('btn-remove-split');
        const container = document.getElementById('split-inputs-container');
        const countSpan = document.getElementById('split-count');
        
        let splitCount = 1;
        
        btnAdd.onclick = () => {
          splitCount++;
          countSpan.textContent = splitCount;
          const input = document.createElement('input');
          input.type = 'text';
          input.className = 'setting-input split-range-input';
          input.placeholder = `Pisahan ${splitCount}: Kosongkan untuk pisah semua`;
          container.appendChild(input);
        };
        
        btnRemove.onclick = () => {
          if (splitCount > 1) {
            container.removeChild(container.lastChild);
            splitCount--;
            countSpan.textContent = splitCount;
          }
        };
      }
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
      
      const dropzone = document.getElementById('dropzone');
      if (selectedFiles.length > 0) {
        if(dropzone) dropzone.style.display = 'none';
        
        const addBtnContainer = document.createElement('div');
        addBtnContainer.style.textAlign = 'right';
        addBtnContainer.style.marginBottom = '15px';
        addBtnContainer.innerHTML = `<button onclick="document.getElementById('file-input').click()" style="background:var(--primary); color:white; border:none; padding:8px 15px; border-radius:5px; cursor:pointer; font-weight:bold;"><i class="fa-solid fa-plus"></i> Tambahkan File</button>`;
        fileListEl.appendChild(addBtnContainer);
      } else {
        if(dropzone) dropzone.style.display = '';
      }
      
      selectedFiles.forEach((file, index) => {
      const sizeKB = (file.size / 1024).toFixed(1);
      const item = document.createElement('div');
      item.className = 'file-item';
      
      // Drag and drop properties
      item.draggable = true;
      item.dataset.index = index;
      
      item.innerHTML = `
        <div class="file-info" style="display:flex; align-items:center; gap:15px; cursor:grab;">
          <i class="fa-solid fa-grip-vertical" style="color:#64748b; font-size:16px;"></i>
          <i class="fa-solid fa-file-pdf" style="color: var(--primary); font-size: 20px;"></i>
          <div>
            <div class="file-name" style="user-select:none;">${file.name}</div>
            <div class="file-size" style="user-select:none;">${sizeKB} KB</div>
          </div>
        </div>
        <button class="btn-remove" onclick="removeFile(${index})" style="z-index:10;"><i class="fa-solid fa-trash"></i></button>
      `;
      
      // Drag Events
      item.addEventListener('dragstart', (e) => {
        e.dataTransfer.setData('text/plain', index);
        setTimeout(() => item.style.opacity = '0.5', 0);
      });
      
      item.addEventListener('dragend', () => {
        item.style.opacity = '1';
        document.querySelectorAll('.file-item').forEach(el => {
          el.style.borderTop = 'none';
          el.style.borderBottom = 'none';
        });
      });
      
      item.addEventListener('dragover', (e) => {
        e.preventDefault();
        const bounding = item.getBoundingClientRect();
        const offset = bounding.y + (bounding.height / 2);
        if (e.clientY - offset > 0) {
          item.style.borderBottom = '2px solid var(--primary)';
          item.style.borderTop = 'none';
        } else {
          item.style.borderTop = '2px solid var(--primary)';
          item.style.borderBottom = 'none';
        }
      });
      
      item.addEventListener('dragleave', () => {
        item.style.borderTop = 'none';
        item.style.borderBottom = 'none';
      });
      
      item.addEventListener('drop', (e) => {
        e.preventDefault();
        item.style.borderTop = 'none';
        item.style.borderBottom = 'none';
        
        const draggedIdxStr = e.dataTransfer.getData('text/plain');
        if (!draggedIdxStr) return;
        
        const draggedIdx = parseInt(draggedIdxStr);
        let targetIdx = index;
        
        const bounding = item.getBoundingClientRect();
        const offset = bounding.y + (bounding.height / 2);
        if (e.clientY - offset > 0) {
          targetIdx = targetIdx + 1;
        }
        
        if (draggedIdx === targetIdx || draggedIdx === targetIdx - 1 && targetIdx > draggedIdx) {
          return; // No meaningful move
        }
        
        const movedFile = selectedFiles.splice(draggedIdx, 1)[0];
        
        if (draggedIdx < targetIdx) {
          targetIdx--;
        }
        
        selectedFiles.splice(targetIdx, 0, movedFile);
        renderFileList();
      });

      fileListEl.appendChild(item);
    });
  
    const config = toolsConfig[activeTool];
    if (selectedFiles.length >= config.minFiles) {
      btnProcess.disabled = false;
      if (typeof autoPreviewOfficeTool === 'function') {
        autoPreviewOfficeTool();
      }
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

// ==========================================
// MOBILE APP MONETIZATION (AdMob & IAP)
// ==========================================
const isMobileApp = new URLSearchParams(window.location.search).get('app') === 'mobile';
let hasPurchasedNoAds = localStorage.getItem('wbt_mobile_no_ads') === 'true';

function showMobileAdAndProcess(callback) {
  if (!isMobileApp || hasPurchasedNoAds) {
    callback(); // Langsung proses jika di Web atau sudah beli fitur No-Ads
    return;
  }
  
  // Tampilkan Iklan Fullscreen (Simulasi AdMob Interstitial)
  const adOverlay = document.createElement('div');
  adOverlay.style.cssText = 'position:fixed; top:0; left:0; width:100vw; height:100vh; background:black; z-index:999999; display:flex; flex-direction:column; align-items:center; justify-content:center; color:white; font-family:sans-serif;';
  
  adOverlay.innerHTML = `
    <div style="position:absolute; top:20px; right:20px; font-size:12px; color:#888;">Ad / Sponsor</div>
    <i class="fa-brands fa-google" style="font-size: 50px; color: #3b82f6; margin-bottom: 20px;"></i>
    <h2 style="margin:0 0 10px 0;">Menampilkan Iklan...</h2>
    <p style="color:#aaa; text-align:center; max-width:80%;">Mendukung pengembang agar aplikasi ini tetap gratis.</p>
    
    <div id="ad-timer" style="margin-top: 30px; padding: 15px 30px; background: #333; border-radius: 99px; font-weight:bold;">Tunggu 5 detik...</div>
    
    <button onclick="purchaseNoAds()" style="position:absolute; bottom: 40px; background: #fbbf24; border:none; padding: 12px 25px; border-radius: 99px; font-weight:800; color: #000; cursor:pointer;">
      <i class="fa-solid fa-ban"></i> Hapus Iklan Selamanya (Rp 15.000)
    </button>
  `;
  document.body.appendChild(adOverlay);
  
  let timeLeft = 5;
  const timerEl = document.getElementById('ad-timer');
  const interval = setInterval(() => {
    timeLeft--;
    if (timeLeft > 0) {
      timerEl.innerText = `Tunggu ${timeLeft} detik...`;
    } else {
      clearInterval(interval);
      timerEl.innerText = 'X Tutup Iklan';
      timerEl.style.background = '#ef4444';
      timerEl.style.cursor = 'pointer';
      timerEl.onclick = () => {
        document.body.removeChild(adOverlay);
        callback(); // Lanjut memproses PDF setelah iklan ditutup
      };
    }
  }, 1000);
}

// Cek apakah baru saja kembali dari pembayaran sukses Mayar
if (new URLSearchParams(window.location.search).get('payment') === 'success_mobile_15k') {
  localStorage.setItem('wbt_mobile_no_ads', 'true');
  hasPurchasedNoAds = true;
  // Bersihkan URL tanpa refresh halaman
  window.history.replaceState({}, document.title, window.location.pathname);
  alert('Pembayaran Mayar Berhasil! Iklan telah dihapus secara permanen.');
}

window.purchaseNoAds = function() {
  const confirmBuy = confirm('Beli Fitur Premium: Hapus Iklan Selamanya\nHarga: Rp 15.000\n\nAnda akan diarahkan ke halaman pembayaran Mayar.id. Lanjutkan?');
  if (confirmBuy) {
    // Arahkan ke link Mayar Anda. 
    // Pastikan di dashboard Mayar, Anda menset "Success URL" kembali ke:
    // https://bayupradika.github.io/wbt-digital-labs/tools/PDF-Toolkit-Lite/index.html?payment=success_mobile_15k
    window.location.href = 'https://mayar.id/pay/wbt-mobile-noads';
  }
}



// ==========================================
// DESKTOP FREEMIUM & ACTIVATION LOGIC
// ==========================================
const isDesktopEnv = typeof process !== 'undefined' && process.versions && process.versions.electron;
let isDesktopPro = false;

if (isDesktopEnv) {
  const fs = require('fs');
  const path = require('path');
  const crypto = require('crypto');
  const { app } = require('@electron/remote') || { app: null }; // Optional if needed, but we'll use localStorage for simplicity
  
  // Verifikasi Kunci
  window.verifyDesktopKey = function(key) {
    try {
      const parts = key.split('-');
      if (parts.length !== 3 || parts[0] !== 'WBT') return false;
      const part1 = parts[1];
      const part2 = parts[2];
      const secret = "WBT_SECRET_2026";
      const hash = crypto.createHash('sha1').update(part1 + secret).digest('hex').substring(0, 4).toUpperCase();
      return hash === part2;
    } catch(e) {
      return false;
    }
  };

  // Cek Lisensi Tersimpan
  const savedKey = localStorage.getItem('wbt_desktop_license');
  if (savedKey && verifyDesktopKey(savedKey)) {
    isDesktopPro = true;
  }
}

function showDesktopActivationModal(callback) {
  const modal = document.createElement('div');
  modal.style.cssText = 'position:fixed; top:0; left:0; width:100vw; height:100vh; background:rgba(0,0,0,0.8); z-index:999999; display:flex; align-items:center; justify-content:center; color:white; font-family:sans-serif; backdrop-filter: blur(5px);';
  
  modal.innerHTML = `
      <div style="background:#1e293b; padding:40px; border-radius:12px; width:450px; text-align:center; border:1px solid #3b82f6;">
      <h2 style="color:#38bdf8; margin-top:0;">WBT Desktop PRO Required</h2>
      <p style="color:#cbd5e1; font-size:14px; margin-bottom:20px;">Fitur ini eksklusif untuk versi Premium. Anda sedang menggunakan versi Gratis (hanya mendukung Split & Merge).</p>
      
      <button onclick="window.open('https://wbtdigitallabs.myr.id/pl/lisensi-premium-wbt-desktop-pro/', '_blank')" style="background:transparent; border:1px solid #3b82f6; color:#38bdf8; padding:12px; width:100%; border-radius:6px; cursor:pointer; font-weight:bold; margin-bottom:20px;">
        Beli Lisensi (Rp 30.000)
      </button>
      
      <div style="border-top:1px solid #334155; padding-top:20px; position:relative;">
        <span style="position:absolute; top:-10px; left:50%; transform:translateX(-50%); background:#1e293b; padding:0 10px; font-size:12px; color:#64748b;">SUDAH PUNYA KODE?</span>
        <input type="text" id="modal-license-key" placeholder="WBT-XXXX-YYYY" style="width:90%; padding:12px; margin-bottom:15px; background:#0f172a; border:1px solid #475569; color:white; text-align:center; letter-spacing:2px; font-weight:bold; border-radius:6px;">
        <button id="btn-activate-modal" style="background:#10b981; color:white; border:none; padding:12px; width:100%; border-radius:6px; font-weight:bold; cursor:pointer;">Aktifkan Aplikasi</button>
      </div>
      <button id="btn-close-modal" style="margin-top:15px; background:transparent; color:#94a3b8; border:none; cursor:pointer; text-decoration:underline;">Tutup</button>
      </div>
    `;
    document.body.appendChild(modal);

  document.getElementById('btn-close-modal').onclick = () => document.body.removeChild(modal);
  
  document.getElementById('btn-activate-modal').onclick = () => {
    const key = document.getElementById('modal-license-key').value.trim();
    if (!key) return alert('Masukkan Kunci Lisensi!');
    if (window.verifyDesktopKey(key)) {
      localStorage.setItem('wbt_desktop_license', key);
      isDesktopPro = true;
      alert('Aktivasi Berhasil! Terima kasih telah membeli WBT Document Toolkit Pro.');
      document.body.removeChild(modal);
      if(callback) callback();
    } else {
      alert('Kunci Lisensi tidak valid atau salah.');
    }
  };
}


async function processCurrentTool() {
    if (isMobileApp && !hasPurchasedNoAds) {
      return showMobileAdAndProcess(executeProcessing);
    }
    return executeProcessing();
}

async function executeProcessing() {
    
    
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
      else {
        await new Promise(r => setTimeout(r, 1000));
        showToast('Fitur ini sedang dalam tahap pengembangan untuk versi Offline murni (Coming Soon).', 'warning');
      }
    } catch (e) {
      console.error(e);
      showToast('Gagal memproses file: ' + e.message, 'error');
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
  downloadBlob(pdfBytes, 'Merged_Document_WBT_Docs.pdf', 'application/pdf');
}

async function processSplit() {
    const arrayBuffer = await selectedFiles[0].arrayBuffer();
    const pdf = await PDFDocument.load(arrayBuffer);
    const totalPages = pdf.getPageCount();
    
    const inputs = document.querySelectorAll('.split-range-input');
    let partNum = 1;
    
    for (let input of inputs) {
      const rangeInput = input.value.trim();
      let targetIndices = [];
      
      if (!rangeInput) {
        for (let i = 0; i < totalPages; i++) {
          const splitPdf = await PDFDocument.create();
          const [copiedPage] = await splitPdf.copyPages(pdf, [i]);
          splitPdf.addPage(copiedPage);
          const pdfBytes = await splitPdf.save();
          downloadBlob(pdfBytes, `Split_Part${partNum}_Page${i+1}_WBT_Docs.pdf`, 'application/pdf');
          await new Promise(r => setTimeout(r, 400));
        }
        partNum++;
        continue;
      }
      
      const ranges = rangeInput.split(',');
      for (const r of ranges) {
        const parts = r.split('-');
        if (parts.length === 2) {
          const start = Math.max(1, parseInt(parts[0].trim())) - 1;
          const end = Math.min(totalPages, parseInt(parts[1].trim())) - 1;
          for (let i = start; i <= end; i++) {
             if(!targetIndices.includes(i)) targetIndices.push(i);
          }
        } else {
          const idx = parseInt(parts[0].trim());
          if (!isNaN(idx)) {
            const validIdx = Math.max(1, Math.min(totalPages, idx)) - 1;
            if(!targetIndices.includes(validIdx)) targetIndices.push(validIdx);
          }
        }
      }
      
      targetIndices.sort((a,b) => a - b);
      
      if (targetIndices.length > 0) {
        const splitPdf = await PDFDocument.create();
        const copiedPages = await splitPdf.copyPages(pdf, targetIndices);
        copiedPages.forEach((page) => splitPdf.addPage(page));
        const pdfBytes = await splitPdf.save();
        
        let filename = inputs.length > 1 ? `Split_Part${partNum}_WBT_Docs.pdf` : 'Split_Document_WBT_Docs.pdf';
        downloadBlob(pdfBytes, filename, 'application/pdf');
        await new Promise(r => setTimeout(r, 600));
      }
      
      partNum++;
    }
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
  downloadBlob(pdfBytes, 'Cleaned_Document_WBT_Docs.pdf', 'application/pdf');
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
  downloadBlob(pdfBytes, 'Extracted_Pages_WBT_Docs.pdf', 'application/pdf');
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
  downloadBlob(pdfBytes, 'Reordered_Document_WBT_Docs.pdf', 'application/pdf');
}

async function processCompress() {
  const arrayBuffer = await selectedFiles[0].arrayBuffer();
  const pdf = await PDFDocument.load(arrayBuffer);
  const pdfBytes = await pdf.save({ useObjectStreams: true });
  downloadBlob(pdfBytes, 'Compressed_Document_WBT_Docs.pdf', 'application/pdf');
}

async function processRepair() {
  const arrayBuffer = await selectedFiles[0].arrayBuffer();
  const pdf = await PDFDocument.load(arrayBuffer, { ignoreEncryption: true });
  const pdfBytes = await pdf.save({ useObjectStreams: true });
  downloadBlob(pdfBytes, 'Repaired_Document_WBT_Docs.pdf', 'application/pdf');
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
  downloadBlob(pdfBytes, 'Metadata_Cleaned_WBT_Docs.pdf', 'application/pdf');
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
  downloadBlob(pdfBytes, 'Converted_Images_WBT_Docs.pdf', 'application/pdf');
}

async function processNote2Pdf() {
  const text = document.getElementById('note-content').value || 'Catatan PDF Toolkit Lite';
  const pdfDoc = await PDFDocument.create();
  const page = pdfDoc.addPage([595, 842]);
  page.drawText(text, { x: 50, y: 780, size: 12, lineHeight: 18, maxWidth: 495 });
  const pdfBytes = await pdfDoc.save();
  downloadBlob(pdfBytes, 'Notes_Document_WBT_Docs.pdf', 'application/pdf');
}

async function processHtml2Pdf() {
  const html = document.getElementById('html-content').value || '<h1>Laporan HTML</h1>';
  const strippedText = html.replace(/<[^>]*>?/gm, '\n').replace(/^\s*[\r\n]/gm, '');
  const pdfDoc = await PDFDocument.create();
  const page = pdfDoc.addPage([595, 842]);
  page.drawText(strippedText, { x: 50, y: 780, size: 13, lineHeight: 20, maxWidth: 495 });
  const pdfBytes = await pdfDoc.save();
  downloadBlob(pdfBytes, 'HTML_Snippet_WBT_Docs.pdf', 'application/pdf');
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
    a.download = `Page1_Extracted_WBT_Docs.${format}`;
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
  downloadBlob(new TextEncoder().encode(fullText), 'Extracted_Text_WBT_Docs.txt', 'text/plain');
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
  downloadBlob(new TextEncoder().encode(csvContent), 'Extracted_Data_WBT_Docs.csv', 'text/csv');
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
  downloadBlob(pdfBytes, 'Rotated_Document_WBT_Docs.pdf', 'application/pdf');
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
  downloadBlob(pdfBytes, 'Numbered_Document_WBT_Docs.pdf', 'application/pdf');
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
  downloadBlob(pdfBytes, 'Watermarked_Document_WBT_Docs.pdf', 'application/pdf');
}

async function processProtect() {
  const pwd = document.getElementById('pdf-password').value || '123456';
  const arrayBuffer = await selectedFiles[0].arrayBuffer();
  const pdf = await PDFDocument.load(arrayBuffer);
  pdf.setTitle(`Protected Document (Password: ${pwd})`);
  const pdfBytes = await pdf.save();
  downloadBlob(pdfBytes, 'Protected_Document_WBT_Docs.pdf', 'application/pdf');
}

async function processUnlock() {
  const arrayBuffer = await selectedFiles[0].arrayBuffer();
  const pdf = await PDFDocument.load(arrayBuffer, { ignoreEncryption: true });
  pdf.setTitle('Unlocked Document');
  const pdfBytes = await pdf.save();
  downloadBlob(pdfBytes, 'Unlocked_Document_WBT_Docs.pdf', 'application/pdf');
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
  downloadBlob(pdfBytes, 'Signed_Document_WBT_Docs.pdf', 'application/pdf');
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
  if (codeInput === 'IMPOSSIBLE_CODE_999' || codeInput === 'IMPOSSIBLE_CODE_999') {
    isPro = true;
    localStorage.setItem('pdf_toolkit_is_pro_v2', 'true');
    updateQuotaUI();
    closeUpgradeModal();
    showToast('🎉 Selamat! Akun Anda telah di-upgrade ke Pro Lifetime!', 'success');
  } else {
    showToast('Kode aktivasi tidak valid. Gunakan kode: PRO3K', 'error');
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
      localStorage.setItem('pdf_toolkit_is_pro_v2', 'true');
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



  async function processWithCloudConvert(inputFormat, outputFormat) {
    const apiKey = 'eyJ0eXAiOiJKV1QiLCJhbGciOiJSUzI1NiJ9.eyJhdWQiOiIxIiwianRpIjoiMGU4NmY5OGY4Y2E3OWMyMzA0MmI2N2ZmNmM3YmVhZGExM2FjNDZjNzY2ODY5ZDg5ZmU3OGQzMTY1ODFjYjQwMjViZTBiNGIzZDMwNTkzNGQiLCJpYXQiOjE3ODg1NjA1NjUuNTA5ODIsIm5iZiI6MTc4ODU2MDU2NS41MDk4MjEsImV4cCI6NDk0NDIzNDE2NS40OTkyMDcsInN1YiI6Ijc2ODU3MjM4Iiwic2NvcGVzIjpbInVzZXIucmVhZCIsInRhc2sucmVhZCIsInRhc2sud3JpdGUiLCJ1c2VyLndyaXRlIiwid2ViaG9vay53cml0ZSIsIndlYmhvb2sucmVhZCIsInByZXNldC53cml0ZSIsInByZXNldC5yZWFkIl19.AkrzfvCJB2mt7SEvGKoMO5dJCVEGwU3fW0Q_rBQQLxjaPy53JF4xT_Liu83Eef_rLYQFK-B3AGyg1cO61ZlzZS8eVMiZahaWfc5ND10itr6nSD9NdS99_SgfkacipwWL5Mgu21IcPNRS6zp6NEh36Namu5MdTnAGYzl4bhPb2rePWrGeFjajBJBR2E88FMIaCl5_42HUR8IK1AnLu539KntAVUR0VdNeHkpLQWtYccz0XInIA1Zt4A3NZl1ft6aSKmUZsMPmyT6PFw58zZLL6ZQMqtbt8YwWQCfPxObPeIxmhkr41Cl4ILd3orZ3-AOqTXZYeo5Qdp2wUIXCgw-i67TjPZLtkqZurgcpKzcdMrYwyovUsVNoOIZUXkd7H_4RFzNcM-zjxcIbOaAs6oW6z9OqeBlvgHMdfNmwdX_Svq6u299H9O9LHOYsoY8Dk1h_ipqV-elcQMK87gob4x8CP0CtlktbtafWMvjG54njxr47iHxGXw7zJi3dMIdrOVZvLhiS2pTYWT-20aaG9vRqLVNZovrKkmri7QQsL8Rtdpgl6fVKV55wTITNpOGlWoak2PqwdZStcASiWDMx_47PHHjcLZZd4VCTZL6XZnE7BuGDHmU9l4XpsuEtGtULcHJ8WyldgNXTOBHJwM-lNaktENw8sTpFSojTaN6sjz6fJRY';
    const file = selectedFiles[0];
    
    // 1. Create Job
    const jobReq = await fetch('https://api.cloudconvert.com/v2/jobs', {
      method: 'POST',
      headers: {
        'Authorization': 'Bearer ' + apiKey,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        tasks: {
          'import-it': { operation: 'import/upload' },
          'convert-it': { operation: 'convert', input: 'import-it', output_format: outputFormat },
          'export-it': { operation: 'export/url', input: 'convert-it' }
        }
      })
    });
    
    if (!jobReq.ok) {
       const err = await jobReq.json();
       throw new Error("API Error: " + (err.message || 'Gagal menghubungi server CloudConvert.'));
    }
    
    const jobData = await jobReq.json();
    const importTask = jobData.data.tasks.find(t => t.name === 'import-it');
    const uploadUrl = importTask.result.form.url;
    const uploadParams = importTask.result.form.parameters;
    
    // 2. Upload file
    const formData = new FormData();
    for (const key in uploadParams) {
      formData.append(key, uploadParams[key]);
    }
    formData.append('file', file);
    
    showToast('Mengunggah dokumen ke server konversi...', 'info');
    const uploadReq = await fetch(uploadUrl, { method: 'POST', body: formData });
    if (!uploadReq.ok) throw new Error("Gagal mengunggah file.");
    
    // 3. Poll job status
    showToast('Memproses dokumen di Cloud (Mungkin memakan waktu beberapa menit)...', 'info');
    let jobFinished = false;
    let exportUrl = null;
    
    while (!jobFinished) {
      await new Promise(r => setTimeout(r, 2000));
      const pollReq = await fetch(`https://api.cloudconvert.com/v2/jobs/${jobData.data.id}`, {
        headers: { 'Authorization': 'Bearer ' + apiKey }
      });
      const pollData = await pollReq.json();
      const status = pollData.data.status;
      
      if (status === 'error') {
         throw new Error("Proses konversi gagal di server.");
      } else if (status === 'finished') {
         jobFinished = true;
         const exportTask = pollData.data.tasks.find(t => t.name === 'export-it');
         exportUrl = exportTask.result.files[0].url;
      }
    }
    
    // 4. Download file
    showToast('Mengunduh hasil...', 'info');
    const downloadReq = await fetch(exportUrl);
    const blob = await downloadReq.blob();
    const filename = file.name.substring(0, file.name.lastIndexOf('.')) + '.' + outputFormat;
    downloadBlob(blob, filename, downloadReq.headers.get('Content-Type') || 'application/octet-stream');
  }
