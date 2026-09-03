import re

with open('d:/Produk-Sell/tools/PDF-Toolkit-Lite/desktop-build/src/index.html', 'r', encoding='utf-8') as f:
    html = f.read()

# Fix asset paths
html = html.replace('../../assets/', './assets/')
html = html.replace('../assets/', './assets/')
html = html.replace('/wbt-digital-labs/assets/', './assets/')

# Remove Pricing Section
html = re.sub(r'<section class="pricing-section" id="pricing">.*?</section>', '', html, flags=re.DOTALL)

# Remove Features Section ("WBT Docs Offline - Kelola PDF...")
html = re.sub(r'<section class="features-section">.*?</section>', '', html, flags=re.DOTALL)

# Also remove everything below tools grid if needed, let's just make sure pricing and features are gone.

# Add Activation button to header
# Find: <div class="nav-links"> ... </div>
nav_match = re.search(r'<div class="nav-links">.*?</div>', html, flags=re.DOTALL)
if nav_match:
    nav_inner = nav_match.group(0)
    # Insert activation button at the end of nav-links before closing div
    activation_btn = '<a href="#" id="desktop-activation-nav" style="background:#fbbf24; color:black; padding:5px 15px; border-radius:20px; font-weight:bold; margin-left:15px;"><i class="fa-solid fa-key"></i> ACTIVATION</a>'
    new_nav = nav_inner.replace('</div>', f'{activation_btn}</div>')
    html = html.replace(nav_inner, new_nav)

with open('d:/Produk-Sell/tools/PDF-Toolkit-Lite/desktop-build/src/index.html', 'w', encoding='utf-8') as f:
    f.write(html)

# 3. Update app.js
with open('d:/Produk-Sell/tools/PDF-Toolkit-Lite/desktop-build/src/app.js', 'r', encoding='utf-8') as f:
    app_js = f.read()

# Update the modal UI to match exactly what they want
modal_html_old = r"""<div style="background:#1e293b; padding:40px; border-radius:12px; width:450px; text-align:center; border:1px solid #3b82f6;">.*?</div>"""
modal_html_new = r"""
    <div style="background:#1e293b; padding:40px; border-radius:12px; width:450px; text-align:center; border:1px solid #3b82f6; position:relative;">
      <h2 style="color:#fbbf24; margin-top:0;"><i class="fa-solid fa-crown"></i> Aktivasi WBT Docs Pro</h2>
      <p style="color:#cbd5e1; font-size:14px; margin-bottom:20px;">Versi gratis hanya mendukung fitur Merge & Split PDF. Masukkan kode lisensi untuk membuka semua fitur.</p>
      
      <button onclick="window.open('https://wbtdigitallabs.myr.id/pl/lisensi-premium-wbt-desktop-pro/', '_blank')" style="background:transparent; border:1px solid #fbbf24; color:#fbbf24; padding:12px; width:100%; border-radius:6px; cursor:pointer; font-weight:bold; margin-bottom:20px;">
        <i class="fa-solid fa-cart-shopping"></i> Beli Lisensi via Mayar (Rp 30.000)
      </button>
      
      <div style="border-top:1px solid #334155; padding-top:20px; position:relative;">
        <span style="position:absolute; top:-10px; left:50%; transform:translateX(-50%); background:#1e293b; padding:0 10px; font-size:12px; color:#64748b;">MASUKKAN KODE LISENSI</span>
        <input type="text" id="modal-license-key" placeholder="WBT-XXXX-YYYY" style="width:90%; padding:12px; margin-bottom:15px; background:#0f172a; border:1px solid #475569; color:white; text-align:center; letter-spacing:2px; font-weight:bold; border-radius:6px;">
        <button id="btn-activate-modal" style="background:#10b981; color:white; border:none; padding:12px; width:100%; border-radius:6px; font-weight:bold; cursor:pointer;"><i class="fa-solid fa-check"></i> Activate Now</button>
      </div>
      <button id="btn-close-modal" style="position:absolute; top:15px; right:15px; background:transparent; color:#94a3b8; border:none; cursor:pointer; font-size:20px;"><i class="fa-solid fa-xmark"></i></button>
    </div>
"""

app_js = re.sub(r'<div style="background:#1e293b; padding:40px; border-radius:12px; width:450px; text-align:center; border:1px solid #3b82f6;">.*?</div>', modal_html_new, app_js, flags=re.DOTALL)

# Add logic to change button to ACTIVATED and bind click
update_ui_logic = r"""
  function updateDesktopUI() {
    const navBtn = document.getElementById('desktop-activation-nav');
    if(navBtn) {
      if(isDesktopPro) {
        navBtn.innerHTML = '<i class="fa-solid fa-check-circle"></i> ACTIVATED';
        navBtn.style.background = '#10b981'; // Green
        navBtn.style.color = 'white';
        navBtn.onclick = (e) => { e.preventDefault(); alert('Aplikasi Anda sudah Aktif Permanen!'); };
      } else {
        navBtn.onclick = (e) => { e.preventDefault(); showDesktopActivationModal(); };
      }
    }
  }
  
  document.addEventListener('DOMContentLoaded', updateDesktopUI);
"""

# Insert update_ui_logic into app.js
app_js = app_js.replace('isDesktopPro = true;\n  }', 'isDesktopPro = true;\n  }\n' + update_ui_logic)

# In modal activate success, call updateDesktopUI()
app_js = app_js.replace("isDesktopPro = true;\n      alert('Aktivasi Berhasil! Terima kasih telah membeli WBT Document Toolkit Pro.');", "isDesktopPro = true;\n      alert('Aktivasi Berhasil! Terima kasih telah membeli WBT Document Toolkit Pro.');\n      updateDesktopUI();")

with open('d:/Produk-Sell/tools/PDF-Toolkit-Lite/desktop-build/src/app.js', 'w', encoding='utf-8') as f:
    f.write(app_js)

print("Desktop Source Code Updated.")
