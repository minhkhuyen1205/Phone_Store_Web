# 📱 Techno Store - Nền tảng Thương mại Điện tử Bán Điện Thoại
---

## 📑 Mục lục
1. [Giới thiệu dự án](#1-giới-thiệu-dự-án)
2. [Tính năng cốt lõi](#2-tính-năng-cốt-lõi)
3. [Cấu trúc dự án](#3-cấu-trúc-dự-án)
4. [Phân công nhiệm vụ](#4-phân-công-nhiệm-vụ)
5. [Công nghệ sử dụng](#5-công-nghệ-sử-dụng)
6. [Tài liệu hướng dẫn](#6-tài-liệu-hướng-dẫn)

---

## 📄 1. Giới thiệu dự án
**Techno Store** là hệ thống website thương mại điện tử chuyên cung cấp các dòng điện thoại thông minh và phụ kiện công nghệ. Dự án được thực hiện trong khuôn khổ **Đồ án học phần Lập trình Web & Ứng dụng - Đại học Sài Gòn (SGU)**.

Dự án chú trọng vào việc xây dựng một **Clickable Prototype Website** hoàn chỉnh theo mô hình Multi-Page Application (MPA). Hệ thống sử dụng cơ chế lưu trữ `localStorage` để mô phỏng Database theo thời gian thực, đảm bảo website hoạt động ổn định 100% trong môi trường chấm điểm offline, đồng thời đi kèm bản thiết kế cơ sở dữ liệu MySQL tiêu chuẩn.

---

## 🚀 2. Tính năng cốt lõi

### 🛒 Phân hệ Khách hàng (End-User)
- **Quản lý tài khoản (Auth):** Đăng ký, đăng nhập và quản lý hồ sơ cá nhân.
- **Trưng bày & Phân trang:** Hiển thị danh sách sản phẩm (Grid/List), phân trang động.
- **Tìm kiếm đa chiều:** Lọc sản phẩm nâng cao kết hợp theo Tên, Hãng sản xuất và Khoảng giá.
- **Mua sắm & Thanh toán:** Giỏ hàng thông minh, form nhập địa chỉ giao hàng, tùy chọn phương thức thanh toán và lưu vết lịch sử đơn hàng.

### ⚙️ Phân hệ Quản trị (Admin)
- **Quản lý Sản phẩm:** Thêm mới, cập nhật, xóa và ẩn sản phẩm khỏi hệ thống.
- **Quản lý Nhập hàng:** Lập phiếu nhập kho, thiết lập tỷ lệ % lợi nhuận để hệ thống tự động xuất giá bán lẻ.
- **Quản lý Đơn hàng & Tồn kho:** Tra cứu, luân chuyển trạng thái đơn hàng và hệ thống tự động cảnh báo khi sản phẩm sắp hết hàng.

---

## 📁 3. Cấu trúc dự án

```text
TechnoStore/
├── assets/                  # Nơi lưu trữ toàn bộ tài nguyên tĩnh của website
│   ├── images/              # Hình ảnh sản phẩm, banner tiếp thị và logo
│   └── icons/               # Các biểu tượng (icon) định dạng SVG 
│
├── css/                     # Nơi chứa các tệp định dạng giao diện (Stylesheet)
│   ├── base.css             # Reset CSS, định nghĩa biến màu (:root) và layout cơ bản
│   ├── components.css       # Các class dùng chung cho toàn dự án (button, input, badge, card)
│   ├── admin.css            # Định kiểu riêng biệt cho phân hệ quản trị (Admin Dashboard)
│   └── style.css            # Định kiểu chi tiết cho các trang thuộc phân hệ Khách hàng
│
├── js/                      # Nơi chứa logic xử lý cốt lõi của website
│   ├── data.js              # Nạp mảng dữ liệu mẫu (Sản phẩm, User) vào localStorage
│   ├── components.js        # Hàm render các thành phần HTML lặp lại (Navbar, Footer, Product Card)
│   ├── auth.js              # Logic kiểm tra đăng nhập, đăng ký và quản lý phiên người dùng
│   ├── display.js           # Truy xuất sản phẩm từ localStorage, in ra giao diện và phân trang
│   ├── search.js            # Thuật toán lọc mảng sản phẩm đa tiêu chí (Tên, hãng, khoảng giá)
│   ├── cart.js              # Quản lý giỏ hàng, tính tổng tiền và tạo Object Đơn hàng
│   └── admin.js             # Logic chuyển Tab ẩn/hiện và thao tác CRUD bên Admin
│
├── views/                   # Nơi chứa các trang giao diện HTML
│   ├── admin.html           # (Giả lập SPA) Trang Quản trị duy nhất chứa luồng Dashboard, Products, Orders
│   │
│   └── customer/            # (Mô hình MPA) Các trang chức năng rời rạc của Khách hàng
│       ├── login.html       # Giao diện Đăng ký / Đăng nhập
│       ├── profile.html     # Giao diện xem và chỉnh sửa thông tin cá nhân
│       ├── detail.html      # Giao diện xem chi tiết thông số một sản phẩm
│       ├── search.html      # Giao diện tìm kiếm và hiển thị kết quả lọc
│       ├── cart.html        # Giao diện giỏ hàng tổng kết số lượng và đơn giá
│       ├── checkout.html    # Giao diện điền thông tin giao hàng và xác nhận thanh toán
│       └── history.html     # Giao diện xem lại lịch sử trạng thái đơn hàng cá nhân
│
├── database/                # Nơi chứa minh chứng thiết kế Cơ sở dữ liệu
│   ├── technostore.sql      # Script xuất cấu trúc bảng và dữ liệu từ MySQL/phpMyAdmin
│   └── ERD_Diagram.png      # Sơ đồ quan hệ thực thể minh họa kiến trúc Database
│
├── index.html               # Trang chủ website, hiển thị banner và các sản phẩm nổi bật
├── README.md                # Tài liệu tổng quan về dự án và phân công nhiệm vụ
├── SETUP_GUIDE.md           # Hướng dẫn chi tiết cách chạy website bằng Live Server
└── Git_workFlow.md          # Tài liệu quy định luồng làm việc và phân nhánh trên GitHub
```

---

## 👥 4. Phân công nhiệm vụ

Nhóm 5 thành viên chia tách module độc lập. Mọi thành viên đều tham gia thiết kế giao diện (HTML/CSS) và xử lý logic (JS) cho phần việc của mình:

| Thành viên | Nhiệm vụ chính phụ trách | Khối lượng |
| :--- | :--- | :---: |
| **Thành viên 1** (Trưởng nhóm) | **Admin toàn diện & Thiết kế Figma**<br>Thiết kế hệ thống UI trên Figma. Code các trang Admin (Dashboard, Sản phẩm, Đơn hàng) và logic xử lý `localStorage` bên quản trị. | **24%** |
| **Thành viên 2** | **Quản lý tài khoản (Auth) & UI Kit Components**<br>Trang Auth, Hồ sơ. Xây dựng `components.css` (button, input) và hàm JS sinh component động tái sử dụng. | **19%** |
| **Thành viên 3** | **Trưng bày, Chi tiết, Database & Base HTML**<br>Thiết kế Database. Dựng khung `base.css` và `index.html`. Xử lý in chi tiết sản phẩm và phân trang. | **19%** |
| **Thành viên 4** | **Tìm kiếm đa tiêu chí & Deploy**<br>Giao diện tìm kiếm. Xử lý thuật toán lọc sản phẩm theo điều kiện kết hợp. Triển khai website lên Internet. | **18%** |
| **Thành viên 5** | **Giỏ hàng, Thanh toán & Logic cốt lõi**<br>Giao diện Giỏ hàng, Thanh toán, Lịch sử. Xử lý logic tính tổng tiền, kiểm tra tồn kho và tạo đơn hàng. | **20%** |



---

## 🛠 5. Công nghệ sử dụng
- **Giao diện (Frontend):** HTML5, CSS3, JavaScript (Vanilla JS).
- **Lưu trữ (Storage):** LocalStorage (Mock Data) & MySQL (Thiết kế kiến trúc).
- **Thiết kế UI/UX:** Figma.
- **Quản lý phiên bản:** Git & GitHub.

---

## 📚 6. Tài liệu hướng dẫn
- 👉 **[Hướng dẫn Cài đặt & Chạy dự án (SETUP_GUIDE.md)](./SETUP_GUIDE.md)**
- 👉 **[Quy trình phối hợp nhóm & Luồng Git (Git_workFlow.md)](./Git_workFlow.md)**
