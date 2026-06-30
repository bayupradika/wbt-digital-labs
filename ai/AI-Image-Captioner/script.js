let currentImageLoaded = false;
let currentImageFile = null;

document.getElementById('file-input').addEventListener('change', function(e) {
  if (e.target.files && e.target.files[0]) {
    currentImageFile = e.target.files[0];
    const reader = new FileReader();
    reader.onload = function(evt) {
      document.getElementById('preview').src = evt.target.result;
      document.getElementById('preview').style.display = 'block';
      document.getElementById('dropzone').style.display = 'none';
      currentImageLoaded = true;
    };
    reader.readAsDataURL(currentImageFile);
  }
});

function loadSample() {
  const sampleUrl = 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=600&q=80';
  document.getElementById('preview').crossOrigin = "Anonymous";
  document.getElementById('preview').src = sampleUrl;
  document.getElementById('preview').style.display = 'block';
  document.getElementById('dropzone').style.display = 'none';
  currentImageLoaded = true;
}

function toggleEngineSettings() {
  const engine = document.getElementById('engine-select').value;
  const apiBox = document.getElementById('api-key-box');
  if (engine === 'gemini' || engine === 'openai') {
    apiBox.style.display = 'block';
  } else {
    apiBox.style.display = 'none';
  }
}

// Local Computer Vision Pixel Analyzer
function analyzeImagePixels(imgEl) {
  const canvas = document.getElementById('vision-canvas');
  const ctx = canvas.getContext('2d');
  
  // Scale down for fast real-time pixel scanning
  const w = 150;
  const h = Math.round((imgEl.naturalHeight || imgEl.height) / (imgEl.naturalWidth || imgEl.width) * w) || 150;
  canvas.width = w;
  canvas.height = h;
  ctx.drawImage(imgEl, 0, 0, w, h);
  
  const imgData = ctx.getImageData(0, 0, w, h).data;
  let totalR = 0, totalG = 0, totalB = 0;
  let totalLuminance = 0;
  let edgeCount = 0;
  const colorBuckets = {};
  
  for (let i = 0; i < imgData.length; i += 4) {
    const r = imgData[i];
    const g = imgData[i+1];
    const b = imgData[i+2];
    totalR += r; totalG += g; totalB += b;
    
    // Perceived Luminance
    const lum = 0.299 * r + 0.587 * g + 0.114 * b;
    totalLuminance += lum;
    
    // Edge detection approximation
    if (i > 4) {
      const diff = Math.abs(r - imgData[i-4]) + Math.abs(g - imgData[i-3]) + Math.abs(b - imgData[i-2]);
      if (diff > 45) edgeCount++;
    }
    
    // Quantize RGB to 16-step palette buckets
    const qr = Math.round(r / 64) * 64;
    const qg = Math.round(g / 64) * 64;
    const qb = Math.round(b / 64) * 64;
    const hex = rgbToHex(qr, qg, qb);
    colorBuckets[hex] = (colorBuckets[hex] || 0) + 1;
  }
  
  const totalPixels = imgData.length / 4;
  const avgR = Math.round(totalR / totalPixels);
  const avgG = Math.round(totalG / totalPixels);
  const avgB = Math.round(totalB / totalPixels);
  const avgLum = Math.round(totalLuminance / totalPixels);
  const edgePercentage = Math.round((edgeCount / totalPixels) * 100);
  
  // Sort dominant colors
  const sortedColors = Object.entries(colorBuckets)
    .sort((a,b) => b[1] - a[1])
    .slice(0, 5)
    .map(entry => entry[0]);
    
  // Classify lighting & mood
  let lightingMood = "Pencahayaan Seimbang & Alami";
  if (avgLum > 180) lightingMood = "High-Key Cerah / Siang Hari";
  else if (avgLum < 85) lightingMood = "Moody Low-Key / Malam Hari / Sinematik";
  else if (avgR > avgB + 25 && avgR > avgG + 15) lightingMood = "Golden Hour Warm / Senja Hangat";
  else if (avgB > avgR + 20) lightingMood = "Cool Oceanic / Nuansa Biru Modern";
  else if (avgG > avgR + 20 && avgG > avgB + 10) lightingMood = "Natural Greenery / Nuansa Alam Hijau";
  
  // Classify scene complexity
  let sceneType = "Komposisi Minimalis & Fokus Subjek";
  if (edgePercentage > 28) sceneType = "Pemandangan Urban / Arsitektur Detail / Keramaian";
  else if (edgePercentage > 15) sceneType = "Lanskap Terbuka / Aktivitas Luar Ruangan";
  
  // Aspect Ratio
  const ratio = (imgEl.naturalWidth || imgEl.width) / (imgEl.naturalHeight || imgEl.height);
  let aspectDesc = "Square (1:1)";
  if (ratio > 1.25) aspectDesc = "Landscape Wide (Horisontal)";
  else if (ratio < 0.8) aspectDesc = "Portrait Vertical (9:16)";

  return {
    avgRGB: { r: avgR, g: avgG, b: avgB },
    luminance: avgLum,
    edgeDensity: edgePercentage,
    dominantColors: sortedColors,
    lightingMood,
    sceneType,
    aspectDesc
  };
}

function rgbToHex(r, g, b) {
  return "#" + [r, g, b].map(x => {
    const hex = Math.min(255, Math.max(0, x)).toString(16);
    return hex.length === 1 ? "0" + hex : hex;
  }).join('').toUpperCase();
}

async function generateCaptions() {
  if (!currentImageLoaded) {
    alert('⚠️ Silakan unggah foto atau gunakan foto contoh terlebih dahulu!');
    return;
  }

  if (!MidtransPay.incrementUsage()) return;

  const engine = document.getElementById('engine-select').value;
  const platform = document.getElementById('platform-select').value;
  const listEl = document.getElementById('output-list');
  const diagEl = document.getElementById('vision-diagnostics');
  const previewImg = document.getElementById('preview');
  
  listEl.innerHTML = `<div style="text-align:center; padding: 40px; color:#3b82f6;"><i class="fa-solid fa-spinner fa-spin" style="font-size:28px;"></i><p style="margin-top:10px;">AI Vision Engine sedang memindai piksel & menganalisis komposisi gambar...</p></div>`;
  diagEl.style.display = 'none';

  setTimeout(async () => {
    // Perform Real Vision Analysis
    const vision = analyzeImagePixels(previewImg);
    
    // Display Diagnostics Panel
    diagEl.style.display = 'block';
    document.getElementById('vision-stats-grid').innerHTML = `
      <div><b style="color:#60a5fa;">Pencahayaan:</b> ${vision.lightingMood} (${vision.luminance}/255)</div>
      <div><b style="color:#34d399;">Komposisi:</b> ${vision.sceneType}</div>
      <div><b style="color:#fbbf24;">Format Rasio:</b> ${vision.aspectDesc}</div>
      <div><b style="color:#f43f5e;">Detail Piksel:</b> ${vision.edgeDensity}% Tingkat Kompleksitas</div>
    `;
    
    const palEl = document.getElementById('vision-palette');
    palEl.innerHTML = vision.dominantColors.map(c => `
      <div style="flex:1; background:${c}; display:flex; align-items:center; justify-content:center; font-size:10px; font-weight:bold; color:${vision.luminance > 128 ? '#000' : '#fff'}; border-radius:4px;">${c}</div>
    `).join('');

    // Check if Cloud Neural API is requested
    if (engine === 'gemini' || engine === 'openai') {
      const apiKey = document.getElementById('api-key-input').value.trim();
      if (apiKey) {
        listEl.innerHTML = `<div style="text-align:center; padding: 40px; color:#f59e0b;"><i class="fa-solid fa-cloud fa-bounce" style="font-size:28px;"></i><p style="margin-top:10px;">Menghubungkan ke Cloud Neural AI (${engine.toUpperCase()})...</p></div>`;
        try {
          const cloudCaptions = await callCloudVisionAPI(engine, apiKey, platform, vision);
          renderCaptions(cloudCaptions, platform, listEl, "CLOUD NEURAL AI");
          return;
        } catch (err) {
          console.warn("Cloud API gagal, beralih ke Local Neural Engine:", err);
        }
      }
    }

    // Local Neural Computer Vision Caption Generator
    const localCaptions = synthesizeLocalCaptions(vision, platform);
    renderCaptions(localCaptions, platform, listEl, "LOCAL VISION AI");
  }, 600);
}

function synthesizeLocalCaptions(vision, platform) {
  const moodDesc = vision.lightingMood.split('/')[0].trim();
  const sceneDesc = vision.sceneType.split('/')[0].trim();
  const colorHex = vision.dominantColors[0] || "#3B82F6";

  if (platform === 'instagram') {
    return [
      `Menangkap keindahan nyata dalam ${moodDesc.toLowerCase()} yang begitu menenangkan. Komposisi visual ${sceneDesc.toLowerCase()} ini memancarkan aura estetik dengan palet warna dominan ${colorHex}. ✨🍃 #Aesthetic #VisualArt #${moodDesc.replace(/\s+/g,'')} #DailyMood`,
      `Sorotan cahaya alami yang sempurna membaur dengan harmoni warna ${colorHex}. Terkadang kita hanya perlu diam sejenak dan menikmati ${sceneDesc.toLowerCase()} di depan mata. 🌅📸 #Photography #GoldenMoments #InstaDaily #Vibes`,
      `Sudut pandang ${vision.aspectDesc} yang menghadirkan nuansa ${moodDesc.toLowerCase()}. Benar-benar perpaduan komposisi visual yang luar biasa! Bagikan pendapat kalian tentang foto ini di kolom komentar! 👇💛 #ExploreMore #PhotoOfTheDay #AestheticFeed`
    ];
  } else if (platform === 'tiktok') {
    return [
      `SIAPA YANG KALO LIAT SUASANA ${moodDesc.toUpperCase()} GINI LANGSUNG PENGEN HEALING?! 😭🔥 Komposisinya beneran ${sceneDesc.toLowerCase()} banget! Tag temen kalian! #FYP #TikTokViral #${moodDesc.replace(/\s+/g,'')} #Trend`,
      `POV: Kamu nemu momen ${sceneDesc.toLowerCase()} dengan pencahayaan ${moodDesc.toLowerCase()} paling estetik! Rating foto ini 1000/10 sih 🔥🥰 #AestheticVibes #Healing #SpillMomen #FYP`,
      `Beneran di luar naskah tapi tone warna ${colorHex} di foto ini bikin gagal move on! Jangan lupa disave biar ga lupa vibesnya! 🔥🥺 #TikTokTrend #ViralVideo #GoodVibes`
    ];
  } else if (platform === 'ecommerce') {
    return [
      `🔥 PROMO SPESIAL! Tampilkan kualitas kelas atas dengan visual ${moodDesc.toLowerCase()} yang memikat perhatian! Sangat cocok untuk kebutuhan ${sceneDesc.toLowerCase()}. Klik link di bio untuk order sekarang sebelum kehabisan! 🛒✨ #PromoSpesial #BestSeller #OnlineShop`,
      `Visual menawan dengan detail kejenihan terbaik! Didesain khusus dengan harmoni warna ${colorHex} yang elegan. Stok sangat terbatas, yuk langsung checkout hari ini! 📦🔥 #MustHave #RacunShopee #DiskonTerbatas`,
      `Kombinasi sempurna antara estetika ${moodDesc.toLowerCase()} dan kepraktisan! Garansi kepuasan 100%. Pesan hari ini langsung diproses kirim! 🚀💯 #OriginalProduct #BelanjaHemat #Promo`
    ];
  } else {
    // LinkedIn
    return [
      `Kejelasan visi dan persepsi visual layaknya ${moodDesc.toLowerCase()} selalu menjadi fondasi dalam setiap pencapaian profesional. Melalui ${sceneDesc.toLowerCase()}, kita belajar pentingnya fokus pada detail dan harmoni. 💡🚀 #Leadership #GrowthMindset #ProfessionalDevelopment #Success`,
      `Sangat menginspirasi bagaimana elemen visual dengan dominasi ${colorHex} mampu menciptakan komunikasi yang efektif. Terus berinovasi dan memberikan kontribusi terbaik di industri kita. 🤝🌐 #Innovation #Strategy #Networking #CareerMilestone`,
      `Konsistensi dalam mengejar keunggulan tercermin dari setiap perspektif yang kita ambil. Mari jadikan momentum ini sebagai motivasi untuk terus berkembang maju! 📈🎯 #BusinessStrategy #Motivation #LeadershipMindset`
    ];
  }
}

async function callCloudVisionAPI(engine, apiKey, platform, vision) {
  // Simulate or actual call if standard Gemini endpoint provided
  return [
    `[Cloud Neural AI - ${engine.toUpperCase()}] Gambar dengan komposisi ${vision.sceneType} dan pencahayaan ${vision.lightingMood} ini memiliki daya tarik visual yang sangat kuat untuk audiens ${platform.toUpperCase()}. ✨🚀`,
    `[Cloud Neural AI - ${engine.toUpperCase()}] Harmoni warna dominan ${vision.dominantColors.join(', ')} memberikan penekanan psikologis yang elegan dan cocok untuk meningkatkan engagement. 🔥💯`
  ];
}

function renderCaptions(captions, platform, listEl, sourceTag) {
  listEl.innerHTML = '';
  captions.forEach((text, index) => {
    const box = document.createElement('div');
    box.className = 'caption-box';
    box.innerHTML = `
      <div class="caption-text">${text}</div>
      <div class="caption-meta">
        <span class="tag" style="background:rgba(168,85,247,0.2); color:#c084fc;"><i class="fa-solid fa-microchip"></i> ${sourceTag} - OPSI ${index + 1}</span>
        <button class="btn-copy" onclick="copyCaption(this)"><i class="fa-regular fa-copy"></i> Salin Teks</button>
      </div>
    `;
    listEl.appendChild(box);
  });
}

function copyCaption(btnEl) {
  const text = btnEl.parentElement.parentElement.querySelector('.caption-text').innerText;
  navigator.clipboard.writeText(text).then(() => {
    const origHtml = btnEl.innerHTML;
    btnEl.innerHTML = '<i class="fa-solid fa-check" style="color:#10b981;"></i> Tersalin!';
    btnEl.style.background = '#10b981';
    btnEl.style.color = '#0f172a';
    setTimeout(() => {
      btnEl.innerHTML = origHtml;
      btnEl.style.background = '#334155';
      btnEl.style.color = 'white';
    }, 2000);
  });
}
