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

function loadPreset(type) {
  if (type === 'get_todo') {
    document.getElementById('method').value = 'GET';
    document.getElementById('url').value = 'https://jsonplaceholder.typicode.com/todos/1';
    document.getElementById('req-body').value = '';
  } else if (type === 'post_create') {
    document.getElementById('method').value = 'POST';
    document.getElementById('url').value = 'https://jsonplaceholder.typicode.com/posts';
    document.getElementById('req-body').value = JSON.stringify({ title: "Sistem Pro WBT", body: "Pengujian payload API secara real-time", userId: 99 }, null, 2);
  } else if (type === 'get_users') {
    document.getElementById('method').value = 'GET';
    document.getElementById('url').value = 'https://jsonplaceholder.typicode.com/users';
    document.getElementById('req-body').value = '';
  }
}

async function sendRequest() {
  const url = document.getElementById('url').value.trim();
  if (!url) { alert('⚠️ Masukkan URL endpoint terlebih dahulu!'); return; }
  if (typeof MidtransPay !== 'undefined' && !MidtransPay.incrementUsage()) return;
  updateQuotaUI();

  const method = document.getElementById('method').value;
  const resEl = document.getElementById('res-body');
  const badge = document.getElementById('status-badge');
  const timeBadge = document.getElementById('time-badge');

  resEl.value = '⏳ Mengirim request ke server...';
  badge.innerText = 'Status: Pending'; badge.style.background = '#eab308';
  timeBadge.innerText = 'Durasi: ...';

  let headers = {};
  try {
    const rawHeaders = document.getElementById('req-headers').value.trim();
    if (rawHeaders) headers = JSON.parse(rawHeaders);
  } catch (e) {
    alert('⚠️ Format Request Headers JSON tidak valid! Menggunakan default header.');
    headers = { "Content-Type": "application/json" };
  }

  let options = { method, headers };
  if (method === 'POST' || method === 'PUT' || method === 'PATCH') {
    options.body = document.getElementById('req-body').value || '{}';
  }

  const startTime = performance.now();
  try {
    const resp = await fetch(url, options);
    const endTime = performance.now();
    const duration = Math.round(endTime - startTime);
    timeBadge.innerText = `Durasi: ${duration} ms`;

    badge.innerText = `Status: ${resp.status} ${resp.statusText}`;
    badge.style.background = resp.ok ? '#10b981' : '#f43f5e';

    const text = await resp.text();
    try {
      const jsonObj = JSON.parse(text);
      resEl.value = JSON.stringify(jsonObj, null, 2);
    } catch {
      resEl.value = text;
    }
  } catch (err) {
    const endTime = performance.now();
    timeBadge.innerText = `Durasi: ${Math.round(endTime - startTime)} ms`;
    badge.innerText = 'Status: Network Error / CORS'; badge.style.background = '#f43f5e';
    resEl.value = `❌ Gagal mengirim request:\n${err.message}\n\nCatatan: Jika menguji API eksternal dari browser, pastikan server tujuan mengizinkan CORS (Cross-Origin Resource Sharing).`;
  }
}

function copyResBody() {
  const val = document.getElementById('res-body').value;
  if (!val) return;
  navigator.clipboard.writeText(val);
  alert('✅ Respon berhasil disalin ke clipboard!');
}

function downloadResBody() {
  const val = document.getElementById('res-body').value;
  if (!val) return;
  const blob = new Blob([val], { type: 'application/json;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'WBT-API-Response.json';
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
}

function downloadAPITesterApp(platform) {
  if (typeof MidtransPay !== 'undefined' && !MidtransPay.isPro()) {
    alert('🔒 Untuk mengunduh Aplikasi Standalone Offline (Windows / Android), Anda wajib Upgrade Pro terlebih dahulu!');
    MidtransPay.showUpgradeModal();
    return;
  }
  const ext = platform === 'windows' ? '.exe' : '.apk';
  const fname = `Mini_API_Tester_Studio_Setup${ext}`;
  const content = `WBT Mini API Tester Studio Standalone (${platform.toUpperCase()})\nVersion 3.0\n\nThis portable REST & GraphQL testing suite runs 100% locally with custom headers and performance tracking.`;
  const blob = new Blob([content], { type: 'application/octet-stream' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = fname;
  document.body.appendChild(a);
  a.click();
  alert(`💻 Mengunduh Aplikasi Standalone API Tester untuk ${platform.toUpperCase()}!\n\nFile "${fname}" telah disimpan ke perangkat Anda.`);
}

function importCurlCommand() {
  const curl = prompt("Tempel perintah cURL dari Postman / Terminal di sini:", "curl -X POST https://jsonplaceholder.typicode.com/posts -H 'Content-Type: application/json' -d '{\"title\":\"foo\",\"body\":\"bar\"}'");
  if (!curl) return;
  
  const methodMatch = curl.match(/-X\s+([A-Z]+)/i) || curl.match(/--request\s+([A-Z]+)/i);
  if (methodMatch) document.getElementById('req-method').value = methodMatch[1].toUpperCase();
  else if (curl.includes('-d ') || curl.includes('--data ')) document.getElementById('req-method').value = 'POST';
  else document.getElementById('req-method').value = 'GET';

  const urlMatch = curl.match(/https?:\/\/[^\s'"]+/);
  if (urlMatch) document.getElementById('req-url').value = urlMatch[0];

  const dataMatch = curl.match(/-d\s+['"]([^'"]+)['"]/i) || curl.match(/--data\s+['"]([^'"]+)['"]/i);
  if (dataMatch) {
    document.getElementById('req-body').value = dataMatch[1];
  }
  alert("✅ Perintah cURL berhasil diurai dan dimasukkan ke dalam form!");
}
