import re

with open('d:/Produk-Sell/tools/PDF-Toolkit-Lite/index.html', 'r', encoding='utf-8') as f:
    content = f.read()

# Replace the hero badge
old_badge = r'<div class="hero-badge">\s*<i class="fa-solid fa-shield-halved"></i> 100% Offline &amp; Privasi Dokumen Terjamin\s*</div>'
new_badge = '<div class="hero-badge">\n      <i class="fa-solid fa-bolt"></i> Gratis, Cepat &amp; Privasi Dokumen Aman\n    </div>'
content = re.sub(old_badge, new_badge, content)

# Replace the title description
old_desc = r'<p class="hero-desc">Kelola, gabung, pisahkan, dan kompres file PDF, Word, Excel, hingga Markdown secara instan <strong>langsung di dalam perangkat Anda</strong> tanpa batas unggah.</p>'
new_desc = '<p class="hero-desc">Solusi lengkap kelola dokumen Anda. Gabung, pisahkan, kompres, dan konversi file PDF serta Office secara instan dengan akses tanpa batas.</p>'
content = re.sub(old_desc, new_desc, content)

with open('d:/Produk-Sell/tools/PDF-Toolkit-Lite/index.html', 'w', encoding='utf-8') as f:
    f.write(content)
