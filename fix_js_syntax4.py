import re

with open('d:/Produk-Sell/tools/PDF-Toolkit-Lite/app.js', 'r', encoding='utf-8') as f:
    content = f.read()

# Replace the specific syntax issue
pattern = re.compile(r'else \{\s*// Feature not natively implemented.*?\s*await new Promise.*?;\s*showToast.*?;\s*\}\s*else if', re.DOTALL)

def replacer(match):
    return 'else if'

# We'll just replace the whole processCurrentTool to be perfectly safe
process_new = '''async function processCurrentTool() {
    
    
    const btnProcess = document.getElementById('btn-process');
    const originalText = btnProcess.innerHTML;
    btnProcess.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Memproses...';
    btnProcess.disabled = true;
  
    try {
      if (activeTool === 'merge') await processMerge();
      else if (activeTool === 'split') await processSplit();
      else if (activeTool === 'remove_pages') await processRemovePages();
      else if (activeTool === 'extract_pages') await processExtractPages();
      else if (activeTool === 'organize') await processOrganize();
      else if (activeTool === 'compress') await processCompress();
      else if (activeTool === 'repair') await processRepair();
      else if (activeTool === 'clean_exif') await processCleanExif();
      else if (activeTool === 'img2pdf') await processImg2Pdf();
      else if (activeTool === 'note2pdf') await processNote2Pdf();
      else if (activeTool === 'html2pdf') await processHtml2Pdf();
      else if (activeTool === 'pdf2img') await processPdf2Img();
      else {
        await new Promise(r => setTimeout(r, 1000));
        showToast('Fitur ini sedang dalam tahap pengembangan untuk versi Offline murni (Coming Soon).', 'warning');
      }
    } catch (e) {
      console.error(e);
      showToast('Gagal memproses file: ' + e.message, 'error');
    } finally {
      btnProcess.innerHTML = originalText;
      btnProcess.disabled = false;
    }
}'''

# Replace the function body
content = re.sub(r'async function processCurrentTool\(\) \{.*?(?=async function)', process_new + '\n\n', content, flags=re.DOTALL)

with open('d:/Produk-Sell/tools/PDF-Toolkit-Lite/app.js', 'w', encoding='utf-8') as f:
    f.write(content)

print("Berhasil fix processCurrentTool")
