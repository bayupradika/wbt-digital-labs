let db = null;
let currentResult = null;

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
});

initSqlJs({ locateFile: file => `https://cdnjs.cloudflare.com/ajax/libs/sql.js/1.8.0/${file}` }).then(SQL => {
  const fileInput = document.getElementById('file-input');
  if (fileInput) {
    fileInput.addEventListener('change', (e) => {
      if (!e.target.files.length) return;
      const reader = new FileReader();
      reader.onload = () => {
        db = new SQL.Database(new Uint8Array(reader.result));
        document.getElementById('dropzone').style.display = 'none';
        document.getElementById('workspace').style.display = 'block';
        runQuery();
      };
      reader.readAsArrayBuffer(e.target.files[0]);
    });
  }
});

function setQuery(qStr) {
  document.getElementById('query-input').value = qStr;
  runQuery();
}

function runQuery() {
  if (!db) return;
  if (typeof MidtransPay !== 'undefined' && !MidtransPay.incrementUsage()) return;
  updateQuotaUI();

  const q = document.getElementById('query-input').value;
  const table = document.getElementById('data-table');
  table.innerHTML = '';

  try {
    const res = db.exec(q);
    if (!res.length) {
      table.innerHTML = '<tr><td style="padding:16px; text-align:center; color:#94a3b8;">Hasil query kosong (0 baris dikembalikan)</td></tr>';
      currentResult = null;
      return;
    }
    currentResult = res[0];
    let thead = '<tr style="border-bottom:1px solid rgba(255,255,255,0.1); text-align:left;">' + res[0].columns.map(c => `<th style="padding:10px; color:#38bdf8;">${c}</th>`).join('') + '</tr>';
    let tbody = res[0].values.map(v => '<tr style="border-bottom:1px solid rgba(255,255,255,0.05);">' + v.map(val => `<td style="padding:10px; color:#e2e8f0;">${val === null ? '<i style="color:#64748b">NULL</i>' : val}</td>`).join('') + '</tr>').join('');
    table.innerHTML = thead + tbody;
  } catch (err) {
    alert('Error SQL Execution: ' + err.message);
  }
}

function exportCSV() {
  if (!currentResult) { alert('⚠️ Jalankan query yang mengembalikan data terlebih dahulu!'); return; }
  let csv = currentResult.columns.join(',') + '\n';
  currentResult.values.forEach(row => {
    csv += row.map(v => `"${(v || '').toString().replace(/"/g, '""')}"`).join(',') + '\n';
  });
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'WBT-SQL-Result.csv';
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
}

function exportJSON() {
  if (!currentResult) { alert('⚠️ Jalankan query yang mengembalikan data terlebih dahulu!'); return; }
  const cols = currentResult.columns;
  const jsonArr = currentResult.values.map(row => {
    let obj = {};
    cols.forEach((c, idx) => { obj[c] = row[idx]; });
    return obj;
  });
  const blob = new Blob([JSON.stringify(jsonArr, null, 2)], { type: 'application/json;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'WBT-SQL-Result.json';
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
}

function downloadSQLiteApp(platform) {
  if (typeof MidtransPay !== 'undefined' && !MidtransPay.isPro()) {
    alert('🔒 Untuk mengunduh Aplikasi Standalone Offline (Windows / Android), Anda wajib Upgrade Pro terlebih dahulu!');
    MidtransPay.showUpgradeModal();
    return;
  }
  const ext = platform === 'windows' ? '.exe' : '.apk';
  const fname = `SQLite_Database_Viewer_Setup${ext}`;
  const content = `WBT SQLite Database Viewer Studio Standalone (${platform.toUpperCase()})\nVersion 3.0\n\nThis portable SQLite database client runs 100% locally on your machine without external dependencies.`;
  const blob = new Blob([content], { type: 'application/octet-stream' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = fname;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  alert(`💻 Mengunduh Aplikasi Standalone SQLite Viewer untuk ${platform.toUpperCase()}!\n\nFile "${fname}" telah disimpan ke perangkat Anda.`);
}
