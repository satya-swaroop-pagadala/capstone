# Build stage - use full Node image for better compatibility
FROM --platform=linux/amd64 node:18 AS builder

WORKDIR /app

# Copy package files first (for better layer caching)
COPY package.json package-lock.json ./

# Clean install dependencies with rollup platform binary
RUN rm -rf node_modules && \
    npm install --legacy-peer-deps && \
    npm install --save-optional @rollup/rollup-linux-x64-gnu || true

# Copy all source files (node_modules excluded via .dockerignore)
COPY . .

# Set build-time environment variable
ARG VITE_API_URL=http://localhost:5001/
ENV VITE_API_URL=$VITE_API_URL

# Build the application
RUN npm run build

# Production stage - use slim image to reduce size
FROM --platform=linux/amd64 node:18-slim

WORKDIR /app

# Install serve globally
RUN npm install -g serve@14.2.0

# Copy built files from builder
COPY --from=builder /app/dist ./dist

# Expose port (Railway will override with PORT env var)
EXPOSE 3000

# Start with serve package - proper syntax for Railway PORT
CMD ["sh", "-c", "serve dist -s -n -p ${PORT:-3000}"]
