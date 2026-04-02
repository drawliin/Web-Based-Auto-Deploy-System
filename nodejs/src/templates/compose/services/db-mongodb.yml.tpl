db:
  build:
    context: ./{{DATABASE_FOLDER}}
    dockerfile: Dockerfile
  ports:
    - "27017:27017"
  volumes:
    - {{VOLUME_NAME}}:/data/db
    - ./{{DATABASE_FOLDER}}/init:/docker-entrypoint-initdb.d
