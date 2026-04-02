services:
{{SERVICES_BLOCK}}

  nginx:
    image: nginx:alpine
    volumes:
      - ./nginx.conf:/etc/nginx/nginx.conf:ro
      - ./{{FRONTEND_FOLDER}}/{{FRONTEND_BUILD_PATH}}:/usr/share/nginx/html
    ports:
      - "8081:80"
    depends_on:
      - backend
      - db
      - {{FRONTEND_DEPENDS_ON}}

networks:
  {{NETWORK_NAME}}:
    driver: bridge

volumes:
  {{VOLUME_NAME}}:
