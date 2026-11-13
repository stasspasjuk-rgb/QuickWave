@echo off
powershell.exe -NoLogo -NoProfile -ExecutionPolicy Bypass -File "%~dp0Update-QuickWave.ps1" -Watch
if errorlevel 1 pause
