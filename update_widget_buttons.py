import re

def update_widget(file_path):
    with open(file_path, 'r', encoding='utf-8') as f:
        html = f.read()

    # The block to replace
    old_buttons = """<div id="donation-buttons" style="display: flex; gap: 8px; margin-top: 5px;">
      <button class="don-btn" onclick="window.open('https://wbtdigitallabs.myr.id/', '_blank')">☕ Rp 10.000</button>
      <button class="don-btn" onclick="window.open('https://wbtdigitallabs.myr.id/', '_blank')">☕ Rp 25.000</button>
      <button class="don-btn" onclick="window.open('https://wbtdigitallabs.myr.id/', '_blank')">☕ Rp 50.000</button>
    </div>"""
    
    # New block
    new_buttons = """<div id="donation-buttons" style="display: flex; gap: 8px; margin-top: 5px;">
      <button class="don-btn" onclick="window.open('https://wbtdigitallabs.myr.id/', '_blank')" style="font-size: 14px; padding: 10px; width: 100%;">☕ Traktir (Nominal Bebas)</button>
    </div>"""
    
    # We use regex to handle any potential spacing issues
    pattern = re.compile(r'<div id="donation-buttons".*?</div>', re.DOTALL)
    html = pattern.sub(new_buttons, html)

    with open(file_path, 'w', encoding='utf-8') as f:
        f.write(html)
        print("Updated " + file_path)

update_widget('d:/Produk-Sell/index.html')
update_widget('d:/Produk-Sell/tools/PDF-Toolkit-Lite/index.html')
update_widget('d:/Produk-Sell/tools/PDF-Toolkit-Lite/desktop-build/src/index.html')
