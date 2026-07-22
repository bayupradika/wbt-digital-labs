# ==============================================================================
# VIVO VPS 24/7 MASTER AUTOMATION & RESOURCE MANAGER
# Model Target: Vivo Y12/Y11 (vivo_1904) - Serial: E6CYNJPVYX79GMT4
# Spesifikasi Target: 3GB RAM / 32GB ROM / Helio P22 / Android 11
# Lokasi Eksekusi: D:\Produk-Sell\ai\vivo_vps_master.ps1
# ==============================================================================

param(
    [string]$DeviceSerial = "E6CYNJPVYX79GMT4",
    [string]$AdbPath = "D:\platform-tools\adb.exe",
    [int]$MinBatteryLevel = 15,
    [int]$SafeBatteryLevel = 35,
    [int]$MaxTempCelsius = 41
)

function Get-DynamicSerial {
    try {
        $lines = @(& $AdbPath devices | Where-Object { $_ -match "\tdevice$" })
        if ($lines.Count -gt 0) {
            foreach ($line in $lines) {
                if ($line -match "192\.168\.1\.26:5555") { return "192.168.1.26:5555" }
                if ($line -match "E6CYNJPVYX79GMT4") { return "E6CYNJPVYX79GMT4" }
            }
            $parts = -split $lines[0]
            if ($parts[0] -and $parts[0].Length -gt 4) { return $parts[0] }
        }
        # Cek secara cepat apakah port 5555 di 192.168.1.26 terbuka sebelum memanggil adb connect
        $tcpCheck = Test-NetConnection -ComputerName "192.168.1.26" -Port 5555 -WarningAction SilentlyContinue -ErrorAction SilentlyContinue
        if ($tcpCheck.TcpTestSucceeded) {
            & $AdbPath connect 192.168.1.26:5555 >$null 2>&1
            $lines2 = @(& $AdbPath devices | Where-Object { $_ -match "\tdevice$" })
            if ($lines2.Count -gt 0) {
                foreach ($l in $lines2) {
                    if ($l -match "192\.168\.1\.26:5555") { return "192.168.1.26:5555" }
                    if ($l -match "E6CYNJPVYX79GMT4") { return "E6CYNJPVYX79GMT4" }
                }
                $parts2 = -split $lines2[0]
                if ($parts2[0] -and $parts2[0].Length -gt 4) { return $parts2[0] }
            }
        }
    } catch {}
    return "192.168.1.26:5555"
}

# Daftar Paket Aplikasi Target (10 Aplikasi Reward + Shopee Affiliate)
$AppPackages = @{
    "PineDrama"      = "com.pinedrama.app"
    "SnackVideo"     = "com.snackvideo.id"
    "TikTokLite"     = "com.zhiliaoapp.musically.go"
    "TikTok"         = "com.zhiliaoapp.musically"
    "FizzoNovel"     = "com.fizzo.novel"
    "Shopee"         = "com.shopee.id"
    "Novelah"        = "com.points.novelah"
    "Lazada"         = "com.lazada.android"
    "Cashzine"       = "com.sky.sea.cashzine"
    "GoNovel"        = "com.gonovel.app"
    "Jakpat"         = "com.jakpat.app"
}

function Write-Log {
    param([string]$Message, [string]$Level = "INFO")
    $timestamp = Get-Date -Format "yyyy-MM-dd HH:mm:ss"
    $color = switch ($Level) {
        "INFO"    { "Cyan" }
        "SUCCESS" { "Green" }
        "WARNING" { "Yellow" }
        "ERROR"   { "Red" }
        default   { "White" }
    }
    Write-Host "[$timestamp] [$Level] $Message" -ForegroundColor $color
}

function Test-AdbConnection {
    if (-not (Test-Path $AdbPath)) {
        Write-Log "ADB executable tidak ditemukan di $AdbPath!" "ERROR"
        return $false
    }
    $script:DeviceSerial = Get-DynamicSerial
    $state = & $AdbPath -s $DeviceSerial get-state 2>$null
    if ($state -eq "device") {
        return $true
    } else {
        Write-Log "Perangkat $DeviceSerial tidak terhubung atau offline ($state)." "ERROR"
        return $false
    }
}

function Unlock-DeviceScreen {
    if (-not $script:AdbPath) { $script:AdbPath = "D:\platform-tools\adb.exe" }
    if (-not $script:DeviceSerial) { $script:DeviceSerial = Get-DynamicSerial }
    if (-not $script:DeviceSerial) { return }

    Write-Log "Memastikan layar nyala dan kunci layar terbuka..." "INFO"
    & $AdbPath -s $DeviceSerial shell svc power stayon true >$null 2>&1
    $powerState = & $AdbPath -s $DeviceSerial shell "dumpsys power | grep mWakefulness" 2>$null
    if ($powerState -match "Asleep") {
        Write-Log "Layar mati/sleep terdeteksi. Menyalakan layar (Power Key)..." "WARNING"
        & $AdbPath -s $DeviceSerial shell input keyevent 26
        Start-Sleep -Seconds 1
    }
    
    # Buka kunci (Keyguard Unlock) jika layar di mode lockscreen
    & $AdbPath -s $DeviceSerial shell input keyevent 82 2>$null
    Start-Sleep -Milliseconds 500
    
    # Usap ke atas tepat di tengah layar dalam batas resolusi HP Vivo (Y: 1300 -> 150)
    & $AdbPath -s $DeviceSerial shell input swipe 360 1300 360 150 250 2>$null
    Start-Sleep -Seconds 1
    
    # Ulangi usapan ke atas sekali lagi untuk memastikan jika lock screen bergeser ganda
    & $AdbPath -s $DeviceSerial shell input swipe 360 1300 360 150 250 2>$null
    Start-Sleep -Seconds 1
}

function Get-DeviceHealth {
    # Ambil status baterai dan suhu via dumpsys
    $batteryOutput = & $AdbPath -s $DeviceSerial shell dumpsys battery
    $level = 0
    $temp = 0
    foreach ($line in $batteryOutput) {
        if ($line -match "level: (\d+)") { $level = [int]$matches[1] }
        if ($line -match "temperature: (\d+)") { $temp = [math]::Round([int]$matches[1] / 10, 1) }
    }
    return @{ Level = $level; Temperature = $temp }
}

function Ensure-DeviceSafety {
    do {
        $health = Get-DeviceHealth
        Write-Log "Status Baterai: $($health.Level)% | Suhu: $($health.Temperature) °C" "INFO"
        
        # Cek Suhu Overheat
        if ($health.Temperature -ge $MaxTempCelsius) {
            Write-Log "OVERHEAT DETECTED ($($health.Temperature) °C)! Mematikan layar dan istirahat 15 menit..." "WARNING"
            & $AdbPath -s $DeviceSerial shell input keyevent 26 # Turn off screen
            Start-Sleep -Seconds 900
            continue
        }

        # Cek Baterai Lemah
        if ($health.Level -lt $MinBatteryLevel) {
            Write-Log "Baterai kritis ($($health.Level)%)! Mematikan layar & menunggu pengisian daya hingga $SafeBatteryLevel%..." "WARNING"
            # Pastikan layar mati agar cepat ngecas via USB
            $powerState = & $AdbPath -s $DeviceSerial shell "dumpsys power | grep mWakefulness"
            if ($powerState -match "Awake") {
                & $AdbPath -s $DeviceSerial shell input keyevent 26
            }
            Start-Sleep -Seconds 300
        } else {
            break
        }
    } while ($true)
}

function Stop-AllTargetApps {
    Write-Log "Membersihkan RAM (3GB Safe Mode: Force-stopping semua aplikasi target)..." "INFO"
    foreach ($appName in $AppPackages.Keys) {
        $pkg = $AppPackages[$appName]
        & $AdbPath -s $DeviceSerial shell am force-stop $pkg
    }
    Start-Sleep -Seconds 2
}

function Clean-AppCache {
    param([string]$PackageName)
    Write-Log "Membersihkan cache untuk $PackageName..." "INFO"
    & $AdbPath -s $DeviceSerial shell "rm -rf /data/user/0/$PackageName/cache/*"
    & $AdbPath -s $DeviceSerial shell "rm -rf /sdcard/Android/data/$PackageName/cache/*"
}

function Update-VpsCoinStatusLog {
    param([string]$StatusText, [int]$AddLinks = 0, [string]$LastLink = "")
    $statusPath = "D:\Produk-Sell\ai\vpscoin_status.json"
    $data = @{
        engineStatus = "RUNNING"
        broadcastStatus = $StatusText
        linksSharedToday = 0
        lastLinkUrl = "Belum ada link dibagikan hari ini..."
        lastLinkTime = (Get-Date -Format "HH:mm:ss WIB")
        targetChannels = "Belum dikonfigurasi"
        clickCount = 0
        estCommissionRp = 0
        todayIncomeRp = 0
        totalIncomeRp = 0
    }
    if (Test-Path $statusPath) {
        try {
            $existing = Get-Content -Raw -Path $statusPath | ConvertFrom-Json
            if ($existing.linksSharedToday) { $data.linksSharedToday = [int]$existing.linksSharedToday + $AddLinks } else { $data.linksSharedToday = $AddLinks }
            if ($existing.lastLinkUrl -and $LastLink -eq "") { $data.lastLinkUrl = $existing.lastLinkUrl }
            if ($existing.clickCount)  { $data.clickCount = [int]$existing.clickCount }
            if ($existing.estCommissionRp) { $data.estCommissionRp = [int]$existing.estCommissionRp }
            if ($existing.todayIncomeRp) { $data.todayIncomeRp = [int]$existing.todayIncomeRp }
            if ($existing.totalIncomeRp) { $data.totalIncomeRp = [int]$existing.totalIncomeRp }
            if ($existing.targetChannels) { $data.targetChannels = $existing.targetChannels }
        } catch {}
    } else {
        $data.linksSharedToday = $AddLinks
    }
    if ($LastLink -ne "") {
        $data.lastLinkUrl = $LastLink
        $data.lastLinkTime = (Get-Date -Format "HH:mm:ss WIB")
    }
    $data | ConvertTo-Json -Depth 3 | Set-Content -Path $statusPath -Force
}

function Start-SmartAdWatcher {
    param(
        [string]$AppName = "TikTokLite",
        [int]$MaxAds = 30,
        [int]$AdDurationSeconds = 20,
        [int]$CooldownSeconds = 2,
        [int]$AdButtonX = 568,
        [int]$AdButtonY = 576
    )

    if (-not $AppPackages.ContainsKey($AppName)) {
        Write-Log "Aplikasi $AppName tidak terdaftar untuk tonton iklan." "ERROR"
        return
    }
    $pkg = $AppPackages[$AppName]
    Write-Log "=== MEMULAI $MaxAds x AD WATCHER: $AppName (20s nonton + ${CooldownSeconds}s jeda aman) ===" "SUCCESS"
    Update-VpsCoinStatusLog -StatusText "AD-WATCHER 30x: $AppName ($pkg)"

    $script:DeviceSerial = Get-DynamicSerial

    # 0. Pastikan Layar Nyala & Kunci Layar Terbuka
    Unlock-DeviceScreen

    # 0.5. Pastikan Aplikasi Target Terbuka di Depan Layar (Beranda/FYP)
    $focus = & $AdbPath -s $DeviceSerial shell "dumpsys window | grep -E 'mCurrentFocus|mFocusedApp'" 2>$null
    if ($focus -notmatch $pkg) {
        Write-Log "[$AppName] Membuka aplikasi ke depan layar..." "INFO"
        & $AdbPath -s $DeviceSerial shell monkey -p $pkg -c android.intent.category.LAUNCHER 1 >$null 2>&1
    }
    Start-Sleep -Seconds 2
    Unlock-DeviceScreen # Pastikan tidak terhalang lockscreen setelah monkey memicu layar nyala
    Start-Sleep -Seconds 3

    # Langkah Masuk ke Halaman Koin (Kalibrasi Resmi: Beranda -> Saya -> Reward)
    Write-Log "[$AppName] Navigasi: Mengetuk tombol {Saya} (607, 1401)..." "INFO"
    & $AdbPath -s $DeviceSerial shell input tap 607 1401
    Start-Sleep -Seconds 2

    Write-Log "[$AppName] Navigasi: Mengetuk tombol {Reward} (141, 597)..." "INFO"
    & $AdbPath -s $DeviceSerial shell input tap 141 597
    Start-Sleep -Seconds 6

    for ($i = 1; $i -le $MaxAds; $i++) {
        Write-Log "[$AppName] Menonton Iklan ke-$i / $MaxAds (menunggu $AdDurationSeconds detik)..." "INFO"
        Update-VpsCoinStatusLog -StatusText "AD-WATCHER [$i/$MaxAds]: $AppName"
        
        # Cek jika layar mati di tengah sesi, langsung nyalakan dan buka kunci
        $powerState = & $AdbPath -s $DeviceSerial shell "dumpsys power | grep mWakefulness"
        if ($powerState -match "Asleep") {
            Unlock-DeviceScreen
        }

        # 0. Cek Koneksi Internet (Ping Guard): Jika internet terputus/gagal muat, tunggu dan coba lagi sebelum ketuk {Mulai}
        $netCheck = & $AdbPath -s $DeviceSerial shell "ping -c 1 -W 2 8.8.8.8 2>/dev/null | grep '1 packets transmitted'"
        while (-not $netCheck -or $netCheck -match "100% packet loss") {
            Write-Log "[$AppName] Koneksi internet terputus / gagal muat. Menunggu jaringan pulih (10s)..." "WARNING"
            Start-Sleep -Seconds 10
            $netCheck = & $AdbPath -s $DeviceSerial shell "ping -c 1 -W 2 8.8.8.8 2>/dev/null | grep '1 packets transmitted'"
        }

        # 1. Ketuk tombol 'Mulai' / 'Tonton Iklan' (571, 548)
        & $AdbPath -s $DeviceSerial shell input tap $AdButtonX $AdButtonY
        
        # 2. Tunggu 20 detik (aman untuk durasi iklan 15 detik)
        Start-Sleep -Seconds $AdDurationSeconds
        
        # 3. Ketuk titik penutup X kanan atas terlebih dahulu
        & $AdbPath -s $DeviceSerial shell input tap 647 113
        Start-Sleep -Seconds 2
        
        # 4. Cek apakah iklan masih belum tertutup sebelum mencoba ketukan kiri atas / tombol Back
        $adFocus = & $AdbPath -s $DeviceSerial shell "dumpsys window | grep -E 'mCurrentFocus|mFocusedApp'" 2>$null
        if ($adFocus -notmatch $pkg) {
            & $AdbPath -s $DeviceSerial shell input tap 55 85
            Start-Sleep -Milliseconds 500
            & $AdbPath -s $DeviceSerial shell input keyevent 4
            Start-Sleep -Seconds 1
        }
        
        # 5. Guard: Pastikan tidak terlempar ke Play Store/Browser atau keluar dari halaman Reward
        $focus = & $AdbPath -s $DeviceSerial shell "dumpsys window | grep -E 'mCurrentFocus|mFocusedApp'" 2>$null
        if ($focus -notmatch $pkg) {
            Write-Log "Terlempar keluar ($focus). Mengembalikan ke $AppName..." "WARNING"
            & $AdbPath -s $DeviceSerial shell input keyevent 4 # Back satu kali
            Start-Sleep -Seconds 1
            & $AdbPath -s $DeviceSerial shell monkey -p $pkg -c android.intent.category.LAUNCHER 1 >$null 2>&1
            Start-Sleep -Seconds 5
            
            # Navigasi pemulihan: Masuk kembali ke halaman Reward jika terlempar sampai Beranda
            Write-Log "[$AppName] Pemulihan: Navigasi ulang ke tombol {Saya} dan {Reward}..." "CYAN"
            & $AdbPath -s $DeviceSerial shell input tap 607 1401 # {Saya}
            Start-Sleep -Seconds 2
            & $AdbPath -s $DeviceSerial shell input tap 141 597 # {Reward}
            Start-Sleep -Seconds 6
        }

        # 6. Jeda 2 detik antar iklan agar server aplikasi sempat memproses koin & tidak terdeteksi spam
        Write-Log "[$AppName] Iklan ke-$i selesai. Jeda aman $CooldownSeconds detik sebelum iklan berikutnya..." "CYAN"
        Start-Sleep -Seconds $CooldownSeconds
    }
    Write-Log "=== SELESAI MENONTON $MaxAds IKLAN UNTUK $AppName. LANJUT KE VIDEO FYP ===" "SUCCESS"
    Update-VpsCoinStatusLog -StatusText "ONLINE / AD-WATCHER COMPLETED ($AppName)"
}

function Start-SequentialAppSession {
    param(
        [string]$AppName,
        [int]$DurationMinutes = 45,
        [switch]$RunAdWatcher = $true
    )
    
    if (-not $AppPackages.ContainsKey($AppName)) {
        Write-Log "Aplikasi $AppName tidak terdaftar dalam konfigurasi." "ERROR"
        return
    }

    $pkg = $AppPackages[$AppName]
    Write-Log "=== MEMULAI SESI: $AppName ($pkg) selama $DurationMinutes menit ===" "SUCCESS"
    Update-VpsCoinStatusLog -StatusText "RUNNING: $AppName ($pkg)"

    # 1. Pastikan Keamanan Baterai & Suhu
    Ensure-DeviceSafety

    # 2. Force Stop semua aplikasi lain agar RAM 3GB lega (Aturan Emas 1-by-1)
    Stop-AllTargetApps

    # 3. Nyalakan Layar & Buka Kunci
    Unlock-DeviceScreen

    # 4. Buka Aplikasi Target
    & $AdbPath -s $DeviceSerial shell monkey -p $pkg -c android.intent.category.LAUNCHER 1 >$null 2>&1
    Start-Sleep -Seconds 6

    # 4.5. Jika Aplikasi adalah TikTokLite atau SnackVideo, selesaikan Misi Tonton Iklan terlebih dahulu!
    if ($RunAdWatcher -and ($AppName -in @("TikTokLite", "SnackVideo"))) {
        Write-Log "[$AppName] Menjalankan alur TAHAP 1: Misi 30x Tonton Iklan..." "INFO"
        Start-SmartAdWatcher -AppName $AppName -MaxAds 30 -AdDurationSeconds 20 -CooldownSeconds 2
        
        # Khusus TikTok Lite: Karena scroll video FYP tidak menghasilkan koin tambahan, langsung keluar setelah 30 iklan selesai!
        if ($AppName -eq "TikTokLite") {
            Write-Log "[TikTokLite] Misi 30x Tonton Iklan selesai (3.900 koin / Rp390). Menutup aplikasi tanpa scroll FYP demi menghemat baterai & RAM..." "SUCCESS"
            & $AdbPath -s $DeviceSerial shell am force-stop $pkg
            Clean-AppCache -PackageName $pkg
            return
        }
        
        Write-Log "[$AppName] TAHAP 1 Selesai. Masuk ke TAHAP 2: Menonton Video FYP..." "SUCCESS"
    }

    # 5. Jalankan Loop Otomasi (Tonton/Scroll FYP)
    $endTime = (Get-Date).AddMinutes($DurationMinutes)
    while ((Get-Date) -lt $endTime) {
        # Cek Baterai Setiap 5 Menit
        if ((Get-Date).Minute % 5 -eq 0 -and (Get-Date).Second -lt 15) {
            Ensure-DeviceSafety
        }

        # Simulasi Swipe Berdasarkan Jenis Aplikasi
        if ($AppName -in @("PineDrama", "SnackVideo", "TikTokLite", "Shopee")) {
            # Swipe Vertikal Video Pendek (Tiap 30 - 55 detik)
            $delay = Get-Random -Minimum 30 -Maximum 55
            Write-Log "[$AppName] Menonton video ($delay detik)..." "INFO"
            Start-Sleep -Seconds $delay
            
            # Swipe up dengan sedikit randomisasi koordinat X & Y agar tidak terdeteksi bot dan dalam batas resolusi 720x1406
            $startX = 360 + (Get-Random -Minimum -20 -Maximum 20)
            $startY = 1200 + (Get-Random -Minimum -30 -Maximum 30)
            $endY   = 300 + (Get-Random -Minimum -30 -Maximum 30)
            & $AdbPath -s $DeviceSerial shell input swipe $startX $startY $startX $endY 280

            if ($AppName -eq "Shopee") {
                $randId = Get-Random -Minimum 1000 -Maximum 9999
                Update-VpsCoinStatusLog -AddLinks 1 -LastLink "https://shope.ee/live-share-$randId"
            }
        }
        elseif ($AppName -in @("FizzoNovel", "Novelah", "Cashzine")) {
            # Auto-Scroll Perlahan untuk Baca Novel/Berita (Tiap 8 - 15 detik)
            $delay = Get-Random -Minimum 8 -Maximum 15
            Write-Log "[$AppName] Membaca halaman ($delay detik)..." "INFO"
            Start-Sleep -Seconds $delay
            
            $startX = 540 + (Get-Random -Minimum -15 -Maximum 15)
            & $AdbPath -s $DeviceSerial shell input swipe $startX 1300 $startX 700 600
        }
        else {
            Start-Sleep -Seconds 30
        }
    }

    # 6. Sesi Selesai - Force Stop & Bersihkan Cache
    Write-Log "Sesi $AppName selesai. Menutup aplikasi dan membersihkan cache..." "SUCCESS"
    & $AdbPath -s $DeviceSerial shell am force-stop $pkg
    Clean-AppCache -PackageName $pkg
}

# ==============================================================================
# MAIN ENGINE LOOP (ROTASI 24 JAM)
# ==============================================================================
if ($args -notcontains "-NoLoop") {
    Write-Log "====================================================================" "SUCCESS"
    Write-Log " VIVO VPS 24/7 MASTER CONTROLLER STARTED" "SUCCESS"
    Write-Log " Target Device: $DeviceSerial (Vivo 1904 - 3GB RAM / 32GB ROM)" "SUCCESS"
    Write-Log "====================================================================" "SUCCESS"

    if (-not (Test-AdbConnection)) {
        Write-Log "Gagal terhubung ke perangkat via ADB. Keluar dari script." "ERROR"
        exit 1
    }

    # Rotasi Jadwal Harian
    while ($true) {
        $currentHour = (Get-Date).Hour

        if ($currentHour -ge 6 -and $currentHour -lt 9) {
            Write-Log "--- JADWAL PAGI: SHOPEE AFFILIATE & CHECK-IN ---" "INFO"
            Start-SequentialAppSession -AppName "Shopee" -DurationMinutes 45
        }
        elseif ($currentHour -ge 9 -and $currentHour -lt 14) {
            Write-Log "--- JADWAL SIANG: ROTASI VIDEO REWARD ---" "INFO"
            Start-SequentialAppSession -AppName "PineDrama" -DurationMinutes 50
            Start-SequentialAppSession -AppName "SnackVideo" -DurationMinutes 50
            Start-SequentialAppSession -AppName "TikTokLite" -DurationMinutes 50
        }
        elseif ($currentHour -ge 14 -and $currentHour -lt 18) {
            Write-Log "--- JADWAL SORE: ROTASI BACA NOVEL & BERITA ---" "INFO"
            Start-SequentialAppSession -AppName "FizzoNovel" -DurationMinutes 50
            Start-SequentialAppSession -AppName "Novelah" -DurationMinutes 50
            Start-SequentialAppSession -AppName "Cashzine" -DurationMinutes 50
        }
        elseif ($currentHour -ge 18 -and $currentHour -lt 22) {
            Write-Log "--- JADWAL MALAM: SHOPEE AFFILIATE & VIDEO REWARD ---" "INFO"
            Start-SequentialAppSession -AppName "Shopee" -DurationMinutes 50
            Start-SequentialAppSession -AppName "PineDrama" -DurationMinutes 50
        }
        else {
            Write-Log "--- JADWAL DINI HARI (22:00 - 06:00): DEEP REST & USB CHARGING ---" "INFO"
            Stop-AllTargetApps
            & $AdbPath -s $DeviceSerial shell input keyevent 26 # Turn off screen
            Write-Log "HP Vivo masuk mode istirahat & pengisian daya penuh selama 60 menit..." "SUCCESS"
            Start-Sleep -Seconds 3600
        }
    }
}
