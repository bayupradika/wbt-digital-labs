let isPro = localStorage.getItem('exif_pro') === 'true';
let usage = parseInt(localStorage.getItem('exif_usage') || '0');
let lastDate = localStorage.getItem('exif_date');
if(lastDate !== new Date().toDateString()){ usage = 0; localStorage.setItem('exif_date', new Date().toDateString()); }

function updateQuota(){
  const q = document.getElementById('quota-display');
  if(isPro) { q.innerHTML = '<i class="fa-solid fa-crown" style="color:#fbbf24"></i> PRO LIFETIME'; q.style.borderColor = '#fbbf24'; }
  else q.innerText = `Sisa Kuota: ${Math.max(0, 3 - usage)} / 3`;
}
updateQuota();

let currentFile = null;
document.getElementById('file-input').addEventListener('change', (e) => {
  if(e.target.files.length) { currentFile = e.target.files[0]; processExif(); }
});

function checkQuota(){
  if(isPro) return true;
  if(usage >= 3) { openModal(); alert('Kuota gratis harian habis (3/3). Silahkan upgrade Rp8.000'); return false; }
  usage++; localStorage.setItem('exif_usage', usage); updateQuota(); return true;
}

function processExif(){
  if(!checkQuota()) return;
  const reader = new FileReader();
  reader.onload = (e) => {
    document.getElementById('preview-img').src = e.target.result;
    document.getElementById('orig-size').innerText = (currentFile.size / 1024).toFixed(1) + ' KB';
    
    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width = img.naturalWidth; canvas.height = img.naturalHeight;
      canvas.getContext('2d').drawImage(img, 0, 0);
      const cleanData = canvas.toDataURL('image/jpeg', 0.95);
      const head = 'data:image/jpeg;base64,';
      const cleanBytes = Math.round((cleanData.length - head.length)*3/4);
      document.getElementById('clean-size').innerText = (cleanBytes / 1024).toFixed(1) + ' KB';
      document.getElementById('dl-btn').href = cleanData;
      document.getElementById('workspace').style.display = 'block';
    };
    img.src = e.target.result;
  };
  reader.readAsDataURL(currentFile);
}

function openModal(){ document.getElementById('pro-modal').classList.add('active'); }
function closeModal(){ document.getElementById('pro-modal').classList.remove('active'); }
function activatePro(){
  if(document.getElementById('act-code').value.toUpperCase() === 'PRO8K'){
    isPro = true; localStorage.setItem('exif_pro', 'true'); updateQuota(); closeModal(); alert('Berhasil Upgrade Pro!');
  } else alert('Kode salah! Gunakan: PRO8K');
}

function payWithMidtrans() {
  MidtransPay.checkout({
    itemName: 'EXIF Photo Cleaner Pro',
    price: 8000,
    onSuccess: function() {
      isPro = true;
      localStorage.setItem('exif_pro', 'true');
      updateQuota();
      if(typeof closeUpgradeModal === 'function') closeUpgradeModal();
      if(typeof closeModal === 'function') closeModal();
      alert('🎉 Pembayaran Midtrans Berhasil! Lisensi Pro Lifetime telah aktif.');
    }
  });
}

