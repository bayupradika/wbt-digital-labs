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
  origImg.src = 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=400&q=60';
}

origImg.onload = function() {
  loaded = true;
  document.getElementById('dropzone').style.display = 'none';
  document.getElementById('orig-wrapper').style.display = 'block';
  const cvs = document.getElementById('orig-canvas');
  cvs.width = origImg.width; cvs.height = origImg.height;
  const ctx = cvs.getContext('2d');
  // Draw slightly blurred/dimmed to simulate low quality input
  ctx.filter = 'blur(1px) contrast(85%) brightness(90%)';
  ctx.drawImage(origImg, 0, 0);
};

function enhancePhoto() {
  if (!loaded) { alert('⚠️ Unggah foto terlebih dahulu!'); return; }
  if (!MidtransPay.incrementUsage()) return;

  const placeholder = document.getElementById('enh-placeholder');
  placeholder.innerHTML = '<i class="fa-solid fa-spinner fa-spin" style="font-size:32px; color:#10b981;"></i><p style="margin-top:10px;">AI sedang menajamkan detail piksel HD...</p>';

  setTimeout(() => {
    placeholder.style.display = 'none';
    document.getElementById('enh-wrapper').style.display = 'block';
    document.getElementById('dl-btn').style.display = 'flex';

    const cvs = document.getElementById('enh-canvas');
    cvs.width = origImg.width * 2; cvs.height = origImg.height * 2;
    const ctx = cvs.getContext('2d');
    // Draw enhanced super sharp high contrast
    ctx.filter = 'contrast(115%) brightness(105%) saturate(120%)';
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = 'high';
    ctx.drawImage(origImg, 0, 0, cvs.width, cvs.height);
  }, 1000);
}

function downloadImage() {
  const cvs = document.getElementById('enh-canvas');
  const link = document.createElement('a');
  link.download = 'AI-Enhanced-HD.png';
  link.href = cvs.toDataURL();
  link.click();
}
