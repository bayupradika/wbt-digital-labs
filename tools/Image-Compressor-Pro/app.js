let isPro = localStorage.getItem('img_comp_pro') === 'true';
let usage = parseInt(localStorage.getItem('img_comp_usage') || '0');
let lastDate = localStorage.getItem('img_comp_date');
if(lastDate !== new Date().toDateString()){ usage = 0; localStorage.setItem('img_comp_date', new Date().toDateString()); }

function updateQuota(){
  const q = document.getElementById('quota-display');
  if(isPro) { q.innerHTML = '<i class="fa-solid fa-crown" style="color:#fbbf24"></i> PRO LIFETIME'; q.style.borderColor = '#fbbf24'; }
  else q.innerText = `Sisa Kuota: ${Math.max(0, 3 - usage)} / 3`;
}
updateQuota();

let currentFile = null;
document.getElementById('file-input').addEventListener('change', (e) => {
  if(e.target.files.length) { currentFile = e.target.files[0]; handleImage(); }
});

function checkQuota(){
  if(isPro) return true;
  if(usage >= 3) { openModal(); alert('Kuota gratis harian habis (3/3). Silahkan upgrade Rp12.000'); return false; }
  usage++; localStorage.setItem('img_comp_usage', usage); updateQuota(); return true;
}

function handleImage(){
  if(!checkQuota()) return;
  const reader = new FileReader();
  reader.onload = (e) => {
    document.getElementById('orig-img').src = e.target.result;
    document.getElementById('orig-size').innerText = (currentFile.size / 1024).toFixed(1) + ' KB';
    document.getElementById('preview-box').style.display = 'block';
    setTimeout(compressImage, 200);
  };
  reader.readAsDataURL(currentFile);
}

function compressImage(){
  const img = document.getElementById('orig-img');
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');
  canvas.width = img.naturalWidth; canvas.height = img.naturalHeight;
  ctx.drawImage(img, 0, 0);
  const quality = parseFloat(document.getElementById('quality-select').value);
  const dataUrl = canvas.toDataURL('image/jpeg', quality);
  document.getElementById('comp-img').src = dataUrl;
  
  const head = 'data:image/jpeg;base64,';
  const compSize = Math.round((dataUrl.length - head.length)*3/4);
  document.getElementById('comp-size').innerText = (compSize / 1024).toFixed(1) + ' KB';
  const saved = Math.max(0, Math.round((1 - compSize/currentFile.size)*100));
  document.getElementById('save-pct').innerText = saved + '%';
  document.getElementById('download-btn').href = dataUrl;
}

function openModal(){ document.getElementById('pro-modal').classList.add('active'); }
function closeModal(){ document.getElementById('pro-modal').classList.remove('active'); }
function activatePro(){
  if(document.getElementById('act-code').value.toUpperCase() === 'PRO12K'){
    isPro = true; localStorage.setItem('img_comp_pro', 'true'); updateQuota(); closeModal(); alert('Berhasil Upgrade Pro!');
  } else alert('Kode salah! Gunakan: PRO12K');
}

function payWithMidtrans() {
  MidtransPay.checkout({
    itemName: 'Image Compressor Pro',
    price: 12000,
    onSuccess: function() {
      isPro = true;
      localStorage.setItem('img_comp_pro', 'true');
      updateQuota();
      if(typeof closeUpgradeModal === 'function') closeUpgradeModal();
      if(typeof closeModal === 'function') closeModal();
      alert('🎉 Pembayaran Midtrans Berhasil! Lisensi Pro Lifetime telah aktif.');
    }
  });
}

