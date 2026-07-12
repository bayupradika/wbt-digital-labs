$games = @(
    @{ id="Color-Block-Master"; name="Color Block Master"; icon="PUZZLE"; color="#fbbf24" },
    @{ id="Cube-Escape-Dash"; name="Cube Escape Dash"; icon="DASH"; color="#60a5fa" },
    @{ id="Merge-Kingdom"; name="Merge Kingdom Castle"; icon="CASTLE"; color="#a855f7" },
    @{ id="Mini-Farming-Life"; name="Mini Farming Life"; icon="FARM"; color="#10b981" },
    @{ id="Neon-Drift-Racer"; name="Neon Drift Racer"; icon="RACER"; color="#f43f5e" },
    @{ id="Pixel-Dungeon-Quest"; name="Pixel Dungeon Quest"; icon="QUEST"; color="#eab308" },
    @{ id="Shadow-Ninja-Jump"; name="Shadow Ninja Jump"; icon="NINJA"; color="#6366f1" },
    @{ id="Space-Survivor-Roguelike"; name="Space Survivor Roguelike"; icon="SPACE"; color="#38bdf8" },
    @{ id="Tower-Builder-3D"; name="Tower Builder 3D"; icon="TOWER"; color="#ec4899" },
    @{ id="Core-Stone-Defense"; name="Core Stone Defense"; icon="CORE"; color="#10b981" }
)

$swTemplate = @'
const CACHE_NAME = 'wbt-game-v1';
const ASSETS = [
  './',
  './index.html',
  './style.css'
];

self.addEventListener('install', (e) => {
  e.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(ASSETS))
  );
  self.skipWaiting();
});

self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.map((key) => {
          if (key !== CACHE_NAME) return caches.delete(key);
        })
      );
    })
  );
  self.clients.claim();
});

self.addEventListener('fetch', (e) => {
  e.respondWith(
    fetch(e.request).catch(() => caches.match(e.request))
  );
});
'@

foreach ($g in $games) {
    $dir = "D:\Produk-Sell\game\$($g.id)"
    if (Test-Path $dir) {
        $manifest = @{
            name = "WBT $($g.name)"
            short_name = $g.name
            description = "Game Arcade Offline Resmi dari WBT Digital Labs"
            start_url = "./index.html"
            display = "standalone"
            background_color = "#090d16"
            theme_color = $g.color
            icons = @(
                @{
                    src = "https://via.placeholder.com/192x192/$($g.color.Replace('#',''))/ffffff?text=$($g.icon)"
                    sizes = "192x192"
                    type = "image/png"
                },
                @{
                    src = "https://via.placeholder.com/512x512/$($g.color.Replace('#',''))/ffffff?text=$($g.icon)"
                    sizes = "512x512"
                    type = "image/png"
                }
            )
        } | ConvertTo-Json -Depth 5
        
        Set-Content -Path "$dir\manifest.json" -Value $manifest -Encoding UTF8
        Set-Content -Path "$dir\sw.js" -Value $swTemplate -Encoding UTF8

        $batLines = @(
            "@echo off",
            "title WBT $($g.name) - Windows Launcher",
            "echo Membuka WBT $($g.name) dalam Mode Game Fullscreen PC...",
            "start msedge --app=`"file:///%~dp0index.html`"",
            "exit"
        )
        Set-Content -Path "$dir\Main-di-PC-Windows.bat" -Value $batLines -Encoding Ascii
        
        Write-Host "Prepared App and Launcher for $($g.name)"
    }
}
