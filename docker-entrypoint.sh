#!/bin/sh
set -e

cd /app/server

# Crea/actualiza el esquema en la base de datos
npx prisma db push --skip-generate

# Hace seed solo la primera vez (marca en el volumen de datos persistente)
if [ ! -f /data/.seeded ]; then
  echo "🌱 Primera ejecucion: cargando datos de ejemplo..."
  node prisma/seed.js
  touch /data/.seeded
fi

echo "🚀 Iniciando servidor..."
exec node src/index.js
