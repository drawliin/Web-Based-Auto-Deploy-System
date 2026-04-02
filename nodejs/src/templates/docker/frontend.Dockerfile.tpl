# Dockerfile for frontend app
FROM node:alpine AS build
ARG {{API_URL_VARIABLE}}
ENV {{API_URL_VARIABLE}}='http://localhost:{{BACKEND_PORT}}/api'
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY ./ ./
