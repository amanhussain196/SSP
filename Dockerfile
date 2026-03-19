# Use the official Playwright image which includes all browsers pre-installed
FROM mcr.microsoft.com/playwright:v1.48.0-noble

# Set working directory
WORKDIR /app

# Copy package files and install dependencies
COPY package*.json ./
RUN npm install

# Copy application files
COPY . .

# No hardcoded ENV PORT or EXPOSE, Render will set the port.

# Start command
CMD ["node", "server.js"]
