@echo off
echo Membuka 10 Aplikasi Tools di Browser Anda...
start "" "%~dp0PDF-Toolkit-Lite\index.html"
timeout /t 1 /nobreak >nul
start "" "%~dp0Image-Compressor-Pro\index.html"
start "" "%~dp0QuickScan-OCR\index.html"
start "" "%~dp0Batch-Image-Resizer\index.html"
start "" "%~dp0EXIF-Photo-Cleaner\index.html"
start "" "%~dp0Offline-Markdown-Editor\index.html"
start "" "%~dp0SQLite-Database-Viewer\index.html"
start "" "%~dp0JSON-Formatter-Viewer\index.html"
start "" "%~dp0Mini-API-Tester\index.html"
start "" "%~dp0Bulk-Photo-Renamer\index.html"
exit
