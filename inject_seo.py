import os
import re

tools_data = {
    "tools/PDF-Toolkit-Lite/index.html": {
        "url": "https://bayupradika.github.io/wbt-digital-labs/tools/PDF-Toolkit-Lite/",
        "title": "Document Toolkit Offline",
        "desc": "Kelola, gabung, dan kompres PDF 100% Offline.",
        "seo_file": "seo_pdf.txt"
    }
}

for filepath, data in tools_data.items():
    if not os.path.exists(filepath):
        continue
    with open(filepath, 'r', encoding='utf-8') as f:
        content = f.read()

    # Inject canonical and schema in head
    head_injection = f'''
    <link rel="canonical" href="{data['url']}" />
    <meta name="description" content="{data['desc']}" />
    <script type="application/ld+json">
    {{
      "@context": "https://schema.org",
      "@type": "SoftwareApplication",
      "name": "{data['title']}",
      "operatingSystem": "Web Browser",
      "applicationCategory": "UtilitiesApplication",
      "offers": {{
        "@type": "Offer",
        "price": "3000.00",
        "priceCurrency": "IDR"
      }}
    }}
    </script>
    '''
    
    if '<link rel="canonical"' not in content:
        content = content.replace('</title>', '</title>\n' + head_injection)

    # Inject SEO content at the end of the container, before scripts
    with open(data['seo_file'], 'r', encoding='utf-8') as f:
        seo_content = f.read()
    
    if 'seo-content' not in content:
        # Find last closing div before script
        content = re.sub(r'(<script[^>]*src="[^"]*app\.js".*?</script>)', seo_content + r'\n\1', content, count=1, flags=re.DOTALL)
        if 'seo-content' not in content: # fallback
             content = content.replace('</body>', seo_content + '\n</body>')

    with open(filepath, 'w', encoding='utf-8') as f:
        f.write(content)

print("Injected PDF SEO")
