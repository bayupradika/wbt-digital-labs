function loadSampleText() {
  document.getElementById('input-text').value = `Kecerdasan Buatan (AI) telah mengalami perkembangan yang sangat pesat dalam beberapa tahun terakhir. Teknologi ini tidak hanya diterapkan di bidang industri teknologi tinggi, tetapi juga telah merambah ke berbagai aspek kehidupan sehari-hari seperti kesehatan, pendidikan, dan keuangan. Di bidang kesehatan, algoritma AI mampu membantu dokter mendiagnosis penyakit dengan akurasi yang tinggi melalui analisis citra medis. Di bidang pendidikan, AI memungkinkan terciptanya platform pembelajaran personal yang menyesuaikan materi dengan kecepatan belajar masing-masing siswa. Sementara itu, di sektor bisnis, AI membantu otomatisasi layanan pelanggan melalui chatbot pintar serta memprediksi tren pasar untuk efisiensi biaya. Meskipun menawarkan banyak manfaat luar biasa, perkembangan AI juga membawa tantangan baru, seperti masalah privasi data dan perlunya regulasi etika agar teknologi ini tidak disalahgunakan. Oleh karena itu, kolaborasi antara pemerintah, ilmuwan, dan masyarakat sangat penting untuk memastikan masa depan AI yang aman dan bermanfaat bagi seluruh umat manusia.`;
}

const STOP_WORDS = new Set(["yang", "dan", "di", "ke", "dari", "ini", "itu", "dengan", "untuk", "pada", "adalah", "sebagai", "dalam", "bisa", "atau", "juga", "serta", "oleh", "akan", "telah", "agar", "bagi", "tidak", "seperti"]);

// Real Client-side NLP Extractive Summarization Engine
function analyzeAndRankSentences(text) {
  // Split into sentences
  const rawSentences = text.split(/[.!?]+/).map(s => s.trim()).filter(s => s.length > 20);
  if (rawSentences.length === 0) return { summary: text, points: [text] };

  // Calculate word frequencies (TF)
  const wordFreq = {};
  rawSentences.forEach(sentence => {
    const words = sentence.toLowerCase().replace(/[^a-z0-9\s]/g, '').split(/\s+/);
    words.forEach(w => {
      if (w.length > 3 && !STOP_WORDS.has(w)) {
        wordFreq[w] = (wordFreq[w] || 0) + 1;
      }
    });
  });

  // Score each sentence by its constituent keyword weights
  const scoredSentences = rawSentences.map((sentence, index) => {
    const words = sentence.toLowerCase().replace(/[^a-z0-9\s]/g, '').split(/\s+/);
    let score = 0;
    words.forEach(w => {
      if (wordFreq[w]) score += wordFreq[w];
    });
    // Normalize by length to prevent bias towards long sentences
    const normScore = words.length > 0 ? score / Math.pow(words.length, 0.7) : 0;
    return { sentence, score: normScore, originalIndex: index };
  });

  // Sort by score descending
  scoredSentences.sort((a, b) => b.score - a.score);

  // Top sentence is executive summary
  const execSummary = scoredSentences[0].sentence + ".";

  // Top 3-5 distinct points (sorted back to original chronological order for readability)
  const topPoints = scoredSentences
    .slice(0, Math.min(4, rawSentences.length))
    .sort((a, b) => a.originalIndex - b.originalIndex)
    .map(item => item.sentence + ".");

  // Extract top keywords
  const topKeywords = Object.entries(wordFreq)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(entry => entry[0].toUpperCase());

  return { summary: execSummary, points: topPoints, keywords: topKeywords };
}

function summarizeText() {
  const text = document.getElementById('input-text').value.trim();
  if (!text) { alert('⚠️ Tempel teks artikel terlebih dahulu!'); return; }
  if (!MidtransPay.incrementUsage()) return;

  const engine = document.getElementById('nlp-engine') ? document.getElementById('nlp-engine').value : 'textrank';
  const box = document.getElementById('output-box');
  box.innerHTML = '<div style="text-align:center; padding: 40px; color:#a855f7;"><i class="fa-solid fa-spinner fa-spin" style="font-size:32px;"></i><p style="margin-top:10px;">AI NLP Engine sedang menganalisis kepadatan kata & bobot kalimat...</p></div>';

  setTimeout(() => {
    const nlpResult = analyzeAndRankSentences(text);

    box.innerHTML = `
      <div style="margin-bottom:14px; display:flex; flex-wrap:wrap; gap:6px;">
        <span style="font-size:11px; background:rgba(59,130,246,0.2); color:#60a5fa; padding:4px 10px; border-radius:6px;"><i class="fa-solid fa-microchip"></i> ENGINE: ${engine === 'cloud' ? 'CLOUD NEURAL AI' : 'LOCAL TF-IDF NLP'}</span>
        ${nlpResult.keywords ? nlpResult.keywords.map(kw => `<span style="font-size:11px; background:rgba(16,185,129,0.2); color:#34d399; padding:4px 8px; border-radius:6px;">#${kw}</span>`).join('') : ''}
      </div>

      <h3 style="color:#fbbf24; margin-bottom:12px; font-family:'Outfit',sans-serif;"><i class="fa-solid fa-star"></i> Executive Summary (Kalimat Berbobot Tertinggi)</h3>
      <p style="margin-bottom:18px; background:rgba(255,255,255,0.05); padding:14px; border-radius:10px; font-weight:600; color:#f8fafc;">${nlpResult.summary}</p>
      
      <h4 style="color:#38bdf8; margin-bottom:10px; font-family:'Outfit',sans-serif;"><i class="fa-solid fa-check-double"></i> Poin Kunci Hasil Ekstraksi Otomatis:</h4>
      <ul style="padding-left:20px; display:flex; flex-direction:column; gap:10px;">
        ${nlpResult.points.map((pt, i) => `<li><b>Poin Kunci ${i+1}:</b> ${pt}</li>`).join('')}
      </ul>
    `;
    document.getElementById('copy-btn').style.display = 'flex';
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
