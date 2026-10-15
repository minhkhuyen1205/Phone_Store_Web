// 1. Hàm định dạng tiền tệ Việt Nam Đồng (VNĐ)
export const vnd = (n) => (Number(n) || 0).toLocaleString('vi-VN') + ' ₫';

// 2. Danh mục & Hãng sản xuất mẫu
export const categories = ['Điện thoại', 'Máy tính bảng', 'Tai nghe', 'Đồng hồ thông minh', 'Phụ kiện'];
export const brands = ['Apple', 'Samsung', 'Xiaomi', 'OPPO', 'Google'];

// 3. Dữ liệu danh sách sản phẩm mẫu (12 sản phẩm)
export const defaultProducts = [
  { id: 1, code: 'SP001', name: 'iPhone 16 Pro Max 256GB', brand: 'Apple', category: 'Điện thoại', price: 34990000, cost: 30200000, old: 36990000, ram: '8 GB', rom: '256 GB', chip: 'Apple A18 Pro', screen: '6.9" OLED 120Hz', camera: '48MP + 48MP + 12MP', battery: '4685 mAh', color: ['#d9d4cb', '#8c867b'], stock: 24, rating: 4.9, isNew: true, imported: 60, sold: 36 },
  { id: 2, code: 'SP002', name: 'Samsung Galaxy S25 Ultra 512GB', brand: 'Samsung', category: 'Điện thoại', price: 33490000, cost: 28900000, old: 35990000, ram: '12 GB', rom: '512 GB', chip: 'Snapdragon 8 Elite', screen: '6.9" Dynamic AMOLED 2X', camera: '200MP + 50MP + 10MP + 50MP', battery: '5000 mAh', color: ['#2b3a55', '#0f1626'], stock: 8, rating: 4.8, isNew: true, imported: 40, sold: 32 },
  { id: 3, code: 'SP003', name: 'iPhone 15 128GB', brand: 'Apple', category: 'Điện thoại', price: 18990000, cost: 16400000, old: 21990000, ram: '6 GB', rom: '128 GB', chip: 'Apple A16 Bionic', screen: '6.1" OLED 60Hz', camera: '48MP + 12MP', battery: '3349 mAh', color: ['#f3c9d0', '#d38b98'], stock: 41, rating: 4.7, imported: 80, sold: 39 },
  { id: 4, code: 'SP004', name: 'Xiaomi 15 Ultra 16GB/512GB', brand: 'Xiaomi', category: 'Điện thoại', price: 29990000, cost: 25800000, old: 32990000, ram: '16 GB', rom: '512 GB', chip: 'Snapdragon 8 Elite', screen: '6.73" AMOLED 120Hz', camera: '50MP Leica x4', battery: '5410 mAh', color: ['#1e1e22', '#55565c'], stock: 5, rating: 4.6, isNew: true, imported: 20, sold: 15 },
  { id: 5, code: 'SP005', name: 'Galaxy Z Flip6 256GB', brand: 'Samsung', category: 'Điện thoại', price: 21990000, cost: 18700000, old: 28990000, ram: '12 GB', rom: '256 GB', chip: 'Snapdragon 8 Gen 3', screen: '6.7" Dynamic AMOLED 2X', camera: '50MP + 12MP', battery: '4000 mAh', color: ['#b9d4f5', '#6f9bd1'], stock: 17, rating: 4.5, imported: 30, sold: 13 },
  { id: 6, code: 'SP006', name: 'OPPO Find X8 Pro 512GB', brand: 'OPPO', category: 'Điện thoại', price: 27990000, cost: 24100000, old: 29990000, ram: '16 GB', rom: '512 GB', chip: 'Dimensity 9400', screen: '6.78" LTPO AMOLED', camera: '50MP Hasselblad x4', battery: '5910 mAh', color: ['#f1ede4', '#bfb6a1'], stock: 12, rating: 4.6, imported: 25, sold: 13 },
  { id: 7, code: 'SP007', name: 'Google Pixel 9 Pro 256GB', brand: 'Google', category: 'Điện thoại', price: 24990000, cost: 21500000, old: 26990000, ram: '16 GB', rom: '256 GB', chip: 'Google Tensor G4', screen: '6.3" LTPO OLED', camera: '50MP + 48MP + 48MP', battery: '4700 mAh', color: ['#e7e3d6', '#a29c85'], stock: 3, rating: 4.7, imported: 15, sold: 12 },
  { id: 8, code: 'SP008', name: 'iPad Pro M4 11 inch Wi-Fi', brand: 'Apple', category: 'Máy tính bảng', price: 28990000, cost: 25200000, old: 30990000, ram: '8 GB', rom: '256 GB', chip: 'Apple M4', screen: '11" Tandem OLED', camera: '12MP', battery: '31.29 Wh', color: ['#c6c8cc', '#6e7076'], stock: 14, rating: 4.9, imported: 20, sold: 6 },
  { id: 9, code: 'SP009', name: 'AirPods Pro 2 USB-C', brand: 'Apple', category: 'Tai nghe', price: 5990000, cost: 4700000, old: 6790000, ram: '-', rom: '-', chip: 'Apple H2', screen: '-', camera: '-', battery: '6 giờ', color: ['#f4f4f6', '#c9cad0'], stock: 62, rating: 4.8, imported: 100, sold: 38 },
  { id: 10, code: 'SP010', name: 'Apple Watch Series 10 46mm', brand: 'Apple', category: 'Đồng hồ thông minh', price: 11990000, cost: 9900000, old: 12990000, ram: '-', rom: '64 GB', chip: 'Apple S10', screen: '46mm LTPO OLED', camera: '-', battery: '18 giờ', color: ['#2a2b30', '#0e0e11'], stock: 6, rating: 4.6, imported: 30, sold: 24 },
  { id: 11, code: 'SP011', name: 'Galaxy Tab S10+ 12GB/256GB', brand: 'Samsung', category: 'Máy tính bảng', price: 23990000, cost: 20400000, old: 25990000, ram: '12 GB', rom: '256 GB', chip: 'Dimensity 9300+', screen: '12.4" Dynamic AMOLED', camera: '13MP + 8MP', battery: '10090 mAh', color: ['#cfd3da', '#8a909c'], stock: 19, rating: 4.5, imported: 25, sold: 6 },
  { id: 12, code: 'SP012', name: 'Sạc nhanh MagSafe 25W', brand: 'Apple', category: 'Phụ kiện', price: 1090000, cost: 720000, old: 1290000, ram: '-', rom: '-', chip: '-', screen: '-', camera: '-', battery: '-', color: ['#fafafa', '#d4d5da'], stock: 120, rating: 4.4, imported: 200, sold: 80 }
];

// 4. Dữ liệu danh sách đơn hàng mẫu
export const defaultOrders = [
  { id: 'DH24101', customer: 'Nguyễn Minh Anh', date: '02/10/2026', total: 34990000, status: 'Mới đặt', pay: 'Chuyển khoản', items: [{ productId: 1, quantity: 1, price: 34990000 }] },
  { id: 'DH24100', customer: 'Trần Quốc Bảo', date: '02/10/2026', total: 6080000, status: 'Đã xác nhận', pay: 'Tiền mặt', items: [{ productId: 9, quantity: 1, price: 5990000 }, { productId: 12, quantity: 1, price: 1090000 }] },
  { id: 'DH24099', customer: 'Lê Thu Hà', date: '01/10/2026', total: 21990000, status: 'Đang giao', pay: 'Thẻ tín dụng', items: [{ productId: 5, quantity: 1, price: 21990000 }] },
  { id: 'DH24098', customer: 'Phạm Đức Long', date: '30/09/2026', total: 18990000, status: 'Đã giao', pay: 'Tiền mặt', items: [{ productId: 3, quantity: 1, price: 18990000 }] },
  { id: 'DH24097', customer: 'Võ Thanh Tâm', date: '29/09/2026', total: 33490000, status: 'Đã giao', pay: 'Chuyển khoản', items: [{ productId: 2, quantity: 1, price: 33490000 }] },
  { id: 'DH24096', customer: 'Đặng Hoàng Nam', date: '28/09/2026', total: 11990000, status: 'Đã huỷ', pay: 'Thẻ tín dụng', items: [{ productId: 10, quantity: 1, price: 11990000 }] },
  { id: 'DH24095', customer: 'Bùi Khánh Linh', date: '27/09/2026', total: 28990000, status: 'Đã giao', pay: 'Chuyển khoản', items: [{ productId: 8, quantity: 1, price: 28990000 }] }
];

// 5. Dữ liệu danh sách khách hàng mẫu
export const defaultCustomers = [
  { id: 'KH001', name: 'Nguyễn Minh Anh', email: 'minhanh@mail.com', phone: '0901 234 567', joined: '12/03/2025', orders: 8, locked: false },
  { id: 'KH002', name: 'Trần Quốc Bảo', email: 'quocbao@mail.com', phone: '0912 345 678', joined: '28/05/2025', orders: 3, locked: false },
  { id: 'KH003', name: 'Lê Thu Hà', email: 'thuha@mail.com', phone: '0933 456 789', joined: '02/07/2025', orders: 5, locked: false },
  { id: 'KH004', name: 'Phạm Đức Long', email: 'duclong@mail.com', phone: '0944 567 890', joined: '19/08/2025', orders: 1, locked: true },
  { id: 'KH005', name: 'Võ Thanh Tâm', email: 'thanhtam@mail.com', phone: '0977 678 901', joined: '04/01/2026', orders: 12, locked: false },
  { id: 'KH006', name: 'Đặng Hoàng Nam', email: 'hoangnam@mail.com', phone: '0988 789 012', joined: '15/02/2026', orders: 2, locked: false }
];

// 6. Dữ liệu danh sách phiếu nhập kho mẫu
export const defaultReceipts = [
  { id: 'PN0012', date: '28/09/2026', lines: 3, qty: 85, total: 1862000000, status: 'Hoàn thành' },
  { id: 'PN0011', date: '20/09/2026', lines: 2, qty: 40, total: 904000000, status: 'Hoàn thành' },
  { id: 'PN0010', date: '11/09/2026', lines: 4, qty: 120, total: 1215000000, status: 'Hoàn thành' },
  { id: 'PN0009', date: '03/10/2026', lines: 2, qty: 30, total: 612000000, status: 'Nháp' }
];

/* ========================================================
   CƠ CHẾ LƯU TRỮ VÀ HÀM HELPER TƯƠNG TÁC LOCALSTORAGE
======================================================== */

// Khởi tạo dữ liệu ban đầu
export function initData() {
  if (!localStorage.getItem('ts_products')) localStorage.setItem('ts_products', JSON.stringify(defaultProducts));
  if (!localStorage.getItem('ts_orders')) localStorage.setItem('ts_orders', JSON.stringify(defaultOrders));
  if (!localStorage.getItem('ts_customers')) localStorage.setItem('ts_customers', JSON.stringify(defaultCustomers));
  if (!localStorage.getItem('ts_receipts')) localStorage.setItem('ts_receipts', JSON.stringify(defaultReceipts));
  if (!localStorage.getItem('ts_categories')) localStorage.setItem('ts_categories', JSON.stringify(categories));
  if (!localStorage.getItem('ts_brands')) localStorage.setItem('ts_brands', JSON.stringify(brands));
}

// Các hàm lấy dữ liệu luôn mới nhất (Getters)
export const getProducts = () => JSON.parse(localStorage.getItem('ts_products')) || defaultProducts;
export const getOrders = () => JSON.parse(localStorage.getItem('ts_orders')) || defaultOrders;
export const getCustomers = () => JSON.parse(localStorage.getItem('ts_customers')) || defaultCustomers;
export const getReceipts = () => JSON.parse(localStorage.getItem('ts_receipts')) || defaultReceipts;
export const getCategories = () => JSON.parse(localStorage.getItem('ts_categories')) || categories;
export const getBrands = () => JSON.parse(localStorage.getItem('ts_brands')) || brands;

// Các hàm lưu dữ liệu cập nhật (Setters)
export const saveProducts = (data) => localStorage.setItem('ts_products', JSON.stringify(data));
export const saveOrders = (data) => localStorage.setItem('ts_orders', JSON.stringify(data));
export const saveCustomers = (data) => localStorage.setItem('ts_customers', JSON.stringify(data));
export const saveReceipts = (data) => localStorage.setItem('ts_receipts', JSON.stringify(data));

// Hàm Reset toàn bộ dữ liệu về mặc định 
export const resetToDefault = () => {
  localStorage.clear();
  initData();
  location.reload();
};

// Tự động chạy khởi tạo khi load file
initData();
