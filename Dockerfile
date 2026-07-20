FROM node:20-alpine

WORKDIR /app

# Copiar archivos de dependencias primero (para caché de capas)
COPY package.json package-lock.json* ./

# Instalar TODAS las dependencias (incluyendo devDependencies para desarrollo si es necesario)
RUN npm ci --production=false

# Copiar el resto del código
COPY . .

# Exponer puerto
EXPOSE 3000

# Variables de entorno por defecto
ENV NODE_ENV=production
ENV PORT=3000

# Comando de inicio
CMD ["node", "src/app.js"]
