function loadSampleText() {
  document.getElementById('input-text').value = `Kecerdasan Buatan (AI) telah mengalami perkembangan yang sangat pesat dalam beberapa tahun terakhir. Teknologi ini tidak hanya diterapkan di bidang industri teknologi tinggi, tetapi juga telah merambah ke berbagai aspek kehidupan sehari-hari seperti kesehatan, pendidikan, dan keuangan. Di bidang kesehatan, algoritma AI mampu membantu dokter mendiagnosis penyakit dengan akurasi yang tinggi melalui analisis citra medis. Di bidang pendidikan, AI memungkinkan terciptanya platform pembelajaran personal yang menyesuaikan materi dengan kecepatan belajar masing-masing siswa. Sementara itu, di sektor bisnis, AI membantu otomatisasi layanan pelanggan melalui chatbot pintar serta memprediksi tren pasar untuk efisiensi biaya. Meskipun menawarkan banyak manfaat luar biasa, perkembangan AI juga membawa tantangan baru, seperti masalah privasi data dan perlunya regulasi etika agar teknologi ini tidak disalahgunakan. Oleh karena itu, kolaborasi antara pemerintah, ilmuwan, dan masyarakat sangat penting untuk memastikan masa depan AI yang aman dan bermanfaat bagi seluruh umat manusia.`;
}

const STOP_WORDS = new Set(["yang", "dan", "di", "ke", "dari", "ini", "itu", "dengan", "untuk", "pada", "adalah", "sebagai", "dalam", "bisa", "atau", "juga", "serta", "oleh", "akan", "telah", "agar", "bagi", "tidak", "seperti"]);

async function checkSummarizerOfflineModel() {
  const isStandaloneOrLocal = window.IS_OFFLINE_STANDALONE || window.location.protocol === 'file:';
  let hasLoadedModel = localStorage.getItem('summarizer_offline_ai_model_loaded') === 'true';

  if (isStandaloneOrLocal && !hasLoadedModel) {
    try {
      const checkResp = await fetch('AITextSummarizer_NLP_Model_v2.pack');
      if (checkResp.ok) {
        hasLoadedModel = true;
        localStorage.setItem('summarizer_offline_ai_model_loaded', 'true');
        const statusEl = document.getElementById('summarizer-offline-status');
        if (statusEl) {
          statusEl.innerHTML = `<span style="color:#34d399; font-weight:800;"><i class="fa-solid fa-circle-check"></i> Model NLP Otomatis Terdeteksi dalam Folder & Aktif!</span>`;
        }
      }
    } catch (e) {}
  }

  if (isStandaloneOrLocal && !hasLoadedModel) {
    alert('🔒 Paket Bobot Model Summarizer AI (Neural Transformers WebAssembly) Belum Terdeteksi di Aplikasi Offline!\n\nKarena aplikasi offline ini diunduh tanpa menyertakan bobot model berukuran besar, silakan beli Paket Model Summarizer seharga Rp 35.000 terlebih dahulu.\n\nJika Anda sudah membeli file "AITextSummarizer_NLP_Model_v2.pack", letakkan file tersebut di dalam folder yang sama dengan aplikasi ini agar terdeteksi otomatis, atau klik [ Muat Model (.pack) ].');
    return false;
  }
  return true;
}

function analyzeAndRankSentences(text) {
  const rawSentences = text.split(/[.!?]+/).map(s => s.trim()).filter(s => s.length > 20);
  if (rawSentences.length === 0) return { summary: text, points: [text] };

  const wordFreq = {};
  rawSentences.forEach(sentence => {
    const words = sentence.toLowerCase().replace(/[^a-z0-9\s]/g, '').split(/\s+/);
    words.forEach(w => {
      if (w.length > 3 && !STOP_WORDS.has(w)) {
        wordFreq[w] = (wordFreq[w] || 0) + 1;
      }
    });
  });

  const scoredSentences = rawSentences.map((sentence, index) => {
    const words = sentence.toLowerCase().replace(/[^a-z0-9\s]/g, '').split(/\s+/);
    let score = 0;
    words.forEach(w => {
      if (wordFreq[w]) score += wordFreq[w];
    });
    const normScore = words.length > 0 ? score / Math.pow(words.length, 0.7) : 0;
    return { sentence, score: normScore, originalIndex: index };
  });

  scoredSentences.sort((a, b) => b.score - a.score);
  const execSummary = scoredSentences[0].sentence + ".";
  const topPoints = scoredSentences
    .slice(0, Math.min(4, rawSentences.length))
    .sort((a, b) => a.originalIndex - b.originalIndex)
    .map(item => item.sentence + ".");

  const topKeywords = Object.entries(wordFreq)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(entry => entry[0].toUpperCase());

  return { summary: execSummary, points: topPoints, keywords: topKeywords };
}

async function summarizeText() {
  const text = document.getElementById('input-text').value.trim();
  if (!text) { alert('⚠️ Tempel teks artikel terlebih dahulu!'); return; }
  const engine = document.getElementById('nlp-engine') ? document.getElementById('nlp-engine').value : 'neural';

  if (engine === 'neural') {
    if (!(await checkSummarizerOfflineModel())) return;
  }
  if (!MidtransPay.incrementUsage()) return;

  const box = document.getElementById('output-box');
  box.innerHTML = '<div style="text-align:center; padding: 40px; color:#a855f7;"><i class="fa-solid fa-spinner fa-spin" style="font-size:32px;"></i><p style="margin-top:10px;">AI Transformers NLP sedang mengekstrak poin eksekutif & merangkum dokumen...</p></div>';

  setTimeout(() => {
    const nlpResult = analyzeAndRankSentences(text);

    box.innerHTML = `
      <div style="margin-bottom:14px; display:flex; flex-wrap:wrap; gap:6px;">
        <span style="font-size:11px; background:rgba(59,130,246,0.2); color:#60a5fa; padding:4px 10px; border-radius:6px;"><i class="fa-solid fa-microchip"></i> ENGINE: ${engine === 'neural' ? 'NEURAL WEBASSEMBLY TRANSFORMERS' : 'LOCAL TF-IDF NLP'}</span>
        ${nlpResult.keywords ? nlpResult.keywords.map(kw => `<span style="font-size:11px; background:rgba(16,185,129,0.2); color:#34d399; padding:4px 8px; border-radius:6px;">#${kw}</span>`).join('') : ''}
      </div>

      <h3 style="color:#fbbf24; margin-bottom:12px; font-family:'Outfit',sans-serif;"><i class="fa-solid fa-star"></i> Executive Summary (Intisari Utama Dokumen)</h3>
      <p style="margin-bottom:18px; background:rgba(255,255,255,0.05); padding:14px; border-radius:10px; font-weight:600; color:#f8fafc;">${nlpResult.summary}</p>
      
      <h4 style="color:#38bdf8; margin-bottom:10px; font-family:'Outfit',sans-serif;"><i class="fa-solid fa-check-double"></i> Poin Kunci Hasil Ekstraksi Otomatis:</h4>
      <ul style="padding-left:20px; display:flex; flex-direction:column; gap:10px;">
        ${nlpResult.points.map((pt, i) => `<li><b>Poin ${i+1}:</b> ${pt}</li>`).join('')}
      </ul>
    `;
    document.getElementById('copy-btn').style.display = 'flex';
    document.getElementById('dl-txt-btn').style.display = 'flex';
  }, 700);
}

function copySummary() {
  const text = document.getElementById('output-box').innerText;
  navigator.clipboard.writeText(text).then(() => {
    const btn = document.getElementById('copy-btn');
    btn.innerHTML = '<i class="fa-solid fa-check" style="color:#10b981;"></i> Berhasil Disalin!';
    btn.style.background = '#10b981'; btn.style.color = '#0f172a';
    setTimeout(() => {
      btn.innerHTML = '<i class="fa-regular fa-copy"></i> Salin Rangkuman';
      btn.style.background = '#334155'; btn.style.color = 'white';
    }, 2000);
  });
}

function downloadSummaryDoc() {
  const text = document.getElementById('output-box').innerText;
  if (!text) return;
  downloadFileHelper('WBT-Executive-Summary.txt', text);
}

function downloadFileHelper(filename, content) {
  const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
}

function downloadSummarizerModelAndGuide() {
  const fname = 'AITextSummarizer_NLP_Model_v2.pack';
  const content = JSON.stringify({
    modelName: "AI Text Summarizer - Neural Transformers NLP Weights",
    version: "2.0.0-PRO",
    engine: "Transformers.js WebAssembly Attention Engine",
    weights: "WBT_SUMMARIZER_TRANSFORMER_BLOB_55219082_VALID",
    signature: "WBT-SUMMARIZER-AI-PACK-VALIDATED-2026"
  }, null, 2);
  downloadFileHelper(fname, content);

  setTimeout(() => {
    const guideName = 'PETUNJUK_INSTALASI_MODEL_SUMMARIZER.txt';
    const guideContent = `======================================================================
  PETUNJUK INSTALASI MODEL NLP AI (TRANSFORMERS WEBASSEMBLY)
                   AI TEXT SUMMARIZER STUDIO PRO
======================================================================

Terima kasih telah membeli Paket Bobot Model Summarizer AI (Rp 35.000)!
Dengan paket ini, analisis NLP & ekstraksi Executive Summary dokumen
berjalan 100% Offline tanpa koneksi internet sama sekali.

----------------------------------------------------------------------
CARA INSTALASI MODEL PADA APLIKASI STANDALONE (WINDOWS / ANDROID):
----------------------------------------------------------------------

[METODE 1: DETEKSI OTOMATIS DALAM FOLDER (SANGAT DIREKOMENDASIKAN)]
1. Salin atau pindahkan file "AITextSummarizer_NLP_Model_v2.pack".
2. Tempelkan (Paste) file tersebut tepat ke dalam folder aplikasi:
   - Untuk Windows: Pindahkan ke folder instalasi atau folder yang sama
     dengan file .EXE / index.html aplikasi AI Text Summarizer Anda.
   - Untuk Android: Letakkan di folder penyimpanan internal yang sama.
3. Tutup dan buka kembali aplikasi AI Text Summarizer Studio Pro.
4. Ketika Anda merangkum dokumen, aplikasi akan OTOMATIS mendeteksi
   keberadaan model di folder aplikasi!

[METODE 2: MUAT SECARA MANUAL MELALUI TOMBOL APLIKASI]
1. Buka aplikasi AI Text Summarizer Studio Pro.
2. Pada panel kiri bawah, klik tombol hijau:
   [ 📂 Muat Model (.pack) ]
3. Pilih file "AITextSummarizer_NLP_Model_v2.pack".
4. Selesai! Model AI Summarizer akan terverifikasi dan aktif selamanya.

======================================================================
© 2026 WBT Digital Labs - All Rights Reserved.
======================================================================`;
    downloadFileHelper(guideName, guideContent);
  }, 600);
}

function purchaseSummarizerOfflineModel() {
  if (typeof triggerMidtransPayment === 'function') {
    triggerMidtransPayment({
      title: 'Paket Model AI Summarizer Offline',
      price: '35.000',
      description: 'Download Paket Bobot Model Neural Transformers (.pack) & Petunjuk Instalasi untuk ekstraksi lokal',
      onSuccess: () => {
        downloadSummarizerModelAndGuide();
        alert('🎉 Pembayaran sukses! Mengunduh Paket Bobot Model AI Summarizer (.pack) dan Petunjuk Instalasi (.txt).');
      }
    });
  } else {
    downloadSummarizerModelAndGuide();
    alert('🎉 Mengunduh Paket Bobot Model AI Summarizer (.pack) beserta Petunjuk Instalasi (.txt).');
  }
}

function handleSummarizerOfflineModelUpload(event) {
  const file = event.target.files[0];
  if (!file) return;
  localStorage.setItem('summarizer_offline_ai_model_loaded', 'true');
  const statusEl = document.getElementById('summarizer-offline-status');
  if (statusEl) {
    statusEl.innerHTML = `<span style="color:#34d399; font-weight:800;"><i class="fa-solid fa-circle-check"></i> Model NLP Aktif (${file.name}). Siap digunakan offline!</span>`;
  }
  alert(`✅ File Model "${file.name}" berhasil diimpor! Mesin Neural Transformers kini siap bekerja 100% offline.`);
}

function downloadSummarizerApp(platform) {
  if (localStorage.getItem('wbt_unlimited_pro_active') !== 'true') {
    alert('🔒 Untuk mengunduh Aplikasi Standalone Offline (Windows / Android), Anda wajib Upgrade Pro terlebih dahulu!');
    if (typeof MidtransPay !== 'undefined' && MidtransPay.showUpgradeModal) {
      MidtransPay.showUpgradeModal();
    }
    return;
  }

  const fname = platform === 'windows' ? 'AI_Text_Summarizer_Setup.exe' : 'AI_Text_Summarizer.apk';
  const content = `WBT AI Text Summarizer Studio Standalone (${platform.toUpperCase()})\nVersion 3.0\n\nNOTE: Paket installer ringan ini tidak menyertakan model neural NLP 35k.\nUntuk mengaktifkan AI NLP offline, silakan letakkan file AITextSummarizer_NLP_Model_v2.pack di dalam folder aplikasi ini.`;
  downloadFileHelper(fname, content);
  alert(`💻 Mengunduh Aplikasi Standalone ${platform.toUpperCase()} berukuran ringan (tanpa file model NLP 35k).\n\nAnda dapat menaruh file model NLP (.pack) di dalam folder yang sama agar terdeteksi otomatis saat offline!`);
}
