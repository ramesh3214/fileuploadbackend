# Use official Node.js image with Debian (bullseye)
FROM node:18-bullseye

# Install LibreOffice and unoconv
RUN apt-get update && \
    apt-get install -y libreoffice libreoffice-common unoconv && \
    apt-get clean && \
    rm -rf /var/lib/apt/lists/*

# Ensure unoconv can access LibreOffice, removing existing symlink if present
RUN [ -e /usr/bin/soffice ] && rm -f /usr/bin/soffice; ln -s /usr/bin/libreoffice /usr/bin/soffice

# Set the working directory inside the container
WORKDIR /app

# Copy package files and install dependencies
COPY package*.json ./
RUN npm install --production

# Copy all project files
COPY . .

# Expose the port your app runs on
EXPOSE 3000

# Start unoconv listener and run the app
CMD unoconv --listener --server=0.0.0.0 --port=2002 & exec node index.js
