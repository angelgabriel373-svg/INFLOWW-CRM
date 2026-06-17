#!/bin/sh
# Configuracion inicial en Linux/Mac
# Uso:  sh setup.sh
set -e

echo "==> Instalando dependencias (raiz, server, client)..."
npm install
npm --prefix server install
npm --prefix client install

echo "==> Preparando la base de datos (genera, push, seed)..."
if [ ! -f server/.env ]; then
  cp server/.env.example server/.env
  echo "    Creado server/.env desde el ejemplo."
fi
npm --prefix server run db:setup

echo ""
echo "Listo. Arranca el proyecto con:  npm run dev"
echo "Frontend: http://localhost:5173   |   API: http://localhost:4000"
