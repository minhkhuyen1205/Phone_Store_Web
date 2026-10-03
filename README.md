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
DoAn_TechnoStore/
├── assets/                  
│   └── images/              # Lưu trữ hình ảnh sản phẩm thực tế (.png nền trong suốt), banner quảng cáo, logo cửa hàng (đã nén tối ưu dung lượng).
│
├── css/                     
│   ├── base.css             # Chứa CSS Reset (*), định nghĩa biến màu toàn cục (:root), font chữ mặc định, setup khung chứa chung (.container).
│   ├── components.css       # Chứa hệ thống UI Kit dùng chung: các biến thể nút bấm (.btn), nhãn trạng thái (.badge), ô nhập liệu (.form-input), thẻ sản phẩm (.product-card).
│   ├── admin.css            # Định kiểu cho phân hệ quản trị: bố cục sidebar dọc, các thẻ thống kê tổng quan (dashboard cards), bảng dữ liệu (data table) và form modal thêm/sửa.
│   │
│   └── pages/               # Tách CSS theo từng trang cụ thể để định dạng bố cục (layout) riêng biệt
│       ├── home.css         # Bố cục slider banner chính, lưới hiển thị danh mục và danh sách sản phẩm nổi bật của trang chủ.
│       ├── detail.css       # Bố cục chia 2 cột của trang chi tiết: cột trái chứa ảnh lớn/thumbnail, cột phải chứa bảng thông số cấu hình và cụm nút mua hàng.
│       ├── auth.css         # Bố cục canh giữa màn hình cho khối form đăng nhập/đăng ký và form cập nhật hồ sơ cá nhân.
│       ├── search.css       # Bố cục trang tìm kiếm: thanh bên (sidebar) chứa các bộ lọc (hãng, mức giá, sắp xếp) và lưới kết quả tìm kiếm bên phải.
│       └── cart.css         # Bố cục bảng danh sách giỏ hàng, bảng tóm tắt tiền đơn hàng, form điền thông tin thanh toán (checkout) và bảng lịch sử mua hàng.
│
├── js/                      
│   ├── data.js              # Khởi tạo mảng dữ liệu mẫu (10-15 sản phẩm, tài khoản mẫu) và ghi vào localStorage nếu trình duyệt chưa có dữ liệu.
│   ├── components.js        # Chứa các hàm JavaScript trả về chuỗi HTML tái sử dụng: renderNavbar(), renderFooter(), renderProductCard(product).
│   ├── auth.js              # Xử lý sự kiện submit form đăng ký, form đăng nhập, lưu thông tin tài khoản đang hoạt động vào localStorage, xử lý đăng xuất.
│   ├── display.js           # Đọc mảng sản phẩm từ localStorage, in ra lưới sản phẩm ở trang chủ, hiển thị chi tiết khi bấm vào một sản phẩm và tính toán thuật toán phân trang.
│   ├── search.js            # Lắng nghe sự kiện ô tìm kiếm và các checkbox bộ lọc, dùng hàm .filter() trên mảng sản phẩm và gọi hàm in kết quả ra màn hình.
│   ├── cart.js              # Xử lý thêm/sửa/xóa sản phẩm trong giỏ, cập nhật số lượng, tính tổng tiền tạm tính và đóng gói thành Object Đơn hàng lưu vào localStorage.
│   └── admin.js             # Xử lý logic chuyển tab ẩn/hiện (.active) giữa các mục quản trị, xử lý CRUD (thêm/sửa/xóa sản phẩm) và cập nhật trạng thái đơn hàng.
│
├── views/                   
│   ├── admin.html           # Khung sườn phân hệ quản trị (SPA): chứa thanh điều hướng dọc (sidebar) và các thẻ <section> riêng cho Dashboard, Quản lý sản phẩm, Quản lý đơn hàng.
│   │
│   └── customer/            # Các trang giao diện chức năng độc lập dành cho khách hàng (MPA)
│       ├── login.html       # Giao diện biểu mẫu đăng ký tài khoản mới và đăng nhập hệ thống.
│       ├── profile.html     # Giao diện xem và chỉnh sửa thông tin cá nhân, đổi mật khẩu của tài khoản.
│       ├── detail.html      # Giao diện hiển thị chi tiết thông tin, hình ảnh lớn, cấu hình và nút bấm thêm vào giỏ của một sản phẩm.
│       ├── search.html      # Giao diện tìm kiếm sản phẩm kèm khung lọc đa tiêu chí (danh mục, mức giá) và danh sách kết quả.
│       ├── cart.html        # Giao diện bảng danh sách sản phẩm đã chọn mua, thay đổi số lượng và nút chuyển sang thanh toán.
│       ├── checkout.html    # Giao diện form nhập thông tin người nhận, địa chỉ giao hàng và lựa chọn phương thức thanh toán.
│       └── history.html     # Giao diện tra cứu danh sách đơn hàng đã mua và theo dõi trạng thái xử lý từng đơn.
│
├── database/                
│   ├── technostore.sql      # Tập lệnh SQL tạo cấu trúc bảng (Categories, Products, Users, Orders, Order_Details) và dữ liệu mẫu trích xuất từ phpMyAdmin.
│   └── ERD_Diagram.png      # Sơ đồ quan hệ thực thể (ERD) minh họa liên kết khóa chính (PK) và khóa ngoại (FK) giữa các bảng.
│
├── index.html               # Điểm truy cập chính của website: chứa thanh điều hướng, banner chào mừng và các khối sản phẩm mới/bán chạy.
├── README.md                # Tài liệu tổng quan: mô tả đề tài, các tính năng chính, kiến trúc thư mục và bảng phân chia nhiệm vụ.
├── SETUP_GUIDE.md           # Tài liệu hướng dẫn các bước mở và chạy thử website trên trình duyệt máy tính.
└── Git_workFlow.md          # Tài liệu quy định quy trình phân nhánh Git (branching), cú pháp đặt tên commit và các bước đồng bộ mã nguồn nhóm.
```

---

## 👥 4. Phân công nhiệm vụ

Nhóm 5 thành viên chia tách module độc lập. Mọi thành viên đều tham gia thiết kế giao diện (HTML/CSS) và xử lý logic (JS) cho phần việc của mình:

| Thành viên | Nhiệm vụ chính phụ trách | 
| :--- | :--- | 
| **Thành viên 1** (Trưởng nhóm) | **Admin toàn diện & Thiết kế Figma**<br>Thiết kế hệ thống UI trên Figma. Code các trang Admin (Dashboard, Sản phẩm, Đơn hàng) và logic xử lý `localStorage` bên quản trị.
| **Thành viên 2** | **Quản lý tài khoản (Auth) & UI Kit Components**<br>Trang Auth, Hồ sơ. Xây dựng `components.css` (button, input) và hàm JS sinh component động tái sử dụng. 
| **Thành viên 3** | **Trưng bày, Chi tiết, Database & Base HTML**<br>Thiết kế Database. Dựng khung `base.css` và `index.html`. Xử lý in chi tiết sản phẩm và phân trang. 
| **Thành viên 4** | **Tìm kiếm đa tiêu chí & Deploy**<br>Giao diện tìm kiếm. Xử lý thuật toán lọc sản phẩm theo điều kiện kết hợp. Triển khai website lên Internet. 
| **Thành viên 5** | **Giỏ hàng, Thanh toán & Logic cốt lõi**<br>Giao diện Giỏ hàng, Thanh toán, Lịch sử. Xử lý logic tính tổng tiền, kiểm tra tồn kho và tạo đơn hàng. 


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
