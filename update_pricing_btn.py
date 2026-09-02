import re

with open('d:/Produk-Sell/tools/PDF-Toolkit-Lite/index.html', 'r', encoding='utf-8') as f:
    content = f.read()

# Replace the alert button with the actual Mayar link
old_btn = '''<button class="btn btn-gold" style="width: 100%;" onclick="alert('Instalasi Desktop sedang dipersiapkan. Hubungi admin untuk Pre-Order.')">Pre-Order Lisensi Desktop (Rp 30rb)</button>'''
new_btn = '''<a href="https://wbtdigitallabs.myr.id/pl/lisensi-premium-wbt-desktop-pro/" target="_blank" style="text-decoration:none;"><button class="btn btn-gold" style="width: 100%;">Beli Lisensi Desktop (Rp 30rb)</button></a>'''

content = content.replace(old_btn, new_btn)

with open('d:/Produk-Sell/tools/PDF-Toolkit-Lite/index.html', 'w', encoding='utf-8') as f:
    f.write(content)
