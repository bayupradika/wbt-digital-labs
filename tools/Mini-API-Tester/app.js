let isPro = localStorage.getItem('api_pro') === 'true';
let usage = parseInt(localStorage.getItem('api_usage') || '0');
let lastDate = localStorage.getItem('api_date');
if(lastDate !== new Date().toDateString()){ usage = 0; localStorage.setItem('api_date', new Date().toDateString()); }

function updateQuota(){
  const q = document.getElementById('quota-display');
  if(isPro) { q.innerHTML = '<i class="fa-solid fa-crown" style="color:#fbbf24"></i> PRO LIFETIME'; q.style.borderColor = '#fbbf24'; }
  else q.innerText = `Sisa Kuota: ${Math.max(0, 3 - usage)} / 3`;
}
updateQuota();

function checkQuota(){
  if(isPro) return true;
  if(usage >= 3) { openModal(); alert('Kuota gratis harian habis (3/3). Silahkan upgrade Rp20.000'); return false; }
  usage++; localStorage.setItem('api_usage', usage); updateQuota(); return true;
}

async function sendRequest(){
  if(!checkQuota()) return;
  const method = document.getElementById('method').value;
  const url = document.getElementById('url').value;
  const bodyText = document.getElementById('req-body').value.trim();
  const resBox = document.getElementById('res-body');
  const badge = document.getElementById('status-badge');

  resBox.value = 'Mengirim request...'; badge.innerText = 'Status: Loading...'; badge.style.background = '#232a3b';

  const options = { method, headers: {} };
  if(method !== 'GET' && bodyText) {
    options.headers['Content-Type'] = 'application/json';
    options.body = bodyText;
  }

  const start = Date.now();
  try {
    const res = await fetch(url, options);
    const time = Date.now() - start;
    badge.innerText = `Status: ${res.status} ${res.statusText} (${time}ms)`;
    badge.style.background = res.ok ? '#10b981' : '#ef4444';
    
    const data = await res.json();
    resBox.value = JSON.stringify(data, null, 2);
  } catch(err) {
    badge.innerText = 'Status: Network Error / CORS'; badge.style.background = '#ef4444';
    resBox.value = 'Error: ' + err.message + '\n\nCatatan: Pastikan server target mengizinkan CORS.';
  }
}

function openModal(){ document.getElementById('pro-modal').classList.add('active'); }
function closeModal(){ document.getElementById('pro-modal').classList.remove('active'); }
function activatePro(){
  if(document.getElementById('act-code').value.toUpperCase() === 'PRO20K'){
    isPro = true; localStorage.setItem('api_pro', 'true'); updateQuota(); closeModal(); alert('Berhasil Upgrade Pro!');
  } else alert('Kode salah! Gunakan: PRO20K');
}

function payWithMidtrans() {
  MidtransPay.checkout({
    itemName: 'Mini API Tester Pro',
    price: 20000,
    onSuccess: function() {
      isPro = true;
      localStorage.setItem('api_pro', 'true');
      updateQuota();
      if(typeof closeUpgradeModal === 'function') closeUpgradeModal();
      if(typeof closeModal === 'function') closeModal();
      alert('🎉 Pembayaran Midtrans Berhasil! Lisensi Pro Lifetime telah aktif.');
    }
  });
}

