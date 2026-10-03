# 🛠️ Quy trình Phối hợp nhóm & Làm việc với Git

Tài liệu này chuẩn hóa quy trình phân chia giai đoạn code và các lệnh Git hàng ngày nhằm hạn chế tối đa xung đột mã nguồn (Conflict) cho 5 thành viên.

---

## 1️⃣ Luồng Phối hợp Công việc (Work Coordination Flow)

Dự án được triển khai theo 4 giai đoạn nối tiếp. Các thành viên phải tuân thủ thứ tự này để có tài nguyên code của nhau:

*   **Giai đoạn 1: Dựng móng UI & Data (TV 2 & TV 3)**
    *   **Thành viên 3:** Xây dựng `base.css` (Reset css, biến màu `:root`, layout `.container`). Thiết lập cấu trúc thư mục và `index.html`.
    *   **Thành viên 2:** Xây dựng `components.css` (UI Kit định dạng chung cho input, button) và file `components.js` chứa hàm sinh giao diện động.
    *   👉 *Merge toàn bộ lên nhánh `main` để các thành viên khác kéo về tái sử dụng.*
*   **Giai đoạn 2: Lắp ráp Giao diện (Toàn nhóm)**
    *   Mỗi thành viên tạo các file `.html` riêng biệt trong thư mục `views`.
    *   Tất cả phải `<link>` file `base.css` và `components.css` vào trang của mình để đảm bảo giao diện đồng bộ 100% với Figma. 
*   **Giai đoạn 3: Xử lý Logic Javascript (TV 1, 4, 5)**
    *   **Thành viên 4 (Tìm kiếm):** Rút mảng sản phẩm từ `localStorage`, dùng hàm `.filter()` để lọc đa điều kiện, gọi hàm render của TV2 để in kết quả.
    *   **Thành viên 5 (Giỏ hàng):** Viết logic tính toán tiền, tạo Object đơn hàng mới và đẩy vào `localStorage`.
    *   **Thành viên 1 (Admin):** Truy xuất mảng Đơn hàng do TV5 vừa tạo để hiển thị lên bảng quản trị và xử lý thay đổi trạng thái (Đã giao, Hủy...).
*   **Giai đoạn 4: Đóng gói & Deploy (TV 4)**
    *   Kiểm tra chéo toàn bộ luồng, gộp code vào `main` và Deploy lên nền tảng đám mây.

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
