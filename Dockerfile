# Frontend de la clinica (Angular)
# Etapa 1: compilar la aplicacion
FROM node:22-alpine AS build
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci --legacy-peer-deps
COPY . .
RUN npx ng build --configuration production

# Etapa 2: servir los archivos con nginx
FROM nginx:1.27-alpine
COPY --from=build /app/dist /usr/share/nginx/html
EXPOSE 80
