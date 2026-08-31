import re

with open('d:/Produk-Sell/tools/PDF-Toolkit-Lite/index.html', 'r', encoding='utf-8') as f:
    content = f.read()

# Replace the ENTIRE <div class="wbt-global-header-right"> block
new_right_block = '''<div class="wbt-global-header-right" style="flex-grow:1; justify-content: flex-end; display:flex;">
  <style>
    .nav-links { list-style: none; display: flex; gap: 25px; align-items: center; margin: 0; padding: 0; font-family: 'Inter', sans-serif; font-weight: 700; font-size: 13px; text-transform: uppercase; }
    .nav-links li { position: relative; }
    .nav-links a { color: #f8fafc; text-decoration: none; display: flex; align-items: center; gap: 6px; transition: 0.2s; padding: 10px 0; }
    .nav-links a:hover { color: #ef4444; } /* iLovePDF red hover */
    
    .dropdown-menu { 
      display: none; position: absolute; top: 100%; left: -20px; background: white; 
      border-radius: 8px; padding: 10px 0; min-width: 240px; flex-direction: column; z-index: 9999; 
      box-shadow: 0 10px 30px rgba(0,0,0,0.2);
    }
    .nav-links li:hover .dropdown-menu { display: flex; }
    .dropdown-menu a { padding: 10px 20px; color: #334155; font-weight: 600; text-transform: none; font-size: 14px; }
    .dropdown-menu a:hover { background: rgba(239,68,68,0.1); color: #ef4444; }
    .dropdown-divider { height: 1px; background: #e2e8f0; margin: 5px 0; }
  </style>
  <ul class="nav-links">
    <li><a href="javascript:void(0)" onclick="selectTool('merge')">Merge PDF</a></li>
    <li><a href="javascript:void(0)" onclick="selectTool('split')">Split PDF</a></li>
    <li><a href="javascript:void(0)" onclick="selectTool('compress')">Compress PDF</a></li>
    <li>
      <a href="javascript:void(0)">Convert PDF <i class="fa-solid fa-chevron-down" style="font-size: 10px;"></i></a>
      <div class="dropdown-menu">
        <a href="javascript:void(0)" onclick="selectTool('word2pdf')"><i class="fa-solid fa-file-word" style="width:20px; color:#3b82f6;"></i> Word to PDF</a>
        <a href="javascript:void(0)" onclick="selectTool('excel2pdf')"><i class="fa-solid fa-file-excel" style="width:20px; color:#10b981;"></i> Excel to PDF</a>
        <a href="javascript:void(0)" onclick="selectTool('ppt2pdf')"><i class="fa-solid fa-file-powerpoint" style="width:20px; color:#f97316;"></i> PowerPoint to PDF</a>
        <a href="javascript:void(0)" onclick="selectTool('jpg2pdf')"><i class="fa-solid fa-image" style="width:20px; color:#eab308;"></i> JPG to PDF</a>
        <a href="javascript:void(0)" onclick="selectTool('html2pdf')"><i class="fa-brands fa-html5" style="width:20px; color:#14b8a6;"></i> HTML to PDF</a>
      </div>
    </li>
    <li>
      <a href="javascript:void(0)">ALL WBT Document Tools <i class="fa-solid fa-chevron-down" style="font-size: 10px;"></i></a>
      <div class="dropdown-menu" style="min-width: 280px; max-height: 70vh; overflow-y: auto; right: 0; left: auto;">
        <a href="javascript:void(0)" onclick="selectTool('merge')"><i class="fa-solid fa-object-group" style="width:20px; color:#ef4444;"></i> Merge PDF</a>
        <a href="javascript:void(0)" onclick="selectTool('split')"><i class="fa-solid fa-scissors" style="width:20px; color:#f97316;"></i> Split PDF</a>
        <a href="javascript:void(0)" onclick="selectTool('compress')"><i class="fa-solid fa-compress" style="width:20px; color:#10b981;"></i> Compress PDF</a>
        <a href="javascript:void(0)" onclick="selectTool('edit')"><i class="fa-solid fa-pen-to-square" style="width:20px; color:#8b5cf6;"></i> Edit PDF</a>
        <div class="dropdown-divider"></div>
        <a href="javascript:void(0)" onclick="selectTool('word2pdf')"><i class="fa-solid fa-file-word" style="width:20px; color:#3b82f6;"></i> Word to PDF</a>
        <a href="javascript:void(0)" onclick="selectTool('pdf2word')"><i class="fa-solid fa-file-export" style="width:20px; color:#3b82f6;"></i> PDF to Word</a>
        <a href="javascript:void(0)" onclick="selectTool('excel2pdf')"><i class="fa-solid fa-file-excel" style="width:20px; color:#10b981;"></i> Excel to PDF</a>
        <a href="javascript:void(0)" onclick="selectTool('pdf2excel')"><i class="fa-solid fa-table" style="width:20px; color:#10b981;"></i> PDF to Excel</a>
        <div class="dropdown-divider"></div>
        <a href="javascript:void(0)" onclick="selectTool('protect')"><i class="fa-solid fa-lock" style="width:20px; color:#ef4444;"></i> Protect PDF</a>
        <a href="javascript:void(0)" onclick="selectTool('unlock')"><i class="fa-solid fa-lock-open" style="width:20px; color:#22c55e;"></i> Unlock PDF</a>
        <a href="javascript:void(0)" onclick="selectTool('sign')"><i class="fa-solid fa-signature" style="width:20px; color:#6366f1;"></i> Sign PDF</a>
      </div>
    </li>
  </ul>
</div>
  </header>'''

pattern_right = re.compile(r'<div class="wbt-global-header-right">.*?</header>', re.DOTALL)
content = pattern_right.sub(new_right_block, content)

with open('d:/Produk-Sell/tools/PDF-Toolkit-Lite/index.html', 'w', encoding='utf-8') as f:
    f.write(content)

print("Berhasil update header nav.")
