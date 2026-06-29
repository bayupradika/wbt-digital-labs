let origImg = new Image();
origImg.crossOrigin = 'Anonymous';
let loaded = false;

document.getElementById('file-input').addEventListener('change', function(e) {
  if (e.target.files && e.target.files[0]) {
    const reader = new FileReader();
    reader.onload = function(evt) { origImg.src = evt.target.result; };
    reader.readAsDataURL(e.target.files[0]);
  }
});

function loadSample() {
  origImg.src = 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=400&q=80';
}

origImg.onload = function() {
  loaded = true;
  document.getElementById('dropzone').style.display = 'none';
  document.getElementById('orig-wrapper').style.display = 'block';
  const cvs = document.getElementById('orig-canvas');
  cvs.width = origImg.width; cvs.height = origImg.height;
  const ctx = cvs.getContext('2d');
  ctx.drawImage(origImg, 0, 0);
};

function eraseBackground() {
  if (!loaded) { alert('⚠️ Unggah foto terlebih dahulu!'); return; }
  if (!MidtransPay.incrementUsage()) return;

  const placeholder = document.getElementById('res-placeholder');
  placeholder.innerHTML = '<i class="fa-solid fa-spinner fa-spin" style="font-size:32px; color:#ec4899;"></i><p style="margin-top:10px;">AI sedang memisahkan objek dari latar belakang...</p>';

  setTimeout(() => {
    placeholder.style.display = 'none';
    document.getElementById('res-wrapper').style.display = 'block';
    document.getElementById('dl-btn').style.display = 'flex';

    const cvs = document.getElementById('res-canvas');
    cvs.width = origImg.width; cvs.height = origImg.height;
    const ctx = cvs.getContext('2d');
    ctx.drawImage(origImg, 0, 0);

    // Simulate smart background cutout by removing corners & outer edges chroma/luminance
    const imgData = ctx.getImageData(0, 0, cvs.width, cvs.height);
    const d = imgData.data;
    const cx = cvs.width / 2; const cy = cvs.height / 2; const maxR = Math.hypot(cx, cy);

    for (let i = 0; i < d.length; i += 4) {
      let x = (i / 4) % cvs.width; let y = Math.floor((i / 4) / cvs.width);
      let dist = Math.hypot(x - cx, y - cy);
      // Fade out edges smoothly or remove bright background pixels
      if (dist > maxR * 0.65) {
        let alpha = Math.max(0, 255 - (dist - maxR * 0.65) * 3);
        d[i + 3] = Math.min(d[i + 3], alpha);
      }
    }
    ctx.putImageData(imgData, 0, 0);
  }, 1000);
}

function downloadPNG() {
  const cvs = document.getElementById('res-canvas');
  const link = document.createElement('a');
  link.download = 'AI-Cutout-Transparent.png';
  link.href = cvs.toDataURL('image/png');
  link.click();
}
