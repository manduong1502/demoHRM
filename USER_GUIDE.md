# Hướng Dẫn Sử Dụng Hệ Thống Quản Trị Nhân Sự (HRM Portal)

Hệ thống HRM Portal được thiết kế nhằm tinh gọn hóa quy trình quản lý nhân sự, chấm công, tính lương và xét duyệt đơn từ trong doanh nghiệp. Giao diện trực quan dạng bảng dữ liệu sạch sẽ, giúp thao tác nhanh chóng và chính xác.

---

## 1. ĐỊA CHỈ TRUY CẬP & TÀI KHOẢN THỬ NGHIỆM

* **Địa chỉ truy cập**: [https://demohrm.tikovia.vn](https://demohrm.tikovia.vn)
* **Tài khoản dùng thử** (Phân quyền theo các vai trò khác nhau):

| Tên Đăng Nhập | Mật Khẩu | Vai Trò (Role) | Chức Năng Chính |
| :--- | :--- | :--- | :--- |
| **`admin`** | `admin123` | **Quản trị viên (Admin)** | Toàn quyền hệ thống, quản lý tài khoản và phân quyền |
| **`hruser`** | `hr123` | **Quản lý Nhân sự (HR)** | Quản lý hồ sơ nhân sự, phê duyệt đơn từ nghỉ phép/OT toàn công ty, tính lương |
| **`manageruser`** | `manager123` | **Quản lý Bộ phận (Manager)** | Phê duyệt đơn từ của nhân viên thuộc phòng ban mình quản lý |
| **`empuser`** | `emp123` | **Nhân viên (Employee)** | Tự chấm công, gửi đơn xin nghỉ phép/tăng ca, xem bảng công cá nhân |

---

## 2. HƯỚNG DẪN CÁC CHỨC NĂNG CHÍNH

### 📑 Chức Năng 1: Chấm Công Hàng Ngày (Check-in / Check-out)
* **Đối tượng**: Dành cho tất cả nhân viên.
* **Cách thực hiện**:
  1. Đăng nhập vào tài khoản cá nhân (ví dụ: `empuser`).
  2. Tại trang **Tổng quan**, bạn sẽ nhìn thấy góc trên cùng bên phải có 2 nút: `Check-In` (Màu xanh lá) và `Check-Out` (Màu xanh dương).
  3. Nhấp vào nút `Check-In` khi bắt đầu làm việc và nút `Check-Out` khi ra về.
  4. Hệ thống sẽ tự động ghi nhận thời gian thực tế và hiển thị trạng thái đi muộn/về sớm hoặc đúng giờ ngay lập tức.

---

### 👥 Chức Năng 2: Quản Lý Hồ Sơ Nhân Viên (Chỉ dành cho Admin & HR)
* **Đối tượng**: HR Manager (`hruser`) hoặc Admin (`admin`).
* **Cách thực hiện**:
  1. Vào mục **Hồ sơ nhân viên** từ menu bên trái.
  2. **Tìm kiếm & Bộ lọc**: Bạn có thể lọc nhanh nhân viên theo *Trạng thái* (Đang làm việc, Thử việc, Đã nghỉ việc) hoặc theo *Phòng ban*. Danh sách sẽ lập tức cập nhật mà không cần tải lại trang.
  3. **Thêm nhân viên mới**: Bấm nút **Thêm nhân viên** ở góc phải, điền thông tin và cấp tài khoản hệ thống.
  4. **Chỉnh sửa / Xóa**: Nhấp vào nút sửa (biểu tượng bút chì) hoặc xóa trực tiếp trên từng dòng nhân viên.

---

### 📅 Chức Năng 3: Theo Dõi Bảng Chấm Công Tự Động
* **Đối tượng**: Tất cả vai trò (Nhân viên xem bảng công của mình; HR/Admin xem bảng công toàn công ty).
* **Tính năng thông minh tích hợp**:
  * Tự động hiển thị lịch trực quan theo từng ngày trong tháng được chọn (thay đổi Tháng/Năm lọc nhanh tức thì).
  * Ký hiệu chấm công chuẩn hóa: 
    * `X` (Đi làm đầy đủ), `M` (Đi muộn), `V` (Về sớm), `TC` (Tăng ca), `P` (Nghỉ phép có lương), `KP` (Nghỉ không lương).
  * **Thông minh**: Hệ thống tự động nhận biết ngày thứ 7/chủ nhật hoặc những ngày trước khi nhân viên vào thử việc (ngày bắt đầu thử việc `probationDate`) để tránh hiển thị lỗi nghỉ không phép (`KP`).

---

### ✉️ Chức Năng 4: Đăng Ký và Phê Duyệt Đơn Từ (Nghỉ phép / Tăng ca)
* **Quy trình gửi đơn (Dành cho Nhân viên)**:
  1. Vào mục **Đơn thư nghỉ phép / OT**.
  2. Nhấp vào **Tạo đơn mới**.
  3. Chọn loại đơn (Nghỉ phép có lương, Nghỉ phép không lương, Đăng ký Tăng ca OT), nhập ngày bắt đầu, ngày kết thúc và lý do.
  4. **Tự động tính ngày nghỉ**: Hệ thống sẽ tự động trừ đi các ngày thứ Bảy và Chủ nhật trong khoảng thời gian nghỉ phép của bạn để tính số ngày nghỉ chính xác nhất.
* **Quy trình duyệt đơn (Dành cho Manager và HR)**:
  1. Đăng nhập tài khoản `manageruser` hoặc `hruser`.
  2. Các đơn chờ duyệt sẽ hiển thị nổi bật với nhãn trạng thái **Chờ duyệt** (Màu cam).
  3. Nhấp vào **Duyệt (Approve)** hoặc **Từ chối (Reject)**, ghi chú phản hồi trực tiếp cho nhân viên. Trạng thái đơn sẽ được cập nhật và đồng bộ thẳng vào bảng chấm công của nhân viên đó.

---

### 💵 Chức Năng 5: Tính Lương & Phúc Lợi (Dành cho HR & Admin)
* **Cách hoạt động**:
  1. Vào mục **Tính lương & Phúc lợi**.
  2. Hệ thống sẽ tự động tổng hợp số ngày công làm việc thực tế, số ngày nghỉ phép có lương từ bảng công để tính ra mức lương thực tế trong tháng của từng nhân viên.
  3. Mọi công thức tính toán đều minh bạch dựa trên lương cơ bản đã thiết lập trong hồ sơ nhân sự của từng người.

---

### 📊 Chức Năng 6: Đánh Giá KPI & Báo Cáo Tổng Hợp
* **Đánh giá KPI**: Quản lý có thể chấm điểm hiệu suất làm việc cho nhân viên theo từng quý/năm kèm nhận xét chi tiết.
* **Báo cáo tổng hợp**: Thống kê nhanh dưới dạng biểu đồ số liệu về tỷ lệ chuyên cần, số giờ tăng ca trung bình của toàn doanh nghiệp hoặc từng bộ phận để hỗ trợ ra quyết định quản lý.
