FROM ghcr.io/puppeteer/puppeteer:latest

# Switch to root to install dependencies
USER root
WORKDIR /usr/src/app

# Copy package files
COPY package*.json ./

# Install dependencies (including those in package.json)
RUN npm ci

# Copy the rest of the application code
COPY . .

# Switch back to the non-root user provided by the image
USER pptruser

# Start the bot
CMD ["node", "index.js"]
