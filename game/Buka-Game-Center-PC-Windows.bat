@echo off
title WBT Arcade Game Center - Windows Launcher
echo Membuka WBT Arcade Game Center dalam Mode Game Fullscreen PC...
start msedge --app="file:///%~dp0index.html" 2>nul || start chrome --app="file:///%~dp0index.html" 2>nul || start "" "%~dp0index.html"
exit
