import re
import os

# 1. Update Donation Links in Mega Portal
mega_portal = 'd:/Produk-Sell/index.html'
with open(mega_portal, 'r', encoding='utf-8') as f:
    html = f.read()

html = html.replace('https://saweria.co/', 'https://wbtdigitallabs.myr.id/')

# Inject Announcement Modal into Mega Portal
announcement_html = """
  <!-- Announcement Modal -->
  <div id="announcement-modal" style="display:none; position:fixed; top:0; left:0; width:100vw; height:100vh; background:rgba(0,0,0,0.8); z-index:100000; align-items:center; justify-content:center; backdrop-filter:blur(5px);">
    <div style="background:#1e293b; padding:40px; border-radius:12px; max-width:450px; width:90%; text-align:center; border:1px solid #38bdf8; position:relative; box-shadow: 0 20px 50px rgba(0,0,0,0.5);">
      <h2 style="color:#38bdf8; margin-top:0; font-family:'Outfit', sans-serif;"><i class="fa-solid fa-bullhorn"></i> Pengumuman WBT!</h2>
      <p style="color:#cbd5e1; font-size:15px; margin-bottom:25px; line-height:1.6;">
        Telah Rilis! <strong>WBT Docs Pro (Desktop Edition)</strong>.<br>Kelola file PDF 100% Offline tanpa internet dan aman dari kebocoran data.
      </p>
      <button onclick="closeAnnouncement()" style="background:#38bdf8; color:#0f172a; border:none; padding:12px 25px; border-radius:8px; font-weight:bold; cursor:pointer; font-size:14px; width:100%;">Tutup & Lanjutkan</button>
      <button onclick="closeAnnouncement()" style="position:absolute; top:15px; right:15px; background:transparent; border:none; color:#94a3b8; cursor:pointer; font-size:20px;"><i class="fa-solid fa-xmark"></i></button>
    </div>
  </div>
  
  <script>
    function checkAnnouncement() {
      // Ubah versi ini jika Anda ingin menampilkan ulang notifikasi di masa depan (misal ganti ke 'wbt_announce_v2')
      if (!localStorage.getItem('wbt_announce_v1')) {
        setTimeout(() => {
          document.getElementById('announcement-modal').style.display = 'flex';
        }, 1500); // Muncul setelah 1.5 detik
      }
    }
    
    function closeAnnouncement() {
      document.getElementById('announcement-modal').style.display = 'none';
      localStorage.setItem('wbt_announce_v1', 'true');
    }
    
    window.addEventListener('DOMContentLoaded', checkAnnouncement);
  </script>
</body>
"""

if 'id="announcement-modal"' not in html:
    html = html.replace('</body>', announcement_html)

with open(mega_portal, 'w', encoding='utf-8') as f:
    f.write(html)

# 2. Inject Announcement into Web App
web_app = 'd:/Produk-Sell/tools/PDF-Toolkit-Lite/index.html'
with open(web_app, 'r', encoding='utf-8') as f:
    html_web = f.read()

if 'id="announcement-modal"' not in html_web:
    html_web = html_web.replace('</body>', announcement_html)

with open(web_app, 'w', encoding='utf-8') as f:
    f.write(html_web)

# 3. Update desktop app donation links
desktop_app = 'd:/Produk-Sell/tools/PDF-Toolkit-Lite/desktop-build/src/index.html'
with open(desktop_app, 'r', encoding='utf-8') as f:
    html_desk = f.read()

html_desk = html_desk.replace('https://saweria.co/', 'https://wbtdigitallabs.myr.id/')

with open(desktop_app, 'w', encoding='utf-8') as f:
    f.write(html_desk)

print("Updated links and injected announcement.")
