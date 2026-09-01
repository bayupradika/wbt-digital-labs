import re

with open('d:/Produk-Sell/tools/PDF-Toolkit-Lite/app.js', 'r', encoding='utf-8') as f:
    content = f.read()

# Replace the purchaseNoAds logic
old_func = '''window.purchaseNoAds = function() {
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
}'''

new_func = '''// Cek apakah baru saja kembali dari pembayaran sukses Mayar
if (new URLSearchParams(window.location.search).get('payment') === 'success_mobile_15k') {
  localStorage.setItem('wbt_mobile_no_ads', 'true');
  hasPurchasedNoAds = true;
  // Bersihkan URL tanpa refresh halaman
  window.history.replaceState({}, document.title, window.location.pathname);
  alert('Pembayaran Mayar Berhasil! Iklan telah dihapus secara permanen.');
}

window.purchaseNoAds = function() {
  const confirmBuy = confirm('Beli Fitur Premium: Hapus Iklan Selamanya\\nHarga: Rp 15.000\\n\\nAnda akan diarahkan ke halaman pembayaran Mayar.id. Lanjutkan?');
  if (confirmBuy) {
    // Arahkan ke link Mayar Anda. 
    // Pastikan di dashboard Mayar, Anda menset "Success URL" kembali ke:
    // https://bayupradika.github.io/wbt-digital-labs/tools/PDF-Toolkit-Lite/index.html?payment=success_mobile_15k
    window.location.href = 'https://mayar.id/pay/wbt-mobile-noads';
  }
}'''

content = content.replace(old_func, new_func)

with open('d:/Produk-Sell/tools/PDF-Toolkit-Lite/app.js', 'w', encoding='utf-8') as f:
    f.write(content)
print("Berhasil update mobile IAP.")
