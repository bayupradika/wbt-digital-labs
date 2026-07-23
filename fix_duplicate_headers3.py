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
            
        # 2. Find old nav bar by class (ignoring tag name)
        old_header = soup.find(class_='nav-bar')
        if not old_header:
            old_header = soup.find(class_='header-nav')
        if not old_header:
            old_header = soup.find(class_='header-container')
        if not old_header:
            old_header = soup.find(class_='top-nav')
        if not old_header:
            old_header = soup.find('nav')
            
        if not old_header:
            # Maybe the file was already processed?
            return False
            
        # We want to move everything EXCEPT elements that look like the old logo/back button
        elements_to_move = []
        for child in old_header.find_all(recursive=False):
            if child.name is None:
                continue # Skip pure text
            classes = child.get('class', [])
            if child.name == 'a' and ('btn-back' in classes or 'brand' in classes or 'logo' in classes):
                continue
            if child.name == 'div' and ('logo' in classes or 'brand' in classes):
                continue
            
            elements_to_move.append(child)
            
        # Move them to global_right
        global_right['style'] = "display: flex; gap: 8px; align-items: center; justify-content: flex-end;"
        
        # Clear out previous contents of global_right just in case (like PRO UNLIMITED)
        global_right.clear()
        
        for el in elements_to_move:
            global_right.append(el)
            
        # 4. Remove old header
        old_header.decompose()
        
        # Write back
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
