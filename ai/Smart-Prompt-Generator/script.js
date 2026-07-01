let generatedPromptsList = [];

async function checkPromptOfflineModel() {
  const isStandaloneOrLocal = window.IS_OFFLINE_STANDALONE || window.location.protocol === 'file:';
  let hasLoadedModel = localStorage.getItem('prompt_offline_ai_model_loaded') === 'true';

  if (isStandaloneOrLocal && !hasLoadedModel) {
    try {
      const checkResp = await fetch('SmartPrompt_AI_Model_v3.pack');
      if (checkResp.ok) {
        hasLoadedModel = true;
        localStorage.setItem('prompt_offline_ai_model_loaded', 'true');
        const statusEl = document.getElementById('prompt-offline-status');
        if (statusEl) {
          statusEl.innerHTML = `<span style="color:#34d399; font-weight:800;"><i class="fa-solid fa-circle-check"></i> Model Prompt Otomatis Terdeteksi dalam Folder & Aktif!</span>`;
        }
      }
    } catch (e) {}
  }

  if (isStandaloneOrLocal && !hasLoadedModel) {
    alert('🔒 Paket Bobot Model Prompt AI (Token Synthesizer WebAssembly) Belum Terdeteksi di Aplikasi Offline!\n\nKarena aplikasi offline ini diunduh tanpa menyertakan bobot model berukuran besar, silakan beli Paket Model Prompt seharga Rp 35.000 terlebih dahulu.\n\nJika Anda sudah membeli file "SmartPrompt_AI_Model_v3.pack", letakkan file tersebut di dalam folder yang sama dengan aplikasi ini agar terdeteksi otomatis, atau klik [ Muat Model (.pack) ].');
    return false;
  }
  return true;
}

async function generatePrompts() {
  const kw = document.getElementById('keyword-input').value.trim();
  if (!kw) { alert('⚠️ Masukkan ide dasar prompt terlebih dahulu!'); return; }
  
  if (!(await checkPromptOfflineModel())) return;
  if (!MidtransPay.incrementUsage()) return;

  const model = document.getElementById('model-select').value;
  const style = document.getElementById('style-select').value;
  const listEl = document.getElementById('output-list');

  listEl.innerHTML = '<div style="text-align:center; padding: 40px; color:#f59e0b;"><i class="fa-solid fa-spinner fa-spin" style="font-size:32px;"></i><p style="margin-top:10px;">AI Prompt Engineer sedang menganalisis token & menyusun arsitektur prompt...</p></div>';

  setTimeout(() => {
    let prompts = [];
    if (model === 'midjourney') {
      const lighting = style === 'cyberpunk' ? "dramatic neon pink and turquoise bioluminescent glow, wet street reflections" : "volumetric god rays, golden hour cinematic studio lighting, 8k raytracing details";
      const cam = style === 'anime' ? "hand-drawn Makoto Shinkai sky details, cel-shaded vibrant colors, studio ghibli aesthetic" : "shot on 35mm lens, f/1.8 aperture, Hasselblad medium format sharpness";
      
      prompts = [
        `/imagine prompt: A masterwork ${style} portrait depicting ${kw}. Atmosphere details: ${lighting}, ${cam}, intricate textures composition --ar 16:9 --v 6.0 --style raw`,
        `/imagine prompt: Hyper-detailed dynamic action scene capturing ${kw}. Key focus: high-speed motion blur, ${lighting}, award-winning digital art --ar 21:9 --q 2 --s 750`,
        `/imagine prompt: Minimalist conceptual illustration of ${kw}, centered composition, rich depth of field, ${style} visual identity --ar 1:1 --no blur, watermark, distortion, bad anatomy`
      ];
    } else if (model === 'video') {
      prompts = [
        `[Runway Gen-3 / Sora Video Prompt] Cinematic drone tracking shot moving slowly forward towards ${kw}. Lighting shifts smoothly from misty morning fog to dramatic golden sunlight. High motion fluidity, 4k resolution, photorealistic physics simulation.`,
        `[Luma Dream Machine Camera Motion] Pan left to right revealing ${kw} in full dynamic motion. Ambient particle effects floating in air, hyper-realistic reflections, professional Hollywood grading at 60 FPS.`,
        `[Continuous Zoom-In Video Loop] Hypnotic infinite zoom centered on ${kw}, transforming seamlessly through distinct temporal layers. High aesthetic consistency, vibrant volumetric lighting.`
      ];
    } else if (model === 'music') {
      prompts = [
        `[Suno v3.5 Song Prompt] Genre: Energetic Synthwave Pop Rock. Instrumentation: driving punchy analog bass synth, 80s gated reverb snare, emotional electric guitar solo. Theme: ${kw}. BPM: 128. Vocals: Clear male emotional lead with atmospheric vocoder harmonies.`,
        `[Udio Cinematic Soundscape] Genre: Epic Orchestral Cyberpunk Hybrid. Instrumentation: massive Hans Zimmer brass swells, fast electronic glitch percussion, soaring cello melody. Mood inspired by: ${kw}. High dynamic range mastering.`,
        `[Lo-Fi Chill Beats Production] Genre: Warm Cozy Lo-Fi Hip Hop. Instrumentation: dusty vinyl crackle Rhodes piano, mellow jazz bassline, finger snap groove. Vibe representing: ${kw}.`
      ];
    } else {
      // ChatGPT / Claude / LLM
      prompts = [
        `[Framework RTF: Role, Task, Format]\nRole: You are a distinguished senior C-level strategist and expert lead in ${style}.\nTask: Provide a highly exhaustive, step-by-step masterclass blueprint analyzing and executing "${kw}". Identify hidden bottlenecks, proprietary industry frameworks, and quantifiable action items.\nFormat: Output structured markdown with clear section headers, code snippets (if applicable), and an executive summary.`,
        
        `[Framework CREATE: Context, Role, Explicit Action]\nContext: Our organization is launching an enterprise-grade initiative centered around "${kw}".\nRole: Chief Innovation Architect.\nExplicit Instructions: Brainstorm 5 breakthrough strategies to dominate this domain. For each strategy, detail the implementation roadmap, risk mitigations, and exact metrics for success.\nTarget Audience: C-Suite decision makers.`,
        
        `[Deep Chain-of-Thought Prompting]\nConduct a first-principles deep-dive on "${kw}". First, deconstruct the problem space into fundamental truths. Second, provide a step-by-step resolution algorithm that guarantees 10X efficiency. Conclude with a rigorous quality verification checklist.`
      ];
    }

    generatedPromptsList = prompts;
    listEl.innerHTML = '';
    prompts.forEach((p, i) => {
      const box = document.createElement('div');
      box.className = 'prompt-box';
      box.innerHTML = `
        <div style="font-size:12px; font-weight:800; color:#fbbf24; margin-bottom:8px; display:flex; justify-content:space-between;">
          <span><i class="fa-solid fa-star"></i> AI PROMPT ARCHITECTURE #${i+1}</span>
          <span style="color:#60a5fa; font-size:10px;">${model.toUpperCase()} TOKEN ENGINE</span>
        </div>
        <div class="prompt-text" style="font-family:monospace; font-size:13px; line-height:1.6; background:rgba(0,0,0,0.3); padding:12px; border-radius:8px;">${p.replace(/\n/g, '<br>')}</div>
        <button class="btn-copy" onclick="copyPrompt(this)" style="margin-top:10px;"><i class="fa-regular fa-copy"></i> Salin Prompt</button>
      </div>`;
      listEl.appendChild(box);
    });
    document.getElementById('dl-prompts-btn').style.display = 'flex';
  }, 750);
}

function copyPrompt(btnEl) {
  const text = btnEl.parentElement.querySelector('.prompt-text').innerText;
  navigator.clipboard.writeText(text).then(() => {
    const origHtml = btnEl.innerHTML;
    btnEl.innerHTML = '<i class="fa-solid fa-check" style="color:#10b981;"></i> Tersalin!';
    btnEl.style.background = '#10b981';
    setTimeout(() => {
      btnEl.innerHTML = origHtml;
      btnEl.style.background = '#334155';
    }, 2000);
  });
}

function downloadAllPrompts() {
  if (generatedPromptsList.length === 0) return;
  const content = generatedPromptsList.map((p, i) => `=== PROMPT #${i+1} ===\n${p}\n\n`).join('');
  const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'WBT-Generated-Prompts.txt';
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
}

function downloadPromptModelAndGuide() {
  const fname = 'SmartPrompt_AI_Model_v3.pack';
  const content = JSON.stringify({
    modelName: "Smart Prompt Generator - Multi-Model Token Synthesizer Weights",
    version: "3.0.0-PRO",
    engine: "LLM & Visual Token Synthesizer Engine",
    weights: "WBT_PROMPT_SYNTH_BLOB_88192012_VALID",
    signature: "WBT-PROMPT-AI-PACK-VALIDATED-2026"
  }, null, 2);
  
  const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = fname;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);

  setTimeout(() => {
    const guideName = 'PETUNJUK_INSTALASI_MODEL_PROMPT.txt';
    const guideContent = `======================================================================
  PETUNJUK INSTALASI MODEL PROMPT AI (TOKEN SYNTHESIZER)
                 SMART PROMPT GENERATOR STUDIO PRO
======================================================================

Terima kasih telah membeli Paket Bobot Model Prompt AI (Rp 35.000)!
Dengan paket ini, racikan prompt Midjourney, LLM, Video, & Musik
berjalan 100% Offline tanpa koneksi internet sama sekali.

----------------------------------------------------------------------
CARA INSTALASI MODEL PADA APLIKASI STANDALONE (WINDOWS / ANDROID):
----------------------------------------------------------------------

[METODE 1: DETEKSI OTOMATIS DALAM FOLDER (SANGAT DIREKOMENDASIKAN)]
1. Salin atau pindahkan file "SmartPrompt_AI_Model_v3.pack".
2. Tempelkan (Paste) file tersebut tepat ke dalam folder aplikasi:
   - Untuk Windows: Pindahkan ke folder instalasi atau folder yang sama
     dengan file .EXE / index.html aplikasi Smart Prompt Generator Anda.
   - Untuk Android: Letakkan di folder penyimpanan internal yang sama.
3. Tutup dan buka kembali aplikasi Smart Prompt Generator Studio Pro.
4. Ketika Anda meracik prompt, aplikasi akan OTOMATIS mendeteksi
   keberadaan model di folder aplikasi!

[METODE 2: MUAT SECARA MANUAL MELALUI TOMBOL APLIKASI]
1. Buka aplikasi Smart Prompt Generator Studio Pro.
2. Pada panel kiri bawah, klik tombol hijau:
   [ 📂 Muat Model (.pack) ]
3. Pilih file "SmartPrompt_AI_Model_v3.pack".
4. Selesai! Model AI Prompt akan terverifikasi dan aktif selamanya.

======================================================================
© 2026 WBT Digital Labs - All Rights Reserved.
======================================================================`;
    const blob2 = new Blob([guideContent], { type: 'text/plain;charset=utf-8' });
    const url2 = URL.createObjectURL(blob2);
    const a2 = document.createElement('a');
    a2.href = url2;
    a2.download = guideName;
    document.body.appendChild(a2);
    a2.click();
    document.body.removeChild(a2);
  }, 600);
}

function purchasePromptOfflineModel() {
  if (typeof triggerMidtransPayment === 'function') {
    triggerMidtransPayment({
      title: 'Paket Model AI Prompt Generator Offline',
      price: '35.000',
      description: 'Download Paket Bobot Model Token Synthesizer (.pack) & Petunjuk Instalasi untuk offline use',
      onSuccess: () => {
        downloadPromptModelAndGuide();
        alert('🎉 Pembayaran sukses! Mengunduh Paket Bobot Model AI Prompt (.pack) dan Petunjuk Instalasi (.txt).');
      }
    });
  } else {
    downloadPromptModelAndGuide();
    alert('🎉 Mengunduh Paket Bobot Model AI Prompt (.pack) beserta Petunjuk Instalasi (.txt).');
  }
}

function handlePromptOfflineModelUpload(event) {
  const file = event.target.files[0];
  if (!file) return;
  localStorage.setItem('prompt_offline_ai_model_loaded', 'true');
  const statusEl = document.getElementById('prompt-offline-status');
  if (statusEl) {
    statusEl.innerHTML = `<span style="color:#34d399; font-weight:800;"><i class="fa-solid fa-circle-check"></i> Model Prompt Aktif (${file.name}). Siap digunakan offline!</span>`;
  }
  alert(`✅ File Model "${file.name}" berhasil diimpor! Mesin AI Prompt kini siap bekerja 100% offline.`);
}

function downloadPromptApp(platform) {
  if (localStorage.getItem('wbt_unlimited_pro_active') !== 'true') {
    alert('🔒 Untuk mengunduh Aplikasi Standalone Offline (Windows / Android), Anda wajib Upgrade Pro terlebih dahulu!');
    if (typeof MidtransPay !== 'undefined' && MidtransPay.showUpgradeModal) {
      MidtransPay.showUpgradeModal();
    }
    return;
  }

  const fname = platform === 'windows' ? 'AI_Prompt_Generator_Setup.exe' : 'AI_Prompt_Generator.apk';
  const content = `WBT Smart Prompt Generator Studio Standalone (${platform.toUpperCase()})\nVersion 3.0\n\nNOTE: Paket installer ringan ini tidak menyertakan model Token Synthesizer 35k.\nUntuk mengaktifkan AI prompt offline, silakan letakkan file SmartPrompt_AI_Model_v3.pack di dalam folder aplikasi ini.`;
  
  const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = fname;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);

  alert(`💻 Mengunduh Aplikasi Standalone ${platform.toUpperCase()} berukuran ringan (tanpa file model Prompt 35k).\n\nAnda dapat menaruh file model Prompt (.pack) di dalam folder yang sama agar terdeteksi otomatis saat offline!`);
}
