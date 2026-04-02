backend:
  build:
    context: ./{{BACKEND_FOLDER}}
    dockerfile: Dockerfile
  ports:
    - "{{BACKEND_PORT}}:{{BACKEND_PORT}}"
  depends_on:
    - db
  environment:
    - PORT={{BACKEND_PORT}}
    - MONGO_URI=mongodb://db:27017
