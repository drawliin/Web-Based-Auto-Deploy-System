events {}

http {
  include       mime.types;
  default_type  application/octet-stream;
  types {
    application/javascript js;
  }

  server {
    listen 80;

    location / {
      root /usr/share/nginx/html;
      index index.html;
      try_files $uri /index.html;
    }

    location /api/ {
      proxy_pass http://backend:{{BACKEND_PORT}}/;
      proxy_set_header Host $host;
      proxy_set_header X-Real-IP $remote_addr;
      proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    }
  }
}
