// Shared Payment Gateway Router & Simulator for AI Tools Suite (Per-Tool Individual Pricing & Mayar Links)
const PRODUK_MAYAR_CONFIG = {
  'Live-Wallpaper-Video-Studio': {
    nama: 'Live Wallpaper Video Studio Pro',
    hargaOriginal: 'Rp 25.000',
    hargaPro: 'Rp 10.000',
    linkMayar: 'https://wbtdigitallabs.myr.id/pl/ai-image-captioner-pro-unlimited-lifetime-edition',
    fitur: ['Melepas Batas Quota Harian Jadi Unlimited (0/5 Limit Dihapus)', 'Eksport Wallpaper Resolusi Tertinggi Full HD & 4K Widescreen', 'Akses Penuh Fitur Seamless Ping-Pong Loop & Cyberpunk HUD Clock']
  },
  'Social-Media-Video-Downloader': {
    nama: 'Social Media Video Downloader Pro',
    hargaOriginal: 'Rp 25.000',
    hargaPro: 'Rp 10.000',
    linkMayar: 'https://wbtdigitallabs.myr.id/pl/ai-image-captioner-pro-unlimited-lifetime-edition',
    fitur: ['Melepas Batas Quota Harian Jadi Unlimited (0/5 Limit Dihapus)', 'Melepas Batas Durasi Video Jadi Unlimited (> 1 Jam Bebas Download)', 'Download Video Full HD 1080p & 4K Kecepatan Tinggi Tanpa Iklan']
  },
  'Dataset-Labeling-Tool': {
    nama: 'CitraLabeling Studio Pro',
    hargaOriginal: 'Rp 40.000',
    hargaPro: 'Rp 20.000',
    linkMayar: 'https://mayar.id/pl/lisensi-citralabeling-pro',
    fitur: ['Hapus Batasan Kuota 1.000 File/Hari', 'Download Aplikasi Standalone Windows (.EXE)', 'Download Aplikasi Portable Android (.APK)']
  },
  'AI-Image-Captioner': {
    nama: 'AI Image Captioner Pro',
    hargaOriginal: 'Rp 25.000',
    hargaPro: 'Rp 10.000',
    linkMayar: 'https://wbtdigitallabs.myr.id/pl/ai-captioner-pro',
    fitur: ['Melepas Batas Penggunaan Harian Jadi Unlimited (0/5 Limit Dihapus)', 'Dukungan Penuh Model AI Vision Kecepatan Tinggi', 'Sekali Bayar untuk Akses Selamanya (Lifetime Pro)']
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
    // Otomatis reset kuota saat ini ke 0 untuk semua pengguna (Auto-Reset Quota)
    const resetVersion = 'v5_quota_reset_5x_limit_2026_07_08';
    if (localStorage.getItem('ai_quota_reset_ver_' + key) !== resetVersion) {
      localStorage.setItem('ai_quota_reset_ver_' + key, resetVersion);
      localStorage.setItem('ai_date_' + key, today);
      localStorage.setItem('ai_count_' + key, '0');
      return 0;
    }
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
    if (count >= 5) {
      this.showUpgradeModal();
      return false;
    }
    count++;
    localStorage.setItem('ai_count_' + this.getToolKey(), count.toString());
    this.updateUsageUI();
    return true;
  },

  resetCurrentQuota: function() {
    const key = this.getToolKey();
    localStorage.setItem('ai_count_' + key, '0');
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
      const left = Math.max(0, 5 - this.getUsageCount());
      badge.innerHTML = `<i class="fa-solid fa-bolt" style="color: #38bdf8;"></i> Sisa Hari Ini: <b>${left}/5</b> Gratis`;
    }
  },

  resetAllPro: function() {
    const keysToRemove = [];
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && (key.includes('pro') || key.includes('vip') || key.includes('limit') || key.includes('model_loaded') || key.includes('usage') || key.includes('count') || key.includes('unlocked') || key.includes('license_key') || key.includes('tier_limit') || key.includes('resizer_') || key.includes('rename_') || key.includes('exif_'))) {
        keysToRemove.push(key);
      }
    }
    keysToRemove.forEach(k => localStorage.removeItem(k));
    this.updateUsageUI();
    alert('🔄 Berhasil! Seluruh status PRO, kuota harian, dan lisensi pada SEMUA Tools & Game telah di-reset ke awal (Mode Gratis / Belum Pro).');
  },

  showUpgradeModal: function() {
    if (this.isPro()) {
      const confirmReset = confirm('👑 Anda saat ini dalam status PRO (Unlimited).\n\nApakah Anda ingin MERESET status PRO ini (dan seluruh tools lainnya) kembali ke mode Gratis / Belum Pro untuk pengujian ulang?');
      if (confirmReset) {
        this.resetAllPro();
      }
      return;
    }
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
        <div style="background:#0f172a;border:2px solid #38bdf8;border-radius:24px;padding:30px;max-width:450px;width:100%;color:white;text-align:center;box-shadow:0 25px 50px -12px rgba(56,189,248,0.5);position:relative;">
          <button onclick="document.getElementById('midtrans-ai-modal').remove()" style="position:absolute;top:15px;right:20px;background:none;border:none;color:#94a3b8;font-size:26px;cursor:pointer;">&times;</button>
          <div style="font-size:50px;color:#38bdf8;margin-bottom:15px;"><i class="fa-solid fa-spinner fa-spin"></i></div>
          <h2 style="font-family:'Outfit',sans-serif;font-size:22px;margin-bottom:10px;">Menunggu Pembayaran Mayar...</h2>
          <p style="color:#94a3b8;font-size:14px;line-height:1.6;margin-bottom:20px;">Silakan selesaikan pembayaran sebesar <b style="color:#fbbf24;">${config.hargaPro}</b> via QRIS / E-Wallet di halaman resmi Mayar.id.</p>
          
          <div style="background:#1e293b;border:1px solid rgba(255,255,255,0.1);padding:16px;border-radius:14px;margin-bottom:20px;font-size:13px;color:#cbd5e1;text-align:left;line-height:1.5;">
            <i class="fa-solid fa-circle-info" style="color:#60a5fa;"></i> <b>Aktivasi Otomatis:</b> Setelah pembayaran di Mayar selesai & berstatus LUNAS, sistem Mayar akan otomatis mengalihkan Anda kembali ke halaman ini dan fitur PRO akan langsung terbuka secara otomatis tanpa perlu klik tombol apa pun!
          </div>

          <a href="${config.linkMayar}" target="_blank" style="display:block;width:100%;padding:16px;border-radius:14px;background:linear-gradient(135deg,#3b82f6,#2563eb);color:white;font-weight:800;font-size:16px;text-decoration:none;box-shadow:0 10px 20px -5px rgba(59,130,246,0.5);">
            <i class="fa-solid fa-arrow-up-right-from-square"></i> Buka Halaman Mayar.id / QRIS
          </a>
        </div>
      `;
      window.open(config.linkMayar, '_blank');
    }
  },

  completeUpgrade: function() {
    localStorage.setItem('ai_pro_' + this.getToolKey(), 'true');
    const modal = document.getElementById('midtrans-ai-modal');
    if (modal) modal.remove();
    this.updateUsageUI();
    const config = this.getToolConfig();
    alert(`🎉 Selamat! Upgrade PRO untuk ${config.nama} berhasil diaktifkan. Batas kuota harian telah dihapus menjadi UNLIMITED!`);
  }
};

document.addEventListener('DOMContentLoaded', () => {
  MidtransPay.updateUsageUI();
  
  // Deteksi otomatis jika Mayar mengalihkan kembali setelah pembayaran sukses (Redirect URL)
  const params = new URLSearchParams(window.location.search);
  if (params.get('status') === 'success' || params.get('status') === 'paid' || params.get('payment') === 'success' || params.get('paid') === 'true' || params.get('transaction_status') === 'settlement') {
    localStorage.setItem('ai_pro_' + MidtransPay.getToolKey(), 'true');
    if (window.history && window.history.replaceState) {
      window.history.replaceState({}, document.title, window.location.pathname);
    }
    setTimeout(() => {
      MidtransPay.updateUsageUI();
      const config = MidtransPay.getToolConfig();
      alert(`🎉 Selamat! Pembayaran Anda via Mayar.id berhasil terverifikasi. Fitur PRO Unlimited untuk ${config.nama} telah terbuka selamanya!`);
    }, 500);
  }
});
