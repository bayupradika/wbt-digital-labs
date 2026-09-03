import re

with open('d:/Produk-Sell/tools/PDF-Toolkit-Lite/desktop-build/src/index.html', 'r', encoding='utf-8') as f:
    html = f.read()

# Replace links
html = html.replace('https://cdnjs.cloudflare.com/ajax/libs/pdf-lib/1.17.1/pdf-lib.min.js', './assets/js/pdf-lib.min.js')
html = html.replace('https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.min.js', './assets/js/pdf.min.js')
html = html.replace('https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js', './assets/js/pdf.worker.min.js')
html = html.replace('https://cdnjs.cloudflare.com/ajax/libs/marked/4.3.0/marked.min.js', './assets/js/marked.min.js')

with open('d:/Produk-Sell/tools/PDF-Toolkit-Lite/desktop-build/src/index.html', 'w', encoding='utf-8') as f:
    f.write(html)

print("Updated script tags")
