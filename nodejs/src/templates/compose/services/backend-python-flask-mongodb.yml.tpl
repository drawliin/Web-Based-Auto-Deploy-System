backend:
  build:
    context: ./{{BACKEND_FOLDER}}
    dockerfile: Dockerfile
  ports:
    - "{{BACKEND_PORT}}:{{BACKEND_PORT}}"
  command: ["gunicorn", "-b", ":{{BACKEND_PORT}}", "app:app"]
  depends_on:
    - db
  environment:
    - MONGO_URI=mongodb://db:27017
    - PORT={{BACKEND_PORT}}
