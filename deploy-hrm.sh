#!/bin/bash

# Kiểm tra xem có đang đứng đúng thư mục dự án không
PROJECT_DIR="/mnt/ssd500/tiko/demoHRM"

if [ -d "$PROJECT_DIR" ]; then
    cd "$PROJECT_DIR"
else
    echo "Lỗi: Thư mục dự án $PROJECT_DIR không tồn tại!"
    exit 1
fi

echo "=== 1. CẬP NHẬT MÃ NGUỒN TỪ GITHUB ==="
sudo git fetch --all
sudo git reset --hard origin/main

echo "=== 2. KHỞI CHẠY CONTAINER BẰNG DOCKER ==="
sudo docker compose down
sudo docker compose up -d --build

echo "=== HOÀN TẤT TRIỂN KHAI ==="
