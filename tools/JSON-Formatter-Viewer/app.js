let isPro = localStorage.getItem('json_pro') === 'true';
let usage = parseInt(localStorage.getItem('json_usage') || '0');
let lastDate = localStorage.getItem('json_date');
if(lastDate !== new Date().toDateString()){ usage = 0; localStorage.setItem('json_date', new Date().toDateString()); }

function updateQuota(){
  const q = document.getElementById('quota-display');
  if(isPro) { q.innerHTML = '<i class="fa-solid fa-crown" style="color:#fbbf24"></i> PRO LIFETIME'; q.style.borderColor = '#fbbf24'; }
  else q.innerText = `Sisa Kuota: ${Math.max(0, 3 - usage)} / 3`;
}
updateQuota();

function checkQuota(){
  if(isPro) return true;
  if(usage >= 3) { openModal(); alert('Kuota gratis harian habis (3/3). Silahkan upgrade Rp8.000'); return false; }
  usage++; localStorage.setItem('json_usage', usage); updateQuota(); return true;
}

function formatJson(){
  if(!checkQuota()) return;
  const status = document.getElementById('status');
  try {
    const obj = JSON.parse(document.getElementById('input-json').value);
    document.getElementById('output-json').value = JSON.stringify(obj, null, 2);
    status.innerText = '✔ Valid & Rapih'; status.style.color = '#3fb950';
  } catch(err) {
    document.getElementById('output-json').value = err.message;
    status.innerText = '✖ JSON Tidak Valid!'; status.style.color = '#f85149';
  }
}

function minifyJson(){
  if(!checkQuota()) return;
  const status = document.getElementById('status');
  try {
    const obj = JSON.parse(document.getElementById('input-json').value);
    document.getElementById('output-json').value = JSON.stringify(obj);
    status.innerText = '✔ Ter-minify'; status.style.color = '#3fb950';
  } catch(err) {
    document.getElementById('output-json').value = err.message;
    status.innerText = '✖ JSON Tidak Valid!'; status.style.color = '#f85149';
  }
}

function openModal(){ document.getElementById('pro-modal').classList.add('active'); }
function closeModal(){ document.getElementById('pro-modal').classList.remove('active'); }
function activatePro(){
  if(document.getElementById('act-code').value.toUpperCase() === 'PRO8K'){
    isPro = true; localStorage.setItem('json_pro', 'true'); updateQuota(); closeModal(); alert('Berhasil Upgrade Pro!');
  } else alert('Kode salah! Gunakan: PRO8K');
}

function payWithMidtrans() {
  MidtransPay.checkout({
    itemName: 'JSON Formatter Pro',
    price: 8000,
    onSuccess: function() {
      isPro = true;
      localStorage.setItem('json_pro', 'true');
      updateQuota();
      if(typeof closeUpgradeModal === 'function') closeUpgradeModal();
      if(typeof closeModal === 'function') closeModal();
      alert('🎉 Pembayaran Midtrans Berhasil! Lisensi Pro Lifetime telah aktif.');
    }
  });
}

