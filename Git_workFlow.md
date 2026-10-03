# 🛠️ Quy trình Phối hợp nhóm & Làm việc với Git

Tài liệu này chuẩn hóa quy trình phân chia giai đoạn code và các lệnh Git hàng ngày nhằm hạn chế tối đa xung đột mã nguồn (Conflict) cho 5 thành viên.

---

## 1️⃣ Luồng Phối hợp Công việc (Work Coordination Flow)

Dự án được triển khai tuần tự qua 4 giai đoạn khép kín nhằm đảm bảo tính đồng bộ dữ liệu và giao diện giữa 5 thành viên:

*   **Giai đoạn 1: Thiết kế UI & Chuẩn hóa Nền tảng (TV1, TV2, TV3)**
    *   **Thành viên 1:** Hoàn thiện bản vẽ Figma các màn hình cốt lõi (Khách hàng & Admin), trích xuất mã màu, typography và xuất toàn bộ ảnh/icon vào thư mục `assets/`.
    *   **Thành viên 3:** 
        * Thiết lập cấu trúc khung thư mục dự án và file `index.html` mẫu.
        * Viết `base.css` (Reset CSS, khai báo CSS Variables `:root`, layout `.container`).
        * Thiết kế CSDL trên MySQL qua phpMyAdmin, vẽ sơ đồ `ERD_Diagram.png` và xuất file `technostore.sql` vào thư mục `database/`.
    *   **Thành viên 2:** Dựa vào Figma của TV1 để code `components.css` (UI Kit: button, input, badge, card) và viết hàm render HTML động trong `components.js`.
    *   **Thống nhất chung:** Thống nhất cấu trúc Schema của đối tượng (Product, User, Order) và tạo sẵn file `js/data.js` để nạp dữ liệu mẫu ban đầu vào `localStorage`.
    *   👉 *Merge toàn bộ nhánh móng lên `main` để các thành viên đồng bộ về máy trước khi code giao diện.*

*   **Giai đoạn 2: Lắp ráp Giao diện HTML tĩnh (Toàn bộ 5 thành viên)**
    *   Mỗi thành viên tạo nhánh riêng và dựng các file `.html` được phân công trong thư mục `views/`.
    *   Bắt buộc nhúng đồng thời `base.css` và `components.css` vào tất cả các file HTML để đảm bảo chuẩn giao diện từ Figma.
    *   Liên kết các trang với nhau bằng thẻ `<a>` với đường dẫn tương đối (`./` hoặc `../`) để tạo luồng Clickable Prototype hoàn chỉnh.
    *   👉 *Hoàn tất bộ khung giao diện tĩnh, kiểm tra hiển thị trên trình duyệt trước khi gắn logic.*

*   **Giai đoạn 3: Hiện thực hóa Logic JavaScript & LocalStorage (Toàn bộ 5 thành viên)**
    *   **Thành viên 2 (`auth.js`):** Xử lý form Đăng ký, Đăng nhập, Đăng xuất, cập nhật thông tin cá nhân và lưu trạng thái phiên đăng nhập vào `localStorage`.
    *   **Thành viên 3 (`display.js`):** Đọc danh sách sản phẩm từ `localStorage`, render ra trang chủ, xử lý thuật toán phân trang (pagination) và hiển thị trang chi tiết khi click vào sản phẩm.
    *   **Thành viên 4 (`search.js`):** Lấy dữ liệu sản phẩm từ `localStorage`, dùng hàm `.filter()` để lọc theo từ khóa, danh mục và khoảng giá; tái sử dụng hàm render của TV2 để in kết quả ra `search.html`.
    *   **Thành viên 5 (`cart.js`):** Xử lý thêm/bớt/xóa giỏ hàng, tính tổng tiền tự động, kiểm tra tồn kho, xử lý form đặt hàng và đẩy Object đơn hàng mới vào `localStorage`.
    *   **Thành viên 1 (`admin.js`):** Thao tác CRUD (Thêm/Sửa/Ẩn sản phẩm) bên Admin; đọc mảng đơn hàng do TV5 đẩy lên để duyệt trạng thái (Chờ xử lý -> Đang giao -> Đã giao).

*   **Giai đoạn 4: Kiểm thử tích hợp, Sửa lỗi & Đóng gói Triển khai (Toàn nhóm & TV4)**
    *   **Kiểm thử luồng khép kín:** Khách đăng ký -> Đăng nhập -> Tìm kiếm -> Thêm giỏ -> Đặt hàng -> Admin đăng nhập -> Kiểm tra sản phẩm và duyệt đơn hàng -> Xem lại lịch sử mua.
    *   **Kiểm tra tính tương thích Local:** Mở trực tiếp các file HTML bằng giao thức file local (`file:///...`) trên máy tính lạ không có server để đảm bảo không lỗi font, mất ảnh hay chết script.
    *   **Thành viên 4:** Đóng gói phiên bản ổn định cuối cùng trên nhánh `main`, cấu hình và triển khai (Deploy) website lên nền tảng đám mây (GitHub Pages hoặc Vercel) để lấy điểm cộng triển khai thực tế.
---

## 2️⃣ Quy định Phân nhánh (Branching Strategy)

Tuyệt đối **KHÔNG** thao tác code trực tiếp trên nhánh `main`. 
Mỗi thành viên làm việc trên một nhánh tính năng riêng biệt:
- **Thành viên 1:** `feature/admin-dashboard`
- **Thành viên 2:** `feature/auth-components`
- **Thành viên 3:** `feature/display-database`
- **Thành viên 4:** `feature/search-deploy`
- **Thành viên 5:** `feature/cart-checkout`

**Lệnh khởi tạo và chuyển nhánh:**
```bash
git checkout -b <tên_nhánh_của_bạn>
```

---

## 3️⃣ Luồng Làm việc Hàng ngày (Daily Workflow)

Bắt buộc thực hiện đúng 4 bước sau mỗi khi mở máy lên code và kết thúc tính năng:

**Bước 1: Đồng bộ code mới nhất từ team (Trước khi code)**
```bash
git checkout main
git pull origin main
git checkout <tên_nhánh_của_bạn>
git merge main
```

**Bước 2: Đánh dấu file thay đổi (Sau khi code xong)**
```bash
git add .
```

**Bước 3: Lưu lịch sử phiên bản (Commit)**
Ghi rõ công việc vừa thực hiện (ngắn gọn, có ý nghĩa):
```bash
git commit -m "Thêm logic tính tổng tiền giỏ hàng"
```

**Bước 4: Đẩy code và Yêu cầu gộp (Push & PR)**
```bash
git push origin <tên_nhánh_của_bạn>
```
*Sau đó truy cập trang GitHub của dự án, tạo Pull Request (PR) để Trưởng nhóm (TV1) review và merge vào `main`.*

---

## 4️⃣ Xử lý Xung đột Code (Merge Conflicts)

Xung đột (Conflict) thường xảy ra khi 2 người cùng sửa chung file `style.css` hoặc `data.js`. Cách giải quyết:
1. Mở file bị bôi đỏ trong mục Source Control của VS Code.
2. Tìm các dòng code được bao quanh bởi `<<<<<<< HEAD`, `=======`, và `>>>>>>>`.
3. VS Code sẽ hiển thị các nút thao tác nhanh. Bấm chọn **Accept Both Changes** nếu muốn giữ code của cả 2, hoặc xóa các ký tự thừa và chỉnh sửa thủ công.
4. Lưu file lại.
5. Thực hiện lưu commit giải quyết xung đột:
```bash
git add .
git commit -m "Fix merge conflict file style.css"
```
