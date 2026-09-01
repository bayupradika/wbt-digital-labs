with open('d:/Produk-Sell/tools/PDF-Toolkit-Lite/app.js', 'r', encoding='utf-8') as f:
    content = f.read()

content = content.replace('function updateQuotaUI() { /* Removed Pro Feature */ });', 'function updateQuotaUI() { /* Removed Pro Feature */ }')

with open('d:/Produk-Sell/tools/PDF-Toolkit-Lite/app.js', 'w', encoding='utf-8') as f:
    f.write(content)
