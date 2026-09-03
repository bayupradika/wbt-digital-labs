import re

with open('d:/Produk-Sell/tools/PDF-Toolkit-Lite/desktop-build/src/app.js', 'r', encoding='utf-8') as f:
    app_js = f.read()

# Fix the missing backticks around modal.innerHTML
app_js = re.sub(
    r'modal\.innerHTML = \s*<div style="background:#1e293b;',
    r'modal.innerHTML = `\n    <div style="background:#1e293b;',
    app_js
)

app_js = re.sub(
    r'</button>\s*</div>\s*document\.body\.appendChild\(modal\);',
    r'</button>\n    </div>\n  `;\n  document.body.appendChild(modal);',
    app_js
)

with open('d:/Produk-Sell/tools/PDF-Toolkit-Lite/desktop-build/src/app.js', 'w', encoding='utf-8') as f:
    f.write(app_js)
