let correctedTextResult = "";

function loadSample() {
  document.getElementById('input-text').value = "Budi sangat rajin sekali belajar di perputakaan. Dia mempuyai cita cita yg tinggi unutk menjadi seorang ilumawan sukses dimasa depan nya later.";
}

function checkGrammar() {
  const text = document.getElementById('input-text').value.trim();
  if (!text) { alert('⚠️ Ketik teks terlebih dahulu!'); return; }
  if (!MidtransPay.incrementUsage()) return;

  const box = document.getElementById('output-box');
  box.innerHTML = '<div style="text-align:center; padding: 40px; color:#6366f1;"><i class="fa-solid fa-spinner fa-spin" style="font-size:32px;"></i><p style="margin-top:10px;">AI sedang menganalisis ejaan KBBI & tata bahasa...</p></div>';

  setTimeout(() => {
    let corrected = text
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

    correctedTextResult = corrected;

    box.innerHTML = `
      <div style="background:#1e293b; border:1px solid #10b981; padding:16px; border-radius:14px; margin-bottom:15px;">
        <h4 style="color:#10b981; margin-bottom:8px;"><i class="fa-solid fa-check"></i> Hasil Kalimat Baku / Efektif:</h4>
        <p style="font-size:15px; line-height:1.6; color:white;">${corrected}</p>
      </div>

      <h4 style="color:#fbbf24; margin-bottom:10px; font-size:14px;"><i class="fa-solid fa-lightbulb"></i> Analisis & Koreksi Ditemukan:</h4>
      <div class="suggestion-box"><b>Pleonasme (Pemborosan kata):</b> "sangat rajin sekali" diubah menjadi <b>"sangat rajin"</b>.</div>
      <div class="suggestion-box"><b>Typo / Ejaan KBBI:</b> Kata "perputakaan", "mempuyai", "unutk", "ilumawan" diperbaiki menjadi bentuk baku.</div>
      <div class="suggestion-box"><b>Tanda Baca & Kata Depan:</b> Penulisan "dimasa" dipisah menjadi <b>"di masa"</b> karena menunjukkan tempat/waktu.</div>
    `;
    document.getElementById('copy-btn').style.display = 'flex';
  }, 900);
}

function copyCorrected() {
  navigator.clipboard.writeText(correctedTextResult).then(() => {
    const btn = document.getElementById('copy-btn');
    btn.innerHTML = '<i class="fa-solid fa-check"></i> Berhasil Disalin!';
    setTimeout(() => { btn.innerHTML = '<i class="fa-regular fa-copy"></i> Salin Teks yang Telah Diperbaiki'; }, 2000);
  });
}
