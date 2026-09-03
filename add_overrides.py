import re

with open('d:/Produk-Sell/tools/PDF-Toolkit-Lite/desktop-build/src/app.js', 'r', encoding='utf-8') as f:
    app_js = f.read()

# Override selectTool to intercept clicks on Premium features
override_logic = r"""
  // Override selectTool untuk proteksi Freemium Desktop
  const originalSelectTool = selectTool;
  selectTool = function(toolKey) {
    if (isDesktopEnv && !isDesktopPro && toolKey !== 'merge' && toolKey !== 'split') {
      showDesktopActivationModal();
      return; // Stop here, do not select the tool
    }
    return originalSelectTool(toolKey);
  };
  
  // Override executeProcessing just in case
  const originalExecuteProcessing = executeProcessing;
  executeProcessing = async function() {
    if (isDesktopEnv && !isDesktopPro && activeTool !== 'merge' && activeTool !== 'split') {
      showDesktopActivationModal();
      return;
    }
    return originalExecuteProcessing();
  };
"""

# Insert right after `document.addEventListener('DOMContentLoaded', updateDesktopUI);`
app_js = app_js.replace("document.addEventListener('DOMContentLoaded', updateDesktopUI);", "document.addEventListener('DOMContentLoaded', updateDesktopUI);\n" + override_logic)

with open('d:/Produk-Sell/tools/PDF-Toolkit-Lite/desktop-build/src/app.js', 'w', encoding='utf-8') as f:
    f.write(app_js)

print("Added overrides to app.js")
