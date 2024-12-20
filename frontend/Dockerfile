# frontend/Dockerfile

# 1. Node.js tabanlı bir image kullanarak, frontend için çalışma ortamı hazırlıyoruz.
FROM nginx:alpine

# 2. Frontend kaynak kodunu konteynere kopyalayın
COPY ./frontend /usr/share/nginx/html

# 3. Nginx 80 portunu açıyoruz
EXPOSE 80

# 4. Nginx'i başlatıyoruz
CMD ["nginx", "-g", "daemon off;"]
