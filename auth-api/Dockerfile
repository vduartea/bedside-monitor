# 1. Imagen base de Node
FROM node:20

# 2. Crear carpeta de trabajo
WORKDIR /usr/src/app

# 3. Copiar package.json y package-lock (si existe)
COPY package*.json ./

# 4. Instalar dependencias
RUN npm install

# 5. Copiar el resto del código
COPY . .

# 6. Exponer el puerto (mismo que usas en index.js, normalmente 3000)
EXPOSE 3000

# 7. Comando de arranque
CMD ["npm", "start"]
