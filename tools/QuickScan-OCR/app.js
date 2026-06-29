let isPro = localStorage.getItem('ocr_pro') === 'true';
let usage = parseInt(localStorage.getItem('ocr_usage') || '0');
let lastDate = localStorage.getItem('ocr_date');
if(lastDate !== new Date().toDateString()){ usage = 0; localStorage.setItem('ocr_date', new Date().toDateString()); }

function updateQuota(){
  const q = document.getElementById('quota-display');
  if(isPro) { q.innerHTML = '<i class="fa-solid fa-crown" style="color:#fbbf24"></i> PRO LIFETIME'; q.style.borderColor = '#fbbf24'; }
  else q.innerText = `Sisa Kuota: ${Math.max(0, 3 - usage)} / 3`;
}
updateQuota();

document.getElementById('file-input').addEventListener('change', (e) => {
  if(e.target.files.length) { handleScan(e.target.files[0]); }
});

function checkQuota(){
  if(isPro) return true;
  if(usage >= 3) { openModal(); alert('Kuota gratis harian habis (3/3). Silahkan upgrade Rp20.000'); return false; }
  usage++; localStorage.setItem('ocr_usage', usage); updateQuota(); return true;
}

async function handleScan(file){
  if(!checkQuota()) return;
  const reader = new FileReader();
  reader.onload = async (e) => {
    document.getElementById('preview-img').src = e.target.result;
    document.getElementById('workspace').style.display = 'grid';
    const status = document.getElementById('status-text');
    status.innerText = 'Sedang Membaca Teks (AI)...';
    try {
      const worker = await Tesseract.createWorker('eng+ind');
      const ret = await worker.recognize(e.target.result);
      document.getElementById('output-text').value = ret.data.text;
      status.innerText = 'Selesai!';
      await worker.terminate();
    } catch(err) {
      status.innerText = 'Gagal membaca teks';
      console.error(err);
    }
  };
  reader.readAsDataURL(file);
}

function copyText(){
  const txt = document.getElementById('output-text');
  txt.select(); document.execCommand('copy'); alert('Teks berhasil disalin!');
}
function downloadTxt(){
  const blob = new Blob([document.getElementById('output-text').value], {type:'text/plain'});
  const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = 'hasil_ocr.txt'; a.click();
}

function openModal(){ document.getElementById('pro-modal').classList.add('active'); }
function closeModal(){ document.getElementById('pro-modal').classList.remove('active'); }
function activatePro(){
  if(document.getElementById('act-code').value.toUpperCase() === 'PRO20K'){
    isPro = true; localStorage.setItem('ocr_pro', 'true'); updateQuota(); closeModal(); alert('Berhasil Upgrade Pro!');
  } else alert('Kode salah! Gunakan: PRO20K');
}

function payWithMidtrans() {
  MidtransPay.checkout({
    itemName: 'QuickScan OCR Pro',
    price: 20000,
    onSuccess: function() {
      isPro = true;
      localStorage.setItem('ocr_pro', 'true');
      updateQuota();
      if(typeof closeUpgradeModal === 'function') closeUpgradeModal();
      if(typeof closeModal === 'function') closeModal();
      alert('🎉 Pembayaran Midtrans Berhasil! Lisensi Pro Lifetime telah aktif.');
    }
  });
}

