# Frontend de la clínica (Angular 19).
# Etapa 1: compila la aplicación para producción.
FROM node:22-alpine AS compilacion
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci
COPY . .
RUN npx ng build --configuration production

# Etapa 2: la sirve con Nginx.
FROM nginx:1.27-alpine
COPY docker/nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=compilacion /app/dist /usr/share/nginx/html
EXPOSE 80
