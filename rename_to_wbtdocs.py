import re

# 1. Update app.js
with open('d:/Produk-Sell/tools/PDF-Toolkit-Lite/app.js', 'r', encoding='utf-8') as f:
    app_js = f.read()

app_js = app_js.replace('_WBT_Document_Toolkit', '_WBT_Docs')
app_js = app_js.replace('_PDFToolkitLite', '_WBT_Docs')

with open('d:/Produk-Sell/tools/PDF-Toolkit-Lite/app.js', 'w', encoding='utf-8') as f:
    f.write(app_js)

# 2. Update index.html
with open('d:/Produk-Sell/tools/PDF-Toolkit-Lite/index.html', 'r', encoding='utf-8') as f:
    index_html = f.read()

index_html = index_html.replace('WBT Document Toolkit', 'WBT Docs')
index_html = index_html.replace('Document Toolkit', 'WBT Docs')

with open('d:/Produk-Sell/tools/PDF-Toolkit-Lite/index.html', 'w', encoding='utf-8') as f:
    f.write(index_html)

# 3. Update package.json
import json
with open('d:/Produk-Sell/tools/PDF-Toolkit-Lite/desktop-build/package.json', 'r', encoding='utf-8') as f:
    pkg = json.load(f)

pkg['name'] = 'wbt-docs'
pkg['description'] = 'WBT Docs - Premium Desktop Edition'
pkg['build'] = {
    "productName": "WBT Docs Pro",
    "appId": "com.wbt.docs",
    "directories": {
        "buildResources": "build"
    }
}

with open('d:/Produk-Sell/tools/PDF-Toolkit-Lite/desktop-build/package.json', 'w', encoding='utf-8') as f:
    json.dump(pkg, f, indent=2)

print("Berhasil mengganti nama aplikasi menjadi WBT Docs")
