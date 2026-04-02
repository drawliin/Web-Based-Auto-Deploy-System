backend:
  build:
    context: ./{{BACKEND_FOLDER}}
    dockerfile: Dockerfile
  ports:
    - "{{BACKEND_PORT}}:{{BACKEND_PORT}}"
  command: ["gunicorn", "-b", ":{{BACKEND_PORT}}", "app:app"]
  depends_on:
    db:
      condition: service_healthy
  environment:
    - DB_HOST=db
    - DB_USER=root
    - DB_PASS=root
    - DB_NAME=mydb
    - PORT={{BACKEND_PORT}}
