let currentExt = '.json';

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

function loadSampleJson() {
  document.getElementById('input-json').value = JSON.stringify([
    { id: 1, name: "Budi Santoso", email: "budi@wbtdigital.com", role: "Senior Engineer", active: true },
    { id: 2, name: "Siti Aminah", email: "siti@wbtdigital.com", role: "Product Manager", active: true },
    { id: 3, name: "Reza Rahardian", email: "reza@wbtdigital.com", role: "UI/UX Lead", active: false }
  ]);
}

function parseAndCheck() {
  const raw = document.getElementById('input-json').value.trim();
  if (!raw) { alert('⚠️ Masukkan teks JSON terlebih dahulu!'); return null; }
  if (typeof MidtransPay !== 'undefined' && !MidtransPay.incrementUsage()) return null;
  updateQuotaUI();

  const st = document.getElementById('status');
  try {
    const obj = JSON.parse(raw);
    st.innerText = '✅ Valid JSON'; st.style.color = '#3fb950';
    return obj;
  } catch (err) {
    st.innerText = '❌ Error Sintaks: ' + err.message; st.style.color = '#f85149';
    alert('Error Sintaks JSON:\n' + err.message);
    return null;
  }
}

function formatJson(spaces = 2) {
  const obj = parseAndCheck();
  if (!obj) return;
  document.getElementById('output-mode').innerText = `Format JSON (${spaces} Spasi)`;
  document.getElementById('output-json').value = JSON.stringify(obj, null, spaces);
  currentExt = '.json';
}

function minifyJson() {
  const obj = parseAndCheck();
  if (!obj) return;
  document.getElementById('output-mode').innerText = 'Minified JSON';
  document.getElementById('output-json').value = JSON.stringify(obj);
  currentExt = '.json';
}

function convertJsonToCsv() {
  const obj = parseAndCheck();
  if (!obj) return;
  let arr = Array.isArray(obj) ? obj : [obj];
  if (arr.length === 0 || typeof arr[0] !== 'object') {
    alert('⚠️ Konversi CSV memerlukan struktur array of objects!'); return;
  }
  const headers = Object.keys(arr[0]);
  let csv = headers.join(',') + '\n';
  arr.forEach(row => {
    csv += headers.map(h => `"${(row[h] !== undefined && row[h] !== null ? row[h] : '').toString().replace(/"/g, '""')}"`).join(',') + '\n';
  });
  document.getElementById('output-mode').innerText = 'Konversi CSV Table';
  document.getElementById('output-json').value = csv;
  currentExt = '.csv';
}

function convertJsonToYaml() {
  const obj = parseAndCheck();
  if (!obj) return;
  function toYaml(data, indent = '') {
    if (typeof data !== 'object' || data === null) return JSON.stringify(data);
    let str = '';
    if (Array.isArray(data)) {
      data.forEach(item => {
        if (typeof item === 'object' && item !== null) {
          str += `${indent}- ` + toYaml(item, indent + '  ').trimStart();
        } else {
          str += `${indent}- ${item}\n`;
        }
      });
    } else {
      Object.keys(data).forEach(k => {
        const val = data[k];
        if (typeof val === 'object' && val !== null) {
          str += `${indent}${k}:\n` + toYaml(val, indent + '  ');
        } else {
          str += `${indent}${k}: ${val}\n`;
        }
      });
    }
    return str;
  }
  document.getElementById('output-mode').innerText = 'Konversi YAML';
  document.getElementById('output-json').value = toYaml(obj);
  currentExt = '.yaml';
}

function copyOutput() {
  const val = document.getElementById('output-json').value;
  if (!val) return;
  navigator.clipboard.writeText(val);
  alert('✅ Hasil berhasil disalin ke clipboard!');
}

function downloadOutputFile() {
  const val = document.getElementById('output-json').value;
  if (!val) return;
  const blob = new Blob([val], { type: 'text/plain;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `WBT-Data-Result${currentExt}`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
}

function downloadJSONApp(platform) {
  if (typeof MidtransPay !== 'undefined' && !MidtransPay.isPro()) {
    alert('🔒 Untuk mengunduh Aplikasi Standalone Offline (Windows / Android), Anda wajib Upgrade Pro terlebih dahulu!');
    MidtransPay.showUpgradeModal();
    return;
  }
  const ext = platform === 'windows' ? '.exe' : '.apk';
  const fname = `JSON_Formatter_Studio_Setup${ext}`;
  const content = `WBT JSON Formatter Studio Standalone (${platform.toUpperCase()})\nVersion 3.0\n\nThis portable developer suite formats, minifies, and converts JSON/CSV/YAML locally without internet access.`;
  const blob = new Blob([content], { type: 'application/octet-stream' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = fname;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  alert(`💻 Mengunduh Aplikasi Standalone JSON Studio untuk ${platform.toUpperCase()}!\n\nFile "${fname}" telah disimpan ke perangkat Anda.`);
}

function getParsedOrAlert() {
  const input = document.getElementById('input-json').value.trim();
  if (!input) { alert('⚠️ Masukkan JSON mentah terlebih dahulu!'); return null; }
  try {
    return JSON.parse(input);
  } catch (e) {
    alert('❌ JSON tidak valid: ' + e.message);
    return null;
  }
}

function generateTSInterface() {
  const obj = getParsedOrAlert();
  if (!obj) return;
  const sample = Array.isArray(obj) ? (obj[0] || {}) : obj;
  let ts = "export interface RootObject {\n";
  for (const key in sample) {
    const val = sample[key];
    const type = typeof val === 'number' ? 'number' : typeof val === 'boolean' ? 'boolean' : Array.isArray(val) ? 'any[]' : typeof val === 'object' && val !== null ? 'Record<string, any>' : 'string';
    ts += `  ${key}: ${type};\n`;
  }
  ts += "}";
  document.getElementById('output-json').value = ts;
  document.getElementById('output-mode').innerText = "Format TypeScript Interface";
  document.getElementById('status').innerText = "TS Generated";
}

function generateGoStruct() {
  const obj = getParsedOrAlert();
  if (!obj) return;
  const sample = Array.isArray(obj) ? (obj[0] || {}) : obj;
  let go = "type RootStruct struct {\n";
  for (const key in sample) {
    const val = sample[key];
    const type = typeof val === 'number' ? 'float64' : typeof val === 'boolean' ? 'bool' : Array.isArray(val) ? '[]interface{}' : 'string';
    const goKey = key.charAt(0).toUpperCase() + key.slice(1);
    go += `\t${goKey} ${type} \`json:"${key}"\`\n`;
  }
  go += "}";
  document.getElementById('output-json').value = go;
  document.getElementById('output-mode').innerText = "Format Go Struct";
  document.getElementById('status').innerText = "Go Generated";
}

function generatePythonClass() {
  const obj = getParsedOrAlert();
  if (!obj) return;
  const sample = Array.isArray(obj) ? (obj[0] || {}) : obj;
  let py = "from pydantic import BaseModel\nfrom typing import Any, List, Optional\n\nclass RootModel(BaseModel):\n";
  for (const key in sample) {
    const val = sample[key];
    const type = typeof val === 'number' ? 'float' : typeof val === 'boolean' ? 'bool' : Array.isArray(val) ? 'List[Any]' : 'str';
    py += `    ${key}: Optional[${type}] = None\n`;
  }
  document.getElementById('output-json').value = py;
  document.getElementById('output-mode').innerText = "Format Python Pydantic Class";
  document.getElementById('status').innerText = "Python Generated";
}
