# Use official Node.js runtime as base image
FROM node:20-alpine

# Set working directory
WORKDIR /app

# Install system dependencies
RUN apk add --no-cache \
    ca-certificates \
    dumb-init

# Create non-root user first
RUN addgroup -g 1001 -S nodejs
RUN adduser -S nextjs -u 1001

# Copy package files
COPY --chown=nextjs:nodejs package*.json ./

# Install all dependencies (including devDependencies for build)
RUN npm ci

# Copy source code (excluding node_modules via .dockerignore)
COPY --chown=nextjs:nodejs . .

# Build the application
RUN npm run build

# Remove devDependencies to reduce image size
RUN npm ci --only=production && npm cache clean --force

# Set environment variables
ENV NODE_ENV=production
ENV ALLOWED_DOMAIN=pretty-chatbot.chal.secjhu.club

# Expose port
EXPOSE 3000

# Switch to non-root user
USER nextjs

# Start the application
ENTRYPOINT ["dumb-init", "--"]
CMD ["npm", "start"]