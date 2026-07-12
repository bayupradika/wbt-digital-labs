@echo off
title Core Stone 3D FPS - Desktop PC Game Suite
cd /d "%~dp0"

if not exist "node_modules\electron" (
    echo [Core Stone Engine] Memasang mesin Electron Desktop Game untuk pertama kali...
    call npm install
)

echo [Core Stone Engine] Membuka Core Stone 3D FPS Desktop Game...
call npm start
exit
