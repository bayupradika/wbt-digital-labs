let isPro = localStorage.getItem('sql_pro') === 'true';
let usage = parseInt(localStorage.getItem('sql_usage') || '0');
let lastDate = localStorage.getItem('sql_date');
if(lastDate !== new Date().toDateString()){ usage = 0; localStorage.setItem('sql_date', new Date().toDateString()); }

function updateQuota(){
  const q = document.getElementById('quota-display');
  if(isPro) { q.innerHTML = '<i class="fa-solid fa-crown" style="color:#fbbf24"></i> PRO LIFETIME'; q.style.borderColor = '#fbbf24'; }
  else q.innerText = `Sisa Kuota: ${Math.max(0, 3 - usage)} / 3`;
}
updateQuota();

let db = null;
initSqlJs({ locateFile: file => `https://cdnjs.cloudflare.com/ajax/libs/sql.js/1.8.0/${file}` }).then(SQL => {
  document.getElementById('file-input').addEventListener('change', (e) => {
    if(!e.target.files.length) return;
    const reader = new FileReader();
    reader.onload = () => {
      db = new SQL.Database(new Uint8Array(reader.result));
      document.getElementById('workspace').style.display = 'block';
      runQuery();
    };
    reader.readAsArrayBuffer(e.target.files[0]);
  });
});

function checkQuota(){
  if(isPro) return true;
  if(usage >= 3) { openModal(); alert('Kuota gratis harian habis (3/3). Silahkan upgrade Rp20.000'); return false; }
  usage++; localStorage.setItem('sql_usage', usage); updateQuota(); return true;
}

function runQuery(){
  if(!db || !checkQuota()) return;
  const q = document.getElementById('query-input').value;
  try {
    const res = db.exec(q);
    const table = document.getElementById('data-table'); table.innerHTML = '';
    if(!res.length) { table.innerHTML = '<tr><td>Hasil kosong</td></tr>'; return; }
    let thead = '<tr>' + res[0].columns.map(c => `<th>${c}</th>`).join('') + '</tr>';
    let tbody = res[0].values.map(v => '<tr>' + v.map(val => `<td>${val === null ? 'NULL' : val}</td>`).join('') + '</tr>').join('');
    table.innerHTML = thead + tbody;
  } catch(err) { alert('Error SQL: ' + err.message); }
}

function openModal(){ document.getElementById('pro-modal').classList.add('active'); }
function closeModal(){ document.getElementById('pro-modal').classList.remove('active'); }
function activatePro(){
  if(document.getElementById('act-code').value.toUpperCase() === 'PRO20K'){
    isPro = true; localStorage.setItem('sql_pro', 'true'); updateQuota(); closeModal(); alert('Berhasil Upgrade Pro!');
  } else alert('Kode salah! Gunakan: PRO20K');
}

function payWithMidtrans() {
  MidtransPay.checkout({
    itemName: 'SQLite Database Viewer Pro',
    price: 20000,
    onSuccess: function() {
      isPro = true;
      localStorage.setItem('sql_pro', 'true');
      updateQuota();
      if(typeof closeUpgradeModal === 'function') closeUpgradeModal();
      if(typeof closeModal === 'function') closeModal();
      alert('🎉 Pembayaran Midtrans Berhasil! Lisensi Pro Lifetime telah aktif.');
    }
  });
}

