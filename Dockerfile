# Use official Node.js image with Debian (bullseye)
FROM node:18-bullseye

# Install LibreOffice and unoconv
RUN apt-get update && \
    apt-get install -y libreoffice libreoffice-common unoconv xvfb && \
    apt-get clean && \
    rm -rf /var/lib/apt/lists/*

# Ensure unoconv can access LibreOffice
RUN [ -e /usr/bin/soffice ] && rm -f /usr/bin/soffice; ln -s /usr/bin/libreoffice /usr/bin/soffice

# Set the working directory inside the container
WORKDIR /app

# Create directories with proper permissions
RUN mkdir -p /app/output /app/uploads && chmod -R 777 /app/output /app/uploads

# Copy package files and install dependencies
COPY package*.json ./
RUN npm install --production

# Copy all project files
COPY . .

# Expose the port your app runs on
EXPOSE 3000

# Start LibreOffice in headless mode and run the app
CMD xvfb-run --auto-servernum --server-args="-screen 0 1024x768x24" libreoffice --headless --invisible --accept="socket,host=0.0.0.0,port=2002;urp;" & exec node index.js
