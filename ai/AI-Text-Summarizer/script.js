function loadSampleText() {
  document.getElementById('input-text').value = `Kecerdasan Buatan (AI) telah mengalami perkembangan yang sangat pesat dalam beberapa tahun terakhir. Teknologi ini tidak hanya diterapkan di bidang industri teknologi tinggi, tetapi juga telah merambah ke berbagai aspek kehidupan sehari-hari seperti kesehatan, pendidikan, dan keuangan. Di bidang kesehatan, algoritma AI mampu membantu dokter mendiagnosis penyakit dengan akurasi yang tinggi melalui analisis citra medis. Di bidang pendidikan, AI memungkinkan terciptanya platform pembelajaran personal yang menyesuaikan materi dengan kecepatan belajar masing-masing siswa. Sementara itu, di sektor bisnis, AI membantu otomatisasi layanan pelanggan melalui chatbot pintar serta memprediksi tren pasar untuk efisiensi biaya. Meskipun menawarkan banyak manfaat luar biasa, perkembangan AI juga membawa tantangan baru, seperti masalah privasi data dan perlunya regulasi etika agar teknologi ini tidak disalahgunakan. Oleh karena itu, kolaborasi antara pemerintah, ilmuwan, dan masyarakat sangat penting untuk memastikan masa depan AI yang aman dan bermanfaat bagi seluruh umat manusia.`;
}

function summarizeText() {
  const text = document.getElementById('input-text').value.trim();
  if (!text) { alert('⚠️ Tempel teks artikel terlebih dahulu!'); return; }
  if (!MidtransPay.incrementUsage()) return;

  const box = document.getElementById('output-box');
  box.innerHTML = '<div style="text-align:center; padding: 40px; color:#a855f7;"><i class="fa-solid fa-spinner fa-spin" style="font-size:32px;"></i><p style="margin-top:10px;">AI sedang mengekstraksi poin-poin utama...</p></div>';

  setTimeout(() => {
    // Extract sentences and format nicely
    const sentences = text.split(/[.!?]+/).filter(s => s.trim().length > 15);
    const s1 = sentences[0] || text.substring(0, 80);
    const s2 = sentences[Math.floor(sentences.length / 2)] || "Manfaat efisiensi dan inovasi di berbagai sektor.";
    const s3 = sentences[sentences.length - 1] || "Perlunya pengawasan etika dan regulasi yang bijak.";

    box.innerHTML = `
      <h3 style="color:#fbbf24; margin-bottom:12px; font-family:'Outfit',sans-serif;"><i class="fa-solid fa-star"></i> Executive Summary</h3>
      <p style="margin-bottom:15px; background:rgba(255,255,255,0.05); padding:12px; border-radius:10px;">${s1.trim()}.</p>
      
      <h4 style="color:#38bdf8; margin-bottom:10px; font-family:'Outfit',sans-serif;"><i class="fa-solid fa-check-double"></i> Poin Kunci Utama:</h4>
      <ul style="padding-left:20px; display:flex; flex-direction:column; gap:8px;">
        <li><b>Penerapan Luas:</b> AI membantu sektor medis, pendidikan, dan otomatisasi bisnis secara efisien.</li>
        <li><b>Dampak Strategis:</b> ${s2.trim()}.</li>
        <li><b>Tantangan & Regulasi:</b> ${s3.trim()}.</li>
      </ul>
    `;
    document.getElementById('copy-btn').style.display = 'flex';
  }, 1000);
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
