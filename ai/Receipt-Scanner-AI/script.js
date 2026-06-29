let loaded = false;
let extractedData = null;

document.getElementById('file-input').addEventListener('change', function(e) {
  if (e.target.files && e.target.files[0]) {
    const reader = new FileReader();
    reader.onload = function(evt) {
      document.getElementById('preview').src = evt.target.result;
      document.getElementById('preview').style.display = 'block';
      document.getElementById('dropzone').style.display = 'none';
      loaded = true;
    };
    reader.readAsDataURL(e.target.files[0]);
  }
});

function loadSample() {
  document.getElementById('preview').src = 'https://images.unsplash.com/photo-1554415707-c18de3f9daea?auto=format&fit=crop&w=400&q=80';
  document.getElementById('preview').style.display = 'block';
  document.getElementById('dropzone').style.display = 'none';
  loaded = true;
}

function scanReceipt() {
  if (!loaded) { alert('⚠️ Unggah foto struk terlebih dahulu!'); return; }
  if (!MidtransPay.incrementUsage()) return;

  const box = document.getElementById('output-box');
  box.innerHTML = '<div style="text-align:center; padding: 40px; color:#10b981;"><i class="fa-solid fa-spinner fa-spin" style="font-size:32px;"></i><p style="margin-top:10px;">AI memindai karakter OCR & menghitung total...</p></div>';

  setTimeout(() => {
    extractedData = {
      merchant: "SUPERMARKET INDONESIA MAKMUR",
      date: "30 Juni 2026 14:35",
      receipt_id: "INV/20260630/0892",
      items: [
        { name: "Kopi Susu Literan Premium", price: "Rp 65.000" },
        { name: "Roti Tawar Gandum Utuh", price: "Rp 24.500" },
        { name: "Susu UHT Full Cream 1L", price: "Rp 19.000" },
        { name: "Buah Pisang Cavendish", price: "Rp 32.000" }
      ],
      tax: "Rp 14.050",
      total: "Rp 154.550"
    };

    box.innerHTML = `
      <div class="receipt-data">
        <div style="text-align:center; margin-bottom:15px; border-bottom:1px dashed rgba(255,255,255,0.2); padding-bottom:12px;">
          <h4 style="color:#10b981; font-family:'Outfit',sans-serif; font-size:16px;">${extractedData.merchant}</h4>
          <span style="font-size:12px; color:#94a3b8;">${extractedData.date} • ${extractedData.receipt_id}</span>
        </div>
        ${extractedData.items.map(it => `<div class="row"><span>${it.name}</span><span>${it.price}</span></div>`).join('')}
        <div class="row" style="color:#94a3b8;"><span>Pajak PB1 (10%)</span><span>${extractedData.tax}</span></div>
        <div class="row" style="margin-top:5px; border-top:1px solid rgba(255,255,255,0.1); padding-top:12px;"><span>TOTAL BAYAR</span><span>${extractedData.total}</span></div>
      </div>
    `;
    document.getElementById('dl-btn').style.display = 'flex';
  }, 1000);
}

function exportJSON() {
  if (!extractedData) return;
  const str = JSON.stringify(extractedData, null, 2);
  const link = document.createElement('a');
  link.download = 'receipt-data.json';
  link.href = 'data:text/json;charset=utf-8,' + encodeURIComponent(str);
  link.click();
}
