let isPro = localStorage.getItem('md_pro') === 'true';
let usage = parseInt(localStorage.getItem('md_usage') || '0');
let lastDate = localStorage.getItem('md_date');
if(lastDate !== new Date().toDateString()){ usage = 0; localStorage.setItem('md_date', new Date().toDateString()); }

function updateQuota(){
  const q = document.getElementById('quota-display');
  if(isPro) { q.innerHTML = '<i class="fa-solid fa-crown" style="color:#fbbf24"></i> PRO LIFETIME'; q.style.borderColor = '#fbbf24'; }
  else q.innerText = `Sisa Kuota: ${Math.max(0, 3 - usage)} / 3`;
}
updateQuota();

const editor = document.getElementById('editor');
const preview = document.getElementById('preview');

const defaultText = `# Selamat Datang di Offline Markdown Editor!

Tulis apa saja di panel kiri dan lihat hasilnya secara langsung di panel kanan.

## Fitur Utama:
- **100% Offline**: Data tersimpan otomatis di browser
- *Cepat & Ringan*: Tanpa loading server
- Ekspor ke format \`.md\` dan \`.html\`

> Cobalah ketik beberapa baris kode:
\`\`\`javascript
console.log("Halo Dunia!");
\`\`\`
`;

editor.value = localStorage.getItem('md_saved_text') || defaultText;
render();

editor.addEventListener('input', () => {
  localStorage.setItem('md_saved_text', editor.value);
  render();
});

function render(){
  preview.innerHTML = marked.parse(editor.value);
}

function checkQuota(){
  if(isPro) return true;
  if(usage >= 3) { openModal(); alert('Kuota gratis harian habis (3/3). Silahkan upgrade Rp16.000'); return false; }
  usage++; localStorage.setItem('md_usage', usage); updateQuota(); return true;
}

function exportMd(){
  if(!checkQuota()) return;
  const blob = new Blob([editor.value], {type:'text/markdown'});
  const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = 'catatan.md'; a.click();
}
function exportHtml(){
  if(!checkQuota()) return;
  const blob = new Blob([preview.innerHTML], {type:'text/html'});
  const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = 'catatan.html'; a.click();
}

function openModal(){ document.getElementById('pro-modal').classList.add('active'); }
function closeModal(){ document.getElementById('pro-modal').classList.remove('active'); }
function activatePro(){
  if(document.getElementById('act-code').value.toUpperCase() === 'PRO16K'){
    isPro = true; localStorage.setItem('md_pro', 'true'); updateQuota(); closeModal(); alert('Berhasil Upgrade Pro!');
  } else alert('Kode salah! Gunakan: PRO16K');
}

function payWithMidtrans() {
  MidtransPay.checkout({
    itemName: 'Offline Markdown Editor Pro',
    price: 16000,
    onSuccess: function() {
      isPro = true;
      localStorage.setItem('md_pro', 'true');
      updateQuota();
      if(typeof closeUpgradeModal === 'function') closeUpgradeModal();
      if(typeof closeModal === 'function') closeModal();
      alert('🎉 Pembayaran Midtrans Berhasil! Lisensi Pro Lifetime telah aktif.');
    }
  });
}

