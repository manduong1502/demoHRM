#!/bin/bash

echo "=== 1. CẬP NHẬT MÃ NGUỒN TỪ GITHUB ==="
cd /mnt/ssd500/tiko/demoHRM
sudo git fetch --all
sudo git reset --hard origin/main

echo "=== 2. KHỞI CHẠY CONTAINER BẰNG DOCKER ==="
sudo docker compose down
sudo docker compose up -d --build

echo "=== HOÀN TẤT TRIỂN KHAI ==="
