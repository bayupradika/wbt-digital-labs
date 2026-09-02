import re

with open('d:/Produk-Sell/tools/PDF-Toolkit-Lite/app.js', 'r', encoding='utf-8') as f:
    content = f.read()

bad_chunk = """  adOverlay.innerHTML = 
    <div style="position:absolute; top:20px; right:20px; font-size:12px; color:#888;">Ad / Sponsor</div>
    <i class="fa-brands fa-google" style="font-size: 50px; color: #3b82f6; margin-bottom: 20px;"></i>
    <h2 style="margin:0 0 10px 0;">Menampilkan Iklan...</h2>
    <p style="color:#aaa; text-align:center; max-width:80%;">Mendukung pengembang agar aplikasi ini tetap gratis.</p>
    
    <div id="ad-timer" style="margin-top: 30px; padding: 15px 30px; background: #333; border-radius: 99px; font-weight:bold;">Tunggu 5 detik...</div>
    
    <button onclick="purchaseNoAds()" style="position:absolute; bottom: 40px; background: #fbbf24; border:none; padding: 12px 25px; border-radius: 99px; font-weight:800; color: #000; cursor:pointer;">
      <i class="fa-solid fa-ban"></i> Hapus Iklan Selamanya (Rp 15.000)
    </button>
  ;"""

good_chunk = """  adOverlay.innerHTML = `
    <div style="position:absolute; top:20px; right:20px; font-size:12px; color:#888;">Ad / Sponsor</div>
    <i class="fa-brands fa-google" style="font-size: 50px; color: #3b82f6; margin-bottom: 20px;"></i>
    <h2 style="margin:0 0 10px 0;">Menampilkan Iklan...</h2>
    <p style="color:#aaa; text-align:center; max-width:80%;">Mendukung pengembang agar aplikasi ini tetap gratis.</p>
    
    <div id="ad-timer" style="margin-top: 30px; padding: 15px 30px; background: #333; border-radius: 99px; font-weight:bold;">Tunggu 5 detik...</div>
    
    <button onclick="purchaseNoAds()" style="position:absolute; bottom: 40px; background: #fbbf24; border:none; padding: 12px 25px; border-radius: 99px; font-weight:800; color: #000; cursor:pointer;">
      <i class="fa-solid fa-ban"></i> Hapus Iklan Selamanya (Rp 15.000)
    </button>
  `;"""

content = content.replace(bad_chunk, good_chunk)

with open('d:/Produk-Sell/tools/PDF-Toolkit-Lite/app.js', 'w', encoding='utf-8') as f:
    f.write(content)
