$toolsData = @(
  @{ name="PDF-Toolkit-Lite"; title="PDF Toolkit Lite Pro"; price=20000; key="pdf_toolkit_is_pro" },
  @{ name="Image-Compressor-Pro"; title="Image Compressor Pro"; price=12000; key="img_comp_pro" },
  @{ name="QuickScan-OCR"; title="QuickScan OCR Pro"; price=20000; key="ocr_pro" },
  @{ name="Batch-Image-Resizer"; title="Batch Image Resizer Pro"; price=12000; key="resizer_pro" },
  @{ name="EXIF-Photo-Cleaner"; title="EXIF Photo Cleaner Pro"; price=8000; key="exif_pro" },
  @{ name="Offline-Markdown-Editor"; title="Offline Markdown Editor Pro"; price=16000; key="md_pro" },
  @{ name="SQLite-Database-Viewer"; title="SQLite Database Viewer Pro"; price=20000; key="sql_pro" },
  @{ name="JSON-Formatter-Viewer"; title="JSON Formatter Pro"; price=8000; key="json_pro" },
  @{ name="Mini-API-Tester"; title="Mini API Tester Pro"; price=20000; key="api_pro" },
  @{ name="Bulk-Photo-Renamer"; title="Bulk Photo Renamer Pro"; price=8000; key="rename_pro" }
)

foreach ($t in $toolsData) {
  $dir = "d:\Produk-Sell\tools\" + $t.name
  $htmlPath = Join-Path $dir "index.html"
  $jsPath = Join-Path $dir "app.js"

  if (Test-Path $htmlPath) {
    $html = Get-Content $htmlPath -Raw
    if ($html -notmatch "midtrans-pay.js") {
      $html = $html -replace '</body>', '<script src="../midtrans-pay.js"></script>`r`n</body>'
      $btnHtml = '<button onclick="payWithMidtrans()" style="background:#002855; color:white; font-weight:700; padding:14px 20px; border-radius:12px; border:none; cursor:pointer; width:100%; margin:15px 0; font-size:15px; box-shadow:0 4px 15px rgba(0,40,85,0.4); transition:all 0.2s;"><i class="fa-solid fa-credit-card" style="color:#60a5fa; margin-right:8px;"></i> Bayar Otomatis via Midtrans</button>'
      $html = $html -replace '<img src="https://api\.qrserver\.com[^>]+>', $btnHtml
      Set-Content -Path $htmlPath -Value $html
    }
  }

  if (Test-Path $jsPath) {
    $js = Get-Content $jsPath -Raw
    if ($js -notmatch "payWithMidtrans") {
      $payFunc = "`r`nfunction payWithMidtrans() {`r`n  MidtransPay.checkout({`r`n    itemName: '" + $t.title + "',`r`n    price: " + $t.price + ",`r`n    onSuccess: function() {`r`n      isPro = true;`r`n      localStorage.setItem('" + $t.key + "', 'true');`r`n      updateQuota();`r`n      if(typeof closeUpgradeModal === 'function') closeUpgradeModal();`r`n      if(typeof closeModal === 'function') closeModal();`r`n      alert('🎉 Pembayaran Midtrans Berhasil! Lisensi Pro Lifetime telah aktif.');`r`n    }`r`n  });`r`n}`r`n"
      Add-Content -Path $jsPath -Value $payFunc
    }
  }
}
Write-Host "Berhasil memperbarui semua tools dengan integrasi pembayaran Midtrans!"
