const canvas = document.getElementById('canvas');
const ctx = canvas.getContext('2d');
let img = new Image(); img.crossOrigin = 'Anonymous';
let loaded = false;

const CLASS_NAMES = ['mobil', 'pejalan_kaki', 'lampu_lalu_lintas', 'sepeda', 'bus'];
const COLORS = ['#38bdf8', '#10b981', '#fbbf24', '#ec4899', '#a855f7'];

document.getElementById('file-input').addEventListener('change', (e) => {
  if (e.target.files && e.target.files[0]) {
    const reader = new FileReader();
    reader.onload = (evt) => { img.src = evt.target.result; };
    reader.readAsDataURL(e.target.files[0]);
  }
});

function loadSample() {
  img.src = 'https://images.unsplash.com/photo-1449965408869-eaa3f722e40d?auto=format&fit=crop&w=600&q=80';
  document.getElementById('yolo-input').value = `0 0.520000 0.650000 0.420000 0.350000\n1 0.180000 0.580000 0.150000 0.400000\n0 0.850000 0.620000 0.250000 0.300000`;
}

img.onload = () => {
  loaded = true;
  canvas.width = img.width; canvas.height = img.height;
  document.getElementById('stat-res').innerText = `${img.width} x ${img.height} px`;
  renderYOLO();
};

function renderYOLO() {
  if (!loaded) { alert('⚠️ Unggah atau pilih foto contoh terlebih dahulu!'); return; }
  if (!MidtransPay.incrementUsage()) return;

  ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.drawImage(img, 0, 0);

  const text = document.getElementById('yolo-input').value.trim();
  if (!text) { document.getElementById('stat-count').innerText = '0'; return; }

  const lines = text.split('\n');
  let count = 0;

  lines.forEach(line => {
    const parts = line.trim().split(/\s+/);
    if (parts.length >= 5) {
      let clsId = parseInt(parts[0]);
      let cx = parseFloat(parts[1]) * canvas.width;
      let cy = parseFloat(parts[2]) * canvas.height;
      let w = parseFloat(parts[3]) * canvas.width;
      let h = parseFloat(parts[4]) * canvas.height;

      let x = cx - w / 2; let y = cy - h / 2;
      let color = COLORS[clsId % COLORS.length];
      let clsName = CLASS_NAMES[clsId % CLASS_NAMES.length] || `Class ${clsId}`;

      ctx.strokeStyle = color; ctx.lineWidth = 3;
      ctx.strokeRect(x, y, w, h);
      
      ctx.fillStyle = color;
      let labelW = ctx.measureText(clsName).width + 16;
      ctx.fillRect(x, y - 22, labelW, 22);
      
      ctx.fillStyle = '#0f172a'; ctx.font = 'bold 13px Plus Jakarta Sans';
      ctx.fillText(clsName, x + 6, y - 6);
      count++;
    }
  });

  document.getElementById('stat-count').innerText = count;
}
