import re

with open('d:/Produk-Sell/tools/PDF-Toolkit-Lite/desktop-build/src/index.html', 'r', encoding='utf-8') as f:
    html = f.read()

# We want to remove everything from <section class="pricing-section" id="pricing"> up to the footer
# Let's find the closing tag of tools-grid-section and slice there
tools_grid_start = html.find('<section class="tools-grid-section" id="all-tools">')
if tools_grid_start != -1:
    # Find the matching closing </section>
    # Since regex is tricky with nested tags, let's just use simple string splitting based on known landmarks
    # The landmark after tools grid is the pricing section
    pricing_start = html.find('<section class="pricing-section"')
    if pricing_start != -1:
        # keep everything before pricing
        head_and_tools = html[:pricing_start]
        # and we need to keep the script tags at the very end
        # The script tags are <script src="./app.js"></script>\n</body>\n</html>
        tail = '\n<script src="./app.js"></script>\n</body>\n</html>'
        
        # There might be a toast-container before the article? Let's check.
        toast_idx = html.find('<div id="toast-container"></div>')
        if toast_idx != -1:
            head_and_tools += '\n<div id="toast-container"></div>\n'
            
        html = head_and_tools + tail

with open('d:/Produk-Sell/tools/PDF-Toolkit-Lite/desktop-build/src/index.html', 'w', encoding='utf-8') as f:
    f.write(html)
