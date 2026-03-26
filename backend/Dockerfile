# Stage 1: Builder
FROM node:20-alpine AS builder

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install production dependencies only
RUN npm ci --only=production

# Stage 2: Runtime
FROM node:20-alpine AS runtime

# Create node user
RUN addgroup -g 1000 -S node && \
    adduser -S node -u 1000

WORKDIR /app

# Copy node_modules from builder
COPY --from=builder /app/node_modules ./node_modules

# Copy source code
COPY --from=builder /app/src ./src

# Set environment
ENV NODE_ENV=production
ENV PORT=3000

# Create directories for node user
RUN mkdir -p /app/public && chown -R node:node /app

# Switch to non-root user
USER node

# Expose port
EXPOSE 3000

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
    CMD curl -f http://localhost:3000/health || exit 1

# Start server
CMD ["node", "src/server.js"]
