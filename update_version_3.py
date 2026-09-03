import json
with open('d:/Produk-Sell/tools/PDF-Toolkit-Lite/desktop-build/package.json', 'r', encoding='utf-8') as f:
    pkg = json.load(f)

pkg['version'] = '1.0.3'

with open('d:/Produk-Sell/tools/PDF-Toolkit-Lite/desktop-build/package.json', 'w', encoding='utf-8') as f:
    json.dump(pkg, f, indent=2)
