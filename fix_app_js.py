import re

# Fix app.js
with open('d:/Produk-Sell/tools/PDF-Toolkit-Lite/desktop-build/src/app.js', 'r', encoding='utf-8') as f:
    app_js = f.read()

# Remove the offending line
app_js = re.sub(r"const { app } = require\('@electron/remote'\).*?\n", "", app_js)

with open('d:/Produk-Sell/tools/PDF-Toolkit-Lite/desktop-build/src/app.js', 'w', encoding='utf-8') as f:
    f.write(app_js)

print("Fixed app.js")
