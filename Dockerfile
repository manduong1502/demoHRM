FROM node:20-alpine

# Thiết lập thư mục làm việc
WORKDIR /app

# Sao chép package.json của server trước để cache layer npm install
COPY server/package*.json ./server/

# Cài đặt thư viện dependencies của server (bỏ qua devDependencies)
RUN cd server && npm install --omit=dev

# Sao chép mã nguồn của server
COPY server/ ./server/

# Sao chép thư mục build tĩnh (dist) của client
COPY client/dist/ ./client/dist/

# Di chuyển vào thư mục chạy server
WORKDIR /app/server

# Expose cổng 5000 bên trong container
EXPOSE 5000

# Tạo thư mục chứa database SQLite vật lý để mount volume
RUN mkdir -p /app/server/data

# Khởi chạy Express server
CMD ["node", "src/server.js"]
