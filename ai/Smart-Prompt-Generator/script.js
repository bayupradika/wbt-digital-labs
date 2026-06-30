function generatePrompts() {
  const kw = document.getElementById('keyword-input').value.trim();
  if (!kw) { alert('⚠️ Masukkan ide dasar prompt terlebih dahulu!'); return; }
  if (!MidtransPay.incrementUsage()) return;

  const model = document.getElementById('model-select').value;
  const style = document.getElementById('style-select').value;
  const listEl = document.getElementById('output-list');

  listEl.innerHTML = '<div style="text-align:center; padding: 40px; color:#f59e0b;"><i class="fa-solid fa-spinner fa-spin" style="font-size:32px;"></i><p style="margin-top:10px;">AI Prompt Engineer sedang menganalisis token & menyusun arsitektur prompt...</p></div>';

  setTimeout(() => {
    // Dynamic Token Analysis
    const words = kw.split(/\s+/);
    const isDetailNeeded = words.length < 5;
    const domainDesc = words.some(w => /logo|desain|web|app|ui|ux/i.test(w)) ? "UI/UX & Branding Design" : "General Creative Concept";
    
    let prompts = [];
    if (model === 'midjourney') {
      const lighting = style === 'cinematic' ? "volumetric god rays, dramatic shadows, moody chiaroscuro lighting" : "soft clean studio diffused lighting, golden hour rim reflections";
      const camera = style === 'photorealistic' ? "shot on 35mm lens, f/1.8 aperture, Hasselblad medium format, ultra-sharp optical focus" : "intricate 3D render, Unreal Engine 5 Lumen, 8k raytracing details";
      
      prompts = [
        `/imagine prompt: A breathtaking ${style} subject featuring ${kw}. Key elements include ${lighting}, ${camera}, award-winning composition, vibrant color harmony --ar 16:9 --v 6.0 --style raw`,
        `/imagine prompt: Extreme close-up macro view capturing the essence of ${kw}. Atmosphere: hyper-detailed surface texture, ${lighting}, octane render masterpiece --ar 4:5 --q 2 --s 750`,
        `/imagine prompt: Minimalist and conceptual environmental portrait of ${kw}, centered composition, clean negative space, ${style} aesthetic, high definition --ar 1:1 --no blur, distortion, watermark, bad anatomy`
      ];
    } else {
      // ChatGPT / Claude / LLM Prompt Frameworks (RTF & CREATE)
      prompts = [
        `[Framework RTF: Role, Task, Format]\nRole: You are a distinguished senior expert and strategist in ${domainDesc}.\nTask: Provide a highly detailed, step-by-step masterclass guide and actionable blueprint analyzing "${kw}". Address key challenges, industry secrets, and proven best practices.\nFormat: Present your answer in a structured markdown document with clear headings, bulleted action items, and a concluding checklist.`,
        
        `[Framework CREATE: Context, Role, Explicit Action]\nContext: Our organization is exploring groundbreaking innovations surrounding "${kw}".\nRole: Lead Chief Innovation Officer.\nExplicit Instructions: Brainstorm 7 high-impact, unconventional strategies to leverage "${kw}" for competitive advantage. For each strategy, evaluate the implementation timeline, resource intensity, and potential ROI.\nTarget Audience: Executive C-Suite decision makers.`,
        
        `[Deep Analytical Prompt with Few-Shot Chain-of-Thought]\nAnalyze the subject "${kw}" by applying rigorous critical thinking. First, outline the underlying mechanics and core philosophy. Second, identify the top 3 common pitfalls people make regarding "${kw}" and how to solve them permanently. Conclude with a comparative evaluation table.`
      ];
    }

    listEl.innerHTML = '';
    prompts.forEach((p, i) => {
      const box = document.createElement('div');
      box.className = 'prompt-box';
      box.innerHTML = `
        <div style="font-size:12px; font-weight:800; color:#fbbf24; margin-bottom:8px; display:flex; justify-content:space-between;">
          <span><i class="fa-solid fa-star"></i> AI PROMPT ENGINEERING ARCHITECTURE #${i+1}</span>
          <span style="color:#60a5fa; font-size:10px;">${model === 'midjourney' ? 'VISUAL PARAMETER SYNTHESIS' : 'LLM COGNITIVE FRAMEWORK'}</span>
        </div>
        <div class="prompt-text" style="font-family:monospace; font-size:13px; line-height:1.6; background:rgba(0,0,0,0.3); padding:12px; border-radius:8px;">${p.replace(/\n/g, '<br>')}</div>
        <button class="btn-copy" onclick="copyPrompt(this)" style="margin-top:10px;"><i class="fa-regular fa-copy"></i> Salin Prompt</button>
      </div>`;
      listEl.appendChild(box);
    });
  }, 750);
}

function copyPrompt(btnEl) {
  const text = btnEl.parentElement.querySelector('.prompt-text').innerText;
  navigator.clipboard.writeText(text).then(() => {
    const origHtml = btnEl.innerHTML;
    btnEl.innerHTML = '<i class="fa-solid fa-check" style="color:#10b981;"></i> Tersalin!';
    btnEl.style.background = '#10b981'; btn.style.color = '#0f172a';
    setTimeout(() => {
      btnEl.innerHTML = origHtml;
      btnEl.style.background = '#334155'; btnEl.style.color = 'white';
    }, 2000);
  });
}
