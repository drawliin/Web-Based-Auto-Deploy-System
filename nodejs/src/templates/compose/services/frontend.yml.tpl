frontend:
  build:
    context: ./{{FRONTEND_FOLDER}}
    dockerfile: Dockerfile
  volumes:
    - ./{{FRONTEND_FOLDER}}/{{FRONTEND_BUILD_PATH}}:/app/{{FRONTEND_BUILD_PATH}}
  command: ["npm", "run", "build"]
  depends_on:
    - backend
