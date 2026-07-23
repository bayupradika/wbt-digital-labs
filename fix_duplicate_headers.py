from bs4 import BeautifulSoup
import os
import glob

def fix_header(filepath):
    try:
        with open(filepath, 'r', encoding='utf-8') as f:
            html = f.read()
            
        soup = BeautifulSoup(html, 'html.parser')
        
        # 1. Find global header
        global_header = soup.find('header', class_='wbt-global-header')
        if not global_header:
            return False
            
        global_right = global_header.find('div', class_='wbt-global-header-right')
        if not global_right:
            return False
            
        # 2. Find old nav bar
        old_header = soup.find('div', class_='nav-bar') or soup.find('div', class_='header-nav')
        if not old_header:
            # Maybe it's a <nav> or something else
            old_header = soup.find('header', class_='header')
            if not old_header:
                return False
                
        # 3. Identify elements to move
        # We want to move everything EXCEPT elements that look like the old logo/back button
        elements_to_move = []
        for child in old_header.find_all(recursive=False):
            if child.name == 'a' and ('btn-back' in child.get('class', []) or 'brand' in child.get('class', [])):
                continue
            if child.name == 'div' and 'logo' in child.get('class', []):
                continue
            
            elements_to_move.append(child)
            
        # Move them to global_right
        # Ensure global_right has a flex layout to hold them
        global_right['style'] = "display: flex; gap: 8px; align-items: center;"
        
        for el in elements_to_move:
            global_right.append(el)
            
        # 4. Remove old header
        old_header.decompose()
        
        # 5. Remove any leftover inline <br> or hr that might have been adjacent (optional)
        
        # Write back
        with open(filepath, 'w', encoding='utf-8') as f:
            f.write(str(soup))
            
        return True
    except Exception as e:
        print(f"Error in {filepath}: {e}")
        return False

count = 0
for directory in ['ai', 'tools']:
    path_pattern = os.path.join('D:\\Produk-Sell', directory, '**', '*.html')
    for filepath in glob.glob(path_pattern, recursive=True):
        if 'Portal-Tools.html' in filepath:
            continue
        if fix_header(filepath):
            print(f"Fixed header in: {filepath}")
            count += 1
            
print(f"Total files fixed: {count}")
