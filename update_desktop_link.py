import re

with open('d:/Produk-Sell/tools/PDF-Toolkit-Lite/desktop-build/main.js', 'r', encoding='utf-8') as f:
    content = f.read()

content = content.replace("shell.openExternal('https://mayar.id/pay/wbt-desktop-pro')", "shell.openExternal('https://wbtdigitallabs.myr.id/pl/lisensi-premium-wbt-desktop-pro/')")

with open('d:/Produk-Sell/tools/PDF-Toolkit-Lite/desktop-build/main.js', 'w', encoding='utf-8') as f:
    f.write(content)
