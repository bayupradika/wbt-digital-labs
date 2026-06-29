let isPro = localStorage.getItem('resizer_pro') === 'true';
let usage = parseInt(localStorage.getItem('resizer_usage') || '0');
let lastDate = localStorage.getItem('resizer_date');
if(lastDate !== new Date().toDateString()){ usage = 0; localStorage.setItem('resizer_date', new Date().toDateString()); }

function updateQuota(){
  const q = document.getElementById('quota-display');
  if(isPro) { q.innerHTML = '<i class="fa-solid fa-crown" style="color:#fbbf24"></i> PRO LIFETIME'; q.style.borderColor = '#fbbf24'; }
  else q.innerText = `Sisa Kuota: ${Math.max(0, 3 - usage)} / 3`;
}
updateQuota();

let files = [];
document.getElementById('file-input').addEventListener('change', (e) => {
  if(e.target.files.length) { files = Array.from(e.target.files); render(); }
});

function checkQuota(){
  if(isPro) return true;
  if(usage >= 3) { openModal(); alert('Kuota gratis harian habis (3/3). Silahkan upgrade Rp12.000'); return false; }
  usage++; localStorage.setItem('resizer_usage', usage); updateQuota(); return true;
}

function render(){
  document.getElementById('workspace').style.display = 'block';
  document.getElementById('file-count').innerText = files.length;
  const list = document.getElementById('file-list'); list.innerHTML = '';
  files.forEach((f, i) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      list.innerHTML += `<div class="file-item" id="item-${i}"><img src="${e.target.result}"><p style="font-size:12px; overflow:hidden; text-overflow:ellipsis; white-space:nowrap;">${f.name}</p><a class="btn btn-primary" style="padding:4px 8px; font-size:11px; margin-top:6px; display:none;" id="dl-${i}" download="resized_${f.name}">Download</a></div>`;
    };
    reader.readAsDataURL(f);
  });
}

function processResize(){
  if(!checkQuota()) return;
  const targetW = parseInt(document.getElementById('target-w').value) || 1080;
  files.forEach((f, i) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        const scale = targetW / img.naturalWidth;
        const targetH = Math.round(img.naturalHeight * scale);
        const canvas = document.createElement('canvas');
        canvas.width = targetW; canvas.height = targetH;
        canvas.getContext('2d').drawImage(img, 0, 0, targetW, targetH);
        const dl = document.getElementById(`dl-${i}`);
        dl.href = canvas.toDataURL(f.type || 'image/jpeg');
        dl.style.display = 'inline-block';
      };
      img.src = e.target.result;
    };
    reader.readAsDataURL(f);
  });
  alert('Proses resize selesai! Klik tombol download pada masing-masing foto.');
}

function openModal(){ document.getElementById('pro-modal').classList.add('active'); }
function closeModal(){ document.getElementById('pro-modal').classList.remove('active'); }
function activatePro(){
  if(document.getElementById('act-code').value.toUpperCase() === 'PRO12K'){
    isPro = true; localStorage.setItem('resizer_pro', 'true'); updateQuota(); closeModal(); alert('Berhasil Upgrade Pro!');
  } else alert('Kode salah! Gunakan: PRO12K');
}

function payWithMidtrans() {
  MidtransPay.checkout({
    itemName: 'Batch Image Resizer Pro',
    price: 12000,
    onSuccess: function() {
      isPro = true;
      localStorage.setItem('resizer_pro', 'true');
      updateQuota();
      if(typeof closeUpgradeModal === 'function') closeUpgradeModal();
      if(typeof closeModal === 'function') closeModal();
      alert('🎉 Pembayaran Midtrans Berhasil! Lisensi Pro Lifetime telah aktif.');
    }
  });
}

