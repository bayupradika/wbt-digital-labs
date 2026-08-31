import re

with open('d:/Produk-Sell/tools/PDF-Toolkit-Lite/app.js', 'r', encoding='utf-8') as f:
    content = f.read()

# Add missing configurations dynamically
new_tools = '''
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
'''

pattern = re.compile(r'const toolsConfig = \{')
content = pattern.sub(f'const toolsConfig = {{\n{new_tools}', content, count=1)

with open('d:/Produk-Sell/tools/PDF-Toolkit-Lite/app.js', 'w', encoding='utf-8') as f:
    f.write(content)

print("Berhasil update toolsConfig di app.js.")
