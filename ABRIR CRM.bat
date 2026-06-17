@echo off
title OFM CRM
cd /d C:\Users\angel\infloww-crm
echo ================================================
echo   Arrancando OFM CRM... NO cierres esta ventana
echo   (cuando termines de usar el CRM, cierrala)
echo ================================================
start "" http://localhost:5173
timeout /t 8 /nobreak >nul
start "" http://localhost:5173
npm run dev
