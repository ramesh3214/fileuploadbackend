# Use official Node.js image with Debian (bullseye)
FROM node:18-bullseye

# Install LibreOffice
RUN apt-get update && apt-get install -y libreoffice

# Set the working directory inside the container
WORKDIR .

# Copy package files and install dependencies
COPY package*.json ./
RUN npm install

# Copy all project files
COPY . .

# Expose the port your app runs on
EXPOSE 3000

# Command to run your app
CMD ["node", "server.js"]
