with open('d:/Produk-Sell/tools/PDF-Toolkit-Lite/desktop-build/src/index.html', 'r', encoding='utf-8') as f:
    html = f.read()

# We need to find the end of the tools-grid-section.
# The structure is: <section class="tools-grid-section" id="all-tools"> ... </section>
# followed by <section class="pricing-section container" id="pricing-section">

pricing_idx = html.find('<section class="pricing-section')

if pricing_idx != -1:
    head = html[:pricing_idx]
    tail = '\n<div id="toast-container"></div>\n<script src="./app.js"></script>\n</body>\n</html>'
    html = head + tail
    print("Found pricing section and removed it.")
else:
    # try finding features section
    article_idx = html.find('<article class="seo-content"')
    if article_idx != -1:
        head = html[:article_idx]
        tail = '\n<div id="toast-container"></div>\n<script src="./app.js"></script>\n</body>\n</html>'
        html = head + tail
        print("Found article section and removed it.")

with open('d:/Produk-Sell/tools/PDF-Toolkit-Lite/desktop-build/src/index.html', 'w', encoding='utf-8') as f:
    f.write(html)
