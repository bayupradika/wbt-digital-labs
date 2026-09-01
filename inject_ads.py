import re

with open('d:/Produk-Sell/tools/PDF-Toolkit-Lite/index.html', 'r', encoding='utf-8') as f:
    content = f.read()

# Add CSS for Ads
ad_css = '''
  /* WBT Ad Slots */
  .wbt-ad-container { position: fixed; z-index: 10; display: flex; align-items: center; justify-content: center; background: rgba(30,41,59,0.5); border: 1px dashed rgba(255,255,255,0.2); color: rgba(255,255,255,0.3); font-weight: bold; text-align: center; font-size: 12px; border-radius: 8px;}
  .wbt-ad-left { top: 150px; left: 20px; width: 160px; height: 600px; }
  .wbt-ad-right { top: 150px; right: 20px; width: 160px; height: 600px; }
  .wbt-ad-bottom { bottom: 0; left: 50%; transform: translateX(-50%); width: 728px; height: 90px; border-radius: 8px 8px 0 0; background: rgba(15,23,42,0.95); backdrop-filter: blur(10px); z-index: 9999; border-top: 1px dashed rgba(255,255,255,0.2); border-left: 1px dashed rgba(255,255,255,0.2); border-right: 1px dashed rgba(255,255,255,0.2); }
  
  @media (max-width: 1200px) {
    .wbt-ad-left, .wbt-ad-right { display: none; }
  }
  @media (max-width: 768px) {
    .wbt-ad-bottom { width: 100%; height: 60px; font-size: 10px; }
  }
'''
content = content.replace('</style>', ad_css + '</style>')

# Add Ad Placeholders to body
ad_html = '''
<!-- AdSense Placeholders -->
<div class="wbt-ad-container wbt-ad-left">Iklan Kiri<br>(160x600)</div>
<div class="wbt-ad-container wbt-ad-right">Iklan Kanan<br>(160x600)</div>
<div class="wbt-ad-container wbt-ad-bottom">Banner Iklan Bawah (Responsive)</div>
'''
content = content.replace('<body>', '<body>\n' + ad_html)

with open('d:/Produk-Sell/tools/PDF-Toolkit-Lite/index.html', 'w', encoding='utf-8') as f:
    f.write(content)
print("Berhasil memasang iklan di website.")
