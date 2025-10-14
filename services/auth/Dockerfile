FROM node:20-alpine

# Create app directory
WORKDIR /app

# Add build tools for native dependencies
RUN apk add --no-cache python3 make g++

# Copy package.json and package-lock.json
COPY package*.json ./

# Install dependencies with fallback
RUN npm config set loglevel verbose && \
    npm ci --only=production || npm install --only=production

# Copy source code
COPY . .

# Set environment variables
ENV NODE_ENV=production

# Expose port
EXPOSE 3001

# Start the service
CMD ["node", "server.js"]