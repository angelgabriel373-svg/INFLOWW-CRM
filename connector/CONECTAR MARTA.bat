@echo off
title Conectar OnlyFans - MARTA
cd /d C:\Users\angel\infloww-crm\connector
echo ============================================================
echo   PASO 1: se abrira OnlyFans. Inicia sesion como MARTA.
echo   Cuando estes DENTRO, vuelve aqui y pulsa ENTER.
echo ============================================================
node login.js marta
echo.
echo ============================================================
echo   PASO 2: leyendo los chats reales de MARTA...
echo ============================================================
node read-chats.js marta
echo.
pause
