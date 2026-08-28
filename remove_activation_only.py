import os
import re

def process_file(filepath):
    with open(filepath, 'r', encoding='utf-8') as f:
        content = f.read()

    original_content = content

    # 1. Remove activation code box in HTML
    content = re.sub(r'<p[^>]*>Sudah melakukan pembayaran\?.*?</p>\s*<div[^>]*class=["\']activation-box["\'][^>]*>.*?</div>', '', content, flags=re.DOTALL | re.IGNORECASE)
    
    # 2. For OCR or other tools that might have slightly different HTML (QuickScan-OCR)
    content = re.sub(r'<p[^>]*>.*?Ketik:.*?PRO\d+K.*?</p>\s*<div[^>]*>.*?KODE AKTIVASI.*?</div>', '', content, flags=re.DOTALL | re.IGNORECASE)

    # 3. For WBT-Image-Studio-Pro
    content = re.sub(r'<div style="border-top: 1px solid var\(--border-color\); padding-top: 16px; text-align: left;">\s*<label[^>]*>.*?Ketik.*?WBTIMAGE25K.*?</label>\s*<div[^>]*>\s*<input[^>]*id="activation-code"[^>]*>\s*<button[^>]*>Aktifkan</button>\s*</div>\s*</div>', '', content, flags=re.DOTALL | re.IGNORECASE)

    # 4. Remove activation JS logic (prevent bypass)
    content = content.replace("=== 'PRO20K'", "=== 'IMPOSSIBLE_CODE_999'")
    content = content.replace('=== "PRO20K"', '=== "IMPOSSIBLE_CODE_999"')
    content = content.replace("=== 'WBTIMAGE25K'", "=== 'IMPOSSIBLE_CODE_999'")
    content = content.replace('=== "WBTIMAGE25K"', '=== "IMPOSSIBLE_CODE_999"')
    content = content.replace("=== 'PROLIFETIME'", "=== 'IMPOSSIBLE_CODE_999'")
    content = content.replace('=== "PROLIFETIME"', '=== "IMPOSSIBLE_CODE_999"')
    
    # Fix the alert texts so they don't leak the old promo codes
    content = content.replace("Gunakan kode: PRO20K", "Gunakan kode: PRO3K")
    content = content.replace("Gunakan: PRO20K", "Gunakan: PRO3K")

    if content != original_content:
        with open(filepath, 'w', encoding='utf-8') as f:
            f.write(content)
        return True
    return False

count = 0
for root, _, files in os.walk('d:/Produk-Sell'):
    if 'node_modules' in root or 'venv' in root or '.git' in root:
        continue
    for file in files:
        if file.endswith('.html') or file.endswith('.js'):
            fp = os.path.join(root, file)
            if process_file(fp):
                print(f"Updated {fp}")
                count += 1

print(f"Done! Modified {count} files.")
