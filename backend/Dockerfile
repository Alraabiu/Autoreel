FROM node:20-slim

# Install ffmpeg and ffprobe for video processing
RUN apt-get update && apt-get install -y ffmpeg && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Copy package files and install dependencies
COPY package*.json ./
RUN npm install --omit=dev

# Copy the rest of the backend code
COPY . .

# Expose the port (Render will override this internally)
EXPOSE 4000

# Start the application
CMD ["npm", "start"]