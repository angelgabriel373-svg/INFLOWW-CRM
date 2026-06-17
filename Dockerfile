# Imagen unica: compila el frontend y lo sirve desde el backend (Express).
FROM node:20-alpine

WORKDIR /app

# Dependencias (capa cacheable)
COPY package*.json ./
COPY server/package*.json ./server/
COPY client/package*.json ./client/
RUN npm install \
  && npm --prefix server install \
  && npm --prefix client install

# Codigo
COPY . .

# Build del frontend + cliente de Prisma
RUN npm --prefix client run build \
  && npm --prefix server run db:generate

ENV NODE_ENV=production
EXPOSE 4000

# Arranque: prepara la BD, hace seed la primera vez y levanta el servidor
COPY docker-entrypoint.sh /app/docker-entrypoint.sh
RUN chmod +x /app/docker-entrypoint.sh
ENTRYPOINT ["/app/docker-entrypoint.sh"]
