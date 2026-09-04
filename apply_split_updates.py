import re

def update_app_js(file_path):
    with open(file_path, 'r', encoding='utf-8') as f:
        app_js = f.read()

    # 1. Update split toolsConfig
    old_split_settings = r"""settings: `
        <div class="setting-group">
          <label class="setting-label">Rentang Halaman (Contoh: 1-3, 5)</label>
          <input type="text" id="split-range" class="setting-input" placeholder="Kosongkan untuk pisah semua halaman">
        </div>
      `"""
    new_split_settings = r"""settings: `
        <div class="setting-group" style="width: 100%;">
          <div style="display:flex; justify-content:space-between; align-items:center;">
            <label class="setting-label">Rentang Halaman (Contoh: 1-3, 5)</label>
            <div style="display:flex; gap:10px; margin-bottom:10px;">
              <button id="btn-remove-split" class="btn-action" style="padding:5px 10px; background:#ef4444; color:white; border-radius:5px; border:none; cursor:pointer;" title="Kurangi Input"><i class="fa-solid fa-minus"></i></button>
              <span id="split-count" style="color:white; font-weight:bold; align-self:center;">1</span>
              <button id="btn-add-split" class="btn-action" style="padding:5px 10px; background:#10b981; color:white; border-radius:5px; border:none; cursor:pointer;" title="Tambah Input"><i class="fa-solid fa-plus"></i></button>
            </div>
          </div>
          <div id="split-inputs-container" style="display:flex; flex-direction:column; gap:10px;">
            <input type="text" class="setting-input split-range-input" placeholder="Pisahan 1: Kosongkan untuk pisah semua">
          </div>
        </div>
      `"""
    app_js = app_js.replace(old_split_settings, new_split_settings)

    # 2. Add Event Listeners inside selectTool
    # Right after `settingsDiv.style.display = 'flex';`
    old_select = "settingsDiv.style.display = 'flex';"
    new_select = """settingsDiv.style.display = 'flex';
      
      if (toolKey === 'split') {
        const btnAdd = document.getElementById('btn-add-split');
        const btnRemove = document.getElementById('btn-remove-split');
        const container = document.getElementById('split-inputs-container');
        const countSpan = document.getElementById('split-count');
        
        let splitCount = 1;
        
        btnAdd.onclick = () => {
          splitCount++;
          countSpan.textContent = splitCount;
          const input = document.createElement('input');
          input.type = 'text';
          input.className = 'setting-input split-range-input';
          input.placeholder = `Pisahan ${splitCount}: Kosongkan untuk pisah semua`;
          container.appendChild(input);
        };
        
        btnRemove.onclick = () => {
          if (splitCount > 1) {
            container.removeChild(container.lastChild);
            splitCount--;
            countSpan.textContent = splitCount;
          }
        };
      }"""
    app_js = app_js.replace(old_select, new_select)

    # 3. Replace processSplit logic
    # Find the old processSplit function exactly up to processRemovePages
    old_processSplit_pattern = re.compile(r'async function processSplit\(\) \{.*?\}\s*(?=async function processRemovePages\(\))', re.DOTALL)
    
    new_processSplit = r"""async function processSplit() {
    const arrayBuffer = await selectedFiles[0].arrayBuffer();
    const pdf = await PDFDocument.load(arrayBuffer);
    const totalPages = pdf.getPageCount();
    
    const inputs = document.querySelectorAll('.split-range-input');
    let partNum = 1;
    
    for (let input of inputs) {
      const rangeInput = input.value.trim();
      let targetIndices = [];
      
      if (!rangeInput) {
        for (let i = 0; i < totalPages; i++) {
          const splitPdf = await PDFDocument.create();
          const [copiedPage] = await splitPdf.copyPages(pdf, [i]);
          splitPdf.addPage(copiedPage);
          const pdfBytes = await splitPdf.save();
          downloadBlob(pdfBytes, `Split_Part${partNum}_Page${i+1}_WBT_Docs.pdf`, 'application/pdf');
          await new Promise(r => setTimeout(r, 400));
        }
        partNum++;
        continue;
      }
      
      const ranges = rangeInput.split(',');
      for (const r of ranges) {
        const parts = r.split('-');
        if (parts.length === 2) {
          const start = Math.max(1, parseInt(parts[0].trim())) - 1;
          const end = Math.min(totalPages, parseInt(parts[1].trim())) - 1;
          for (let i = start; i <= end; i++) {
             if(!targetIndices.includes(i)) targetIndices.push(i);
          }
        } else {
          const idx = parseInt(parts[0].trim());
          if (!isNaN(idx)) {
            const validIdx = Math.max(1, Math.min(totalPages, idx)) - 1;
            if(!targetIndices.includes(validIdx)) targetIndices.push(validIdx);
          }
        }
      }
      
      targetIndices.sort((a,b) => a - b);
      
      if (targetIndices.length > 0) {
        const splitPdf = await PDFDocument.create();
        const copiedPages = await splitPdf.copyPages(pdf, targetIndices);
        copiedPages.forEach((page) => splitPdf.addPage(page));
        const pdfBytes = await splitPdf.save();
        
        let filename = inputs.length > 1 ? `Split_Part${partNum}_WBT_Docs.pdf` : 'Split_Document_WBT_Docs.pdf';
        downloadBlob(pdfBytes, filename, 'application/pdf');
        await new Promise(r => setTimeout(r, 600));
      }
      
      partNum++;
    }
  }
  """
    app_js = old_processSplit_pattern.sub(new_processSplit, app_js)

    # 4. Modify renderFileList to hide dropzone and add "+ Tambahkan File"
    old_render_start = """fileListEl.innerHTML = '';
      
      selectedFiles.forEach((file, index) => {"""
    new_render_start = """fileListEl.innerHTML = '';
      
      const dropzone = document.getElementById('dropzone');
      if (selectedFiles.length > 0) {
        dropzone.style.display = 'none';
        
        const addBtnContainer = document.createElement('div');
        addBtnContainer.style.textAlign = 'right';
        addBtnContainer.style.marginBottom = '15px';
        addBtnContainer.innerHTML = `<button onclick="document.getElementById('file-input').click()" style="background:var(--primary); color:white; border:none; padding:8px 15px; border-radius:5px; cursor:pointer; font-weight:bold;"><i class="fa-solid fa-plus"></i> Tambahkan File</button>`;
        fileListEl.appendChild(addBtnContainer);
      } else {
        dropzone.style.display = '';
      }
      
      selectedFiles.forEach((file, index) => {"""
    app_js = app_js.replace(old_render_start, new_render_start)

    with open(file_path, 'w', encoding='utf-8') as f:
        f.write(app_js)

update_app_js('d:/Produk-Sell/tools/PDF-Toolkit-Lite/app.js')
update_app_js('d:/Produk-Sell/tools/PDF-Toolkit-Lite/desktop-build/src/app.js')

print("Applied updates successfully!")
