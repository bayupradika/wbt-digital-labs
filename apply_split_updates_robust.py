import re

def update_app_js(file_path):
    with open(file_path, 'r', encoding='utf-8') as f:
        app_js = f.read()

    # Normalize to \n
    app_js = app_js.replace('\r\n', '\n')

    # 1. Update split toolsConfig
    # Use regex to find the settings block for split
    split_pattern = re.compile(r"split:\s*\{(?:[^{}]|(?:\{[^{}]*\}))*?settings:\s*`(.*?)`", re.DOTALL)
    
    new_settings = """
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
      """
    
    def repl_split(match):
        full = match.group(0)
        old_settings = match.group(1)
        return full.replace(old_settings, new_settings)
        
    app_js = split_pattern.sub(repl_split, app_js)

    # 2. Add Event Listeners inside selectTool
    # It failed because of whitespace. Let's use regex.
    selectTool_pattern = re.compile(r"(settingsDiv\.style\.display = 'flex';)")
    new_selectTool = """settingsDiv.style.display = 'flex';
      
      if (toolKey === 'split') {
        const btnAdd = document.getElementById('btn-add-split');
        const btnRemove = document.getElementById('btn-remove-split');
        const container = document.getElementById('split-inputs-container');
        const countSpan = document.getElementById('split-count');
        if (btnAdd && btnRemove && container && countSpan) {
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
        }
      }"""
    
    # Apply only if not already applied
    if "const btnAdd = document.getElementById('btn-add-split');" not in app_js:
        app_js = selectTool_pattern.sub(new_selectTool, app_js, count=1)


    # 3. Modify renderFileList to hide dropzone and add "+ Tambahkan File"
    # Find the start of the foreach loop in renderFileList
    # It looks like:
    # fileListEl.innerHTML = '';
    # selectedFiles.forEach((file, index) => {
    
    renderFileList_pattern = re.compile(r"fileListEl\.innerHTML = '';\s*selectedFiles\.forEach\(\(file, index\) => \{", re.DOTALL)
    
    new_renderFileList = """fileListEl.innerHTML = '';
      
      const dropzone = document.getElementById('dropzone');
      if (selectedFiles.length > 0) {
        if(dropzone) dropzone.style.display = 'none';
        
        const addBtnContainer = document.createElement('div');
        addBtnContainer.style.textAlign = 'right';
        addBtnContainer.style.marginBottom = '15px';
        addBtnContainer.innerHTML = `<button onclick="document.getElementById('file-input').click()" style="background:var(--primary); color:white; border:none; padding:8px 15px; border-radius:5px; cursor:pointer; font-weight:bold;"><i class="fa-solid fa-plus"></i> Tambahkan File</button>`;
        fileListEl.appendChild(addBtnContainer);
      } else {
        if(dropzone) dropzone.style.display = '';
      }
      
      selectedFiles.forEach((file, index) => {"""
      
    if "Tambahkan File" not in app_js:
        app_js = renderFileList_pattern.sub(new_renderFileList, app_js, count=1)

    with open(file_path, 'w', encoding='utf-8') as f:
        f.write(app_js)
        print("Updated " + file_path)

update_app_js('d:/Produk-Sell/tools/PDF-Toolkit-Lite/app.js')
update_app_js('d:/Produk-Sell/tools/PDF-Toolkit-Lite/desktop-build/src/app.js')
