db:
  build:
    context: ./{{DATABASE_FOLDER}}
    dockerfile: Dockerfile
  environment:
    MYSQL_ROOT_PASSWORD: root
    MYSQL_DATABASE: mydb
  ports:
    - "3307:3307"
  volumes:
    - {{VOLUME_NAME}}:/var/lib/mysql
    - ./{{DATABASE_FOLDER}}/init:/docker-entrypoint-initdb.d
  healthcheck:
    test: ["CMD", "mysqladmin", "ping", "-h", "127.0.0.1"]
    interval: 10s
    retries: 5
    start_period: 30s
