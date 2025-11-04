# Multi-stage Dockerfile for Vite React frontend

# 1) Build stage
FROM node:18-alpine AS builder
WORKDIR /app

COPY package*.json ./
RUN npm install

# Copy source and build
COPY . .
RUN npm run build

# 2) Serve stage using nginx
FROM nginx:stable-alpine
COPY --from=builder /app/dist /usr/share/nginx/html

# Expose port 80 for nginx
EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
