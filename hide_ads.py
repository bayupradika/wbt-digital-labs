import re

with open('d:/Produk-Sell/tools/PDF-Toolkit-Lite/index.html', 'r', encoding='utf-8') as f:
    content = f.read()

# Comment out the AdSense Placeholders
old_html = '''<!-- AdSense Placeholders -->
<div class="wbt-ad-container wbt-ad-left">Iklan Kiri<br>(160x600)</div>
<div class="wbt-ad-container wbt-ad-right">Iklan Kanan<br>(160x600)</div>
<div class="wbt-ad-container wbt-ad-bottom">Banner Iklan Bawah (Responsive)</div>'''

new_html = '''<!-- AdSense Placeholders (Dinonaktifkan Sementara) 
<div class="wbt-ad-container wbt-ad-left">Iklan Kiri<br>(160x600)</div>
<div class="wbt-ad-container wbt-ad-right">Iklan Kanan<br>(160x600)</div>
<div class="wbt-ad-container wbt-ad-bottom">Banner Iklan Bawah (Responsive)</div>
-->'''

content = content.replace(old_html, new_html)

with open('d:/Produk-Sell/tools/PDF-Toolkit-Lite/index.html', 'w', encoding='utf-8') as f:
    f.write(content)
print("Berhasil menyembunyikan slot iklan.")
