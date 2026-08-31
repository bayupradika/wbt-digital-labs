import re

with open('d:/Produk-Sell/tools/PDF-Toolkit-Lite/index.html', 'r', encoding='utf-8') as f:
    content = f.read()

# Remove Pricing section
pattern_pricing = re.compile(r'<section id="pricing-section" class="container".*?</section>', re.DOTALL)
content = pattern_pricing.sub('', content)

# Remove Modal upgrade
pattern_upgrade_modal = re.compile(r'<div class="modal-overlay" id="upgrade-modal".*?</div>\s*</div>\s*</div>', re.DOTALL)
content = pattern_upgrade_modal.sub('', content)

# Replace navigation
new_nav = '''
<style>
  .wbt-global-nav { list-style: none; display: flex; gap: 20px; align-items: center; margin: 0; padding: 0; font-family: 'Plus Jakarta Sans', sans-serif; font-weight: 800; font-size: 13px; text-transform: uppercase; }
  .wbt-global-nav li { position: relative; }
  .wbt-global-nav a { color: white; text-decoration: none; padding: 5px 0; display: flex; align-items: center; gap: 5px; transition: 0.2s; }
  .wbt-global-nav a:hover { color: #38bdf8; }
  
  .dropdown-menu { 
    display: none; position: absolute; top: 100%; left: 0; background: rgba(15,23,42,0.95); 
    border: 1px solid rgba(255,255,255,0.1); border-radius: 12px; padding: 10px 0; 
    min-width: 220px; flex-direction: column; z-index: 9999; backdrop-filter: blur(10px);
    box-shadow: 0 10px 30px rgba(0,0,0,0.5);
  }
  .wbt-global-nav li:hover .dropdown-menu { display: flex; }
  .dropdown-menu a { padding: 10px 20px; color: #cbd5e1; font-weight: 600; text-transform: none; font-size: 14px; }
  .dropdown-menu a:hover { background: rgba(56,189,248,0.1); color: #38bdf8; }
  .dropdown-divider { height: 1px; background: rgba(255,255,255,0.1); margin: 5px 0; }
</style>
<ul class="wbt-global-nav">
  <li><a href="javascript:void(0)" onclick="selectTool('merge')">Merge PDF</a></li>
  <li><a href="javascript:void(0)" onclick="selectTool('split')">Split PDF</a></li>
  <li><a href="javascript:void(0)" onclick="selectTool('compress')">Compress PDF</a></li>
  <li>
    <a href="javascript:void(0)">Convert PDF <i class="fa-solid fa-chevron-down" style="font-size: 10px;"></i></a>
    <div class="dropdown-menu">
      <a href="javascript:void(0)" onclick="selectTool('word2pdf')">Word to PDF</a>
      <a href="javascript:void(0)" onclick="selectTool('excel2pdf')">Excel to PDF</a>
      <a href="javascript:void(0)" onclick="selectTool('ppt2pdf')">PowerPoint to PDF</a>
      <a href="javascript:void(0)" onclick="selectTool('jpg2pdf')">JPG to PDF</a>
      <a href="javascript:void(0)" onclick="selectTool('html2pdf')">HTML to PDF</a>
    </div>
  </li>
  <li>
    <a href="javascript:void(0)">ALL WBT Document Tools <i class="fa-solid fa-chevron-down" style="font-size: 10px;"></i></a>
    <div class="dropdown-menu" style="min-width: 250px; max-height: 400px; overflow-y: auto;">
      <a href="javascript:void(0)" onclick="selectTool('merge')"><i class="fa-solid fa-object-group"></i> Merge PDF</a>
      <a href="javascript:void(0)" onclick="selectTool('split')"><i class="fa-solid fa-scissors"></i> Split PDF</a>
      <a href="javascript:void(0)" onclick="selectTool('compress')"><i class="fa-solid fa-compress"></i> Compress PDF</a>
      <a href="javascript:void(0)" onclick="selectTool('edit')"><i class="fa-solid fa-pen-to-square"></i> Edit PDF</a>
      <div class="dropdown-divider"></div>
      <a href="javascript:void(0)" onclick="selectTool('word2pdf')"><i class="fa-solid fa-file-word"></i> Word to PDF</a>
      <a href="javascript:void(0)" onclick="selectTool('pdf2word')"><i class="fa-solid fa-file-export"></i> PDF to Word</a>
      <a href="javascript:void(0)" onclick="selectTool('excel2pdf')"><i class="fa-solid fa-file-excel"></i> Excel to PDF</a>
      <a href="javascript:void(0)" onclick="selectTool('pdf2excel')"><i class="fa-solid fa-table"></i> PDF to Excel</a>
      <div class="dropdown-divider"></div>
      <a href="javascript:void(0)" onclick="selectTool('protect')"><i class="fa-solid fa-lock"></i> Protect PDF</a>
      <a href="javascript:void(0)" onclick="selectTool('unlock')"><i class="fa-solid fa-lock-open"></i> Unlock PDF</a>
      <a href="javascript:void(0)" onclick="selectTool('sign')"><i class="fa-solid fa-signature"></i> Sign PDF</a>
    </div>
  </li>
</ul>
'''
pattern_nav = re.compile(r'<ul class="wbt-global-nav".*?</ul>', re.DOTALL)
content = pattern_nav.sub(new_nav, content)

# Remove the header action container (which had quota and upgrade pro)
pattern_header_action = re.compile(r'<div style="display: flex; align-items: center; gap: 16px;" id="header-action-container">.*?</div>', re.DOTALL)
content = pattern_header_action.sub('', content)

# Remove the old css block for dropdown if any, I just put it inside the nav for simplicity

with open('d:/Produk-Sell/tools/PDF-Toolkit-Lite/index.html', 'w', encoding='utf-8') as f:
    f.write(content)

print("Berhasil update index.html")
