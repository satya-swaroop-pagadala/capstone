# Build stage
FROM node:18-alpine AS builder

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies (use install instead of ci for better compatibility)
RUN npm install --legacy-peer-deps

# Copy source code
COPY . .

# Set build-time environment variable
ARG VITE_API_URL
ENV VITE_API_URL=$VITE_API_URL

# Build the application
RUN npm run build

# Production stage - using Node.js to serve
FROM node:18-alpine

WORKDIR /app

# Copy built files and static server
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/static-server.js ./

# Expose port (Railway will override with PORT env var)
EXPOSE 3000

# Start the Node.js static server
CMD ["node", "static-server.js"]
