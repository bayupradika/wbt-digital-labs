import os
import re
import glob

# Daftar Tools & AI dengan detail masing-masing untuk Header
tool_data = {
    # UTILITIES & TOOLS
    "PDF-Toolkit-Lite": {"title": "Document Toolkit", "feature": "Kelola Dokumen, PDF, Word, Excel, CSV Offline", "right": ''},
    "Social-Media-Video-Downloader": {"title": "Social Video Downloader Pro", "feature": "Unduh Video FB, IG, TikTok, X, YouTube HD", "right": ''},
    "Live-Wallpaper-Video-Studio": {"title": "Live Wallpaper Studio Pro", "feature": "Jadikan Video Singkat Sebagai Wallpaper Desktop", "right": ''},
    "WBT-Image-Studio-Pro": {"title": "Image Studio Pro", "feature": "Kompres, Resize, Filter, Watermark, & Edit Foto Offline", "right": ''},
    "SQLite-Database-Viewer": {"title": "SQLite Database Viewer", "feature": "Buka, Baca, & Eksekusi Query file .db/.sqlite lokal", "right": ''},
    "JSON-Formatter-Viewer": {"title": "JSON Formatter & Viewer", "feature": "Rapikan, Validasi, & Minify Struktur Kode JSON", "right": ''},
    "Mini-API-Tester": {"title": "Mini API Tester", "feature": "REST Client Ringan (GET, POST, PUT, DELETE)", "right": ''},
    "ActivityTracker\\Web-Hosting": {"title": "Activity Tracker Web", "feature": "Pantau Aktivitas Harian dengan Grafik Visual", "right": ''},
    "ActivityTracker": {"title": "Activity Tracker Pro", "feature": "Aplikasi Manajemen Produktivitas", "right": ''},
    "QR-Barcode-Studio": {"title": "QR & Barcode Studio Pro", "feature": "Buat QR Code Kustom (WiFi, URL) & Scan Barcode", "right": ''},
    "Dev-Crypto-Studio": {"title": "Developer Swiss Army Knife", "feature": "Text Diff, Hash MD5/SHA, JWT Decoder, Regex Live", "right": ''},
    "Audio-Studio-Lite": {"title": "Offline Audio Trimmer Pro", "feature": "Potong Suara, Volume Booster, Ekspor ke WAV", "right": ''},
    "3D-Model-Viewer": {"title": "3D Models Viewer Pro", "feature": "Lihat File .FBX, .OBJ, .GLB dengan Auto-Rotate", "right": ''},
    
    # SMART AI SUITE
    "AI-Image-Captioner": {"title": "AI Image Captioner", "feature": "Analisis Gambar & Buat Caption Otomatis untuk Medsos", "right": ''},
    "AI-Photo-Enhancer": {"title": "AI Photo Enhancer", "feature": "Upscale Foto Buram & Resolusi Rendah Jadi HD", "right": ''},
    "AI-Text-Summarizer": {"title": "AI Text Summarizer", "feature": "Rangkum Artikel Panjang Jadi Poin-Poin Ringkas", "right": ''},
    "Background-Eraser-AI": {"title": "Background Eraser AI", "feature": "Hapus Latar Belakang Foto Otomatis (PNG Transparan)", "right": ''},
    "Dataset-Labeling-Tool": {"title": "Dataset Labeling Tool", "feature": "Anotasi Bounding Box (YOLO & Pascal VOC)", "right": ''},
    "Offline-Grammar-Checker": {"title": "Offline Grammar Checker", "feature": "Cek Ejaan KBBI, Tanda Baca, & Kalimat Efektif", "right": ''},
    "Offline-Voice-Transcriber": {"title": "Offline Voice Transcriber", "feature": "Ubah Suara Mikrofon Menjadi Teks Real-time", "right": ''},
    "Receipt-Scanner-AI": {"title": "Receipt Scanner AI", "feature": "Pindai Struk Belanja & Ekstrak Data ke JSON", "right": ''},
    "Smart-Prompt-Generator": {"title": "Smart Prompt Generator", "feature": "Rakit Parameter Prompt Midjourney & ChatGPT", "right": ''},
    "YOLO-Dataset-Viewer": {"title": "YOLO Dataset Viewer", "feature": "Visualisasi Koordinat Bounding Box Dataset YOLO", "right": ''}
}

base_dir = r"D:\Produk-Sell"
all_html_files = glob.glob(os.path.join(base_dir, "**", "*.html"), recursive=True)

favicon_tag = '\n    <link rel="icon" href="/wbt-digital-labs/assets/img/favicon.png" type="image/png">\n'

for filepath in all_html_files:
    # Skip non-relevant folders
    if ".git" in filepath or "node_modules" in filepath:
        continue
        
    with open(filepath, "r", encoding="utf-8") as f:
        content = f.read()

    # 1. INJECT FAVICON EVERYWHERE
    if 'href="/wbt-digital-labs/assets/img/favicon.png"' not in content:
        content = content.replace("</head>", f"{favicon_tag}</head>")
    
    # 2. INJECT HEADER INTO TOOLS & AI ONLY (Exclude game and main portal pages)
    is_tool = "\\tools\\" in filepath and not filepath.endswith("Portal-Tools.html")
    is_ai = "\\ai\\" in filepath
    
    if is_tool or is_ai:
        # Find which tool this is based on path
        tool_key = None
        for key in tool_data.keys():
            if f"\\{key}\\" in filepath or f"\\{key}.html" in filepath:
                tool_key = key
                break
                
        # Some folders might have slightly different names, default fallback
        if not tool_key:
            dir_name = os.path.basename(os.path.dirname(filepath))
            if dir_name in tool_data:
                tool_key = dir_name

        data = tool_data.get(tool_key, {"title": "WBT Digital Labs Tool", "feature": "Alat Cerdas Interaktif", "right": "Versi 1.0"})
        
        # Build the HTML Header
        # Using glassmorphism UI to match wbt theme
        header_html = f"""
    <style>
      .wbt-global-header {{
        position: sticky;
        top: 0;
        z-index: 9999;
        background: rgba(15, 23, 42, 0.85);
        backdrop-filter: blur(12px);
        border-bottom: 1px solid rgba(255,255,255,0.1);
        padding: 12px 24px;
        display: flex;
        justify-content: space-between;
        align-items: center;
        font-family: 'Plus Jakarta Sans', 'Inter', sans-serif;
        box-shadow: 0 10px 30px rgba(0,0,0,0.5);
      }}
      .wbt-global-header-left {{
        display: flex;
        align-items: center;
        gap: 16px;
      }}
      .wbt-global-header-left img {{
        height: 38px;
        width: auto;
        cursor: pointer;
        transition: transform 0.2s;
      }}
      .wbt-global-header-left img:hover {{
        transform: scale(1.05);
      }}
      .wbt-global-header-title {{
        color: white;
        font-weight: 800;
        font-size: 18px;
        letter-spacing: 0.5px;
      }}
      .wbt-global-header-center {{
        color: #94a3b8;
        font-size: 14px;
        font-weight: 500;
        flex-grow: 1;
        text-align: center;
      }}
      .wbt-global-header-right {{
        background: rgba(255,255,255,0.05);
        border: 1px solid rgba(255,255,255,0.1);
        padding: 8px 16px;
        border-radius: 99px;
        font-size: 13px;
      }}
      @media (max-width: 768px) {{
        .wbt-global-header-center {{ display: none; }}
      }}
    </style>
    <header class="wbt-global-header">
      <div class="wbt-global-header-left">
        <a href="https://bayupradika.github.io/wbt-digital-labs/" title="Kembali ke Portal WBT">
            <img src="/wbt-digital-labs/assets/img/wbt-logo.png" alt="WBT Logo">
        </a>
        <div class="wbt-global-header-title">{data['title']}</div>
      </div>
      <div class="wbt-global-header-center">
        {data['feature']}
      </div>
      <div class="wbt-global-header-right">
        {data['right']}
      </div>
    </header>
"""
        
        # Inject if not already present
        if '<header class="wbt-global-header">' not in content:
            # Replace existing native headers if they exist in a known format (like Audio-Studio-Lite)
            content = re.sub(r'<header>.*?Brand.*?WBT Digital Labs.*?</header>', '', content, flags=re.DOTALL)
            
            # Insert right after <body> tag
            content = re.sub(r'<body[^>]*>', lambda m: m.group(0) + header_html, content, count=1)

    with open(filepath, "w", encoding="utf-8") as f:
        f.write(content)

print("SUCCESS: Headers and Favicons injected.")
