# ⚙ Hướng dẫn Cài đặt & Khởi chạy Dự án Techno Store

Tài liệu này cung cấp các bước thiết lập môi trường nội bộ (Local) để chạy, kiểm tra và phát triển dự án Techno Store.

---

## 💻 1. Yêu cầu Hệ thống

- **Visual Studio Code (VS Code):** Trình soạn thảo mã nguồn chính.
- **Git Bash:** Công cụ dòng lệnh quản lý phiên bản.
- **VS Code Extension (Bắt buộc):** `Live Server` (để chạy giả lập máy chủ và tự động làm mới trình duyệt).

---

## 📥 2. Tải Mã nguồn & Thiết lập Môi trường

**Bước 1: Clone dự án về máy**
Mở Terminal / Git Bash và chạy chuỗi lệnh sau:
```bash
git clone <https://github.com/minhkhuyen1205/Phone_Store_Web>
cd TechnoStore
```

**Bước 2: Hiểu về Cơ chế Lưu trữ Dữ liệu (Mock Data)**
Dự án được tối ưu để **chấm điểm offline** thông qua trình duyệt, không yêu cầu cài đặt Node.js hay XAMPP.
- Toàn bộ dữ liệu (Sản phẩm, Tài khoản, Đơn hàng) được lưu trữ và xử lý trực tiếp trong `localStorage` của trình duyệt.
- Khi mở trang web lần đầu, file `js/data.js` sẽ tự động kích hoạt để nạp mảng dữ liệu mẫu (Mock Data) vào bộ nhớ.

**Bước 3: Tham khảo cấu trúc CSDL thực tế (Tùy chọn)**
Nhóm có đính kèm thiết kế Database chuẩn để minh chứng cho phần kiến trúc dữ liệu. Bạn có thể mở thư mục `database/` để xem bản vẽ `ERD_Diagram.png` hoặc import file `technostore.sql` vào MySQL/phpMyAdmin nếu cần kiểm tra các trường dữ liệu.

---

## 🚀 3. Hướng dẫn Khởi chạy Web

1. Mở toàn bộ thư mục `TechnoStore` bằng phần mềm VS Code.
2. Tìm đến file `index.html` (để vào trang khách hàng) hoặc `views/admin/dashboard.html` (để vào trang quản trị).
3. Click chuột phải vào file HTML đó, chọn **Open with Live Server**.
4. Trình duyệt mặc định sẽ tự động mở trang web tại địa chỉ cục bộ: `http://127.0.0.1:5500`.

---

## 🐛 4. Khắc phục Sự cố (Troubleshooting)

| Lỗi thường gặp | Nguyên nhân & Cách xử lý |
| :--- | :--- |
| **Vỡ giao diện, mất màu, mất hình ảnh** | Lỗi sai đường dẫn file. Đảm bảo bạn đang sử dụng **đường dẫn tương đối** (VD: `../css/style.css` hoặc `./assets/images/`). Tuyệt đối không dùng dấu gạch chéo `/` ở đầu đường dẫn khi mở bằng file local. |
| **Dữ liệu không cập nhật sau khi sửa code JS** | Trình duyệt lưu cache hoặc dính dữ liệu cũ trong Storage. <br>1. Nhấn `F12` > tab `Application` > `Local Storage` > Click chuột phải chọn `Clear`. <br>2. Nhấn `Ctrl + F5` để làm mới hoàn toàn trang web và nạp lại mock data từ `data.js`. |
| **Tính năng giỏ hàng không hoạt động** | Chưa chạy file `data.js` lần đầu tiên. Hãy trở về `index.html` load lại trang 1 lần để hệ thống khởi tạo mảng rỗng cho giỏ hàng. |
