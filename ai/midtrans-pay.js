// Shared Midtrans Payment Gateway Simulator for AI Tools Suite (Per-Tool Individual Status)
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
    const toolName = this.getToolKey().replace(/-/g, ' ');
    let modal = document.getElementById('midtrans-ai-modal');
    if (!modal) {
      modal = document.createElement('div');
      modal.id = 'midtrans-ai-modal';
      modal.style.cssText = 'position:fixed;top:0;left:0;width:100%;height:100%;background:rgba(0,0,0,0.85);backdrop-filter:blur(8px);display:flex;align-items:center;justify-content:center;z-index:99999;padding:20px;';
      modal.innerHTML = `
        <div style="background:#0f172a;border:2px solid #3b82f6;border-radius:24px;padding:30px;max-width:450px;width:100%;color:white;text-align:center;position:relative;box-shadow:0 25px 50px -12px rgba(59,130,246,0.5);">
          <button onclick="document.getElementById('midtrans-ai-modal').remove()" style="position:absolute;top:15px;right:20px;background:none;border:none;color:#94a3b8;font-size:26px;cursor:pointer;">&times;</button>
          <div style="width:70px;height:70px;background:linear-gradient(135deg,#3b82f6,#8b5cf6);border-radius:20px;display:flex;align-items:center;justify-content:center;font-size:36px;margin:0 auto 15px;box-shadow:0 10px 25px rgba(59,130,246,0.4);">👑</div>
          <h2 style="font-family:'Outfit',sans-serif;font-size:24px;margin-bottom:10px;text-transform:capitalize;">Upgrade ${toolName} PRO</h2>
          <p style="color:#94a3b8;font-size:14px;line-height:1.6;margin-bottom:20px;">Anda telah mencapai batas kuota 3x penggunaan gratis hari ini untuk aplikasi ini. Upgrade sekarang untuk akses tanpa batas selamanya!</p>
          
          <div style="background:#1e293b;border:1px solid rgba(255,255,255,0.1);padding:15px;border-radius:16px;margin-bottom:20px;text-align:left;">
            <div style="display:flex;align-items:center;gap:10px;margin-bottom:8px;font-size:14px;color:#38bdf8;text-transform:capitalize;"><i class="fa-solid fa-check-circle"></i> Akses Unlimited Fitur ${toolName}</div>
            <div style="display:flex;align-items:center;gap:10px;margin-bottom:8px;font-size:14px;color:#38bdf8;"><i class="fa-solid fa-check-circle"></i> Tanpa Batasan Harian (0/3 Limit Hapus)</div>
            <div style="display:flex;align-items:center;gap:10px;font-size:14px;color:#38bdf8;"><i class="fa-solid fa-check-circle"></i> Sekali Bayar untuk Selamanya (Lifetime)</div>
          </div>

          <div style="display:flex;align-items:baseline;justify-content:center;gap:10px;margin-bottom:25px;">
            <span style="font-size:16px;color:#94a3b8;text-decoration:line-through;">Rp 25.000</span>
            <span style="font-size:32px;font-weight:900;color:#fbbf24;font-family:'Outfit',sans-serif;">Rp 20.000</span>
          </div>

          <button onclick="MidtransPay.simulatePayment()" style="width:100%;padding:16px;border-radius:16px;background:linear-gradient(135deg,#3b82f6,#8b5cf6);color:white;font-weight:800;font-size:16px;border:none;cursor:pointer;box-shadow:0 10px 25px -5px rgba(59,130,246,0.6);display:flex;align-items:center;justify-content:center;gap:10px;">
            <i class="fa-solid fa-shield-halved"></i> Bayar Sekarang via Midtrans
          </button>
        </div>
      `;
      document.body.appendChild(modal);
    }
  },

  simulatePayment: function() {
    const toolName = this.getToolKey().replace(/-/g, ' ');
    const modal = document.getElementById('midtrans-ai-modal');
    if (modal) {
      modal.innerHTML = `
        <div style="background:#0f172a;border:2px solid #10b981;border-radius:24px;padding:30px;max-width:450px;width:100%;color:white;text-align:center;box-shadow:0 25px 50px -12px rgba(16,185,129,0.5);">
          <div style="font-size:50px;color:#10b981;margin-bottom:15px;animation: bounce 1s infinite;"><i class="fa-solid fa-circle-check"></i></div>
          <h2 style="font-family:'Outfit',sans-serif;font-size:26px;margin-bottom:10px;">Pembayaran Berhasil!</h2>
          <p style="color:#94a3b8;font-size:14px;margin-bottom:20px;text-transform:capitalize;">Selamat! Aplikasi <b>${toolName}</b> telah diupgrade ke PRO. Nikmati akses tanpa batas!</p>
          <button onclick="MidtransPay.completeUpgrade()" style="width:100%;padding:14px;border-radius:14px;background:#10b981;color:#0f172a;font-weight:800;font-size:16px;border:none;cursor:pointer;">Mulai Gunakan PRO</button>
        </div>
      `;
    }
  },

  completeUpgrade: function() {
    localStorage.setItem('ai_pro_' + this.getToolKey(), 'true');
    const modal = document.getElementById('midtrans-ai-modal');
    if (modal) modal.remove();
    this.updateUsageUI();
    const toolName = this.getToolKey().replace(/-/g, ' ');
    alert(`🎉 Upgrade PRO untuk ${toolName} Berhasil!`);
  }
};

document.addEventListener('DOMContentLoaded', () => {
  MidtransPay.updateUsageUI();
});
