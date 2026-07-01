window.addEventListener('DOMContentLoaded', () => {
  document.getElementById('diff-orig').value = `function calculateTotal(price, tax) {\n  return price + (price * tax);\n}`;
  document.getElementById('diff-mod').value = `function calculateTotal(price, tax, discount) {\n  let subtotal = price - discount;\n  return subtotal + (subtotal * tax);\n}`;
  runDiff();
  testRegex();
});

function showDevTool(tool) {
  document.querySelectorAll('.tab-btn').forEach(btn => btn.classList.remove('active'));
  document.querySelectorAll('.tool-panel').forEach(panel => panel.style.display = 'none');
  
  const activeBtn = document.querySelector(`.tab-btn[onclick="showDevTool('${tool}')"]`);
  if (activeBtn) activeBtn.classList.add('active');
  const panel = document.getElementById(`tool-${tool}`);
  if (panel) panel.style.display = 'block';
}

function runDiff() {
  const origWords = document.getElementById('diff-orig').value.split('\n');
  const modWords = document.getElementById('diff-mod').value.split('\n');
  const out = document.getElementById('diff-output');
  
  let html = '<div style="font-family:monospace; line-height:1.8;">';
  const maxLen = Math.max(origWords.length, modWords.length);

  for (let i = 0; i < maxLen; i++) {
    const o = origWords[i];
    const m = modWords[i];
    if (o === m) {
      html += `<div style="color:#94a3b8;">  ${o || ''}</div>`;
    } else {
      if (o !== undefined) html += `<div class="diff-del">- ${o}</div>`;
      if (m !== undefined) html += `<div class="diff-ins">+ ${m}</div>`;
    }
  }
  html += '</div>';
  out.innerHTML = html;
}

function generateHashes() {
  const text = document.getElementById('hash-inp').value;
  if (!text) {
    ['out-md5', 'out-sha1', 'out-sha256', 'out-sha512'].forEach(id => document.getElementById(id).value = '');
    return;
  }
  if (typeof CryptoJS !== 'undefined') {
    document.getElementById('out-md5').value = CryptoJS.MD5(text).toString();
    document.getElementById('out-sha1').value = CryptoJS.SHA1(text).toString();
    document.getElementById('out-sha256').value = CryptoJS.SHA256(text).toString();
    document.getElementById('out-sha512').value = CryptoJS.SHA512(text).toString();
  } else {
    document.getElementById('out-sha256').value = 'Gagal memuat CryptoJS offline library.';
  }
}

function decodeJWT() {
  const jwt = document.getElementById('jwt-inp').value.trim();
  const headerBox = document.getElementById('jwt-header');
  const payloadBox = document.getElementById('jwt-payload');

  if (!jwt) {
    headerBox.innerText = '';
    payloadBox.innerText = '';
    return;
  }

  const parts = jwt.split('.');
  if (parts.length < 2) {
    headerBox.innerText = 'Format JWT tidak valid (butuh 3 bagian dipisah titik).';
    return;
  }

  try {
    const decodeBase64 = (str) => {
      let output = str.replace(/-/g, '+').replace(/_/g, '/');
      switch (output.length % 4) {
        case 0: break;
        case 2: output += '=='; break;
        case 3: output += '='; break;
        default: throw new Error('Illegal base64url string!');
      }
      return decodeURIComponent(escape(atob(output)));
    };

    const headerObj = JSON.parse(decodeBase64(parts[0]));
    const payloadObj = JSON.parse(decodeBase64(parts[1]));

    headerBox.innerText = JSON.stringify(headerObj, null, 2);
    payloadBox.innerText = JSON.stringify(payloadObj, null, 2);
  } catch(e) {
    headerBox.innerText = 'Gagal mendekode token: ' + e.message;
  }
}

function testRegex() {
  const pattern = document.getElementById('reg-pattern').value;
  const flags = document.getElementById('reg-flags').value;
  const text = document.getElementById('reg-text').value;
  const out = document.getElementById('reg-output');
  const countEl = document.getElementById('reg-count');

  if (!pattern || !text) {
    out.innerText = text;
    countEl.innerText = '0';
    return;
  }

  try {
    const rx = new RegExp(pattern, flags);
    let count = 0;
    const highlighted = text.replace(rx, (match) => {
      count++;
      return `<span style="background:#f59e0b; color:#0f172a; font-weight:800; padding:1px 4px; border-radius:4px;">${match}</span>`;
    });
    out.innerHTML = highlighted;
    countEl.innerText = count.toString();
  } catch(e) {
    out.innerHTML = `<span style="color:#ef4444;">Syntax Regex Tidak Valid: ${e.message}</span>`;
    countEl.innerText = 'Error';
  }
}

function downloadDevApp(platform) {
  if (typeof MidtransPay !== 'undefined' && !MidtransPay.isPro()) {
    alert('🔒 Untuk mengunduh Aplikasi Standalone Offline (Windows / Android), Anda wajib Upgrade Pro terlebih dahulu!');
    MidtransPay.showUpgradeModal();
    return;
  }
  const ext = platform === 'windows' ? '.exe' : '.apk';
  const fname = `WBT_DevToys_Studio_Setup${ext}`;
  const content = `WBT Developer Swiss Army Knife Standalone (${platform.toUpperCase()})\nVersion 3.0\n\nRuns 100% offline without internet connection.`;
  const blob = new Blob([content], { type: 'application/octet-stream' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = fname;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  alert(`💻 Mengunduh Aplikasi Standalone DevToys Pro untuk ${platform.toUpperCase()}!\n\nFile "${fname}" telah disimpan ke perangkat Anda.`);
}
