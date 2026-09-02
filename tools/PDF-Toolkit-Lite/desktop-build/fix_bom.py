with open('d:/Produk-Sell/tools/PDF-Toolkit-Lite/desktop-build/package.json', 'r', encoding='utf-8-sig') as f:
    content = f.read()

with open('d:/Produk-Sell/tools/PDF-Toolkit-Lite/desktop-build/package.json', 'w', encoding='utf-8') as f:
    f.write(content)
