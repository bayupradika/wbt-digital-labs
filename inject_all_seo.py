import os
import re
from bs4 import BeautifulSoup

def format_name(folder_name):
    # Convert 'AI-Board-Solver' to 'AI Board Solver'
    return folder_name.replace('-', ' ')

def process_file(filepath, root_dir, folder_name):
    with open(filepath, 'r', encoding='utf-8') as f:
        html = f.read()

    # Skip if already has canonical or seo-content
    if '<link rel="canonical"' in html or 'seo-content' in html:
        return False

    soup = BeautifulSoup(html, 'html.parser')
    
    # Get Tool Title
    tool_title = format_name(folder_name)
    title_el = soup.find('div', class_='wbt-global-header-title')
    if title_el and title_el.text.strip():
        tool_title = title_el.text.strip()
        
    url_path = filepath.replace('\\', '/').split('Produk-Sell/')[1].replace('index.html', '')
    full_url = f"https://bayupradika.github.io/wbt-digital-labs/{url_path}"

    # Determine category
    category = "UtilitiesApplication"
    if 'ai/' in url_path:
        category = "WebApplication" # Or AI
    elif 'game/' in url_path or 'games/' in url_path:
        category = "GameApplication"

    head_injection = f'''
    <link rel="canonical" href="{full_url}" />
    <meta name="description" content="Gunakan {tool_title} secara gratis dan 100% offline dari browser Anda tanpa instalasi." />
    <script type="application/ld+json">
    {{
      "@context": "https://schema.org",
      "@type": "{ "VideoGame" if category == "GameApplication" else "SoftwareApplication" }",
      "name": "{tool_title}",
      "operatingSystem": "Web Browser",
      "applicationCategory": "{category}",
      "offers": {{
        "@type": "Offer",
        "price": "3000.00",
        "priceCurrency": "IDR"
      }}
    }}
    </script>
'''

    seo_injection = f'''
<article class="seo-content" style="margin-top: 60px; padding: 24px; background: rgba(15, 23, 42, 0.5); border-radius: 16px; border: 1px solid rgba(255,255,255,0.1); color: #cbd5e1; line-height: 1.6; max-width: 1100px; margin-left: auto; margin-right: auto; margin-bottom: 40px;">
  <h2 style="color: white; font-size: 24px; margin-bottom: 16px;">{tool_title} - Cepat, Aman, & 100% Offline</h2>
  <p style="margin-bottom: 16px;">Selamat datang di <strong>{tool_title}</strong> dari WBT Digital Labs. Aplikasi web pintar ini dirancang untuk menyelesaikan pekerjaan Anda dengan kecepatan maksimal tanpa perlu mengunggah data atau file Anda ke server pihak ketiga. Semua proses berjalan secara aman langsung di dalam memori perangkat Anda (Client-side).</p>
  
  <h3 style="color: white; font-size: 20px; margin-top: 24px; margin-bottom: 12px;">Keunggulan Sistem WBT Digital Labs</h3>
  <ul style="margin-left: 20px; margin-bottom: 16px; list-style-type: disc;">
    <li><strong>Privasi Penuh:</strong> Karena berbasis offline dan teknologi WebAssembly/Client-Side, privasi data Anda 100% terjamin aman.</li>
    <li><strong>Performa Tinggi:</strong> Bebas dari jeda *loading* server. Pemrosesan instan secepat perangkat Anda.</li>
    <li><strong>Lintas Platform:</strong> Bisa dibuka dari PC Windows, Mac, Android, maupun iOS tanpa instalasi aplikasi tambahan.</li>
  </ul>

  <h3 style="color: white; font-size: 20px; margin-top: 24px; margin-bottom: 12px;">Pertanyaan yang Sering Diajukan (FAQ)</h3>
  <p><strong>Bagaimana cara menggunakan aplikasi ini?</strong> Cukup berinteraksi langsung melalui antarmuka di atas. Tersedia kuota penggunaan gratis harian yang akan di-reset setiap hari.</p>
  <p><strong>Apakah fitur PRO bersifat langganan bulanan?</strong> Tidak! Upgrade PRO hanya memerlukan satu kali pembayaran mikro yang sangat terjangkau (Rp 3.000) dan berlaku seumur hidup untuk fitur ini.</p>
</article>
'''

    # Inject into head
    if soup.head:
        # Find closing title or just append to head
        head_str = str(soup.head)
        if '</title>' in head_str:
            new_head = head_str.replace('</title>', f'</title>\n{head_injection}')
            html = html.replace(head_str, new_head, 1)
        else:
            new_head = head_str.replace('</head>', f'{head_injection}\n</head>')
            html = html.replace(head_str, new_head, 1)

    # Inject into body (before script tags or end of body)
    if '<script src="script.js"' in html:
        html = html.replace('<script src="script.js"', seo_injection + '\n<script src="script.js"')
    elif '<script src="app.js"' in html:
        html = html.replace('<script src="app.js"', seo_injection + '\n<script src="app.js"')
    elif '</body>' in html:
        html = html.replace('</body>', seo_injection + '\n</body>')

    with open(filepath, 'w', encoding='utf-8') as f:
        f.write(html)
        
    return True

dirs = ['tools', 'ai', 'games', 'game']
base = 'd:/Produk-Sell'
count = 0
for d in dirs:
    d_path = os.path.join(base, d)
    if not os.path.exists(d_path): continue
    for root, _, files in os.walk(d_path):
        for file in files:
            if file == 'index.html':
                fp = os.path.join(root, file)
                folder_name = os.path.basename(root)
                if folder_name in ['tools', 'ai', 'games', 'game', 'Produk-Sell']:
                     continue # Skip root portal indexes
                if process_file(fp, root, folder_name):
                    print(f"Injected SEO to {folder_name}")
                    count += 1

print(f"Done updating SEO for {count} tools!")
