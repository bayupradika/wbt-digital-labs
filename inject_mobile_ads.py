import re

with open('d:/Produk-Sell/tools/PDF-Toolkit-Lite/app.js', 'r', encoding='utf-8') as f:
    content = f.read()

mobile_ad_logic = '''
// ==========================================
// MOBILE APP MONETIZATION (AdMob & IAP)
// ==========================================
const isMobileApp = new URLSearchParams(window.location.search).get('app') === 'mobile';
let hasPurchasedNoAds = localStorage.getItem('wbt_mobile_no_ads') === 'true';

function showMobileAdAndProcess(callback) {
  if (!isMobileApp || hasPurchasedNoAds) {
    callback(); // Langsung proses jika di Web atau sudah beli fitur No-Ads
    return;
  }
  
  // Tampilkan Iklan Fullscreen (Simulasi AdMob Interstitial)
  const adOverlay = document.createElement('div');
  adOverlay.style.cssText = 'position:fixed; top:0; left:0; width:100vw; height:100vh; background:black; z-index:999999; display:flex; flex-direction:column; align-items:center; justify-content:center; color:white; font-family:sans-serif;';
  
  adOverlay.innerHTML = 
    <div style="position:absolute; top:20px; right:20px; font-size:12px; color:#888;">Ad / Sponsor</div>
    <i class="fa-brands fa-google" style="font-size: 50px; color: #3b82f6; margin-bottom: 20px;"></i>
    <h2 style="margin:0 0 10px 0;">Menampilkan Iklan...</h2>
    <p style="color:#aaa; text-align:center; max-width:80%;">Mendukung pengembang agar aplikasi ini tetap gratis.</p>
    
    <div id="ad-timer" style="margin-top: 30px; padding: 15px 30px; background: #333; border-radius: 99px; font-weight:bold;">Tunggu 5 detik...</div>
    
    <button onclick="purchaseNoAds()" style="position:absolute; bottom: 40px; background: #fbbf24; border:none; padding: 12px 25px; border-radius: 99px; font-weight:800; color: #000; cursor:pointer;">
      <i class="fa-solid fa-ban"></i> Hapus Iklan Selamanya (Rp 15.000)
    </button>
  ;
  document.body.appendChild(adOverlay);
  
  let timeLeft = 5;
  const timerEl = document.getElementById('ad-timer');
  const interval = setInterval(() => {
    timeLeft--;
    if (timeLeft > 0) {
      timerEl.innerText = Tunggu  detik...;
    } else {
      clearInterval(interval);
      timerEl.innerText = 'X Tutup Iklan';
      timerEl.style.background = '#ef4444';
      timerEl.style.cursor = 'pointer';
      timerEl.onclick = () => {
        document.body.removeChild(adOverlay);
        callback(); // Lanjut memproses PDF setelah iklan ditutup
      };
    }
  }, 1000);
}

window.purchaseNoAds = function() {
  // Simulasi Google Play In-App Billing
  const confirmBuy = confirm('Membeli Fitur Premium: Hapus Iklan Selamanya\\nHarga: Rp 15.000\\nLanjutkan pembayaran via Google Play?');
  if (confirmBuy) {
    localStorage.setItem('wbt_mobile_no_ads', 'true');
    hasPurchasedNoAds = true;
    alert('Pembayaran Berhasil! Iklan telah dihapus secara permanen.');
    // Hapus overlay iklan jika sedang terbuka
    const adOverlay = document.querySelector('div[style*="z-index:999999"]');
    if (adOverlay) document.body.removeChild(adOverlay);
  }
}
'''

# Inject mobile ad logic before processCurrentTool
content = content.replace('async function processCurrentTool() {', mobile_ad_logic + '\n\nasync function processCurrentTool() {\n    if (isMobileApp && !hasPurchasedNoAds) {\n      return showMobileAdAndProcess(executeProcessing);\n    }\n    return executeProcessing();\n}\n\nasync function executeProcessing() {')

with open('d:/Produk-Sell/tools/PDF-Toolkit-Lite/app.js', 'w', encoding='utf-8') as f:
    f.write(content)

print("Berhasil memasang sistem iklan mobile dan IAP.")
