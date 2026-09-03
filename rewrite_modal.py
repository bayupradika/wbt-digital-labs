import re

with open('d:/Produk-Sell/tools/PDF-Toolkit-Lite/desktop-build/src/app.js', 'r', encoding='utf-8') as f:
    app_js = f.read()

# Let's replace the whole showDesktopActivationModal function
start_str = "function showDesktopActivationModal(callback) {"
end_str = "function updateDesktopUI() {"

start_idx = app_js.find(start_str)
end_idx = app_js.find(end_str)

if start_idx != -1 and end_idx != -1:
    head = app_js[:start_idx]
    tail = app_js[end_idx:]
    
    clean_func = """function showDesktopActivationModal(callback) {
  const modal = document.createElement('div');
  modal.style.cssText = 'position:fixed; top:0; left:0; width:100vw; height:100vh; background:rgba(0,0,0,0.8); z-index:999999; display:flex; align-items:center; justify-content:center; color:white; font-family:sans-serif; backdrop-filter: blur(5px);';
  
  modal.innerHTML = `
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
  `;
  document.body.appendChild(modal);

  document.getElementById('btn-close-modal').onclick = () => document.body.removeChild(modal);
  
  document.getElementById('btn-activate-modal').onclick = () => {
    const key = document.getElementById('modal-license-key').value.trim();
    if (!key) return alert('Masukkan Kunci Lisensi!');
    if (window.verifyDesktopKey(key)) {
      localStorage.setItem('wbt_desktop_license', key);
      isDesktopPro = true;
      alert('Aktivasi Berhasil! Terima kasih telah membeli WBT Document Toolkit Pro.');
      updateDesktopUI();
      document.body.removeChild(modal);
      if(callback) callback();
    } else {
      alert('Kunci Lisensi tidak valid atau salah.');
    }
  };
}

"""
    app_js = head + clean_func + tail

with open('d:/Produk-Sell/tools/PDF-Toolkit-Lite/desktop-build/src/app.js', 'w', encoding='utf-8') as f:
    f.write(app_js)

print("Modal function rewritten")
