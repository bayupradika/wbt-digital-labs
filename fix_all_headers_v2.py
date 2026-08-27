import os
from bs4 import BeautifulSoup

def process_file(filepath):
    with open(filepath, 'r', encoding='utf-8') as f:
        html = f.read()

    soup = BeautifulSoup(html, 'html.parser')
    
    header = soup.find('header', class_='wbt-global-header')
    if not header:
        return False
        
    title_el = header.find('div', class_='wbt-global-header-title')
    tool_title = title_el.text.strip() if title_el else "WBT Digital Labs"
    
    right_el = header.find('div', class_='wbt-global-header-right')
    
    links_html = ""
    actions_html = ""
    
    if right_el:
        nav_content = right_el.find(class_='nav-content')
        if nav_content:
            nav_links = nav_content.find('ul', class_='nav-links')
            if nav_links:
                links_html = str(nav_links)
            
            actions_div = nav_content.find_all('div', recursive=False)
            for d in actions_div:
                if 'logo-icon' not in str(d):
                    actions_html += str(d)
        else:
            actions_html = "".join([str(c) for c in right_el.contents])

    style_tags = soup.find_all('style')
    for st in style_tags:
        if '.wbt-global-header' in st.text and 'position: sticky;' in st.text:
            st.decompose()
            # Don't break, remove all matching style tags just in case
            
    header.decompose()
    
    new_header_html = f'''
<style>
  .wbt-global-header {{
    position: sticky; top: 20px; z-index: 9999; 
    background: rgba(15,23,42,0.85); backdrop-filter: blur(16px);
    border: 1px solid rgba(255,255,255,0.1); border-radius: 99px; 
    padding: 10px 24px; max-width: 1050px; margin: 20px auto 40px;
    display: flex; justify-content: space-between; align-items: center; 
    box-shadow: 0 20px 40px -10px rgba(0,0,0,0.7);
    font-family: 'Plus Jakarta Sans', 'Inter', sans-serif;
  }}
  .wbt-global-header-left {{ display: flex; align-items: center; gap: 12px; text-decoration: none; }}
  .wbt-global-header-left img {{ height: 34px; transition: transform 0.2s; filter: drop-shadow(0 0 5px rgba(56,189,248,0.3)); }}
  .wbt-global-header-left img:hover {{ transform: scale(1.05); }}
  .wbt-global-header-title {{ color: white; font-weight: 800; font-size: 16px; font-family: 'Outfit', sans-serif; }}
  .wbt-global-header-right {{ display: flex; gap: 16px; align-items: center; }}
  @media (max-width: 768px) {{
    .wbt-global-header {{ border-radius: 16px; flex-direction: column; gap: 12px; padding: 15px; margin: 10px auto 20px; }}
    .wbt-global-header-right {{ flex-wrap: wrap; justify-content: center; }}
  }}
</style>
<header class="wbt-global-header">
  <a href="https://bayupradika.github.io/wbt-digital-labs/" class="wbt-global-header-left" title="Kembali ke Portal WBT">
    <img alt="WBT Logo" src="/wbt-digital-labs/assets/img/wbt-logo.png"/>
    <div class="wbt-global-header-title">{tool_title}</div>
  </a>
  <div class="wbt-global-header-right">
    {links_html}
    {actions_html}
  </div>
</header>
'''
    
    body = soup.find('body')
    if body:
        new_header_soup = BeautifulSoup(new_header_html, 'html.parser')
        body.insert(0, new_header_soup)
        
        with open(filepath, 'w', encoding='utf-8') as f:
            f.write(str(soup))
        return True
    return False

dirs = ['tools', 'ai', 'games', 'game']
base = 'd:/Produk-Sell'
for d in dirs:
    d_path = os.path.join(base, d)
    if not os.path.exists(d_path): continue
    for root, _, files in os.walk(d_path):
        for file in files:
            if file == 'index.html':
                fp = os.path.join(root, file)
                with open(fp, 'r', encoding='utf-8') as f:
                    content = f.read()
                # Check for the NEW exact class string to avoid re-running
                if '.wbt-global-header-title { color: white; font-weight: 800; font-size: 16px;' not in content:
                    print(f"Updating {fp}...")
                    process_file(fp)

print("Done updating headers!")
