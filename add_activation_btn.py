import re

with open('d:/Produk-Sell/tools/PDF-Toolkit-Lite/desktop-build/src/index.html', 'r', encoding='utf-8') as f:
    html = f.read()

# Add Activation button to header
# Find: <ul class="nav-links"> ... </ul>
nav_match = re.search(r'<ul class="nav-links">.*?</ul>', html, flags=re.DOTALL)
if nav_match:
    nav_inner = nav_match.group(0)
    # Check if already added
    if 'desktop-activation-nav' not in nav_inner:
        # Insert activation button at the end of nav-links before closing ul
        activation_btn = '<li><a href="#" id="desktop-activation-nav" style="background:#fbbf24; color:black; padding:5px 15px; border-radius:20px; font-weight:bold; margin-left:15px;"><i class="fa-solid fa-key"></i> ACTIVATION</a></li>'
        new_nav = nav_inner.replace('</ul>', f'  {activation_btn}\n  </ul>')
        html = html.replace(nav_inner, new_nav)
        print("Added ACTIVATION button.")

with open('d:/Produk-Sell/tools/PDF-Toolkit-Lite/desktop-build/src/index.html', 'w', encoding='utf-8') as f:
    f.write(html)
