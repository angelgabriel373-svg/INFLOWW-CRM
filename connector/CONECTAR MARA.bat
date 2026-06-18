@echo off
title Conectar OnlyFans - MARA
cd /d C:\Users\angel\infloww-crm\connector
echo ============================================================
echo   PASO 1: se abrira OnlyFans. Inicia sesion como MARA.
echo   Cuando estes DENTRO, vuelve aqui y pulsa ENTER.
echo ============================================================
node login.js mara
echo.
echo ============================================================
echo   PASO 2: leyendo los chats reales de MARA...
echo ============================================================
node read-chats.js mara
echo.
pause
