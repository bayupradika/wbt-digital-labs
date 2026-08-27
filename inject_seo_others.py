import os
import re

tools_data = {
    "ai/Background-Eraser-AI/index.html": {
        "url": "https://bayupradika.github.io/wbt-digital-labs/ai/Background-Eraser-AI/",
        "title": "Background Eraser AI Pro",
        "desc": "Hapus latar belakang foto otomatis menjadi PNG transparan dengan AI. 100% Offline.",
        "category": "DesignApplication",
        "seo": '''
<article class="seo-content" style="margin-top: 40px; padding: 24px; background: rgba(15, 23, 42, 0.5); border-radius: 16px; border: 1px solid rgba(255,255,255,0.1); color: #cbd5e1; line-height: 1.6;">
  <h2 style="color: white; font-size: 24px; margin-bottom: 16px;">Penghapus Latar Belakang (Background Eraser) Berbasis AI</h2>
  <p style="margin-bottom: 16px;">Hapus latar belakang foto dengan sekali klik. Background Eraser AI Pro memisahkan objek utama dari latar dengan sangat akurat. Yang membedakan tool kami adalah <strong>semua pemrosesan terjadi langsung di perangkat Anda</strong> (100% Offline). Tidak ada foto yang dikirim ke server internet.</p>
  
  <h3 style="color: white; font-size: 20px; margin-top: 24px; margin-bottom: 12px;">Keunggulan & Fitur</h3>
  <ul style="margin-left: 20px; margin-bottom: 16px; list-style-type: disc;">
    <li><strong>Sangat Privat (Offline):</strong> Data foto pas foto, KTP, atau wajah Anda tidak pernah keluar dari memori browser HP/Laptop Anda.</li>
    <li><strong>Kualitas Transparan (PNG):</strong> Ekspor hasil potongan presisi tanpa watermark beresolusi tinggi.</li>
    <li><strong>Solid Color & Blur Background:</strong> Langsung ubah latar belakang jadi merah muda, biru, putih (untuk e-commerce) atau buram (bokeh).</li>
  </ul>

  <h3 style="color: white; font-size: 20px; margin-top: 24px; margin-bottom: 12px;">FAQ</h3>
  <p><strong>Bagaimana cara upgrade jika limit habis?</strong> Anda hanya cukup membayar biaya sangat murah (mulai dari Rp 3.000) lewat QRIS untuk melepas batas penggunaan, tanpa berlangganan bulanan mahal.</p>

  <h3 style="color: white; font-size: 20px; margin-top: 24px; margin-bottom: 12px;">Jelajahi Alat Kami Lainnya</h3>
  <p>Jika Anda butuh memperjelas foto yang buram, gunakan <a href="/wbt-digital-labs/ai/AI-Photo-Enhancer/index.html" style="color: #38bdf8;">AI Photo Enhancer</a> atau buat deskripsi foto otomatis di <a href="/wbt-digital-labs/ai/AI-Image-Captioner/index.html" style="color: #38bdf8;">AI Image Captioner</a>.</p>
</article>
'''
    },
    "tools/WBT-Image-Studio-Pro/index.html": {
        "url": "https://bayupradika.github.io/wbt-digital-labs/tools/WBT-Image-Studio-Pro/",
        "title": "WBT Image Studio Pro",
        "desc": "Koleksi tools kompresi gambar, resize, crop, filter, dan OCR dalam satu suite offline.",
        "category": "MultimediaApplication",
        "seo": '''
<article class="seo-content" style="margin-top: 40px; padding: 24px; background: rgba(15, 23, 42, 0.5); border-radius: 16px; border: 1px solid rgba(255,255,255,0.1); color: #cbd5e1; line-height: 1.6;">
  <h2 style="color: white; font-size: 24px; margin-bottom: 16px;">WBT Image Studio Pro: Kompresor & Resizer Foto Offline Terlengkap</h2>
  <p style="margin-bottom: 16px;">Kurangi ukuran memori foto (Kompres Gambar), ubah resolusi (Resize), hapus info lokasi GPS (EXIF Cleaner), hingga ekstrak teks dari gambar (OCR) langsung dari browser Anda tanpa harus mengunduh aplikasi tambahan.</p>
  
  <h3 style="color: white; font-size: 20px; margin-top: 24px; margin-bottom: 12px;">Fungsi Utama Aplikasi Studio</h3>
  <ul style="margin-left: 20px; margin-bottom: 16px; list-style-type: disc;">
    <li><strong>Image Compressor:</strong> Turunkan ukuran JPG/PNG dari 5MB menjadi 50KB dengan cepat agar mudah diunggah ke website.</li>
    <li><strong>Batch Processing:</strong> Kompres puluhan foto sekaligus.</li>
    <li><strong>QuickScan OCR:</strong> Baca gambar yang berisi tulisan dan ubah otomatis menjadi teks.</li>
    <li><strong>100% Offline:</strong> Sama seperti produk WBT lainnya, file rahasia tetap berada di perangkat Anda, menjaga privasi maksimal.</li>
  </ul>

  <h3 style="color: white; font-size: 20px; margin-top: 24px; margin-bottom: 12px;">Cara Kerja Tool Ini</h3>
  <p>Cukup pilih foto atau sekumpulan foto, tentukan pengaturan kompresi, dan aplikasi WebAssembly akan merender hasilnya dalam milidetik di dalam memori browser.</p>
</article>
'''
    },
    "tools/Social-Media-Video-Downloader/index.html": {
        "url": "https://bayupradika.github.io/wbt-digital-labs/tools/Social-Media-Video-Downloader/",
        "title": "Social Media Video Downloader Pro",
        "desc": "Download video dan audio MP3 dari YouTube, TikTok, Facebook tanpa watermark.",
        "category": "MultimediaApplication",
        "seo": '''
<article class="seo-content" style="margin-top: 40px; padding: 24px; background: rgba(15, 23, 42, 0.5); border-radius: 16px; border: 1px solid rgba(255,255,255,0.1); color: #cbd5e1; line-height: 1.6; max-width: 1100px; margin-left: auto; margin-right: auto;">
  <h2 style="color: white; font-size: 24px; margin-bottom: 16px;">Unduh Video Sosial Media Favorit Tanpa Watermark Secara Gratis</h2>
  <p style="margin-bottom: 16px;">Apakah Anda ingin menyimpan video dari YouTube, TikTok, Instagram, Facebook, X, atau platform lainnya ke galeri HP/Laptop Anda? WBT Social Video Downloader membantu Anda mengekstrak media tersebut dengan kualitas maksimal hingga Full HD / 4K (tergantung sumber) <strong>tanpa disertai logo watermark</strong>.</p>
  
  <h3 style="color: white; font-size: 20px; margin-top: 24px; margin-bottom: 12px;">Fitur Super Cepat Kami</h3>
  <ul style="margin-left: 20px; margin-bottom: 16px; list-style-type: disc;">
    <li><strong>Tanpa Aplikasi Tambahan:</strong> Cukup salin dan tempel (copy-paste) link video.</li>
    <li><strong>Audio Extractor (MP3):</strong> Unduh lagu MP3 320kbps dari sebuah video musik secara terpisah.</li>
    <li><strong>Bebas Iklan Pop-up:</strong> Kami mendesain antarmuka yang sangat bersih dan rapi, bebas dari iklan perjudian atau pop-up spam yang mengganggu.</li>
  </ul>

  <h3 style="color: white; font-size: 20px; margin-top: 24px; margin-bottom: 12px;">Apakah Ada Batas Download Harian?</h3>
  <p>Pengguna gratis mendapat kuota download harian untuk menjaga stabilitas server. Apabila limit tercapai, Anda dapat meng-upgrade ke mode PRO dengan sekali bayar seumur hidup seharga mulai dari Rp 3.000 saja.</p>

  <h3 style="color: white; font-size: 20px; margin-top: 24px; margin-bottom: 12px;">Disclaimer Privasi</h3>
  <p>Alat ini hanya mengekstrak video yang diizinkan publik. Kami tidak menyimpan histori unduhan Anda.</p>
</article>
'''
    },
    "ai/Offline-Voice-Transcriber/index.html": {
        "url": "https://bayupradika.github.io/wbt-digital-labs/ai/Offline-Voice-Transcriber/",
        "title": "Offline Voice Transcriber",
        "desc": "Ubah suara menjadi teks (Speech-to-Text) real-time dari mikrofon langsung secara offline.",
        "category": "ProductivityApplication",
        "seo": '''
<article class="seo-content" style="margin-top: 40px; padding: 24px; background: rgba(15, 23, 42, 0.5); border-radius: 16px; border: 1px solid rgba(255,255,255,0.1); color: #cbd5e1; line-height: 1.6;">
  <h2 style="color: white; font-size: 24px; margin-bottom: 16px;">Ubah Ucapan Suara Menjadi Teks Real-Time (Speech to Text)</h2>
  <p style="margin-bottom: 16px;">Tingkatkan produktivitas saat meeting, wawancara, rapat penting, atau kelas kuliah dengan WBT Offline Voice Transcriber. Aplikasi web cerdas ini "mendengarkan" melalui mikrofon perangkat Anda dan mengubah suara menjadi catatan teks tulisan yang tertata rapi.</p>
  
  <h3 style="color: white; font-size: 20px; margin-top: 24px; margin-bottom: 12px;">Mengapa Menggunakan Transcriber Kami?</h3>
  <ul style="margin-left: 20px; margin-bottom: 16px; list-style-type: disc;">
    <li><strong>Sistem Offline Privat (Web Speech API):</strong> Percakapan rahasia Anda sama sekali tidak dikirimkan ke cloud pihak ketiga, menjadikannya 100% aman untuk keperluan kantor atau NDA.</li>
    <li><strong>Deteksi Akurat (Bahasa Indonesia & Inggris):</strong> Sistem dapat menyesuaikan ejaan agar minim typo.</li>
    <li><strong>Ekspor File Teks (.txt / Word):</strong> Mudah disalin atau langsung disimpan.</li>
  </ul>

  <h3 style="color: white; font-size: 20px; margin-top: 24px; margin-bottom: 12px;">Sempurna Untuk:</h3>
  <p>Jurnalis, mahasiswa, notulen rapat, atau konten kreator yang ingin menulis caption dengan menggunakan suara (dikte).</p>

  <h3 style="color: white; font-size: 20px; margin-top: 24px; margin-bottom: 12px;">Tools Bahasa Lainnya</h3>
  <p>Gunakan catatan yang dihasilkan bersama dengan <a href="/wbt-digital-labs/ai/AI-Text-Summarizer/index.html" style="color: #38bdf8;">AI Text Summarizer</a> (untuk merangkum notulen otomatis) atau cek tata bahasa di <a href="/wbt-digital-labs/ai/Offline-Grammar-Checker/index.html" style="color: #38bdf8;">Offline Grammar Checker</a>.</p>
</article>
'''
    }
}

for filepath, data in tools_data.items():
    if not os.path.exists(filepath):
        continue
    with open(filepath, 'r', encoding='utf-8') as f:
        content = f.read()

    # Inject canonical and schema in head
    head_injection = f'''
    <link rel="canonical" href="{data['url']}" />
    <meta name="description" content="{data['desc']}" />
    <script type="application/ld+json">
    {{
      "@context": "https://schema.org",
      "@type": "SoftwareApplication",
      "name": "{data['title']}",
      "operatingSystem": "Web Browser",
      "applicationCategory": "{data['category']}",
      "offers": {{
        "@type": "Offer",
        "price": "3000.00",
        "priceCurrency": "IDR"
      }}
    }}
    </script>
    '''
    
    if '<link rel="canonical"' not in content:
        content = content.replace('</title>', '</title>\n' + head_injection)

    seo_content = data['seo']
    
    if 'seo-content' not in content:
        # Custom logic per file for inserting SEO block nicely before the scripts or end of main container
        if filepath == "tools/Social-Media-Video-Downloader/index.html":
             # replace before <script> tags or before </body>
             content = re.sub(r'(\s*<script[^>]*src="[^"]*midtrans-pay[^"]*".*?</script>)', '\n' + seo_content + r'\1', content, count=1)
        else:
             # Find last closing div before script
             content = re.sub(r'(\s*<script[^>]*src="script\.js".*?</script>)', '\n' + seo_content + r'\1', content, count=1)
             if 'seo-content' not in content:
                  content = re.sub(r'(\s*<script[^>]*src="app\.js".*?</script>)', '\n' + seo_content + r'\1', content, count=1)
                  
        if 'seo-content' not in content:
            content = content.replace('</body>', seo_content + '\n</body>')

    with open(filepath, 'w', encoding='utf-8') as f:
        f.write(content)

print("Injected SEO to 4 remaining Top Tools")
