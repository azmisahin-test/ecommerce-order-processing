# websocket/Dockerfile

# Base image
FROM node:22

# Set working directory
WORKDIR /app

# Install dependencies
COPY package.json package-lock.json ./
RUN npm install

# Copy the rest of the application code
COPY . .

# Expose WebSocket port (Örneğin 4000)
EXPOSE 4000

# Start WebSocket server
CMD ["node", "websocket/index.js"] 
