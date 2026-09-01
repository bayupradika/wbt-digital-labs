import re

with open('d:/Produk-Sell/tools/PDF-Toolkit-Lite/app.js', 'r', encoding='utf-8') as f:
    content = f.read()

bad_chunk = '''    try {
      if (activeTool === 'merge') await processMerge();
      else if (activeTool === 'split') await processSplit();
      else if (activeTool === 'remove_pages') await processRemovePages();
      else if (activeTool === 'extract_pages') await processExtractPages();
      else if (activeTool === 'organize') await processOrganize();
      else if (activeTool === 'compress') await processCompress();
      else if (activeTool === 'repair') await processRepair();
      else if (activeTool === 'clean_exif') await processCleanExif();
      else {
        // Feature not natively implemented in this Lite version yet
        await new Promise(r => setTimeout(r, 1000));
        showToast('Fitur ini sedang dalam tahap pengembangan untuk versi Offline murni (Coming Soon).', 'warning');
      }
      else if (activeTool === 'img2pdf') await processImg2Pdf();
      else if (activeTool === 'note2pdf') await processNote2Pdf();
      else if (activeTool === 'html2pdf') await processHtml2Pdf();
      else if (activeTool === 'pdf2img') await processPdf2Img();'''

good_chunk = '''    try {
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
        // Feature not natively implemented in this Lite version yet
        await new Promise(r => setTimeout(r, 1000));
        showToast('Fitur ini sedang dalam tahap pengembangan untuk versi Offline murni (Coming Soon).', 'warning');
      }'''

content = content.replace(bad_chunk, good_chunk)

with open('d:/Produk-Sell/tools/PDF-Toolkit-Lite/app.js', 'w', encoding='utf-8') as f:
    f.write(content)

print("Berhasil memperbaiki SyntaxError.")
