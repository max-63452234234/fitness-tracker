FROM node:18-alpine

WORKDIR /app

# Install build dependencies for bcrypt
RUN apk add --no-cache make gcc g++ python3

# Copy package.json and package-lock.json
COPY package*.json ./

# Install dependencies
RUN npm install

# Copy server files
COPY . .

# Expose port
EXPOSE 3001

# Start the server
CMD ["npm", "start"]
