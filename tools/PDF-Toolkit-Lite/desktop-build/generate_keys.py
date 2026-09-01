import random
import string
import hashlib
import csv

def generate_key():
    # Format: WBT-XXXX-YYYY
    # YYYY is the first 4 chars of SHA1(XXXX + "WBT_SECRET_2026")
    charset = string.ascii_uppercase + string.digits
    part1 = ''.join(random.choices(charset, k=4))
    
    secret = "WBT_SECRET_2026"
    hash_obj = hashlib.sha1((part1 + secret).encode('utf-8'))
    part2 = hash_obj.hexdigest()[:4].upper()
    
    return f"WBT-{part1}-{part2}"

# Generate 1000 keys
keys = [generate_key() for _ in range(1000)]

# Save to CSV for Mayar.id import
with open('d:/Produk-Sell/tools/PDF-Toolkit-Lite/desktop-build/mayar_desktop_keys.csv', 'w', newline='') as f:
    writer = csv.writer(f)
    writer.writerow(['Serial Number'])
    for key in keys:
        writer.writerow([key])

print("Berhasil membuat 1000 kunci lisensi di mayar_desktop_keys.csv")
