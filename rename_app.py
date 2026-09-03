import re

# Update app.js
with open('d:/Produk-Sell/tools/PDF-Toolkit-Lite/app.js', 'r', encoding='utf-8') as f:
    app_js = f.read()

app_js = app_js.replace('_PDFToolkitLite', '_WBT_Document_Toolkit')

with open('d:/Produk-Sell/tools/PDF-Toolkit-Lite/app.js', 'w', encoding='utf-8') as f:
    f.write(app_js)

# Update index.html
with open('d:/Produk-Sell/tools/PDF-Toolkit-Lite/index.html', 'r', encoding='utf-8') as f:
    index_html = f.read()

index_html = index_html.replace('PDF Toolkit Lite', 'WBT Document Toolkit')
index_html = index_html.replace('PDF Studio', 'Document Studio') # Also change PDF Studio in pricing

with open('d:/Produk-Sell/tools/PDF-Toolkit-Lite/index.html', 'w', encoding='utf-8') as f:
    f.write(index_html)

# Update package.json
import json
with open('d:/Produk-Sell/tools/PDF-Toolkit-Lite/desktop-build/package.json', 'r', encoding='utf-8') as f:
    pkg = json.load(f)

pkg['name'] = 'wbt-document-toolkit'
pkg['build'] = {
    "productName": "WBT Document Toolkit Pro",
    "appId": "com.wbt.documenttoolkit"
}

with open('d:/Produk-Sell/tools/PDF-Toolkit-Lite/desktop-build/package.json', 'w', encoding='utf-8') as f:
    json.dump(pkg, f, indent=2)

print("Berhasil mengganti nama aplikasi")
