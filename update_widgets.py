import re

widget_code = """
  <!-- WBT Donation Floating Widget -->
  <div id="wbt-donation-widget" style="position: fixed; bottom: 30px; right: 30px; z-index: 9999; background: rgba(15,23,42,0.95); backdrop-filter: blur(10px); border: 1px solid rgba(251,191,36,0.3); border-radius: 20px; padding: 20px; color: white; display: flex; flex-direction: column; gap: 12px; max-width: 300px; box-shadow: 0 15px 40px rgba(0,0,0,0.8); transition: transform 0.3s; transform-origin: bottom right;">
    <div style="font-size: 16px; font-weight: 800; color: #fbbf24; display:flex; justify-content:space-between; align-items:center;">
      <span><i class="fa-solid fa-mug-hot"></i> Traktir Saya Kopi!</span>
      <i class="fa-solid fa-xmark" style="color: #94a3b8; cursor:pointer;" onclick="document.getElementById('wbt-donation-widget').style.display='none'"></i>
    </div>
    <div style="font-size: 12px; color: #cbd5e1; line-height: 1.5;">
      Jika WBT Docs membantu pekerjaan Anda, pertimbangkan untuk mendukung kami secara sukarela!
    </div>
    <div id="donation-buttons" style="display: flex; gap: 8px; margin-top: 5px;">
      <button class="don-btn" onclick="window.open('https://wbtdigitallabs.myr.id/', '_blank')">☕ Rp 10.000</button>
      <button class="don-btn" onclick="window.open('https://wbtdigitallabs.myr.id/', '_blank')">☕ Rp 25.000</button>
      <button class="don-btn" onclick="window.open('https://wbtdigitallabs.myr.id/', '_blank')">☕ Rp 50.000</button>
    </div>
  </div>
  
  <style>
    .don-btn {
      background: rgba(251,191,36,0.1); border: 1px solid rgba(251,191,36,0.4); 
      color: #fbbf24; padding: 8px 10px; border-radius: 10px; font-size: 12px; font-weight: 800;
      cursor: pointer; transition: all 0.2s; flex-grow: 1;
    }
    .don-btn:hover { background: #fbbf24; color: #0f172a; transform: translateY(-2px); box-shadow: 0 5px 15px rgba(251,191,36,0.3); }
    @media (max-width: 768px) {
      #wbt-donation-widget { bottom: 20px; right: 20px; left: 20px; max-width: unset; }
    }
  </style>
"""

def update_mega_portal():
    with open('d:/Produk-Sell/index.html', 'r', encoding='utf-8') as f:
        html = f.read()
    
    # Remove old widget and script
    pattern = re.compile(r'<!-- WBT Donation Floating Widget -->.*?</script>', re.DOTALL)
    html = pattern.sub('', html)
    
    # Insert new widget before </body>
    html = html.replace('</body>', widget_code + '\n</body>')
    with open('d:/Produk-Sell/index.html', 'w', encoding='utf-8') as f:
        f.write(html)

def update_wbt_docs_web():
    with open('d:/Produk-Sell/tools/PDF-Toolkit-Lite/index.html', 'r', encoding='utf-8') as f:
        html = f.read()
        
    if '<!-- WBT Donation Floating Widget -->' not in html:
        # Insert new widget before <div id="toast-container"> or </body>
        if '<div id="toast-container"></div>' in html:
            html = html.replace('<div id="toast-container"></div>', widget_code + '\n<div id="toast-container"></div>')
        else:
            html = html.replace('</body>', widget_code + '\n</body>')
            
        with open('d:/Produk-Sell/tools/PDF-Toolkit-Lite/index.html', 'w', encoding='utf-8') as f:
            f.write(html)

update_mega_portal()
update_wbt_docs_web()
print("Updated widgets on all sites.")
