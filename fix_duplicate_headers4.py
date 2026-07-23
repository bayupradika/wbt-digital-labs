from bs4 import BeautifulSoup
import os
import glob

def fix_header(filepath):
    try:
        with open(filepath, 'r', encoding='utf-8') as f:
            html = f.read()
            
        soup = BeautifulSoup(html, 'html.parser')
        
        global_header = soup.find('header', class_='wbt-global-header')
        if not global_header:
            return False
            
        global_right = global_header.find('div', class_='wbt-global-header-right')
        if not global_right:
            return False
            
        old_header = soup.find(class_='navbar')
        if not old_header:
            old_header = soup.find(class_='header-nav')
        if not old_header:
            old_header = soup.find(class_='top-nav')
        if not old_header:
            old_header = soup.find(class_='header-container')
        
        # If no specific class found, look for a second <header> tag
        if not old_header:
            headers = soup.find_all('header')
            for h in headers:
                if 'wbt-global-header' not in h.get('class', []):
                    old_header = h
                    break
            
        if not old_header:
            return False
            
        elements_to_move = []
        for child in old_header.find_all(recursive=False):
            if child.name is None:
                continue
            classes = child.get('class', [])
            if child.name == 'a' and ('btn-back' in classes or 'brand' in classes or 'logo' in classes):
                continue
            if child.name == 'div' and ('logo' in classes or 'brand' in classes):
                continue
            
            elements_to_move.append(child)
            
        global_right['style'] = "display: flex; gap: 8px; align-items: center; justify-content: flex-end;"
        global_right.clear()
        
        for el in elements_to_move:
            global_right.append(el)
            
        old_header.decompose()
        
        with open(filepath, 'w', encoding='utf-8') as f:
            f.write(str(soup))
            
        return True
    except Exception as e:
        print(f"Error in {filepath}: {e}")
        return False

count = 0
for directory in ['tools']:
    path_pattern = os.path.join('D:\\Produk-Sell', directory, '**', '*.html')
    for filepath in glob.glob(path_pattern, recursive=True):
        if 'Portal-Tools.html' in filepath:
            continue
        if fix_header(filepath):
            print(f"Fixed header in: {filepath}")
            count += 1
            
print(f"Total files fixed: {count}")
