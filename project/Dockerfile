# Build stage - use full Node image for better compatibility
FROM node:18 AS builder

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm install --legacy-peer-deps

# Copy source code
COPY . .

# Set build-time environment variable
ARG VITE_API_URL
ENV VITE_API_URL=$VITE_API_URL

# Build the application
RUN npm run build

# Production stage - use slim image to reduce size
FROM node:18-slim

WORKDIR /app

# Copy built files and static server
COPY --from=builder /app/dist ./dist
COPY static-server.js ./

# Expose port (Railway will override with PORT env var)
EXPOSE 3000

# Start the Node.js static server
CMD ["node", "static-server.js"]
