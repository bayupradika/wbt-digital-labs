import re

new_render_func = """function renderFileList() {
    const fileListEl = document.getElementById('file-list');
    const btnProcess = document.getElementById('btn-process');
    
    fileListEl.innerHTML = '';
    
    selectedFiles.forEach((file, index) => {
      const sizeKB = (file.size / 1024).toFixed(1);
      const item = document.createElement('div');
      item.className = 'file-item';
      
      // Drag and drop properties
      item.draggable = true;
      item.dataset.index = index;
      
      item.innerHTML = `
        <div class="file-info" style="display:flex; align-items:center; gap:15px; cursor:grab;">
          <i class="fa-solid fa-grip-vertical" style="color:#64748b; font-size:16px;"></i>
          <i class="fa-solid fa-file-pdf" style="color: var(--primary); font-size: 20px;"></i>
          <div>
            <div class="file-name" style="user-select:none;">${file.name}</div>
            <div class="file-size" style="user-select:none;">${sizeKB} KB</div>
          </div>
        </div>
        <button class="btn-remove" onclick="removeFile(${index})" style="z-index:10;"><i class="fa-solid fa-trash"></i></button>
      `;
      
      // Drag Events
      item.addEventListener('dragstart', (e) => {
        e.dataTransfer.setData('text/plain', index);
        setTimeout(() => item.style.opacity = '0.5', 0);
      });
      
      item.addEventListener('dragend', () => {
        item.style.opacity = '1';
        document.querySelectorAll('.file-item').forEach(el => {
          el.style.borderTop = 'none';
          el.style.borderBottom = 'none';
        });
      });
      
      item.addEventListener('dragover', (e) => {
        e.preventDefault();
        const bounding = item.getBoundingClientRect();
        const offset = bounding.y + (bounding.height / 2);
        if (e.clientY - offset > 0) {
          item.style.borderBottom = '2px solid var(--primary)';
          item.style.borderTop = 'none';
        } else {
          item.style.borderTop = '2px solid var(--primary)';
          item.style.borderBottom = 'none';
        }
      });
      
      item.addEventListener('dragleave', () => {
        item.style.borderTop = 'none';
        item.style.borderBottom = 'none';
      });
      
      item.addEventListener('drop', (e) => {
        e.preventDefault();
        item.style.borderTop = 'none';
        item.style.borderBottom = 'none';
        
        const draggedIdxStr = e.dataTransfer.getData('text/plain');
        if (!draggedIdxStr) return;
        
        const draggedIdx = parseInt(draggedIdxStr);
        let targetIdx = index;
        
        const bounding = item.getBoundingClientRect();
        const offset = bounding.y + (bounding.height / 2);
        if (e.clientY - offset > 0) {
          targetIdx = targetIdx + 1;
        }
        
        if (draggedIdx === targetIdx || draggedIdx === targetIdx - 1 && targetIdx > draggedIdx) {
          return; // No meaningful move
        }
        
        const movedFile = selectedFiles.splice(draggedIdx, 1)[0];
        
        if (draggedIdx < targetIdx) {
          targetIdx--;
        }
        
        selectedFiles.splice(targetIdx, 0, movedFile);
        renderFileList();
      });

      fileListEl.appendChild(item);
    });
  
    const config = toolsConfig[activeTool];
    if (selectedFiles.length >= config.minFiles) {
      btnProcess.disabled = false;
      if (typeof autoPreviewOfficeTool === 'function') {
        autoPreviewOfficeTool();
      }
    } else {
      btnProcess.disabled = true;
    }
  }"""

def replace_renderFileList(file_path):
    with open(file_path, 'r', encoding='utf-8') as f:
        content = f.read()
    
    # We will slice exactly from "function renderFileList()" to "async function autoPreviewOfficeTool()"
    # or to whatever comes next. Let's just find the exact block.
    
    start_str = "function renderFileList() {"
    end_str = "async function autoPreviewOfficeTool() {"
    
    s_idx = content.find(start_str)
    e_idx = content.find(end_str)
    
    if s_idx != -1 and e_idx != -1:
        # Check if there is anything we missed between the end of renderFileList and autoPreview
        # It's usually `  }\n  \n  async function autoPreview...`
        new_content = content[:s_idx] + new_render_func + '\n  \n  ' + content[e_idx:]
        with open(file_path, 'w', encoding='utf-8') as f:
            f.write(new_content)
        print(f"Replaced in {file_path}")
    else:
        print(f"Could not find exact block in {file_path}")

replace_renderFileList('d:/Produk-Sell/tools/PDF-Toolkit-Lite/app.js')
replace_renderFileList('d:/Produk-Sell/tools/PDF-Toolkit-Lite/desktop-build/src/app.js')
