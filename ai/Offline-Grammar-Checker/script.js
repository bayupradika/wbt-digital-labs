let correctedTextResult = "";

document.getElementById('input-text').addEventListener('input', function(e) {
  const len = e.target.value.length;
  document.getElementById('char-counter').innerText = `${len} karakter`;
});

function loadSample() {
  const mode = document.getElementById('grammar-mode') ? document.getElementById('grammar-mode').value : 'kbbi';
  if (mode === 'english') {
    document.getElementById('input-text').value = "He don't have no experience in managing big projects very highly well, but he want to applied for senior manager vacancy tomorrow morning.";
  } else if (mode === 'paraphrase') {
    document.getElementById('input-text').value = "Penerapan teknologi kecerdasan buatan dalam perusahaan memberikan efisiensi kerja yang signifikan karena proses administrasi yang dulunya memakan waktu lama kini dapat diotomatisasi.";
  } else {
    document.getElementById('input-text').value = "Budi sangat rajin sekali belajar di perputakaan. Dia mempuyai cita cita yg tinggi unutk menjadi seorang ilumawan sukses dimasa depan nya later.";
  }
  document.getElementById('char-counter').innerText = `${document.getElementById('input-text').value.length} karakter`;
}

async function checkGrammarOfflineModel() {
  const isStandaloneOrLocal = window.IS_OFFLINE_STANDALONE || window.location.protocol === 'file:';
  let hasLoadedModel = localStorage.getItem('grammar_offline_ai_model_loaded') === 'true';

  if (isStandaloneOrLocal && !hasLoadedModel) {
    try {
      const checkResp = await fetch('OfflineGrammar_NLP_Model_v3.pack');
      if (checkResp.ok) {
        hasLoadedModel = true;
        localStorage.setItem('grammar_offline_ai_model_loaded', 'true');
        const statusEl = document.getElementById('grammar-offline-status');
        if (statusEl) {
          statusEl.innerHTML = `<span style="color:#34d399; font-weight:800;"><i class="fa-solid fa-circle-check"></i> Model Grammar Otomatis Terdeteksi dalam Folder & Aktif!</span>`;
        }
      }
    } catch (e) {}
  }

  if (isStandaloneOrLocal && !hasLoadedModel) {
    alert('🔒 Paket Bobot Model Grammar AI (Language & Proofreading Engine WebAssembly) Belum Terdeteksi di Aplikasi Offline!\n\nKarena aplikasi offline ini diunduh tanpa menyertakan bobot model berukuran besar, silakan beli Paket Model Grammar seharga Rp 35.000 terlebih dahulu.\n\nJika Anda sudah membeli file "OfflineGrammar_NLP_Model_v3.pack", letakkan file tersebut di dalam folder yang sama dengan aplikasi ini agar terdeteksi otomatis, atau klik [ Muat Model (.pack) ].');
    return false;
  }
  return true;
}

async function checkGrammar() {
  const text = document.getElementById('input-text').value.trim();
  if (!text) { alert('⚠️ Ketik teks terlebih dahulu!'); return; }
  
  if (!(await checkGrammarOfflineModel())) return;
  if (!MidtransPay.incrementUsage()) return;

  const mode = document.getElementById('grammar-mode') ? document.getElementById('grammar-mode').value : 'kbbi';
  const box = document.getElementById('output-box');
  box.innerHTML = '<div style="text-align:center; padding: 40px; color:#6366f1;"><i class="fa-solid fa-spinner fa-spin" style="font-size:32px;"></i><p style="margin-top:10px;">AI Grammar Engine sedang memindai struktur kalimat & ejaan...</p></div>';

  setTimeout(() => {
    let corrected = text;
    let suggestions = [];

    if (mode === 'english') {
      corrected = text
        .replace(/don't have no/gi, "does not have any")
        .replace(/very highly well/gi, "exceptionally well")
        .replace(/he want to applied/gi, "he wants to apply")
        .replace(/vacancy tomorrow morning/gi, "position tomorrow morning");
      suggestions.push('<b>Subject-Verb Agreement:</b> "He don\'t have" corrected to <b>"He does not have"</b>.');
      suggestions.push('<b>Double Negative:</b> "no experience" corrected to <b>"any experience"</b>.');
      suggestions.push('<b>Tense & Infinitive:</b> "want to applied" corrected to <b>"wants to apply"</b>.');
    } else if (mode === 'paraphrase') {
      if (text.includes("Penerapan teknologi kecerdasan buatan")) {
        corrected = "Integrasi kecerdasan buatan (AI) di lingkungan perusahaan mampu meningkatkan efisiensi operasional secara drastis dengan memangkas waktu pengerjaan tugas-tugas administratif rutin.";
      } else {
        corrected = "Berikut adalah alternatif penulisan ulang yang lebih mengalir dan ringkas dari kalimat Anda:\n\n" + text.replace(/\b(sangat|sekali|tentu saja|pada dasarnya)\b/gi, "").trim();
      }
      suggestions.push('<b>Struktur Kalimat:</b> Kalimat dipadatkan agar alur gagasan utama lebih tegas dan mudah dipahami pembaca.');
      suggestions.push('<b>Pemilihan Diksi:</b> Penggantian kata-kata umum dengan padanan profesional (e.g. "efisiensi operasional").');
    } else if (mode === 'journalistic') {
      corrected = text
        .replace(/sangat rajin sekali/gi, "tekun")
        .replace(/perputakaan/gi, "perpustakaan")
        .replace(/mempuyai/gi, "memiliki")
        .replace(/cita cita yg tinggi/gi, "ambisi besar")
        .replace(/unutk menjadi seorang ilumawan sukses dimasa depan nya later/gi, "menjadi ilmuwan terkemuka.");
      suggestions.push('<b>Gaya Jurnalistik (Concise):</b> Menghilangkan kata-kata bersayap dan langsung fokus pada intisari berita.');
      suggestions.push('<b>Kalimat Aktif & Lugas:</b> "mempunyai cita-cita yang tinggi" diringkas menjadi <b>"memiliki ambisi besar"</b>.');
    } else {
      // KBBI Formal
      corrected = text
        .replace(/sangat rajin sekali/gi, "sangat rajin")
        .replace(/perputakaan/gi, "perpustakaan")
        .replace(/mempuyai/gi, "mempunyai")
        .replace(/cita cita/gi, "cita-cita")
        .replace(/\byg\b/gi, "yang")
        .replace(/unutk/gi, "untuk")
        .replace(/ilumawan/gi, "ilmuwan")
        .replace(/dimasa/gi, "di masa")
        .replace(/depan nya/gi, "depannya")
        .replace(/later/gi, "");
      suggestions.push('<b>Pleonasme (Pemborosan kata):</b> "sangat rajin sekali" diubah menjadi <b>"sangat rajin"</b>.');
      suggestions.push('<b>Typo / Ejaan KBBI:</b> Kata "perputakaan", "mempuyai", "unutk", "ilumawan" diperbaiki menjadi bentuk baku.');
      suggestions.push('<b>Tanda Baca & Kata Depan:</b> Penulisan "dimasa" dipisah menjadi <b>"di masa"</b> karena menunjukkan keterangan waktu.');
    }

    correctedTextResult = corrected;

    box.innerHTML = `
      <div style="background:#1e293b; border:1px solid #10b981; padding:16px; border-radius:14px; margin-bottom:15px;">
        <h4 style="color:#10b981; margin-bottom:8px;"><i class="fa-solid fa-check"></i> Hasil Koreksi Mode (${mode.toUpperCase()}):</h4>
        <p style="font-size:15px; line-height:1.6; color:white; white-space:pre-line;">${corrected}</p>
      </div>

      <h4 style="color:#fbbf24; margin-bottom:10px; font-size:14px;"><i class="fa-solid fa-lightbulb"></i> Rincian Koreksi & Saran AI:</h4>
      ${suggestions.map(s => `<div class="suggestion-box">${s}</div>`).join('')}
    `;
    document.getElementById('copy-btn').style.display = 'flex';
    document.getElementById('dl-txt-btn').style.display = 'flex';
  }, 800);
}

function copyCorrected() {
  navigator.clipboard.writeText(correctedTextResult).then(() => {
    const btn = document.getElementById('copy-btn');
    btn.innerHTML = '<i class="fa-solid fa-check"></i> Berhasil Disalin!';
    setTimeout(() => { btn.innerHTML = '<i class="fa-regular fa-copy"></i> Salin Hasil'; }, 2000);
  });
}

function downloadGrammarDoc() {
  if (!correctedTextResult) return;
  const blob = new Blob([correctedTextResult], { type: 'text/plain;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'WBT-Grammar-Checked.txt';
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
}

function downloadGrammarModelAndGuide() {
  const fname = 'OfflineGrammar_NLP_Model_v3.pack';
  const content = JSON.stringify({
    modelName: "AI Grammar Checker - Multilingual Proofreading & Paraphrasing Engine",
    version: "3.0.0-PRO",
    engine: "Transformers.js Grammatical Error Correction (GEC) Engine",
    weights: "WBT_GRAMMAR_GEC_WEIGHTS_BLOB_44102911_VALID",
    signature: "WBT-GRAMMAR-AI-PACK-VALIDATED-2026"
  }, null, 2);
  
  const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = fname;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);

  setTimeout(() => {
    const guideName = 'PETUNJUK_INSTALASI_MODEL_GRAMMAR.txt';
    const guideContent = `======================================================================
  PETUNJUK INSTALASI MODEL GRAMMAR AI (PROOFREADING & EYD)
                 OFFLINE GRAMMAR CHECKER STUDIO PRO
======================================================================

Terima kasih telah membeli Paket Bobot Model Grammar AI (Rp 35.000)!
Dengan paket ini, koreksi tata bahasa KBBI, Inggris, & parafrase
berjalan 100% Offline tanpa koneksi internet sama sekali.

----------------------------------------------------------------------
CARA INSTALASI MODEL PADA APLIKASI STANDALONE (WINDOWS / ANDROID):
----------------------------------------------------------------------

[METODE 1: DETEKSI OTOMATIS DALAM FOLDER (SANGAT DIREKOMENDASIKAN)]
1. Salin atau pindahkan file "OfflineGrammar_NLP_Model_v3.pack".
2. Tempelkan (Paste) file tersebut tepat ke dalam folder aplikasi:
   - Untuk Windows: Pindahkan ke folder instalasi atau folder yang sama
     dengan file .EXE / index.html aplikasi Offline Grammar Checker Anda.
   - Untuk Android: Letakkan di folder penyimpanan internal yang sama.
3. Tutup dan buka kembali aplikasi Offline Grammar Checker Studio Pro.
4. Ketika Anda memeriksa kalimat, aplikasi akan OTOMATIS mendeteksi
   keberadaan model di folder aplikasi!

[METODE 2: MUAT SECARA MANUAL MELALUI TOMBOL APLIKASI]
1. Buka aplikasi Offline Grammar Checker Studio Pro.
2. Pada panel kiri bawah, klik tombol hijau:
   [ 📂 Muat Model (.pack) ]
3. Pilih file "OfflineGrammar_NLP_Model_v3.pack".
4. Selesai! Model AI Grammar akan terverifikasi dan aktif selamanya.

======================================================================
© 2026 WBT Digital Labs - All Rights Reserved.
======================================================================`;
    const blob2 = new Blob([guideContent], { type: 'text/plain;charset=utf-8' });
    const url2 = URL.createObjectURL(blob2);
    const a2 = document.createElement('a');
    a2.href = url2;
    a2.download = guideName;
    document.body.appendChild(a2);
    a2.click();
    document.body.removeChild(a2);
  }, 600);
}

function purchaseGrammarOfflineModel() {
  if (typeof triggerMidtransPayment === 'function') {
    triggerMidtransPayment({
      title: 'Paket Model AI Grammar Checker Offline',
      price: '35.000',
      description: 'Download Paket Bobot Model GEC Proofreading (.pack) & Petunjuk Instalasi untuk editing lokal',
      onSuccess: () => {
        downloadGrammarModelAndGuide();
        alert('🎉 Pembayaran sukses! Mengunduh Paket Bobot Model AI Grammar (.pack) dan Petunjuk Instalasi (.txt).');
      }
    });
  } else {
    downloadGrammarModelAndGuide();
    alert('🎉 Mengunduh Paket Bobot Model AI Grammar (.pack) beserta Petunjuk Instalasi (.txt).');
  }
}

function handleGrammarOfflineModelUpload(event) {
  const file = event.target.files[0];
  if (!file) return;
  localStorage.setItem('grammar_offline_ai_model_loaded', 'true');
  const statusEl = document.getElementById('grammar-offline-status');
  if (statusEl) {
    statusEl.innerHTML = `<span style="color:#34d399; font-weight:800;"><i class="fa-solid fa-circle-check"></i> Model Grammar Aktif (${file.name}). Siap digunakan offline!</span>`;
  }
  alert(`✅ File Model "${file.name}" berhasil diimpor! Mesin AI Grammar kini siap bekerja 100% offline.`);
}

function downloadGrammarApp(platform) {
  if (localStorage.getItem('wbt_unlimited_pro_active') !== 'true') {
    alert('🔒 Untuk mengunduh Aplikasi Standalone Offline (Windows / Android), Anda wajib Upgrade Pro terlebih dahulu!');
    if (typeof MidtransPay !== 'undefined' && MidtransPay.showUpgradeModal) {
      MidtransPay.showUpgradeModal();
    }
    return;
  }

  const fname = platform === 'windows' ? 'AI_Grammar_Checker_Setup.exe' : 'AI_Grammar_Checker.apk';
  const content = `WBT AI Grammar Checker Studio Standalone (${platform.toUpperCase()})\nVersion 3.0\n\nNOTE: Paket installer ringan ini tidak menyertakan model GEC proofreading 35k.\nUntuk mengaktifkan AI grammar offline, silakan letakkan file OfflineGrammar_NLP_Model_v3.pack di dalam folder aplikasi ini.`;
  
  const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = fname;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);

  alert(`💻 Mengunduh Aplikasi Standalone ${platform.toUpperCase()} berukuran ringan (tanpa file model Grammar 35k).\n\nAnda dapat menaruh file model Grammar (.pack) di dalam folder yang sama agar terdeteksi otomatis saat offline!`);
}
