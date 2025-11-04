# Production Dockerfile for backend
FROM node:18-alpine

WORKDIR /app

# Install dependencies (only production dependencies in final image)
COPY package*.json ./
RUN npm install --production

# Copy source
COPY . .

ENV NODE_ENV=production
EXPOSE 5000

CMD ["node", "server.js"]
