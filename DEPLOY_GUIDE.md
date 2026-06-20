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

3. **Sử dụng Script tự động cập nhật `deploy-hrm.sh`**:
   Tệp script cập nhật nhanh đã được đẩy sẵn ở thư mục gốc của dự án. Bạn chỉ cần sao chép tệp này ra ngoài thư mục làm việc để sử dụng lâu dài:
   ```bash
   # Sao chép script ra ngoài thư mục dự án tiko/
   cp /mnt/ssd500/tiko/demoHRM/deploy-hrm.sh /mnt/ssd500/tiko/deploy-hrm.sh
   
   # Cấp quyền thực thi cho script
   chmod +x /mnt/ssd500/tiko/deploy-hrm.sh
   ```

4. **Kích hoạt chạy dự án**:
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
   * **URL**: `http://192.168.1.200:5005` (Sử dụng IP LAN của máy chủ để Cloudflared truy cập được, tương tự như các app khác của bạn)
4. Bấm **Save hostname** để áp dụng.

*Bây giờ bạn có thể truy cập dự án tại: **`https://demohrm.tikovia.vn`***

---

## BƯỚC 4: CÁC LỆNH KIỂM TRA SỨC KHỎE HỆ THỐNG (HEALTH CHECK & VERIFICATION)

Để đảm bảo quá trình triển khai thành công 100% và không gặp lỗi ngầm, hãy chạy chuỗi lệnh kiểm tra sau sau khi deploy:

### 1. Kiểm tra trạng thái Container
Lệnh này xác nhận Container có khởi chạy thành công hay bị sập liên tục (Crash loop):
```bash
sudo docker ps --filter name=tiko-hrm-app
```
* **Kết quả đúng**: Cột **STATUS** phải hiển thị là `Up` (ví dụ: `Up 2 minutes`). Nếu hiển thị là `Exited (1)`, container đang bị lỗi khởi động.

### 2. Kiểm tra Logs Khởi Chạy
Xem logs trực tiếp để chắc chắn backend kết nối được cơ sở dữ liệu SQLite và tự động seed dữ liệu:
```bash
sudo docker logs tiko-hrm-app
```
* **Kết quả đúng**: Dòng cuối cùng phải xuất hiện log thông báo:
  * `Database connection has been established successfully.`
  * `Database schema synchronized.`
  * `Server is running in production mode on port 5000`

### 3. Kiểm tra Cổng (Port Listening)
Kiểm tra xem docker-proxy trên Ubuntu đã mở và lắng nghe ở cổng `5005` chưa:
```bash
sudo ss -tulnp | grep 5005
```
* **Kết quả đúng**: Sẽ xuất hiện dòng chứa `*:5005` hoặc `:::5005` đi kèm với tiến trình `docker-proxy`.

### 4. Kiểm tra Phản hồi HTTP (Local Curl Test)
Gửi yêu cầu trực tiếp từ Ubuntu đến cổng 5005 để kiểm tra phản hồi của web:
```bash
curl -I http://localhost:5005
```
* **Kết quả đúng**: Đầu ra sẽ xuất hiện HTTP header chứa:
  * `HTTP/1.1 200 OK` (Web hoạt động bình thường, trả về file index.html)

### 5. Kiểm tra Kết Nối Cloudflare Tunnel
Kiểm tra logs của agent `cloudflared` trên server để chắc chắn đường truyền kết nối ổn định:
```bash
# Nếu bạn chạy cloudflared bằng Docker:
sudo docker logs <ten-container-cloudflared>

# Hoặc nếu chạy bằng Service Systemd:
sudo journalctl -u cloudflared -n 50 -f
```
* **Kết quả đúng**: Không có các thông báo lỗi dạng `Connection closed` hay `Authentication failed`, có log dạng `Registered tunnel connection`.

---

## BƯỚC 5: VẬN HÀNH & BẢO TRÌ HÀNG NGÀY (Cheat Sheet)

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

### 2. Các lệnh quản lý Docker HRM hữu dụng:
* **Khởi động lại ứng dụng nhanh**:
  ```bash
  sudo docker restart tiko-hrm-app
  ```
* **Dừng ứng dụng**:
  ```bash
  sudo docker stop tiko-hrm-app
  ```
* **Theo dõi hiệu năng (RAM, CPU của container)**:
  ```bash
  sudo docker stats tiko-hrm-app
  ```
* **Truy cập trực tiếp vào shell bên trong Container để kiểm tra file**:
  ```bash
  sudo docker exec -it tiko-hrm-app sh
  ```

### 3. Vị trí Lưu trữ Dữ liệu SQLite:
Cơ sở dữ liệu chấm công và nhân viên (`database.sqlite`) được lưu trữ bền vững tại Volume vật lý của Docker. Trên Ubuntu, bạn có thể tìm thấy file này tại thư mục hệ thống Docker:
`/var/lib/docker/volumes/tiko-hrm_hrm_db_data/_data/database.sqlite` (Có thể sao lưu file này định kỳ để backup dữ liệu).
