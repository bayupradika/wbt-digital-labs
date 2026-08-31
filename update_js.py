import re

with open('d:/Produk-Sell/tools/PDF-Toolkit-Lite/app.js', 'r', encoding='utf-8') as f:
    content = f.read()

# Replace updateQuotaUI
old_pattern = re.compile(r'function updateQuotaUI\(\) \{.*?\n\}', re.DOTALL)

new_func = '''function updateQuotaUI() {
  const quotaDisplay = document.getElementById('quota-display');
  const btns = document.querySelectorAll('.btn-gold');
  let btnUpgrade = null;
  btns.forEach(b => { if(b.getAttribute('onclick') === 'openUpgradeModal()') btnUpgrade = b; });
  
  if (isPro) {
    if(quotaDisplay) {
      quotaDisplay.innerHTML = <i class="fa-solid fa-crown" style="color: #fbbf24;"></i><span style="color: #fbbf24; font-weight: 800; letter-spacing: 0.5px;">PRO LIFETIME</span>;
      quotaDisplay.style.borderColor = '#f59e0b';
      quotaDisplay.style.background = 'rgba(245, 158, 11, 0.1)';
      quotaDisplay.style.display = 'flex';
    }
    if (btnUpgrade) btnUpgrade.style.display = 'none';
  } else {
    if(quotaDisplay) quotaDisplay.style.display = 'none';
    if (btnUpgrade) btnUpgrade.style.display = 'inline-flex';
  }
}'''

content = old_pattern.sub(new_func, content, count=1)

with open('d:/Produk-Sell/tools/PDF-Toolkit-Lite/app.js', 'w', encoding='utf-8') as f:
    f.write(content)

print("Berhasil.")
