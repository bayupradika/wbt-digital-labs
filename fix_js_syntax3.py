import re

with open('d:/Produk-Sell/tools/PDF-Toolkit-Lite/app.js', 'r', encoding='utf-8') as f:
    content = f.read()

# Fix the leftover updateQuotaUI chunk
content = re.sub(r'function updateQuotaUI\(\) \{ /\* Removed Pro Feature \*/ \}\s*if \(isPro\) \{.*?\}\n\}', 'function updateQuotaUI() { /* Removed Pro Feature */ }', content, flags=re.DOTALL)

with open('d:/Produk-Sell/tools/PDF-Toolkit-Lite/app.js', 'w', encoding='utf-8') as f:
    f.write(content)
