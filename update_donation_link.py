def update_link(file_path):
    with open(file_path, 'r', encoding='utf-8') as f:
        html = f.read()

    # Replace the placeholder URL with the actual URL
    html = html.replace("window.open('https://wbtdigitallabs.myr.id/', '_blank')", "window.open('https://wbtdigitallabs.myr.id/donate/traktir-kopi-developer-wbt', '_blank')")

    with open(file_path, 'w', encoding='utf-8') as f:
        f.write(html)
        print("Updated link in " + file_path)

update_link('d:/Produk-Sell/index.html')
update_link('d:/Produk-Sell/tools/PDF-Toolkit-Lite/index.html')
update_link('d:/Produk-Sell/tools/PDF-Toolkit-Lite/desktop-build/src/index.html')
