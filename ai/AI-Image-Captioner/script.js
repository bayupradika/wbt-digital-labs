let currentImageLoaded = false;

document.getElementById('file-input').addEventListener('change', function(e) {
  if (e.target.files && e.target.files[0]) {
    const reader = new FileReader();
    reader.onload = function(evt) {
      document.getElementById('preview').src = evt.target.result;
      document.getElementById('preview').style.display = 'block';
      document.getElementById('dropzone').style.display = 'none';
      currentImageLoaded = true;
    };
    reader.readAsDataURL(e.target.files[0]);
  }
});

function loadSample() {
  document.getElementById('preview').src = 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=600&q=80';
  document.getElementById('preview').style.display = 'block';
  document.getElementById('dropzone').style.display = 'none';
  currentImageLoaded = true;
}

const CAPTION_TEMPLATES = {
  instagram: [
    "Menikmati setiap detik keindahan yang tak terpisahkan. Kadang kita hanya perlu berhenti sejenak dan mengagumi momen ini. ✨🍃 #Aesthetic #GoodVibes #DailyInspiration #ExploreMore",
    "Golden hour dan atmosfer sempurna! Tidak ada kata yang bisa mendeskripsikan betapa menenangkannya suasana ini. 🌅💛 #SunsetLovers #Photography #LifeIsBeautiful",
    "Vibes hari ini: tenang, bersyukur, dan penuh energi positif! Bagaimana dengan hari kalian? 👇✨ #MoodOfTheDay #Instagrammable #Chilling"
  ],
  tiktok: [
    "SIAPA YANG KALO LIAT GINI LANGSUNG PENGEN LIBURAN JUGA?! 😭🔥 Tag temen kalian yang wajib diajak kesini sekarang! #FYP #Viral #LiburanSeru #WajibCoba",
    "Rating momen ini 1000/10! Benar-benar di luar naskah tapi hasilnya bikin gagal move on 🥺✨ #TikTokViral #AestheticVibes #Trend",
    "POV: Ketika kamu menemukan spot paling healing dan estetik abad ini! Jangan lupa disave biar ga lupa ya! 🔥🥰 #Healing #SpillSpot #FYP"
  ],
  ecommerce: [
    "🔥 PROMO SPESIAL TERBATAS! Kualitas premium dengan tampilan elegan yang siap menemani aktivitas harianmu. Klik link di bio untuk order sebelum kehabisan! 🛒✨ #Promo #BestSeller #Diskon #BelanjaOnline",
    "Tampil lebih percaya diri dengan produk pilihan terbaik! Stok sangat terbatas dan sedang banyak dicari. Yuk langsung checkout sekarang! 📦🔥 #MustHave #RacunShopee #OnlineShop",
    "Cari produk berkualitas tapi harga tetap ramah di kantong? Ini jawabannya! Garansi kepuasan 100%. Pesan hari ini langsung kirim! 🚀💯 #Original #DiskonSpesial"
  ],
  linkedin: [
    "Setiap tantangan baru adalah kesempatan untuk belajar dan tumbuh. Konsistensi dan visi yang jelas selalu membawa kita menuju pencapaian terbaik. 💡🚀 #Leadership #GrowthMindset #ProfessionalDevelopment #Success",
    "Sangat bangga bisa berbagi perspektif dan pencapaian luar biasa ini. Terus berinovasi dan memberikan dampak positif bagi industri. 🤝🌐 #Innovation #CareerMilestone #Networking",
    "Kunci utama dari kesuksesan adalah kolaborasi yang solid dan ketekunan dalam menghadapi perubahan. Mari terus melangkah maju! 📈🎯 #BusinessStrategy #Motivation #WorkLife"
  ]
};

function generateCaptions() {
  if (!currentImageLoaded) {
    alert('⚠️ Silakan unggah foto atau gunakan foto contoh terlebih dahulu!');
    return;
  }

  // Check Midtrans quota
  if (!MidtransPay.incrementUsage()) {
    return;
  }

  const platform = document.getElementById('platform-select').value;
  const listEl = document.getElementById('output-list');
  
  listEl.innerHTML = `<div style="text-align:center; padding: 30px; color:#3b82f6;"><i class="fa-solid fa-spinner fa-spin" style="font-size:28px;"></i><p style="margin-top:10px;">AI sedang menganalisis piksel & merangkai kata...</p></div>`;

  setTimeout(() => {
    const templates = CAPTION_TEMPLATES[platform];
    listEl.innerHTML = '';
    
    templates.forEach((text, index) => {
      const box = document.createElement('div');
      box.className = 'caption-box';
      box.innerHTML = `
        <div class="caption-text">${text}</div>
        <div class="caption-meta">
          <span class="tag"><i class="fa-solid fa-hashtag"></i> ${platform.toUpperCase()} OPSI ${index + 1}</span>
          <button class="btn-copy" onclick="copyCaption(this)"><i class="fa-regular fa-copy"></i> Salin Teks</button>
        </div>
      `;
      listEl.appendChild(box);
    });
  }, 800);
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
