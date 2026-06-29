let recognition;
let isRecording = false;

if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
  const SpeechRec = window.SpeechRecognition || window.webkitSpeechRecognition;
  recognition = new SpeechRec();
  recognition.continuous = true;
  recognition.interimResults = true;
  recognition.lang = 'id-ID';

  recognition.onresult = function(event) {
    let transcript = '';
    for (let i = event.resultIndex; i < event.results.length; ++i) {
      transcript += event.results[i][0].transcript;
    }
    document.getElementById('output-text').value = transcript;
  };

  recognition.onerror = function(event) {
    console.error('Speech recognition error', event.error);
    stopRecord();
  };
}

function toggleRecord() {
  if (!recognition) {
    alert('⚠️ Browser Anda tidak mendukung Web Speech API secara langsung. Silakan gunakan tombol Simulasi Demo di bawah.');
    return;
  }
  if (!isRecording) {
    if (!MidtransPay.incrementUsage()) return;
    startRecord();
  } else {
    stopRecord();
  }
}

function startRecord() {
  isRecording = true;
  recognition.start();
  document.getElementById('mic-btn').classList.add('recording');
  document.getElementById('status-text').innerText = '🔴 Sedang Merekam Suara...';
  document.getElementById('status-text').style.color = '#ef4444';
}

function stopRecord() {
  isRecording = false;
  if (recognition) recognition.stop();
  document.getElementById('mic-btn').classList.remove('recording');
  document.getElementById('status-text').innerText = 'Klik Mikrofon untuk Mulai Merekam';
  document.getElementById('status-text').style.color = 'white';
}

function simulateTranscribe() {
  if (!MidtransPay.incrementUsage()) return;
  const mic = document.getElementById('mic-btn');
  mic.classList.add('recording');
  document.getElementById('status-text').innerText = '🤖 AI Mendengarkan Sampel Audio...';
  
  const sampleSentences = [
    "Halo, selamat pagi. Hari ini kita akan mengadakan rapat evaluasi mengenai perkembangan proyek aplikasi kecerdasan buatan.",
    "Seluruh tim diharapkan dapat mempresentasikan hasil uji coba fitur terbaru, terutama mengenai kecepatan respons dan efisiensi sistem.",
    "Berdasarkan analisis data bulan lalu, tingkat kepuasan pengguna meningkat drastis hingga mencapai sembilan puluh lapan persen.",
    "Terima kasih atas kerja keras seluruh anggota tim. Mari kita pertahankan konsistensi ini untuk peluncuran produk minggu depan."
  ];

  let current = "";
  let idx = 0;
  const interval = setInterval(() => {
    if (idx < sampleSentences.length) {
      current += (idx > 0 ? " " : "") + sampleSentences[idx];
      document.getElementById('output-text').value = current;
      idx++;
    } else {
      clearInterval(interval);
      mic.classList.remove('recording');
      document.getElementById('status-text').innerText = '✅ Simulasi Transkripsi Selesai!';
      document.getElementById('status-text').style.color = '#10b981';
    }
  }, 1200);
}

function copyText() {
  const text = document.getElementById('output-text').value;
  if (!text) return;
  navigator.clipboard.writeText(text).then(() => {
    alert('✅ Teks berhasil disalin!');
  });
}
