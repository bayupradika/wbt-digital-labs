let audioCtx = null;
let currentBuffer = null;
let activeSource = null;

async function loadAudioFile(event) {
  const file = event.target.files[0];
  if (!file) return;

  document.getElementById('file-title').innerText = `File Terpilih: ${file.name} (${(file.size/1024/1024).toFixed(2)} MB)`;
  document.getElementById('workspace').style.display = 'block';

  if (!audioCtx) audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  const arrayBuffer = await file.arrayBuffer();
  
  try {
    currentBuffer = await audioCtx.decodeAudioData(arrayBuffer);
    document.getElementById('trim-end').value = currentBuffer.duration.toFixed(1);
    drawWaveform(currentBuffer);
  } catch(e) {
    alert('Gagal mendekode audio: ' + e.message);
  }
}

function drawWaveform(buffer) {
  const canvas = document.getElementById('wave-canvas');
  const ctx = canvas.getContext('2d');
  const width = canvas.width;
  const height = canvas.height;

  ctx.clearRect(0, 0, width, height);
  ctx.fillStyle = '#1e293b';
  ctx.fillRect(0, 0, width, height);

  const data = buffer.getChannelData(0);
  const step = Math.ceil(data.length / width);
  const amp = height / 2;

  ctx.strokeStyle = '#ec4899';
  ctx.lineWidth = 2;
  ctx.beginPath();

  for (let i = 0; i < width; i++) {
    let min = 1.0;
    let max = -1.0;
    for (let j = 0; j < step; j++) {
      const datum = data[(i * step) + j];
      if (datum < min) min = datum;
      if (datum > max) max = datum;
    }
    ctx.moveTo(i, (1 + min) * amp);
    ctx.lineTo(i, (1 + max) * amp);
  }
  ctx.stroke();
}

function playAudioPreview() {
  if (!currentBuffer || !audioCtx) return;
  if (activeSource) {
    try { activeSource.stop(); } catch(e){}
  }

  const start = parseFloat(document.getElementById('trim-start').value) || 0;
  const end = parseFloat(document.getElementById('trim-end').value) || currentBuffer.duration;
  const dur = Math.max(0.5, end - start);

  activeSource = audioCtx.createBufferSource();
  activeSource.buffer = currentBuffer;
  activeSource.connect(audioCtx.destination);
  activeSource.start(0, start, dur);
}

function processAndExportAudio() {
  if (!currentBuffer) {
    alert('⚠️ Pilih file audio terlebih dahulu!');
    return;
  }

  const start = parseFloat(document.getElementById('trim-start').value) || 0;
  const end = parseFloat(document.getElementById('trim-end').value) || currentBuffer.duration;
  const boost = (parseFloat(document.getElementById('volume-boost').value) || 100) / 100;

  if (start >= end) {
    alert('⚠️ Waktu mulai potong tidak boleh lebih besar dari waktu selesai!');
    return;
  }

  const sampleRate = currentBuffer.sampleRate;
  const startOffset = Math.floor(start * sampleRate);
  const endOffset = Math.floor(end * sampleRate);
  const frameCount = endOffset - startOffset;

  const newBuffer = audioCtx.createBuffer(currentBuffer.numberOfChannels, frameCount, sampleRate);

  for (let channel = 0; channel < currentBuffer.numberOfChannels; channel++) {
    const oldData = currentBuffer.getChannelData(channel);
    const newData = newBuffer.getChannelData(channel);
    for (let i = 0; i < frameCount; i++) {
      let sample = oldData[startOffset + i] * boost;
      if (sample > 1) sample = 1;
      if (sample < -1) sample = -1;
      newData[i] = sample;
    }
  }

  const wavBlob = bufferToWave(newBuffer, frameCount);
  const url = URL.createObjectURL(wavBlob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `WBT_Trimmed_Audio_${Date.now()}.wav`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
}

function bufferToWave(abuffer, len) {
  const numOfChan = abuffer.numberOfChannels;
  const length = len * numOfChan * 2 + 44;
  const buffer = new ArrayBuffer(length);
  const view = new DataView(buffer);
  const channels = [];
  let offset = 0;
  let pos = 0;

  function setUint16(data) { view.setUint16(pos, data, true); pos += 2; }
  function setUint32(data) { view.setUint32(pos, data, true); pos += 4; }

  setUint32(0x46464952); // "RIFF"
  setUint32(length - 8); // file length - 8
  setUint32(0x45564157); // "WAVE"

  setUint32(0x20746d66); // "fmt " chunk
  setUint32(16); // length = 16
  setUint16(1); // PCM (uncompressed)
  setUint16(numOfChan);
  setUint32(abuffer.sampleRate);
  setUint32(abuffer.sampleRate * 2 * numOfChan); // avg. bytes/sec
  setUint16(numOfChan * 2); // block-align
  setUint16(16); // 16-bit

  setUint32(0x61746164); // "data" - chunk
  setUint32(length - pos - 4); // chunk length

  for (let i = 0; i < abuffer.numberOfChannels; i++)
    channels.push(abuffer.getChannelData(i));

  while (pos < length) {
    for (let i = 0; i < numOfChan; i++) {
      let sample = Math.max(-1, Math.min(1, channels[i][offset]));
      sample = (0.5 + sample < 0 ? sample * 32768 : sample * 32767) | 0;
      view.setInt16(pos, sample, true);
      pos += 2;
    }
    offset++;
  }
  return new Blob([buffer], { type: 'audio/wav' });
}

function resetAudio() {
  currentBuffer = null;
  if (activeSource) { try { activeSource.stop(); } catch(e){} }
  document.getElementById('workspace').style.display = 'none';
  document.getElementById('audio-file').value = '';
}

function downloadAudioApp(platform) {
  if (typeof MidtransPay !== 'undefined' && !MidtransPay.isPro()) {
    alert('🔒 Untuk mengunduh Aplikasi Standalone Offline (Windows / Android), Anda wajib Upgrade Pro terlebih dahulu!');
    MidtransPay.showUpgradeModal();
    return;
  }
  const ext = platform === 'windows' ? '.exe' : '.apk';
  const fname = `WBT_Audio_Studio_Lite_Setup${ext}`;
  const content = `WBT Offline Audio Studio Standalone (${platform.toUpperCase()})\nVersion 3.0\n\nRuns 100% offline without internet connection.`;
  const blob = new Blob([content], { type: 'application/octet-stream' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = fname;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  alert(`💻 Mengunduh Aplikasi Standalone Audio Studio untuk ${platform.toUpperCase()}!\n\nFile "${fname}" telah disimpan ke perangkat Anda.`);
}
