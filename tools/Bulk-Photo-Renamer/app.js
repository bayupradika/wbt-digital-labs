let isPro = localStorage.getItem('rename_pro') === 'true';
let usage = parseInt(localStorage.getItem('rename_usage') || '0');
let lastDate = localStorage.getItem('rename_date');
if(lastDate !== new Date().toDateString()){ usage = 0; localStorage.setItem('rename_date', new Date().toDateString()); }

function updateQuota(){
  const q = document.getElementById('quota-display');
  if(isPro) { q.innerHTML = '<i class="fa-solid fa-crown" style="color:#fbbf24"></i> PRO LIFETIME'; q.style.borderColor = '#fbbf24'; }
  else q.innerText = `Sisa Kuota: ${Math.max(0, 3 - usage)} / 3`;
}
updateQuota();

let files = [];
document.getElementById('file-input').addEventListener('change', (e) => {
  if(e.target.files.length) { files = Array.from(e.target.files); document.getElementById('workspace').style.display = 'block'; updateTable(); }
});

function checkQuota(){
  if(isPro) return true;
  if(usage >= 3) { openModal(); alert('Kuota gratis harian habis (3/3). Silahkan upgrade Rp8.000'); return false; }
  usage++; localStorage.setItem('rename_usage', usage); updateQuota(); return true;
}

function updateTable(){
  const prefix = document.getElementById('prefix').value;
  const startNum = parseInt(document.getElementById('start-num').value) || 1;
  const tbody = document.getElementById('table-body'); tbody.innerHTML = '';
  files.forEach((f, i) => {
    const ext = f.name.substring(f.name.lastIndexOf('.'));
    const numStr = String(startNum + i).padStart(3, '0');
    const newName = `${prefix}${numStr}${ext}`;
    const url = URL.createObjectURL(f);
    tbody.innerHTML += `<tr><td>${i+1}</td><td>${f.name}</td><td style="color:#06b6d4; font-weight:700;">${newName}</td><td><a class="btn btn-primary" style="padding:4px 10px; font-size:12px;" href="${url}" download="${newName}">Download</a></td></tr>`;
  });
}

function downloadAll(){
  if(!checkQuota()) return;
  alert('Silahkan klik tombol Download pada masing-masing baris foto dengan nama barunya.');
}

function openModal(){ document.getElementById('pro-modal').classList.add('active'); }
function closeModal(){ document.getElementById('pro-modal').classList.remove('active'); }
function activatePro(){
  if(document.getElementById('act-code').value.toUpperCase() === 'PRO8K'){
    isPro = true; localStorage.setItem('rename_pro', 'true'); updateQuota(); closeModal(); alert('Berhasil Upgrade Pro!');
  } else alert('Kode salah! Gunakan: PRO8K');
}

function payWithMidtrans() {
  MidtransPay.checkout({
    itemName: 'Bulk Photo Renamer Pro',
    price: 8000,
    onSuccess: function() {
      isPro = true;
      localStorage.setItem('rename_pro', 'true');
      updateQuota();
      if(typeof closeUpgradeModal === 'function') closeUpgradeModal();
      if(typeof closeModal === 'function') closeModal();
      alert('🎉 Pembayaran Midtrans Berhasil! Lisensi Pro Lifetime telah aktif.');
    }
  });
}

