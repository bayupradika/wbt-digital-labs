$games = @(
    "Color-Block-Master", "Cube-Escape-Dash", "Merge-Kingdom",
    "Mini-Farming-Life", "Neon-Drift-Racer", "Pixel-Dungeon-Quest",
    "Shadow-Ninja-Jump", "Space-Survivor-Roguelike", "Tower-Builder-3D", "Core-Stone-Defense"
)

$pwaScript = @'
<script>
  if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
      navigator.serviceWorker.register('sw.js').then(reg => {
        console.log('SW registered:', reg);
      }).catch(err => console.log('SW error:', err));
    });
  }
</script>
</body>
'@

foreach ($g in $games) {
    $file = "D:\Produk-Sell\game\$g\index.html"
    if (Test-Path $file) {
        $content = Get-Content -Path $file -Raw
        
        # Add manifest if not present
        if ($content -notmatch "manifest\.json") {
            $content = $content -replace '</head>', "  <link rel=`"manifest`" href=`"manifest.json`">`r`n</head>"
        }
        
        # Add SW script if not present
        if ($content -notmatch "serviceWorker") {
            $content = $content -replace '</body>', $pwaScript
        }
        
        Set-Content -Path $file -Value $content -Encoding UTF8
        Write-Host "Injected PWA tags into $g/index.html"
    }
}
