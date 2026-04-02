backend:
  build:
    context: ./{{BACKEND_FOLDER}}
    dockerfile: Dockerfile
  ports:
    - "{{BACKEND_PORT}}:{{BACKEND_PORT}}"
  depends_on:
    db:
      condition: service_healthy
  environment:
    - PORT={{BACKEND_PORT}}
    - DB_HOST=db
    - DB_USER=postgres
    - DB_PASS=postgres
    - DB_NAME=mydb
