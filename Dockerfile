# Use official Node.js image with Debian (bullseye)
FROM node:18-bullseye

# Install LibreOffice and unoconv
RUN apt-get update && \
    apt-get install -y libreoffice unoconv && \
    apt-get clean && \
    rm -rf /var/lib/apt/lists/*

# Ensure unoconv can access LibreOffice
RUN ln -s /usr/bin/libreoffice /usr/bin/soffice

# Set the working directory inside the container
WORKDIR /app

# Copy package files and install dependencies
COPY package*.json ./
RUN npm install

# Copy all project files
COPY . .

# Expose the port your app runs on
EXPOSE 3000

# Start unoconv listener and run the app
CMD unoconv --listener & node index.js
