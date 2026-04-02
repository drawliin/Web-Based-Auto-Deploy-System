db:
  build:
    context: ./{{DATABASE_FOLDER}}
    dockerfile: Dockerfile
  ports:
    - "5432:5432"
  environment:
    POSTGRES_USER: postgres
    POSTGRES_PASSWORD: postgres
    POSTGRES_DB: mydb
  volumes:
    - {{VOLUME_NAME}}:/var/lib/postgresql/data
    - ./{{DATABASE_FOLDER}}/init:/docker-entrypoint-initdb.d
  healthcheck:
    test: ["CMD-SHELL", "pg_isready -U postgres -d mydb"]
    interval: 10s
    retries: 5
    start_period: 30s
