import os
import xml.etree.ElementTree as ET
from datetime import datetime

base_url = "https://bayupradika.github.io/wbt-digital-labs/"
root_dir = "d:/Produk-Sell/"
sitemap_path = os.path.join(root_dir, "sitemap.xml")

urlset = ET.Element("urlset")
urlset.set("xmlns", "http://www.sitemaps.org/schemas/sitemap/0.9")

for dirpath, dirnames, filenames in os.walk(root_dir):
    if '.git' in dirpath or 'node_modules' in dirpath or 'venv' in dirpath:
        continue
        
    for filename in filenames:
        if filename.endswith(".html"):
            filepath = os.path.join(dirpath, filename)
            rel_path = os.path.relpath(filepath, root_dir).replace('\\', '/')
            
            # Construct URL
            url_text = base_url + ('' if rel_path == 'index.html' else rel_path)
            
            url = ET.SubElement(urlset, "url")
            loc = ET.SubElement(url, "loc")
            loc.text = url_text
            
            lastmod = ET.SubElement(url, "lastmod")
            lastmod.text = datetime.now().strftime("%Y-%m-%d")
            
            changefreq = ET.SubElement(url, "changefreq")
            priority = ET.SubElement(url, "priority")
            
            if rel_path == 'index.html':
                changefreq.text = "daily"
                priority.text = "1.0"
            elif rel_path.startswith('learning/') or rel_path.startswith('games/') or rel_path.startswith('tools/'):
                changefreq.text = "weekly"
                priority.text = "0.8"
            else:
                changefreq.text = "monthly"
                priority.text = "0.6"

tree = ET.ElementTree(urlset)
tree.write(sitemap_path, encoding='utf-8', xml_declaration=True)
print("Sitemap berhasil diperbarui.")
