# Dockerfile for Node.js backend
FROM node:alpine
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY ./ ./
CMD ["node", "{{ENTRY_FILE}}"]
