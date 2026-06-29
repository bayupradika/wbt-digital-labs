/* ==========================================================================
   Midtrans Snap Automated Payment Gateway Simulator (Produk-Sell Game Ecosystem)
   ========================================================================== */

const MidtransPay = {
  createModal: function() {
    if (document.getElementById('midtrans-snap-modal')) return;
    const modal = document.createElement('div');
    modal.id = 'midtrans-snap-modal';
    modal.style.cssText = `
      position: fixed; top: 0; left: 0; width: 100%; height: 100%;
      background: rgba(0, 0, 0, 0.85); backdrop-filter: blur(8px);
      display: none; align-items: center; justify-content: center;
      z-index: 10000; padding: 20px; font-family: 'Plus Jakarta Sans', sans-serif;
    `;
    modal.innerHTML = `
      <div style="background: #ffffff; color: #1e293b; width: 100%; max-width: 440px; border-radius: 20px; overflow: hidden; box-shadow: 0 25px 50px -12px rgba(0,0,0,0.5); position: relative; animation: snapPop 0.3s ease;">
        <div style="background: #0f172a; padding: 20px 24px; border-bottom: 1px solid #334155; display: flex; justify-content: space-between; align-items: center;">
          <div style="display: flex; align-items: center; gap: 10px;">
            <div style="background: #3b82f6; color: white; font-weight: 900; font-size: 16px; padding: 4px 10px; border-radius: 6px;">midtrans</div>
            <span style="font-size: 13px; font-weight: 600; color: #94a3b8;">Game Topup Gateway</span>
          </div>
          <button onclick="MidtransPay.close()" style="background: none; border: none; font-size: 22px; color: #94a3b8; cursor: pointer; padding: 0;">&times;</button>
        </div>

        <div style="padding: 24px;">
          <div style="display: flex; justify-content: space-between; align-items: baseline; margin-bottom: 20px;">
            <div>
              <div style="font-size: 13px; color: #64748b; font-weight: 600;">Paket Sumber Daya</div>
              <div id="snap-item-name" style="font-size: 16px; font-weight: 700; color: #0f172a;">Item Name</div>
            </div>
            <div id="snap-price" style="font-size: 24px; font-weight: 800; color: #3b82f6;">Rp 0</div>
          </div>

          <div style="font-size: 13px; font-weight: 700; color: #475569; margin-bottom: 12px; text-transform: uppercase;">Pilih Metode Pembayaran</div>
          
          <div style="display: flex; flex-direction: column; gap: 10px;">
            <label class="pay-method" style="display: flex; align-items: center; justify-content: space-between; padding: 14px 16px; border: 2px solid #3b82f6; border-radius: 12px; background: #eff6ff; cursor: pointer;">
              <div style="display: flex; align-items: center; gap: 12px;">
                <input type="radio" name="pay_method" value="qris" checked style="accent-color: #2563eb; width: 18px; height: 18px;">
                <span style="font-weight: 700; font-size: 15px;">QRIS (Dana, GoPay, OVO, Shopee)</span>
              </div>
              <span style="background: #dbeafe; color: #1d4ed8; font-size: 11px; font-weight: 700; padding: 2px 8px; border-radius: 4px;">INSTANT</span>
            </label>

            <label class="pay-method" style="display: flex; align-items: center; justify-content: space-between; padding: 14px 16px; border: 1px solid #e2e8f0; border-radius: 12px; cursor: pointer;">
              <div style="display: flex; align-items: center; gap: 12px;">
                <input type="radio" name="pay_method" value="bca" style="accent-color: #2563eb; width: 18px; height: 18px;">
                <span style="font-weight: 600; font-size: 15px;">BCA Virtual Account</span>
              </div>
            </label>
          </div>

          <div id="snap-qris-box" style="margin-top: 20px; text-align: center; background: #f8fafc; padding: 16px; border-radius: 12px; border: 1px dashed #cbd5e1;">
            <img src="https://api.qrserver.com/v1/create-qr-code/?size=160x160&data=MIDTRANS_GAME_TOPUP" style="width: 150px; height: 150px; margin: 0 auto; display: block;">
            <div style="font-size: 12px; color: #64748b; margin-top: 8px; font-weight: 600;">Scan QRIS untuk topup otomatis</div>
          </div>

          <button id="snap-pay-btn" onclick="MidtransPay.process()" style="width: 100%; margin-top: 24px; padding: 16px; background: #3b82f6; color: white; font-weight: 700; font-size: 16px; border: none; border-radius: 12px; cursor: pointer; transition: background 0.2s; box-shadow: 0 10px 15px -3px rgba(59, 130, 246, 0.4);">
            Bayar Sekarang
          </button>
        </div>

        <div style="background: #f1f5f9; padding: 12px 24px; text-align: center; font-size: 11px; color: #64748b;">
          🔒 Terenkripsi SSL & Topup Masuk Otomatis ke Game
        </div>
      </div>
      <style>
        @keyframes snapPop { from { opacity: 0; transform: scale(0.95); } to { opacity: 1; transform: scale(1); } }
      </style>
    `;
    document.body.appendChild(modal);

    modal.querySelectorAll('input[name="pay_method"]').forEach(radio => {
      radio.addEventListener('change', (e) => {
        modal.querySelectorAll('.pay-method').forEach(el => {
          el.style.border = '1px solid #e2e8f0';
          el.style.background = 'transparent';
        });
        e.target.closest('.pay-method').style.border = '2px solid #3b82f6';
        e.target.closest('.pay-method').style.background = '#eff6ff';
        
        const qrisBox = document.getElementById('snap-qris-box');
        if (e.target.value === 'qris') {
          qrisBox.style.display = 'block';
          qrisBox.innerHTML = `
            <img src="https://api.qrserver.com/v1/create-qr-code/?size=160x160&data=MIDTRANS_TOPUP_${Date.now()}" style="width: 150px; height: 150px; margin: 0 auto; display: block;">
            <div style="font-size: 12px; color: #64748b; margin-top: 8px; font-weight: 600;">Scan QRIS untuk topup otomatis</div>
          `;
        } else {
          const vaNum = Math.floor(100000000000 + Math.random() * 900000000000);
          qrisBox.style.display = 'block';
          qrisBox.innerHTML = `
            <div style="font-size: 13px; color: #64748b;">Nomor Virtual Account (BCA):</div>
            <div style="font-size: 20px; font-weight: 800; color: #0f172a; margin: 8px 0; letter-spacing: 1px;">8801 ${vaNum}</div>
            <div style="font-size: 11px; color: #10b981; font-weight: 700;">Menunggu Pembayaran...</div>
          `;
        }
      });
    });
  },

  checkout: function({ itemName, price, onSuccess }) {
    this.createModal();
    this.onSuccessCallback = onSuccess;
    document.getElementById('snap-item-name').textContent = itemName;
    document.getElementById('snap-price').textContent = 'Rp ' + price.toLocaleString('id-ID');
    document.getElementById('midtrans-snap-modal').style.display = 'flex';
  },

  close: function() {
    const modal = document.getElementById('midtrans-snap-modal');
    if (modal) modal.style.display = 'none';
  },

  process: function() {
    const btn = document.getElementById('snap-pay-btn');
    btn.innerHTML = '⌛ Memverifikasi Pembayaran...';
    btn.disabled = true;
    btn.style.background = '#64748b';

    setTimeout(() => {
      btn.innerHTML = '✔ Topup Berhasil Masuk!';
      btn.style.background = '#10b981';
      
      setTimeout(() => {
        this.close();
        btn.innerHTML = 'Bayar Sekarang';
        btn.disabled = false;
        btn.style.background = '#3b82f6';
        if (typeof this.onSuccessCallback === 'function') {
          this.onSuccessCallback();
        }
      }, 1000);
    }, 1800);
  }
};
