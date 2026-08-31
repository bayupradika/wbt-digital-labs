import re

with open('d:/Produk-Sell/tools/PDF-Toolkit-Lite/app.js', 'r', encoding='utf-8') as f:
    content = f.read()

# 1. Remove checkAndConsumeQuota function completely
content = re.sub(r'function checkAndConsumeQuota\(\) \{.*?\n\}', '', content, flags=re.DOTALL)

# 2. Update updateQuotaUI to do nothing
content = re.sub(r'function updateQuotaUI\(\) \{.*?\}', 'function updateQuotaUI() { /* Removed Pro Feature */ }', content, flags=re.DOTALL)

# 3. In processCurrentTool, remove the checkAndConsumeQuota line
content = re.sub(r'if \(\!checkAndConsumeQuota\(\)\) return;', '', content)

# 4. In processCurrentTool, add fallback for unimplemented tools
process_logic_old = '''    if (activeTool === 'merge') await processMerge();
    else if (activeTool === 'split') await processSplit();
    else if (activeTool === 'remove_pages') await processRemovePages();
    else if (activeTool === 'extract_pages') await processExtractPages();
    else if (activeTool === 'organize') await processOrganize();
    else if (activeTool === 'compress') await processCompress();
    else if (activeTool === 'repair') await processRepair();
    else if (activeTool === 'clean_exif') await processCleanExif();'''

process_logic_new = '''    if (activeTool === 'merge') await processMerge();
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
    }'''

content = content.replace(process_logic_old, process_logic_new)

with open('d:/Produk-Sell/tools/PDF-Toolkit-Lite/app.js', 'w', encoding='utf-8') as f:
    f.write(content)

print("Berhasil update app.js")
