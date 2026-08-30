import os
import glob

# Obfuscated Anti-Theft Script
# Checks if domain is bayupradika.github.io, localhost, or file protocol. Otherwise crashes the page and redirects.
lock_script = '''
<script>var _0x1a2b=["bayupradika.github.io","localhost","127.0.0.1","hostname","location","protocol","file:","indexOf","innerHTML","","write","<div style='font-family:sans-serif; text-align:center; margin-top:100px; color:#fff; background:#000; padding:50px;'><h1>⚠️ Akses Ditolak (Anti-Piracy System)</h1><p>Aplikasi ini dilindungi hak cipta oleh WBT Digital Labs.</p><p>Mendeteksi kloning ilegal di luar domain resmi.</p><a href='https://bayupradika.github.io/wbt-digital-labs/' style='color:#38bdf8;'>Kembali ke situs resmi</a></div>","href","https://bayupradika.github.io/wbt-digital-labs/"];!function(){var i=[_0x1a2b[0],_0x1a2b[1],_0x1a2b[2]],a=window[_0x1a2b[4]][_0x1a2b[3]];if(window[_0x1a2b[4]][_0x1a2b[5]]!==_0x1a2b[6]){for(var b=!1,c=0;c<i.length;c++)if(-1!==a[_0x1a2b[7]](i[c])){b=!0;break}b||(document[_0x1a2b[8]]=_0x1a2b[9],document[_0x1a2b[10]](_0x1a2b[11]),window[_0x1a2b[4]][_0x1a2b[12]]=_0x1a2b[13])}}();</script>
'''

# Find all HTML files
html_files = glob.glob('d:/Produk-Sell/**/*.html', recursive=True)
count = 0

for file in html_files:
    # Skip if it's in a virtual environment or node_modules (just in case)
    if 'venv' in file or 'node_modules' in file:
        continue
        
    with open(file, 'r', encoding='utf-8') as f:
        content = f.read()
        
    # Check if already injected
    if "_0x1a2b" in content:
        continue
        
    # Inject right after <head>
    if '<head>' in content:
        new_content = content.replace('<head>', f'<head>\n{lock_script}', 1)
        with open(file, 'w', encoding='utf-8') as f:
            f.write(new_content)
        count += 1
    elif '<head ' in content: # In case of <head lang="...">
        # split by <head
        parts = content.split('<head', 1)
        # find the closing >
        head_end = parts[1].find('>')
        if head_end != -1:
            injected = parts[0] + '<head' + parts[1][:head_end+1] + '\n' + lock_script + parts[1][head_end+1:]
            with open(file, 'w', encoding='utf-8') as f:
                f.write(injected)
            count += 1

print(f"Domain Lock script injected into {count} HTML files.")
