function generatePrompts() {
  const kw = document.getElementById('keyword-input').value.trim();
  if (!kw) { alert('⚠️ Masukkan ide dasar prompt terlebih dahulu!'); return; }
  if (!MidtransPay.incrementUsage()) return;

  const model = document.getElementById('model-select').value;
  const style = document.getElementById('style-select').value;
  const listEl = document.getElementById('output-list');

  listEl.innerHTML = '<div style="text-align:center; padding: 40px; color:#f59e0b;"><i class="fa-solid fa-spinner fa-spin" style="font-size:32px;"></i><p style="margin-top:10px;">AI meracik parameter & token prompt...</p></div>';

  setTimeout(() => {
    let prompts = [];
    if (model === 'midjourney') {
      prompts = [
        `/imagine prompt: A captivating and highly detailed masterpiece featuring ${kw}, executed in ${style} style, dramatic lighting, vivid colors, depth of field, Octane Render, 8k resolution --ar 16:9 --v 6.0 --style raw`,
        `/imagine prompt: Cinematic portrait of ${kw}, golden hour atmosphere, ultra-sharp focus, volumetric fog, intricate surface details, award winning photography on Hasselblad, ${style} aesthetic --ar 4:5 --q 2`,
        `/imagine prompt: Dynamic action shot of ${kw}, futuristic cyberpunk background, neon rim lighting, Unreal Engine 5 rendering, hyper-realistic texture --ar 1:1 --chaos 10`
      ];
    } else {
      prompts = [
        `Act as an expert world-class specialist. Your task is to provide a comprehensive, step-by-step analysis and actionable guide regarding: "${kw}". Ensure the tone is professional, structured with clear headings, and include practical real-world examples.`,
        `I need you to generate a creative and highly converting strategy based on the concept of "${kw}". Please break down the answer into 3 key phases: 1. Preparation & Research, 2. Execution Tactics, 3. Optimization & Scaling.`,
        `Please brainstorm 10 out-of-the-box ideas and innovative solutions related to "${kw}". Present the output in a clean comparative markdown table evaluating feasibility and impact.`
      ];
    }

    listEl.innerHTML = '';
    prompts.forEach((p, i) => {
      const box = document.createElement('div');
      box.className = 'prompt-box';
      box.innerHTML = `
        <div style="font-size:12px; font-weight:800; color:#fbbf24; margin-bottom:8px;"><i class="fa-solid fa-star"></i> OPTIMIZED PROMPT #${i+1}</div>
        <div class="prompt-text">${p}</div>
        <button class="btn-copy" onclick="copyPrompt(this)"><i class="fa-regular fa-copy"></i> Salin Prompt</button>
      </div>`;
      listEl.appendChild(box);
    });
  }, 800);
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
