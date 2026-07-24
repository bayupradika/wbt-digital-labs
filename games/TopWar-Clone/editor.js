let designModeActive = false;
let selectedElement = null;
let isDraggingUI = false;
let dragOffsetX = 0;
let dragOffsetY = 0;

// Initialize Editor UI
function initEditor() {
    // Inject Toggle Button
    let toggleBtn = document.createElement('button');
    toggleBtn.id = 'toggle-editor-btn';
    toggleBtn.innerText = 'Design Mode: OFF';
    toggleBtn.onclick = toggleDesignMode;
    document.body.appendChild(toggleBtn);

    // Inject Toolbar
    let toolbar = document.createElement('div');
    toolbar.id = 'editor-toolbar';
    toolbar.style.display = 'none';
    toolbar.innerHTML = `
        <button id="add-btn-btn">Add Button</button>
        <button id="add-text-btn">Add Text</button>
        <button id="add-box-btn">Add Box</button>
        <button id="export-ui-btn" style="background: #047857;">Export UI Code</button>
    `;
    document.body.appendChild(toolbar);

    // Inject Properties Panel
    let props = document.createElement('div');
    props.id = 'editor-properties';
    props.style.display = 'none';
    props.innerHTML = `
        <h3>Properties</h3>
        <label>ID <input type="text" id="prop-id"></label>
        <label>Text/HTML <textarea id="prop-text" rows="3"></textarea></label>
        <label>Background <input type="text" id="prop-bg"></label>
        <label>Color <input type="text" id="prop-color"></label>
        <label>Font Size <input type="text" id="prop-fontsize"></label>
        <label>Width <input type="text" id="prop-width"></label>
        <label>Height <input type="text" id="prop-height"></label>
        <label>Border Radius <input type="text" id="prop-radius"></label>
        
        <div class="btn-group">
            <button id="prop-dup-btn">Duplicate</button>
            <button id="prop-del-btn" class="danger">Delete</button>
        </div>
    `;
    document.body.appendChild(props);

    // Toolbar events
    document.getElementById('add-btn-btn').onclick = () => addElement('button');
    document.getElementById('add-text-btn').onclick = () => addElement('text');
    document.getElementById('add-box-btn').onclick = () => addElement('box');
    document.getElementById('export-ui-btn').onclick = exportUI;

    // Properties events
    document.getElementById('prop-id').onchange = (e) => {
        if(selectedElement) selectedElement.id = e.target.value;
    };
    document.getElementById('prop-text').oninput = (e) => {
        if(selectedElement) selectedElement.innerHTML = e.target.value;
    };
    document.getElementById('prop-bg').oninput = (e) => {
        if(selectedElement) selectedElement.style.background = e.target.value;
    };
    document.getElementById('prop-color').oninput = (e) => {
        if(selectedElement) selectedElement.style.color = e.target.value;
    };
    document.getElementById('prop-fontsize').oninput = (e) => {
        if(selectedElement) selectedElement.style.fontSize = e.target.value;
    };
    document.getElementById('prop-width').oninput = (e) => {
        if(selectedElement) selectedElement.style.width = e.target.value;
    };
    document.getElementById('prop-height').oninput = (e) => {
        if(selectedElement) selectedElement.style.height = e.target.value;
    };
    document.getElementById('prop-radius').oninput = (e) => {
        if(selectedElement) selectedElement.style.borderRadius = e.target.value;
    };
    
    document.getElementById('prop-dup-btn').onclick = duplicateSelected;
    document.getElementById('prop-del-btn').onclick = deleteSelected;

    // Global listeners for drag and drop
    document.addEventListener('mousedown', onEditorMouseDown, true);
    document.addEventListener('mousemove', onEditorMouseMove, true);
    document.addEventListener('mouseup', onEditorMouseUp, true);
}

function toggleDesignMode() {
    designModeActive = !designModeActive;
    let btn = document.getElementById('toggle-editor-btn');
    btn.innerText = designModeActive ? 'Design Mode: ON' : 'Design Mode: OFF';
    btn.style.background = designModeActive ? '#10b981' : '#8b5cf6';
    
    document.getElementById('editor-toolbar').style.display = designModeActive ? 'flex' : 'none';
    
    if(!designModeActive) {
        deselectElement();
        document.getElementById('editor-properties').style.display = 'none';
    }
}

function selectElement(el) {
    if(selectedElement) {
        selectedElement.classList.remove('editor-selected');
    }
    selectedElement = el;
    selectedElement.classList.add('editor-selected');
    
    document.getElementById('editor-properties').style.display = 'flex';
    document.getElementById('prop-id').value = el.id || '';
    document.getElementById('prop-text').value = el.innerHTML || '';
    document.getElementById('prop-bg').value = el.style.background || '';
    document.getElementById('prop-color').value = el.style.color || '';
    document.getElementById('prop-fontsize').value = el.style.fontSize || '';
    document.getElementById('prop-width').value = el.style.width || el.offsetWidth + 'px';
    document.getElementById('prop-height').value = el.style.height || el.offsetHeight + 'px';
    document.getElementById('prop-radius').value = el.style.borderRadius || '';
}

function deselectElement() {
    if(selectedElement) {
        selectedElement.classList.remove('editor-selected');
    }
    selectedElement = null;
    document.getElementById('editor-properties').style.display = 'none';
}

function onEditorMouseDown(e) {
    if(!designModeActive) return;
    
    // Ignore clicks on editor tools
    if(e.target.closest('#editor-toolbar') || e.target.closest('#editor-properties') || e.target.closest('#toggle-editor-btn')) {
        return;
    }
    
    let el = e.target;
    // Walk up until we find an element in hudLayer
    let hudLayer = document.getElementById('hudLayer');
    if(!hudLayer.contains(el) && el !== hudLayer) return;
    
    if(el === hudLayer) {
        deselectElement();
        return;
    }
    
    // Stop propagation so game doesn't react
    e.stopPropagation();
    e.preventDefault();
    
    selectElement(el);
    isDraggingUI = true;
    
    // Make it absolutely positioned if not already
    let rect = el.getBoundingClientRect();
    if(window.getComputedStyle(el).position !== 'absolute') {
        let parentRect = el.offsetParent ? el.offsetParent.getBoundingClientRect() : {left: 0, top: 0};
        el.style.position = 'absolute';
        el.style.left = (rect.left - parentRect.left) + 'px';
        el.style.top = (rect.top - parentRect.top) + 'px';
        el.style.margin = '0';
    }
    
    dragOffsetX = e.clientX - rect.left;
    dragOffsetY = e.clientY - rect.top;
}

function onEditorMouseMove(e) {
    if(!designModeActive || !isDraggingUI || !selectedElement) return;
    e.stopPropagation();
    e.preventDefault();
    
    let parentRect = selectedElement.offsetParent ? selectedElement.offsetParent.getBoundingClientRect() : {left: 0, top: 0};
    
    let newLeft = (e.clientX - dragOffsetX) - parentRect.left;
    let newTop = (e.clientY - dragOffsetY) - parentRect.top;
    
    selectedElement.style.left = newLeft + 'px';
    selectedElement.style.top = newTop + 'px';
}

function onEditorMouseUp(e) {
    if(!designModeActive || !isDraggingUI || !selectedElement) return;
    
    // Find what is underneath by temporarily hiding selected element
    selectedElement.style.pointerEvents = 'none';
    let elUnder = document.elementFromPoint(e.clientX, e.clientY);
    selectedElement.style.pointerEvents = 'auto';
    
    let hudLayer = document.getElementById('hudLayer');
    
    // Valid container: a div inside hudLayer that is not the selected element itself
    let isContainer = elUnder && hudLayer.contains(elUnder) && elUnder.tagName === 'DIV' && elUnder !== hudLayer && !selectedElement.contains(elUnder);
    
    if(isContainer) {
        if(selectedElement.parentNode !== elUnder) {
            let rect = selectedElement.getBoundingClientRect();
            let newParentRect = elUnder.getBoundingClientRect();
            elUnder.appendChild(selectedElement);
            selectedElement.style.left = (rect.left - newParentRect.left) + 'px';
            selectedElement.style.top = (rect.top - newParentRect.top) + 'px';
        }
    } else {
        if(selectedElement.parentNode !== hudLayer) {
            let rect = selectedElement.getBoundingClientRect();
            let newParentRect = hudLayer.getBoundingClientRect();
            hudLayer.appendChild(selectedElement);
            selectedElement.style.left = (rect.left - newParentRect.left) + 'px';
            selectedElement.style.top = (rect.top - newParentRect.top) + 'px';
        }
    }
    
    e.stopPropagation();
    e.preventDefault();
    isDraggingUI = false;
}

function duplicateSelected() {
    if(!selectedElement) return;
    let clone = selectedElement.cloneNode(true);
    clone.classList.remove('editor-selected');
    
    // Generate new ID
    if(clone.id) {
        let baseId = clone.id.replace(/_\d+$/, '');
        let num = 2;
        while(document.getElementById(baseId + '_' + num)) {
            num++;
        }
        clone.id = baseId + '_' + num;
    } else {
        clone.id = 'element_' + Date.now();
    }
    
    // Offset position slightly
    let left = parseInt(clone.style.left || 0);
    let top = parseInt(clone.style.top || 0);
    clone.style.left = (left + 20) + 'px';
    clone.style.top = (top + 20) + 'px';
    
    selectedElement.parentNode.appendChild(clone);
    selectElement(clone);
}

function deleteSelected() {
    if(!selectedElement) return;
    if(confirm("Hapus elemen ini?")) {
        selectedElement.remove();
        deselectElement();
    }
}

function addElement(type) {
    let id = prompt("Masukkan ID untuk elemen baru ini:");
    if(!id) id = type + '_' + Date.now();
    
    let el = document.createElement(type === 'button' ? 'button' : 'div');
    el.id = id;
    el.style.position = 'absolute';
    el.style.left = '50%';
    el.style.top = '50%';
    el.style.transform = 'translate(-50%, -50%)';
    el.style.zIndex = '100';
    
    if(type === 'button') {
        el.innerHTML = 'Tombol Baru';
        el.style.padding = '10px 20px';
        el.style.background = '#3b82f6';
        el.style.color = 'white';
        el.style.border = 'none';
        el.style.borderRadius = '5px';
        el.style.cursor = 'pointer';
        el.style.width = '60px';
        el.style.height = '60px';
    } else if (type === 'text') {
        el.innerHTML = 'Teks Baru';
        el.style.color = 'white';
        el.style.fontWeight = 'bold';
        el.style.fontSize = '20px';
        el.style.textShadow = '1px 1px 2px black';
    } else if (type === 'box') {
        el.style.width = '100px';
        el.style.height = '100px';
        el.style.background = 'rgba(0,0,0,0.5)';
        el.style.border = '2px solid white';
        el.style.borderRadius = '10px';
    }
    
    document.getElementById('hudLayer').appendChild(el);
    selectElement(el);
}

function exportUI() {
    deselectElement();
    let hudLayer = document.getElementById('hudLayer');
    let clone = hudLayer.cloneNode(true);
    
    // Clean up editor specific classes/attributes
    let els = clone.querySelectorAll('*');
    for(let el of els) {
        el.classList.remove('editor-selected', 'editor-draggable');
        if(el.className === '') el.removeAttribute('class');
    }
    
    let code = clone.innerHTML;
    
    // Show in prompt or copy to clipboard
    let htmlStr = `<!-- HUD Layer (Exported) -->\n<div id="hudLayer">\n${code}\n</div>`;
    
    // Try to copy to clipboard
    try {
        navigator.clipboard.writeText(htmlStr).then(() => {
            alert("Kode UI berhasil disalin ke Clipboard! Silakan Paste ke chat AI.");
        }).catch(() => {
            prompt("Gagal copy otomatis. Silakan Copy kode ini secara manual:", htmlStr);
        });
    } catch(e) {
        prompt("Gagal copy otomatis. Silakan Copy kode ini secara manual:", htmlStr);
    }
}

// Start editor when window loads
window.addEventListener('DOMContentLoaded', initEditor);
