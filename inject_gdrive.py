import re

with open('d:/Produk-Sell/tools/PDF-Toolkit-Lite/index.html', 'r', encoding='utf-8') as f:
    content = f.read()

# Current Desktop Card section:
# <div class="pricing-card pro"> ... 
# <a href="https://wbtdigitallabs.myr.id/pl/lisensi-premium-wbt-desktop-pro/" target="_blank" style="text-decoration:none;"><button class="btn btn-gold" style="width: 100%;">Beli Lisensi Desktop (Rp 30rb)</button></a>
# </div>

new_desktop_card_buttons = '''
      <a href="https://drive.google.com/drive/folders/1yXzbKAL4VE1qqmN4Y6Fnfrm0EFZosVze?usp=sharing" target="_blank" style="text-decoration:none;">
        <button class="btn btn-outline" style="width: 100%; border-color:white; color:white; margin-bottom: 10px;">
          <i class="fa-brands fa-windows"></i> Download Aplikasi Windows
        </button>
      </a>
      <a href="https://wbtdigitallabs.myr.id/pl/lisensi-premium-wbt-desktop-pro/" target="_blank" style="text-decoration:none;">
        <button class="btn btn-gold" style="width: 100%;">Beli Lisensi Pro (Rp 30rb)</button>
      </a>
'''

# We need to replace the single Beli Lisensi button with the two buttons
content = content.replace('<a href="https://wbtdigitallabs.myr.id/pl/lisensi-premium-wbt-desktop-pro/" target="_blank" style="text-decoration:none;"><button class="btn btn-gold" style="width: 100%;">Beli Lisensi Desktop (Rp 30rb)</button></a>', new_desktop_card_buttons)

with open('d:/Produk-Sell/tools/PDF-Toolkit-Lite/index.html', 'w', encoding='utf-8') as f:
    f.write(content)
