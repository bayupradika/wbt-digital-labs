import re

with open('d:/Produk-Sell/tools/PDF-Toolkit-Lite/desktop-build/src/app.js', 'r', encoding='utf-8') as f:
    app_js = f.read()

# 1. Update the modal UI to the new Desktop UI (using raw strings in python)
modal_html_old = r"""<div style="background:#1e293b; padding:40px; border-radius:12px; width:450px; text-align:center; border:1px solid #3b82f6;">.*?</div>"""
modal_html_new = r"""<div style="background:#1e293b; padding:40px; border-radius:12px; width:450px; text-align:center; border:1px solid #3b82f6; position:relative;">
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
    </div>"""

app_js = re.sub(modal_html_old, modal_html_new, app_js, flags=re.DOTALL)

# 2. Add logic to change button to ACTIVATED and bind click
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
app_js = app_js.replace('isDesktopPro = true;\n  }', 'isDesktopPro = true;\n  }\n' + update_ui_logic)
app_js = app_js.replace("isDesktopPro = true;\n      alert('Aktivasi Berhasil! Terima kasih telah membeli WBT Document Toolkit Pro.');", "isDesktopPro = true;\n      alert('Aktivasi Berhasil! Terima kasih telah membeli WBT Document Toolkit Pro.');\n      if(typeof updateDesktopUI === 'function') updateDesktopUI();")

# 3. Remove require('@electron/remote')
app_js = re.sub(r"const { app } = require\('@electron/remote'\).*?\n", "", app_js)

with open('d:/Produk-Sell/tools/PDF-Toolkit-Lite/desktop-build/src/app.js', 'w', encoding='utf-8') as f:
    f.write(app_js)

print("Desktop app.js updated")
