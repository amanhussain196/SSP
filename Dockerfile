FROM mcr.microsoft.com/playwright:v1.58.2-noble

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
