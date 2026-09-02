import re

with open('d:/Produk-Sell/tools/PDF-Toolkit-Lite/app.js', 'r', encoding='utf-8') as f:
    content = f.read()

bad = "timerEl.innerText = Tunggu  detik...;"
good = "timerEl.innerText = `Tunggu ${timeLeft} detik...`;"

content = content.replace(bad, good)

with open('d:/Produk-Sell/tools/PDF-Toolkit-Lite/app.js', 'w', encoding='utf-8') as f:
    f.write(content)
