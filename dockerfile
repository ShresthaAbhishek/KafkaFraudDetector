FROM node:22-alpine

# Set working directory
WORKDIR /app

# Copy package.json and install dependencies
COPY package*.json ./
RUN npm install

# Copy all source files
COPY . .

# Default command (can be overridden in docker-compose)
CMD ["node", "transaction-service.js"]
