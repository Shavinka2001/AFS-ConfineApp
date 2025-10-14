# Stage 1: Dependencies
FROM node:20-alpine AS deps

WORKDIR /app

# Add build tools for native dependencies
RUN apk add --no-cache python3 make g++

# Copy package.json and package-lock.json
COPY package*.json ./

# Install dependencies with more verbose output and fallback to npm install if ci fails
RUN npm config set loglevel verbose && \
    npm ci --only=production || npm install --only=production

# Stage 2: Runtime
FROM node:20-alpine

WORKDIR /app

# Install Chromium using a different approach
RUN apk update && apk upgrade && \
    apk add --no-cache \
    chromium \
    chromium-chromedriver \
    nss \
    ca-certificates \
    freetype \
    harfbuzz \
    ttf-freefont

# Tell Puppeteer to use the installed version of Chromium
ENV PUPPETEER_SKIP_CHROMIUM_DOWNLOAD=true
ENV PUPPETEER_EXECUTABLE_PATH=/usr/bin/chromium-browser

# Create upload directory and set permissions
RUN mkdir -p uploads && chmod 777 uploads

# Copy only the necessary files from the deps stage
COPY --from=deps /app/node_modules ./node_modules

# Copy application code
COPY . .

# Set environment variables
ENV NODE_ENV=production

# Expose port
EXPOSE 3012

# Start the service
CMD ["node", "server.js"]