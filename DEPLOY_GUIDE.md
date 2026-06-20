# Hướng Dẫn Triển Khai HRM Lên Ubuntu Server Bằng Docker & Cloudflare Tunnel
*(Tài liệu hướng dẫn vận hành chuẩn hóa cuối cùng)*

Tài liệu này hướng dẫn cách triển khai dự án **demoHRM** lên mini server Ubuntu của bạn. Đây là phương pháp **tách biệt môi trường sạch sẽ (Dockerized)**, bảo toàn dữ liệu bằng **Volume**, và định tuyến an toàn qua **Cloudflare Tunnel** (chạy chung 1 Port, 1 Domain).

---

## MÔ HÌNH HOẠT ĐỘNG (ARCHITECTURE OVERVIEW)

```text
[Máy cá nhân Windows] (Build FE & Git Push)
         │
         ▼
[GitHub Repository] (Chứa mã nguồn & Thư mục client/dist)
         │
         ▼ (Git Pull / Reset)
[Mini Server Ubuntu]
   ├── docker-compose.yml ──► Khởi chạy Container (Port 5005:5000)
   └── Volume: hrm_db_data ──► Lưu database SQLite bền vững (database.sqlite)
         ▲
         │ (Định tuyến HTTPS không cần mở Port router)
[Cloudflare Tunnel] (tiko-p330) ◄──► Tên miền: https://demohrm.tikovia.vn
```

---

## BƯỚC 1: CHUẨN BỊ MÃ NGUỒN (Thực hiện ở Máy cá nhân Windows)

Chúng ta thiết lập cơ chế **Build Frontend tại Local** để server không phải tốn RAM/CPU biên dịch. 

1. **Biên dịch Giao diện**:
   Mở terminal ở thư mục `client/` trên máy Windows của bạn và chạy:
   ```powershell
   npm run build
   ```
   *(Thư mục tĩnh `client/dist` sẽ được sinh ra/cập nhật).*

2. **Commit và đẩy lên GitHub**:
   Mở terminal ở thư mục gốc `demoHRM` và chạy:
   ```powershell
   git add .
   git commit -m "feat: build frontend and update configuration"
   git push origin main
   ```

---

## BƯỚC 2: TRIỂN KHAI LẦN ĐẦU (Thực hiện trên Server Ubuntu)

1. **SSH vào Server Ubuntu**:
   ```bash
   ssh hoangnam@192.168.2.246
   ```

2. **Kéo mã nguồn về thư mục làm việc**:
   Di chuyển vào thư mục `/mnt/ssd500/tiko/` và chạy lệnh clone dự án:
   ```bash
   cd /mnt/ssd500/tiko/
   git clone https://github.com/manduong1502/demoHRM.git demoHRM
   ```

3. **Tạo File Script tự động cập nhật `deploy-hrm.sh`**:
   Tạo tệp thực thi bên ngoài thư mục dự án để cập nhật nhanh bằng 1 click:
   ```bash
   nano /mnt/ssd500/tiko/deploy-hrm.sh
   ```
   Dán nội dung script sau vào:
   ```bash
   #!/bin/bash
   
   echo "=== 1. CẬP NHẬT CODE TỪ GITHUB ==="
   cd /mnt/ssd500/tiko/demoHRM
   sudo git fetch --all && sudo git reset --hard origin/main
   
   echo "=== 2. KHỞI CHẠY CONTAINER BẰNG DOCKER ==="
   sudo docker compose down
   sudo docker compose up -d --build
   
   echo "=== CẬP NHẬT HOÀN TẤT ==="
   ```
   *Ấn `Ctrl + O` -> `Enter` -> `Ctrl + X` để lưu và thoát.*

4. **Cấp quyền chạy cho Script**:
   ```bash
   chmod +x /mnt/ssd500/tiko/deploy-hrm.sh
   ```

5. **Kích hoạt chạy dự án**:
   ```bash
   /mnt/ssd500/tiko/deploy-hrm.sh
   ```
   *(Docker sẽ tự động tải Image, build container `tiko-hrm-app` và khởi chạy trên cổng **`5005`** của server Ubuntu).*

---

## BƯỚC 3: ĐỊNH TUYẾN TRÊN CLOUDFLARE TUNNEL (Zero Trust)

Cổng **`5005`** hiện tại đã được xác nhận trống hoàn toàn trên máy chủ của bạn (không bị trùng với các cổng `5000`, `8080`, `4000` của các dự án khác).

1. Truy cập vào **Cloudflare Dashboard** -> **Zero Trust** -> **Networks** -> **Tunnels**.
2. Click vào Tunnel đang chạy **`tiko-p330`** và chọn **Configure** (hoặc Edit).
3. Chuyển đến tab **Public Hostname**, chọn **Add a public hostname** và cấu hình:
   * **Subdomain**: `demohrm`
   * **Domain**: `tikovia.vn`
   * **Type**: `HTTP`
   * **URL**: `localhost:5005`
4. Bấm **Save hostname** để áp dụng.

*Bây giờ bạn có thể truy cập dự án tại: **`https://demohrm.tikovia.vn`***

---

## BƯỚC 4: VẬN HÀNH & BẢO TRÌ HÀNG NGÀY (Cheat Sheet)

### 1. Cách cập nhật phiên bản mới sau khi sửa code:
Sau này khi sửa code ở máy Windows, bạn chỉ cần gõ:
* **Ở máy Windows**: 
  ```powershell
  npm run build (ở thư mục client)
  git add .
  git commit -m "update code"
  git push
  ```
* **Ở Server Ubuntu (qua SSH)**:
  ```bash
  /mnt/ssd500/tiko/deploy-hrm.sh
  ```

### 2. Các lệnh kiểm tra trạng thái Container trên server:
* **Xem logs hoạt động của Node.js bên trong container**:
  ```bash
  sudo docker logs -f tiko-hrm-app
  ```
* **Xem danh sách các Container đang chạy**:
  ```bash
  sudo docker ps
  ```
* **Truy cập trực tiếp vào shell bên trong Container**:
  ```bash
  sudo docker exec -it tiko-hrm-app sh
  ```

### 3. Vị trí Lưu trữ Dữ liệu SQLite:
Cơ sở dữ liệu chấm công và nhân viên (`database.sqlite`) được lưu trữ bền vững tại Volume vật lý của Docker. Trên Ubuntu, bạn có thể tìm thấy file này tại thư mục hệ thống Docker:
`/var/lib/docker/volumes/tiko-hrm_hrm_db_data/_data/database.sqlite` (Có thể sao lưu file này định kỳ để backup dữ liệu).
