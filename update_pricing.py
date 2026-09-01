import re

with open('d:/Produk-Sell/tools/PDF-Toolkit-Lite/index.html', 'r', encoding='utf-8') as f:
    content = f.read()

new_pricing = '''<section class="pricing-section container" id="pricing-section">
  <div class="section-header">
    <h2>Ekosistem <span class="text-gold">WBT Document</span></h2>
    <p>Pilih platform yang paling sesuai dengan kebutuhan produktivitas Anda.</p>
  </div>
  <div class="pricing-grid" style="grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));">
    
    <!-- Web Card -->
    <div class="pricing-card">
      <div>
        <h3 class="pricing-title">Versi Web (Gratis)</h3>
        <p style="color: var(--text-muted); font-size: 14px;">Akses langsung dari browser (Online)</p>
        <div class="pricing-price">Rp 0 <span class="pricing-period">/ selamanya</span></div>
        <ul class="pricing-features">
          <li class="pricing-feature"><i class="fa-solid fa-check feature-icon"></i> Akses ke Semua Fitur PDF</li>
          <li class="pricing-feature"><i class="fa-solid fa-check feature-icon"></i> Tanpa Batasan Kuota Penggunaan</li>
          <li class="pricing-feature"><i class="fa-solid fa-check feature-icon"></i> Privasi Aman</li>
          <li class="pricing-feature"><i class="fa-solid fa-xmark feature-icon disabled"></i> Terdapat Iklan (AdSense)</li>
          <li class="pricing-feature"><i class="fa-solid fa-xmark feature-icon disabled"></i> Membutuhkan Koneksi Internet Aktif</li>
        </ul>
      </div>
      <button class="btn btn-outline" style="width: 100%; cursor: default;">Versi Saat Ini</button>
    </div>
    
    <!-- Mobile Card -->
    <div class="pricing-card">
      <div>
        <h3 class="pricing-title">Aplikasi Mobile</h3>
        <p style="color: var(--text-muted); font-size: 14px;">Praktis untuk smartphone Android & iOS</p>
        <div class="pricing-price">Gratis <span class="pricing-period">/ Unduh</span></div>
        <ul class="pricing-features">
          <li class="pricing-feature"><i class="fa-solid fa-check feature-icon"></i> Akses Super Cepat di Genggaman</li>
          <li class="pricing-feature"><i class="fa-solid fa-check feature-icon"></i> Proses Sebagian Besar Fitur Secara Offline</li>
          <li class="pricing-feature"><i class="fa-solid fa-check feature-icon"></i> Ringan dan Hemat RAM</li>
          <li class="pricing-feature"><i class="fa-solid fa-check feature-icon"></i> Didukung oleh Iklan Video (AdMob)</li>
          <li class="pricing-feature"><i class="fa-solid fa-check feature-icon text-gold"></i> Opsi Hapus Iklan Selamanya (Rp 15.000)</li>
        </ul>
      </div>
      <button class="btn btn-outline" style="width: 100%; border-color:#38bdf8; color:#38bdf8;" onclick="alert('Segera Hadir di Play Store!')">Download APK (Segera)</button>
    </div>

    <!-- Pro Card -->
    <div class="pricing-card pro">
      <div class="pricing-badge">PALING EKSKLUSIF & AMAN</div>
      <div>
        <h3 class="pricing-title">WBT Desktop Pro</h3>
        <p style="color: rgba(255,255,255,0.8); font-size: 14px;">Software PC (Windows/Mac) untuk Pekerja Profesional</p>
        <div class="pricing-price">Rp 30.000 <span class="pricing-period">/ lisensi</span></div>
        <ul class="pricing-features">
          <li class="pricing-feature"><i class="fa-solid fa-check feature-icon"></i> Performa Pemrosesan Tercepat (Memakai CPU Lokal)</li>
          <li class="pricing-feature"><i class="fa-solid fa-check feature-icon"></i> 100% Offline Tanpa Butuh Internet Sama Sekali</li>
          <li class="pricing-feature"><i class="fa-solid fa-check feature-icon"></i> Bebas Iklan (Ad-Free) Selamanya</li>
          <li class="pricing-feature"><i class="fa-solid fa-check feature-icon"></i> Keamanan Privasi Level Militer (File Tidak Pernah Keluar dari PC)</li>
          <li class="pricing-feature"><i class="fa-solid fa-check feature-icon text-gold"></i> Lisensi Sekali Bayar (Seumur Hidup)</li>
        </ul>
      </div>
      <button class="btn btn-gold" style="width: 100%;" onclick="alert('Instalasi Desktop sedang dipersiapkan. Hubungi admin untuk Pre-Order.')">Pre-Order Lisensi Desktop (Rp 30rb)</button>
    </div>

  </div>
</section>'''

# Replace the pricing section using regex
pattern = re.compile(r'<section class="pricing-section container" id="pricing-section">.*?</section>', re.DOTALL)
content = pattern.sub(new_pricing, content)

with open('d:/Produk-Sell/tools/PDF-Toolkit-Lite/index.html', 'w', encoding='utf-8') as f:
    f.write(content)

print("Berhasil memperbarui bagian Harga/Paket")
