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
├── assets/                  
│   ├── images/              # Lưu trữ hình ảnh sản phẩm, banner quảng cáo, logo thương hiệu (.png, .jpg).
│   └── icons/               # Lưu trữ các biểu tượng hệ thống dạng vector (.svg) để hiển thị sắc nét.
│
├── css/                     
│   ├── base.css             # Thiết lập Reset CSS, khai báo biến màu (:root), quy chuẩn font chữ và khung layout chung (.container).
│   ├── components.css       # Định nghĩa các thành phần UI dùng chung: nút bấm (.btn), ô nhập liệu (.input), nhãn trạng thái (.badge), khung thẻ (.card).
│   ├── admin.css            # Định kiểu bố cục giao diện quản trị: thanh điều hướng dọc (sidebar), bảng dữ liệu (table), form quản lý.
│   └── style.css            # Định kiểu giao diện chi tiết cho các khối nội dung đặc thù thuộc phân hệ khách hàng.
│
├── js/                      
│   ├── data.js              # Khởi tạo dữ liệu mẫu (sản phẩm, tài khoản, đơn hàng) và lưu vào localStorage khi web chạy lần đầu.
│   ├── components.js        # Chứa các hàm JavaScript tạo và trả về chuỗi HTML tái sử dụng (thẻ sản phẩm, thanh điều hướng, chân trang).
│   ├── auth.js              # Xử lý logic đăng nhập, đăng ký, đăng xuất và kiểm tra phiên làm việc qua localStorage.
│   ├── display.js           # Truy xuất dữ liệu sản phẩm từ localStorage, hiển thị lên giao diện trang chủ/chi tiết và phân trang.
│   ├── search.js            # Xử lý thuật toán tìm kiếm và lọc mảng sản phẩm theo tên, danh mục, khoảng giá.
│   ├── cart.js              # Quản lý mảng giỏ hàng (thêm/sửa số lượng/xóa), tính tổng tiền và tạo đối tượng đơn hàng khi thanh toán.
│   └── admin.js             # Xử lý các thao tác CRUD (thêm, sửa, xóa/ẩn sản phẩm), quản lý nhập kho và duyệt trạng thái đơn hàng.
│
├── views/                   
│   ├── admin/               
│   │   ├── dashboard.html   # Giao diện tổng quan: hiển thị các thẻ thống kê doanh thu, số lượng đơn hàng, cảnh báo tồn kho.
│   │   ├── products.html    # Giao diện quản lý danh mục và sản phẩm: form nhập liệu và bảng hiển thị thao tác thêm/sửa/xóa.
│   │   └── orders.html      # Giao diện danh sách đơn hàng: bảng tra cứu chi tiết và các nút thao tác cập nhật trạng thái đơn.
│   │
│   └── customer/            
│       ├── login.html       # Giao diện biểu mẫu cho khách hàng đăng nhập hoặc tạo tài khoản mới.
│       ├── profile.html     # Giao diện xem và chỉnh sửa thông tin cá nhân của người dùng đã đăng nhập.
│       ├── detail.html      # Giao diện chi tiết sản phẩm: hình ảnh phóng to, thông số kỹ thuật, giá bán và nút thêm vào giỏ.
│       ├── search.html      # Giao diện hiển thị danh sách kết quả tìm kiếm kèm thanh bộ lọc tiêu chí bên cạnh.
│       ├── cart.html        # Giao diện giỏ hàng: bảng danh sách sản phẩm đã chọn, điều chỉnh số lượng và tổng thanh toán tạm tính.
│       ├── checkout.html    # Giao diện hoàn tất đơn: biểu mẫu nhập thông tin người nhận, địa chỉ và chọn phương thức thanh toán.
│       └── history.html     # Giao diện theo dõi danh sách các đơn hàng đã đặt và trạng thái xử lý tương ứng của từng đơn.
│
├── database/                
│   ├── technostore.sql      # Tập lệnh SQL hoàn chỉnh chứa cấu trúc tạo bảng và dữ liệu mẫu được trích xuất từ phpMyAdmin.
│   └── ERD_Diagram.png      # Sơ đồ quan hệ thực thể (ERD) minh họa kiến trúc liên kết giữa các bảng trong cơ sở dữ liệu.
│
├── index.html               # Trang chủ của website: điểm truy cập chính, hiển thị banner tiếp thị và lưới sản phẩm nổi bật.
├── README.md                # Tài liệu tổng quan: thông tin đề tài, chức năng cốt lõi, công nghệ sử dụng và kiến trúc hệ thống.
├── SETUP_GUIDE.md           # Hướng dẫn chi tiết cách thiết lập, cài đặt công cụ và khởi chạy website trên trình duyệt cục bộ.
└── Git_workFlow.md          # Quy chuẩn phân chia nhánh (branch), quy tắc commit và quy trình xử lý xung đột mã nguồn khi làm việc nhóm.
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
