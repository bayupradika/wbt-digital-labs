// Shared Payment Gateway Router & Simulator for AI Tools Suite (Per-Tool Individual Pricing & Mayar Links)
const PRODUK_MAYAR_CONFIG = {
  'Dataset-Labeling-Tool': {
    nama: 'CitraLabeling Studio Pro',
    hargaOriginal: 'Rp 40.000',
    hargaPro: 'Rp 20.000',
    linkMayar: 'https://mayar.id/pl/lisensi-citralabeling-pro',
    fitur: ['Hapus Batasan Kuota 1.000 File/Hari', 'Download Aplikasi Standalone Windows (.EXE)', 'Download Aplikasi Portable Android (.APK)']
  },
  'AI-Image-Captioner': {
    nama: 'AI Image Captioner Pro',
    hargaOriginal: 'Rp 30.000',
    hargaPro: 'Rp 15.000',
    linkMayar: 'https://mayar.id/pl/ai-captioner-pro',
    fitur: ['Generate Caption Tanpa Batasan Harian', 'Ekspor Format YOLO / COCO / Pascal VOC', 'Dukungan Model AI Kecepatan Tinggi']
  },
  'Background-Eraser-AI': {
    nama: 'Background Eraser AI Pro',
    hargaOriginal: 'Rp 50.000',
    hargaPro: 'Rp 25.000',
    linkMayar: 'https://mayar.id/pl/bg-eraser-pro',
    fitur: ['Hapus Latar Belakang Kualitas Resolusi HD', 'Pemrosesan Bulk Tanpa Batas Jumlah Foto', 'Hasil Bersih 100% Tanpa Watermark']
  },
  'default': {
    nama: 'Akses Pro Suite Tool Khusus',
    hargaOriginal: 'Rp 30.000',
    hargaPro: 'Rp 15.000',
    linkMayar: 'https://mayar.id/pl/general-pro',
    fitur: ['Akses Fitur Premium Tanpa Batasan Harian', 'Kecepatan Pemrosesan Prioritas Tinggi', 'Sekali Bayar untuk Akses Selamanya (Lifetime)']
  }
};

const MidtransPay = {
  getToolKey: function() {
    const parts = window.location.pathname.replace(/\\/g, '/').split('/').filter(Boolean);
    let folder = 'default_ai';
    for (let i = parts.length - 1; i >= 0; i--) {
      if (!parts[i].includes('.') && parts[i] !== 'ai' && parts[i] !== 'tools' && parts[i] !== 'game') {
        folder = parts[i];
        break;
      }
    }
    return folder;
  },

  getToolConfig: function() {
    const key = this.getToolKey();
    return PRODUK_MAYAR_CONFIG[key] || PRODUK_MAYAR_CONFIG['default'];
  },

  isPro: function() {
    return localStorage.getItem('ai_pro_' + this.getToolKey()) === 'true';
  },

  getUsageCount: function() {
    const key = this.getToolKey();
    const today = new Date().toDateString();
    const lastDate = localStorage.getItem('ai_date_' + key);
    if (lastDate !== today) {
      localStorage.setItem('ai_date_' + key, today);
      localStorage.setItem('ai_count_' + key, '0');
      return 0;
    }
    return parseInt(localStorage.getItem('ai_count_' + key) || '0');
  },

  incrementUsage: function() {
    if (this.isPro()) return true;
    let count = this.getUsageCount();
    if (count >= 3) {
      this.showUpgradeModal();
      return false;
    }
    count++;
    localStorage.setItem('ai_count_' + this.getToolKey(), count.toString());
    this.updateUsageUI();
    return true;
  },

  updateUsageUI: function() {
    const badge = document.getElementById('quota-badge');
    if (!badge) return;
    if (this.isPro()) {
      badge.innerHTML = '<i class="fa-solid fa-crown" style="color: #fbbf24;"></i> PRO (Unlimited)';
      badge.style.background = 'rgba(245, 158, 11, 0.2)';
      badge.style.borderColor = '#fbbf24';
      badge.style.color = '#fbbf24';
    } else {
      const left = Math.max(0, 3 - this.getUsageCount());
      badge.innerHTML = `<i class="fa-solid fa-bolt" style="color: #38bdf8;"></i> Sisa Hari Ini: <b>${left}/3</b> Gratis`;
    }
  },

  showUpgradeModal: function() {
    const config = this.getToolConfig();
    let modal = document.getElementById('midtrans-ai-modal');
    if (!modal) {
      modal = document.createElement('div');
      modal.id = 'midtrans-ai-modal';
      modal.style.cssText = 'position:fixed;top:0;left:0;width:100%;height:100%;background:rgba(0,0,0,0.85);backdrop-filter:blur(8px);display:flex;align-items:center;justify-content:center;z-index:99999;padding:20px;';
      
      const fiturHtml = config.fitur.map(f => `<div style="display:flex;align-items:center;gap:10px;margin-bottom:8px;font-size:14px;color:#38bdf8;"><i class="fa-solid fa-check-circle"></i> ${f}</div>`).join('');

      modal.innerHTML = `
        <div style="background:#0f172a;border:2px solid #3b82f6;border-radius:24px;padding:30px;max-width:450px;width:100%;color:white;text-align:center;position:relative;box-shadow:0 25px 50px -12px rgba(59,130,246,0.5);">
          <button onclick="document.getElementById('midtrans-ai-modal').remove()" style="position:absolute;top:15px;right:20px;background:none;border:none;color:#94a3b8;font-size:26px;cursor:pointer;">&times;</button>
          <div style="width:70px;height:70px;background:linear-gradient(135deg,#3b82f6,#8b5cf6);border-radius:20px;display:flex;align-items:center;justify-content:center;font-size:36px;margin:0 auto 15px;box-shadow:0 10px 25px rgba(59,130,246,0.4);">👑</div>
          <h2 style="font-family:'Outfit',sans-serif;font-size:24px;margin-bottom:10px;">Upgrade ${config.nama}</h2>
          <p style="color:#94a3b8;font-size:14px;line-height:1.6;margin-bottom:20px;">Dapatkan akses fitur Pro tanpa batasan kuota harian untuk aplikasi ini selamanya!</p>
          
          <div style="background:#1e293b;border:1px solid rgba(255,255,255,0.1);padding:15px;border-radius:16px;margin-bottom:20px;text-align:left;">
            ${fiturHtml}
          </div>

          <div style="display:flex;align-items:baseline;justify-content:center;gap:10px;margin-bottom:25px;">
            <span style="font-size:16px;color:#94a3b8;text-decoration:line-through;">${config.hargaOriginal}</span>
            <span style="font-size:32px;font-weight:900;color:#fbbf24;font-family:'Outfit',sans-serif;">${config.hargaPro}</span>
          </div>

          <button onclick="MidtransPay.simulatePayment()" style="width:100%;padding:16px;border-radius:16px;background:linear-gradient(135deg,#10b981,#059669);color:white;font-weight:800;font-size:16px;border:none;cursor:pointer;box-shadow:0 10px 25px -5px rgba(16,185,129,0.6);display:flex;align-items:center;justify-content:center;gap:10px;">
            <i class="fa-solid fa-bolt"></i> Bayar Sekarang via Mayar / QRIS
          </button>
        </div>
      `;
      document.body.appendChild(modal);
    }
  },

  simulatePayment: function() {
    const config = this.getToolConfig();
    const modal = document.getElementById('midtrans-ai-modal');
    if (modal) {
      modal.innerHTML = `
        <div style="background:#0f172a;border:2px solid #10b981;border-radius:24px;padding:30px;max-width:450px;width:100%;color:white;text-align:center;box-shadow:0 25px 50px -12px rgba(16,185,129,0.5);position:relative;">
          <button onclick="document.getElementById('midtrans-ai-modal').remove()" style="position:absolute;top:15px;right:20px;background:none;border:none;color:#94a3b8;font-size:26px;cursor:pointer;">&times;</button>
          <div style="font-size:50px;color:#10b981;margin-bottom:15px;"><i class="fa-solid fa-qrcode"></i></div>
          <h2 style="font-family:'Outfit',sans-serif;font-size:24px;margin-bottom:10px;">Lanjutkan ke Pembayaran</h2>
          <p style="color:#94a3b8;font-size:14px;margin-bottom:20px;">Silakan klik tombol di bawah untuk membayar <b>${config.nama}</b> seharga <b style="color:#fbbf24;">${config.hargaPro}</b> via Mayar.id / QRIS.</p>
          
          <a href="${config.linkMayar}" target="_blank" style="display:block;width:100%;padding:14px;border-radius:14px;background:#10b981;color:#0f172a;font-weight:800;font-size:16px;text-decoration:none;margin-bottom:12px;box-shadow:0 10px 20px -5px rgba(16,185,129,0.5);">
            <i class="fa-solid fa-arrow-up-right-from-square"></i> Buka Halaman Mayar.id / QRIS
          </a>

          <div style="border-top:1px dashed #334155;padding-top:15px;margin-top:15px;">
            <p style="font-size:12px;color:#cbd5e1;margin-bottom:10px;">Sudah membayar & menerima Kode Lisensi via WhatsApp?</p>
            <input id="mayar-voucher-code" type="text" placeholder="Masukkan Kode Lisensi (cth: CITRA-PRO-VIP)" style="width:100%;padding:12px;border-radius:10px;background:#1e293b;border:1px solid #475569;color:white;text-align:center;font-weight:700;margin-bottom:10px;text-transform:uppercase;">
            <button onclick="MidtransPay.verifyVoucher()" style="width:100%;padding:12px;border-radius:10px;background:#3b82f6;color:white;font-weight:700;border:none;cursor:pointer;">
              <i class="fa-solid fa-key"></i> Klaim & Aktifkan Pro
            </button>
          </div>
        </div>
      `;
    }
  },

  verifyVoucher: function() {
    const codeEl = document.getElementById('mayar-voucher-code');
    const code = codeEl ? codeEl.value.trim().toUpperCase() : '';
    if (code === 'CITRA-PRO-VIP' || code === 'MAYAR-PRO' || code === 'WBT-PRO-2026' || code.length >= 6) {
      this.completeUpgrade();
    } else {
      alert('⚠️ Kode Lisensi tidak valid atau belum lengkap. Masukkan kode yang dikirim oleh sistem Mayar ke WhatsApp Anda.');
    }
  },

  completeUpgrade: function() {
    localStorage.setItem('ai_pro_' + this.getToolKey(), 'true');
    const modal = document.getElementById('midtrans-ai-modal');
    if (modal) modal.remove();
    this.updateUsageUI();
    const config = this.getToolConfig();
    alert(`🎉 Upgrade PRO untuk ${config.nama} Berhasil diaktifkan!`);
  }
};

document.addEventListener('DOMContentLoaded', () => {
  MidtransPay.updateUsageUI();
});
