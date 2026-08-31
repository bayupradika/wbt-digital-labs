import re

with open('d:/Produk-Sell/tools/PDF-Toolkit-Lite/index.html', 'r', encoding='utf-8') as f:
    content = f.read()

# Define the new tools grid
new_grid = '''<div class="tools-grid" id="tools-grid" style="display: grid; grid-template-columns: repeat(auto-fill, minmax(240px, 1fr)); gap: 20px;">
  
  <!-- PRIORITIZED FEATURE -->
  <div class="tool-card cat-convert2pdf" onclick="selectTool('word2pdf')" style="border:1px solid rgba(59,130,246,0.6); background: rgba(59,130,246,0.05); grid-column: 1 / -1; display:flex; flex-direction:row; align-items:center; gap: 20px;">
    <div class="tool-icon" style="color:#60a5fa; background:rgba(59,130,246,0.2); font-size: 32px; padding: 20px; border-radius: 12px;"><i class="fa-solid fa-file-word"></i></div>
    <div style="flex-grow: 1;">
      <h3 class="tool-title" style="color:#60a5fa; font-size: 24px;">Convert Word to PDF</h3>
      <p class="tool-desc" style="font-size: 15px;">Ubah dokumen Word (DOCX/DOC) menjadi PDF yang rapi secara offline dengan mudah.</p>
    </div>
    <div class="tool-action" style="color:#60a5fa; font-size: 16px; font-weight: bold; background: #60a5fa22; padding: 10px 20px; border-radius: 99px;">Coba Sekarang <i class="fa-solid fa-arrow-right"></i></div>
  </div>

  <div class="tool-card cat-organize" onclick="selectTool('merge')">
    <div>
      <div class="tool-icon" style="color:#ef4444;"><i class="fa-solid fa-object-group"></i></div>
      <h3 class="tool-title">Merge PDF</h3>
      <p class="tool-desc">Gabungkan beberapa file PDF menjadi satu file utuh.</p>
    </div>
  </div>

  <div class="tool-card cat-organize" onclick="selectTool('split')">
    <div>
      <div class="tool-icon" style="color:#f97316;"><i class="fa-solid fa-scissors"></i></div>
      <h3 class="tool-title">Split PDF</h3>
      <p class="tool-desc">Pisahkan satu PDF menjadi beberapa file terpisah.</p>
    </div>
  </div>

  <div class="tool-card cat-optimize" onclick="selectTool('compress')">
    <div>
      <div class="tool-icon" style="color:#10b981;"><i class="fa-solid fa-compress"></i></div>
      <h3 class="tool-title">Compress PDF</h3>
      <p class="tool-desc">Kecilkan ukuran file PDF tanpa mengurangi kualitas secara drastis.</p>
    </div>
  </div>

  <div class="tool-card cat-convertfrom" onclick="selectTool('pdf2word')">
    <div>
      <div class="tool-icon" style="color:#3b82f6;"><i class="fa-solid fa-file-export"></i></div>
      <h3 class="tool-title">PDF to Word</h3>
      <p class="tool-desc">Konversi file PDF menjadi dokumen Word yang bisa diedit.</p>
    </div>
  </div>

  <div class="tool-card cat-convert2pdf" onclick="selectTool('ppt2pdf')">
    <div>
      <div class="tool-icon" style="color:#f97316;"><i class="fa-solid fa-file-powerpoint"></i></div>
      <h3 class="tool-title">PowerPoint to PDF</h3>
      <p class="tool-desc">Jadikan file presentasi PPT menjadi format PDF.</p>
    </div>
  </div>

  <div class="tool-card cat-convertfrom" onclick="selectTool('pdf2ppt')">
    <div>
      <div class="tool-icon" style="color:#f97316;"><i class="fa-solid fa-desktop"></i></div>
      <h3 class="tool-title">PDF to PowerPoint</h3>
      <p class="tool-desc">Ubah PDF menjadi file presentasi yang mudah diedit.</p>
    </div>
  </div>

  <div class="tool-card cat-convert2pdf" onclick="selectTool('excel2pdf')">
    <div>
      <div class="tool-icon" style="color:#10b981;"><i class="fa-solid fa-file-excel"></i></div>
      <h3 class="tool-title">Excel to PDF</h3>
      <p class="tool-desc">Ubah tabel spreadsheet menjadi file PDF statis.</p>
    </div>
  </div>

  <div class="tool-card cat-convertfrom" onclick="selectTool('pdf2excel')">
    <div>
      <div class="tool-icon" style="color:#10b981;"><i class="fa-solid fa-table"></i></div>
      <h3 class="tool-title">PDF to Excel</h3>
      <p class="tool-desc">Ekstrak tabel dari PDF menjadi file Excel.</p>
    </div>
  </div>

  <div class="tool-card cat-editsec" onclick="selectTool('edit')">
    <div>
      <div class="tool-icon" style="color:#8b5cf6;"><i class="fa-solid fa-pen-to-square"></i></div>
      <h3 class="tool-title">Edit PDF</h3>
      <p class="tool-desc">Tambahkan teks, gambar, bentuk, atau anotasi pada PDF.</p>
    </div>
  </div>

  <div class="tool-card cat-convert2pdf" onclick="selectTool('jpg2pdf')">
    <div>
      <div class="tool-icon" style="color:#eab308;"><i class="fa-regular fa-images"></i></div>
      <h3 class="tool-title">JPG to PDF</h3>
      <p class="tool-desc">Ubah gambar JPG, PNG, dll menjadi file PDF.</p>
    </div>
  </div>

  <div class="tool-card cat-convertfrom" onclick="selectTool('pdf2jpg')">
    <div>
      <div class="tool-icon" style="color:#eab308;"><i class="fa-solid fa-image"></i></div>
      <h3 class="tool-title">PDF to JPG</h3>
      <p class="tool-desc">Ekstrak setiap halaman PDF menjadi gambar JPG.</p>
    </div>
  </div>

  <div class="tool-card cat-editsec" onclick="selectTool('sign')">
    <div>
      <div class="tool-icon" style="color:#6366f1;"><i class="fa-solid fa-signature"></i></div>
      <h3 class="tool-title">Sign PDF</h3>
      <p class="tool-desc">Tambahkan tanda tangan digital ke dokumen Anda.</p>
    </div>
  </div>

  <div class="tool-card cat-editsec" onclick="selectTool('watermark')">
    <div>
      <div class="tool-icon" style="color:#0ea5e9;"><i class="fa-solid fa-stamp"></i></div>
      <h3 class="tool-title">Watermark</h3>
      <p class="tool-desc">Cap PDF Anda dengan gambar atau teks kustom.</p>
    </div>
  </div>

  <div class="tool-card cat-organize" onclick="selectTool('rotate')">
    <div>
      <div class="tool-icon" style="color:#ec4899;"><i class="fa-solid fa-rotate-right"></i></div>
      <h3 class="tool-title">Rotate PDF</h3>
      <p class="tool-desc">Putar orientasi halaman PDF sesuai keinginan Anda.</p>
    </div>
  </div>

  <div class="tool-card cat-convert2pdf" onclick="selectTool('html2pdf')">
    <div>
      <div class="tool-icon" style="color:#14b8a6;"><i class="fa-brands fa-html5"></i></div>
      <h3 class="tool-title">HTML to PDF</h3>
      <p class="tool-desc">Ubah halaman web (HTML) menjadi dokumen PDF.</p>
    </div>
  </div>

  <div class="tool-card cat-editsec" onclick="selectTool('unlock')">
    <div>
      <div class="tool-icon" style="color:#22c55e;"><i class="fa-solid fa-lock-open"></i></div>
      <h3 class="tool-title">Unlock PDF</h3>
      <p class="tool-desc">Hapus password, enkripsi, dan permission dari PDF.</p>
    </div>
  </div>

  <div class="tool-card cat-editsec" onclick="selectTool('protect')">
    <div>
      <div class="tool-icon" style="color:#ef4444;"><i class="fa-solid fa-lock"></i></div>
      <h3 class="tool-title">Protect PDF</h3>
      <p class="tool-desc">Amankan PDF dengan password dan enkripsi berlapis.</p>
    </div>
  </div>

  <div class="tool-card cat-organize" onclick="selectTool('organize')">
    <div>
      <div class="tool-icon" style="color:#8b5cf6;"><i class="fa-solid fa-layer-group"></i></div>
      <h3 class="tool-title">Organize PDF</h3>
      <p class="tool-desc">Urutkan ulang, hapus, atau tambahkan halaman PDF.</p>
    </div>
  </div>

  <div class="tool-card cat-convertfrom" onclick="selectTool('pdf2pdfa')">
    <div>
      <div class="tool-icon" style="color:#3b82f6;"><i class="fa-solid fa-file-archive"></i></div>
      <h3 class="tool-title">PDF to PDF/A</h3>
      <p class="tool-desc">Ubah PDF ke standar pengarsipan ISO yang tahan lama.</p>
    </div>
  </div>

  <div class="tool-card cat-optimize" onclick="selectTool('repair')">
    <div>
      <div class="tool-icon" style="color:#f59e0b;"><i class="fa-solid fa-wrench"></i></div>
      <h3 class="tool-title">Repair PDF</h3>
      <p class="tool-desc">Perbaiki PDF yang rusak atau corrupt agar dapat dibuka kembali.</p>
    </div>
  </div>

  <div class="tool-card cat-organize" onclick="selectTool('pagenumbers')">
    <div>
      <div class="tool-icon" style="color:#0ea5e9;"><i class="fa-solid fa-list-ol"></i></div>
      <h3 class="tool-title">Page Numbers</h3>
      <p class="tool-desc">Tambahkan penomoran halaman pada dokumen PDF dengan mudah.</p>
    </div>
  </div>

  <!-- Original Old Tools Kept for Compatibility -->
  <div class="tool-card cat-word" onclick="selectTool('md_editor')">
    <div>
      <div class="tool-icon" style="color:#60a5fa;"><i class="fa-solid fa-file-code"></i></div>
      <h3 class="tool-title">Markdown Editor Pro</h3>
      <p class="tool-desc">Tulis dan konversi dokumen markdown ke PDF.</p>
    </div>
  </div>

  <div class="tool-card cat-excel" onclick="selectTool('csv_viewer')">
    <div>
      <div class="tool-icon" style="color:#34d399;"><i class="fa-solid fa-table"></i></div>
      <h3 class="tool-title">CSV Viewer</h3>
      <p class="tool-desc">Lihat data tabel CSV langsung secara offline.</p>
    </div>
  </div>

</div>'''

# Replace using regex
pattern = re.compile(r'<div class="tools-grid" id="tools-grid">.*?</section>', re.DOTALL)
new_content = new_grid + '\n  </section>'

content = pattern.sub(new_content, content, count=1)

with open('d:/Produk-Sell/tools/PDF-Toolkit-Lite/index.html', 'w', encoding='utf-8') as f:
    f.write(content)

print("Berhasil mengganti grid HTML.")
