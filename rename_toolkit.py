import re
import os

# 1. Update Mega Portal (d:/Produk-Sell/index.html)
mega_portal_path = 'd:/Produk-Sell/index.html'
with open(mega_portal_path, 'r', encoding='utf-8') as f:
    html = f.read()
# Replace Document Toolkit with WBT Docs
html = html.replace('Document Toolkit', 'WBT Docs')
html = html.replace('PDF & Office Toolkit Lite', 'WBT Docs') # Just in case
with open(mega_portal_path, 'w', encoding='utf-8') as f:
    f.write(html)

# 2. Update Web App (d:/Produk-Sell/tools/PDF-Toolkit-Lite/index.html)
web_app_path = 'd:/Produk-Sell/tools/PDF-Toolkit-Lite/index.html'
with open(web_app_path, 'r', encoding='utf-8') as f:
    html = f.read()
html = html.replace('Document Toolkit', 'WBT Docs')
html = html.replace('PDF & Office Toolkit Lite', 'WBT Docs')
with open(web_app_path, 'w', encoding='utf-8') as f:
    f.write(html)

# 3. Update Desktop App (d:/Produk-Sell/tools/PDF-Toolkit-Lite/desktop-build/src/index.html)
desktop_app_path = 'd:/Produk-Sell/tools/PDF-Toolkit-Lite/desktop-build/src/index.html'
with open(desktop_app_path, 'r', encoding='utf-8') as f:
    html = f.read()
html = html.replace('Document Toolkit', 'WBT Docs')
html = html.replace('PDF & Office Toolkit Lite', 'WBT Docs')

# Fix Logo link in Desktop app
# Find <a class="wbt-global-header-left" href="https://bayupradika.github.io/wbt-digital-labs/"
# and replace href with "index.html"
html = html.replace('href="https://bayupradika.github.io/wbt-digital-labs/"', 'href="index.html"')
html = html.replace('title="Kembali ke Portal WBT"', 'title="Muat Ulang"')

with open(desktop_app_path, 'w', encoding='utf-8') as f:
    f.write(html)

print("Renaming and link fixing completed.")
