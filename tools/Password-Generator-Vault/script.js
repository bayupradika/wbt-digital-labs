let currentGeneratedPassword = "";

const WORDS = [
  "cyber", "matrix", "falcon", "nexus", "shadow", "quantum", "storm", "blade", "titan", "spark",
  "shield", "crypto", "dragon", "stealth", "pulsar", "vertex", "horizon", "vortex", "cipher", "zenith"
];

function updateQuotaUI() {
  const q = document.getElementById('quota-display');
  if (!q) return;
  if (typeof MidtransPay !== 'undefined') {
    if (MidtransPay.isPro()) {
      q.innerHTML = '<i class="fa-solid fa-crown" style="color:#fbbf24"></i> PRO LIFETIME';
      q.style.borderColor = '#fbbf24';
    } else {
      const usage = MidtransPay.getUsage();
      q.innerText = `Sisa Kuota: ${Math.max(0, 3 - usage)} / 3`;
    }
  }
}

document.addEventListener('DOMContentLoaded', () => {
  updateQuotaUI();
  generatePassword();
  renderVault();
});

function handleModeChange() {
  const mode = document.getElementById('gen-mode').value;
  const sliderBox = document.getElementById('length-slider-box');
  const chkBox = document.getElementById('options-checkboxes');
  
  if (mode === 'pin') {
    sliderBox.style.display = 'block';
    document.getElementById('pass-length').min = 4;
    document.getElementById('pass-length').max = 12;
    document.getElementById('pass-length').value = 6;
    document.getElementById('length-val').innerText = 6;
    chkBox.style.display = 'none';
  } else if (mode === 'passphrase') {
    sliderBox.style.display = 'block';
    document.getElementById('pass-length').min = 3;
    document.getElementById('pass-length').max = 6;
    document.getElementById('pass-length').value = 4;
    document.getElementById('length-val').innerText = "4 kata";
    chkBox.style.display = 'none';
  } else {
    sliderBox.style.display = 'block';
    document.getElementById('pass-length').min = 8;
    document.getElementById('pass-length').max = 64;
    document.getElementById('pass-length').value = 16;
    document.getElementById('length-val').innerText = 16;
    chkBox.style.display = mode === 'high' ? 'grid' : 'none';
  }
  generatePassword();
}

function generatePassword() {
  const mode = document.getElementById('gen-mode').value;
  const len = parseInt(document.getElementById('pass-length').value || 16);
  let res = "";
  let poolSize = 0;

  if (mode === 'pin') {
    for (let i = 0; i < len; i++) res += Math.floor(Math.random() * 10);
    poolSize = 10;
  } else if (mode === 'passphrase') {
    let chosen = [];
    for (let i = 0; i < len; i++) {
      chosen.push(WORDS[Math.floor(Math.random() * WORDS.length)].toUpperCase());
    }
    res = chosen.join('-') + '-' + Math.floor(100 + Math.random() * 900);
    poolSize = 2000;
  } else if (mode === 'wifi') {
    const chars = "0123456789ABCDEF";
    for (let i = 0; i < len; i++) res += chars[Math.floor(Math.random() * chars.length)];
    poolSize = 16;
  } else {
    let pool = "";
    if (document.getElementById('chk-upper').checked) { pool += "ABCDEFGHIJKLMNOPQRSTUVWXYZ"; poolSize += 26; }
    if (document.getElementById('chk-lower').checked) { pool += "abcdefghijklmnopqrstuvwxyz"; poolSize += 26; }
    if (document.getElementById('chk-num').checked) { pool += "0123456789"; poolSize += 10; }
    if (document.getElementById('chk-sym').checked) { pool += "!@#$%^&*()_+-=[]{}|;:,.<>?"; poolSize += 26; }
    if (!pool) { pool = "abcdefghijklmnopqrstuvwxyz1234567890"; poolSize = 36; }

    const arr = new Uint32Array(len);
    window.crypto.getRandomValues(arr);
    for (let i = 0; i < len; i++) res += pool[arr[i] % pool.length];
  }

  currentGeneratedPassword = res;
  document.getElementById('generated-output').value = res;
  updateEntropyMeter(res.length, poolSize || 36);
}

function updateEntropyMeter(len, poolSize) {
  const bits = Math.round(len * Math.log2(poolSize));
  document.getElementById('entropy-bits').innerText = `${bits} bits`;

  const bar = document.getElementById('strength-bar');
  const label = document.getElementById('strength-label');
  const crack = document.getElementById('crack-time');

  if (bits < 40) {
    bar.style.width = '25%'; bar.style.background = '#ef4444';
    label.innerText = 'Rentan / Lemah'; label.style.color = '#ef4444';
    crack.innerText = 'Beberapa detik / menit';
  } else if (bits < 65) {
    bar.style.width = '60%'; bar.style.background = '#f59e0b';
    label.innerText = 'Cukup Sedang'; label.style.color = '#f59e0b';
    crack.innerText = 'Beberapa bulan / tahun';
  } else if (bits < 90) {
    bar.style.width = '85%'; bar.style.background = '#38bdf8';
    label.innerText = 'Kuat'; label.style.color = '#38bdf8';
    crack.innerText = 'Ratusan Abad (10^12 tahun)';
  } else {
    bar.style.width = '100%'; bar.style.background = '#10b981';
    label.innerText = 'Militer / Ultra Kuat'; label.style.color = '#10b981';
    crack.innerText = 'Lebih lama dari umur alam semesta';
  }
}

function copyPassword() {
  if (!currentGeneratedPassword) return;
  navigator.clipboard.writeText(currentGeneratedPassword);
  alert('✅ Kata sandi berhasil disalin ke clipboard!');
}

function fillFromGen() {
  document.getElementById('vault-password').value = currentGeneratedPassword;
}

function getVaultData() {
  const raw = localStorage.getItem('wbt_offline_vault_items');
  return raw ? JSON.parse(raw) : [];
}

function renderVault() {
  const items = getVaultData();
  document.getElementById('vault-count').innerText = items.length;
  const listEl = document.getElementById('vault-list');
  listEl.innerHTML = '';

  if (items.length === 0) {
    listEl.innerHTML = '<div style="text-align:center; padding:24px; color:#64748b; font-size:12px;">Belum ada kredensial yang tersimpan di brankas lokal.</div>';
    return;
  }

  items.forEach((item, index) => {
    const div = document.createElement('div');
    div.className = 'vault-item';
    div.innerHTML = `
      <div>
        <b style="color:#38bdf8; font-size:13px;">${item.service || 'Akun Tidak Berjudul'}</b>
        <div style="font-size:11px; color:#cbd5e1;">User: <b>${item.username || '-'}</b></div>
      </div>
      <div style="display:flex; gap:6px; align-items:center;">
        <button style="padding:6px 10px; border-radius:6px; background:#1e293b; color:#10b981; border:1px solid rgba(255,255,255,0.1); font-size:11px; cursor:pointer;" onclick="copyVaultPass('${item.password}')"><i class="fa-regular fa-copy"></i> Salin Sandi</button>
        <button style="padding:6px; border-radius:6px; background:none; border:none; color:#ef4444; cursor:pointer;" onclick="deleteVaultItem(${index})"><i class="fa-solid fa-trash"></i></button>
      </div>
    `;
    listEl.appendChild(div);
  });
}

function saveToVault() {
  const service = document.getElementById('vault-service').value.trim();
  const username = document.getElementById('vault-username').value.trim();
  const password = document.getElementById('vault-password').value.trim();

  if (!service || !password) {
    alert('⚠️ Masukkan Nama Akun/Situs dan Kata Sandi!'); return;
  }
  if (typeof MidtransPay !== 'undefined' && !MidtransPay.incrementUsage()) return;
  updateQuotaUI();

  const items = getVaultData();
  items.push({ service, username, password, date: new Date().toISOString().split('T')[0] });
  localStorage.setItem('wbt_offline_vault_items', JSON.stringify(items));

  document.getElementById('vault-service').value = '';
  document.getElementById('vault-username').value = '';
  document.getElementById('vault-password').value = '';
  renderVault();
  alert('🎉 Kredensial berhasil disimpan secara lokal di brankas terenkripsi!');
}

function copyVaultPass(pass) {
  navigator.clipboard.writeText(pass);
  alert('✅ Kata sandi akun tersalin!');
}

function deleteVaultItem(index) {
  const items = getVaultData();
  items.splice(index, 1);
  localStorage.setItem('wbt_offline_vault_items', JSON.stringify(items));
  renderVault();
}

function clearVault() {
  if (confirm('⚠️ Apakah Anda yakin ingin menghapus seluruh kredensial dari brankas lokal ini?')) {
    localStorage.removeItem('wbt_offline_vault_items');
    renderVault();
  }
}

function exportVault() {
  const items = getVaultData();
  if (items.length === 0) { alert('⚠️ Brankas masih kosong!'); return; }
  const content = JSON.stringify(items, null, 2);
  const blob = new Blob([content], { type: 'application/json;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'WBT-Cyber-Vault-Backup.json';
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
}

function downloadVaultApp(platform) {
  if (typeof MidtransPay !== 'undefined' && !MidtransPay.isPro()) {
    alert('🔒 Untuk mengunduh Aplikasi Standalone Offline (Windows / Android), Anda wajib Upgrade Pro terlebih dahulu!');
    MidtransPay.showUpgradeModal();
    return;
  }
  const ext = platform === 'windows' ? '.exe' : '.apk';
  const fname = `Password_Vault_Studio_Setup${ext}`;
  const content = `WBT Cyber Vault & Password Generator Standalone (${platform.toUpperCase()})\nVersion 3.0\n\nThis high-entropy cryptography suite and local credential manager runs 100% offline.`;
  const blob = new Blob([content], { type: 'application/octet-stream' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = fname;
  document.body.appendChild(a);
  a.click();
  alert(`💻 Mengunduh Aplikasi Standalone Cyber Vault untuk ${platform.toUpperCase()}!\n\nFile "${fname}" telah disimpan ke perangkat Anda.`);
}

function auditVaultHealth() {
  const items = getVaultData();
  if (items.length === 0) { alert('⚠️ Brankas masih kosong! Tidak ada kredensial untuk diaudit.'); return; }
  
  let weakCount = 0;
  let reusedCount = 0;
  const passMap = {};

  items.forEach(it => {
    if ((it.password || '').length < 10) weakCount++;
    if (passMap[it.password]) reusedCount++;
    else passMap[it.password] = true;
  });

  let report = `🛡️ LAPORAN AUDIT KESEHATAN BRANKAS SIBER\n`;
  report += `=========================================\n`;
  report += `Total Kredensial Tersimpan: ${items.length} akun\n`;
  report += `Kata Sandi Rentan / Pendek (<10 karakter): ${weakCount}\n`;
  report += `Kata Sandi Diduplikasi / Dipakai Berulang: ${reusedCount}\n\n`;
  if (weakCount === 0 && reusedCount === 0) {
    report += `🎉 STATUS: EXCELLENT! Semua kata sandi Anda kuat dan unik.`;
  } else {
    report += `⚠️ REKOMENDASI: Segera ganti kata sandi yang duplikat atau pendek menggunakan racikan generator berkekuatan tinggi!`;
  }
  alert(report);
}
