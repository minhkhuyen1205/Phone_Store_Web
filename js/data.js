/**
 * Định dạng tiền tệ Việt Nam (VNĐ)
 * @param {number|string} n - Số tiền cần format
 * @returns {string} Chuỗi hiển thị VNĐ (VD: 34.990.000 ₫)
 */
function vnd(n) {
  if (typeof n !== 'number') n = Number(n) || 0;
  return n.toLocaleString('vi-VN') + ' ₫';
}

/**
 * Chuyển chuỗi tiếng Việt có dấu thành mã viết hoa không dấu dùng cho SKU
 * @param {string} str - Chuỗi ban đầu (VD: "Titan Đen")
 * @returns {string} Chuỗi slug (VD: "TITAN_DEN")
 */
function slugifySkuPart(str) {
  if (!str) return 'DEF';
  return String(str)
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/đ/g, 'd')
    .replace(/Đ/g, 'D')
    .replace(/[^a-zA-Z0-9]/g, '_')
    .replace(/_+/g, '_')
    .replace(/^_|_$/g, '')
    .toUpperCase();
}

// ==========================================================================
//DANH MỤC & THƯƠNG HIỆU MẶC ĐỊNH
// ==========================================================================
const defaultCategories = ['Điện thoại', 'Máy tính bảng', 'Tai nghe', 'Đồng hồ thông minh', 'Phụ kiện'];
const defaultBrands = ['Apple', 'Samsung', 'Xiaomi', 'OPPO', 'Google'];

const defaultProducts = [
  {
    id: 1,
    code: 'SP001',
    name: 'iPhone 16 Pro Max',
    brand: 'Apple',
    category: 'Điện thoại',
    description: 'iPhone 16 Pro Max sở hữu màn hình Super Retina XDR 6.9" viền siêu mỏng, chip Apple A18 Pro mạnh mẽ vượt trội cùng camera 48MP Fusion thế hệ mới. Khung viền Titan chuẩn hàng không vũ trụ siêu nhẹ và bền bỉ.',
    image: '',
    createdAt: '2026-09-20',
    isDeleted: false,
    attributes: ['Màu sắc', 'RAM', 'ROM'],
    // Thông số kỹ thuật chung
    chip: 'Apple A18 Pro',
    screen: '6.9" OLED 120Hz',
    camera: '48MP + 48MP + 12MP',
    battery: '4685 mAh',
    color: ['#d9d4cb', '#8c867b'],
    rating: 4.9,
    isNew: true,
    imported: 60,
    sold: 36,
    // Danh sách biến thể (Product Variant Matrix)
    variants: [
      { sku: 'SP001-TITANDEN-8GB-256GB', color: 'Titan Đen', ram: '8GB', rom: '256GB', cost: 30200000, price: 34990000, stock: 14 },
      { sku: 'SP001-TITANTRANG-8GB-256GB', color: 'Titan Trắng', ram: '8GB', rom: '256GB', cost: 30200000, price: 34990000, stock: 10 },
      { sku: 'SP001-TITANTUNHIEN-8GB-512GB', color: 'Titan Tự Nhiên', ram: '8GB', rom: '512GB', cost: 34500000, price: 39990000, stock: 0 }, // Hết hàng demo
      { sku: 'SP001-TITANSAMAC-8GB-1TB', color: 'Titan Sa Mạc', ram: '8GB', rom: '1TB', cost: 40000000, price: 46990000, stock: 5 }
    ]
  },
  {
    id: 2,
    code: 'SP002',
    name: 'Samsung Galaxy S25 Ultra',
    brand: 'Samsung',
    category: 'Điện thoại',
    description: 'Galaxy S25 Ultra trang bị chip Snapdragon 8 Elite đỉnh cao, camera 200MP bắt trọn từng chi tiết, tích hợp bút S-Pen thông minh và bộ tính năng Galaxy AI tiên tiến nhất hiện nay.',
    image: '',
    createdAt: '2026-09-22',
    isDeleted: false,
    attributes: ['Màu sắc', 'RAM', 'ROM'],
    chip: 'Snapdragon 8 Elite',
    screen: '6.9" Dynamic AMOLED 2X',
    camera: '200MP + 50MP + 10MP + 50MP',
    battery: '5000 mAh',
    color: ['#2b3a55', '#0f1626'],
    rating: 4.8,
    isNew: true,
    imported: 40,
    sold: 32,
    variants: [
      { sku: 'SP002-XANHTITAN-12GB-256GB', color: 'Xanh Titan', ram: '12GB', rom: '256GB', cost: 26000000, price: 30490000, stock: 5 },
      { sku: 'SP002-DENTITAN-12GB-512GB', color: 'Đen Titan', ram: '12GB', rom: '512GB', cost: 28900000, price: 33490000, stock: 3 },
      { sku: 'SP002-XAMTITAN-16GB-1TB', color: 'Xám Titan', ram: '16GB', rom: '1TB', cost: 36000000, price: 41990000, stock: 0 }
    ]
  },
  {
    id: 3,
    code: 'SP003',
    name: 'iPhone 15',
    brand: 'Apple',
    category: 'Điện thoại',
    description: 'Thiết kế mặt lưng kính pha màu bền bỉ, đảo Dynamic Island tiện ích, chip A16 Bionic và cổng sạc USB-C tiện dụng đáp ứng trọn vẹn mọi nhu cầu học tập và giải trí.',
    image: '',
    createdAt: '2026-08-15',
    isDeleted: false,
    attributes: ['Màu sắc', 'RAM', 'ROM'],
    chip: 'Apple A16 Bionic',
    screen: '6.1" OLED 60Hz',
    camera: '48MP + 12MP',
    battery: '3349 mAh',
    color: ['#f3c9d0', '#d38b98'],
    rating: 4.7,
    imported: 80,
    sold: 39,
    variants: [
      { sku: 'SP003-HONG-6GB-128GB', color: 'Hồng Pastel', ram: '6GB', rom: '128GB', cost: 16400000, price: 18990000, stock: 25 },
      { sku: 'SP003-XANHLA-6GB-128GB', color: 'Xanh Lá', ram: '6GB', rom: '128GB', cost: 16400000, price: 18990000, stock: 10 },
      { sku: 'SP003-DEN-6GB-256GB', color: 'Đen Nhám', ram: '6GB', rom: '256GB', cost: 19100000, price: 21990000, stock: 6 }
    ]
  },
  {
    id: 4,
    code: 'SP004',
    name: 'Xiaomi 15 Ultra',
    brand: 'Xiaomi',
    category: 'Điện thoại',
    description: 'Hệ thống 4 ống kính quang học Leica đỉnh cao, chip Snapdragon 8 Elite tản nhiệt buồng hơi 3D IceLoop, màn hình 2K siêu sáng 3200 nits.',
    image: '',
    createdAt: '2026-09-25',
    isDeleted: false,
    attributes: ['Màu sắc', 'RAM', 'ROM'],
    chip: 'Snapdragon 8 Elite',
    screen: '6.73" AMOLED 120Hz',
    camera: '50MP Leica x4',
    battery: '5410 mAh',
    color: ['#1e1e22', '#55565c'],
    rating: 4.6,
    isNew: true,
    imported: 20,
    sold: 15,
    variants: [
      { sku: 'SP004-DENGOM-16GB-512GB', color: 'Đen Gốm', ram: '16GB', rom: '512GB', cost: 25800000, price: 29990000, stock: 5 },
      { sku: 'SP004-TRANGGOM-16GB-1TB', color: 'Trắng Gốm', ram: '16GB', rom: '1TB', cost: 29000000, price: 33990000, stock: 3 }
    ]
  },
  {
    id: 5,
    code: 'SP005',
    name: 'Galaxy Z Flip6',
    brand: 'Samsung',
    category: 'Điện thoại',
    description: 'Thiết kế gập vỏ sò thời thượng nhỏ gọn, màn hình ngoài FlexWindow tùy biến thông minh, kháng nước chuẩn IP48 cùng chip xử lý mạnh mẽ.',
    image: '',
    createdAt: '2026-08-10',
    isDeleted: false,
    attributes: ['Màu sắc', 'RAM', 'ROM'],
    chip: 'Snapdragon 8 Gen 3',
    screen: '6.7" Dynamic AMOLED 2X',
    camera: '50MP + 12MP',
    battery: '4000 mAh',
    color: ['#b9d4f5', '#6f9bd1'],
    rating: 4.5,
    imported: 30,
    sold: 13,
    variants: [
      { sku: 'SP005-XANHMAYA-12GB-256GB', color: 'Xanh Maya', ram: '12GB', rom: '256GB', cost: 18700000, price: 21990000, stock: 10 },
      { sku: 'SP005-VANGSOLAR-12GB-512GB', color: 'Vàng Solar', ram: '12GB', rom: '512GB', cost: 21500000, price: 25490000, stock: 7 }
    ]
  },
  {
    id: 6,
    code: 'SP006',
    name: 'OPPO Find X8 Pro',
    brand: 'OPPO',
    category: 'Điện thoại',
    description: 'Camera kép tiềm vọng Hasselblad dẫn đầu xu hướng nhiếp ảnh, màn hình cong siêu mỏng 4 cạnh và thời lượng pin vượt trội 5910mAh Silicon-Carbon.',
    image: '',
    createdAt: '2026-09-28',
    isDeleted: false,
    attributes: ['Màu sắc', 'RAM', 'ROM'],
    chip: 'Dimensity 9400',
    screen: '6.78" LTPO AMOLED',
    camera: '50MP Hasselblad x4',
    battery: '5910 mAh',
    color: ['#f1ede4', '#bfb6a1'],
    rating: 4.6,
    imported: 25,
    sold: 13,
    variants: [
      { sku: 'SP006-TRANGNGOC-16GB-512GB', color: 'Trắng Ngọc Trai', ram: '16GB', rom: '512GB', cost: 24100000, price: 27990000, stock: 8 },
      { sku: 'SP006-DENKHONGGIAN-16GB-512GB', color: 'Đen Không Gian', ram: '16GB', rom: '512GB', cost: 24100000, price: 27990000, stock: 4 }
    ]
  },
  {
    id: 7,
    code: 'SP007',
    name: 'Google Pixel 9 Pro',
    brand: 'Google',
    category: 'Điện thoại',
    description: 'Trải nghiệm Android thuần khiết thông minh nhất với chip Tensor G4, trợ lý ảo Gemini Live tích hợp sâu và hệ thống camera AI xóa nhòa mọi giới hạn.',
    image: '',
    createdAt: '2026-09-12',
    isDeleted: false,
    attributes: ['Màu sắc', 'RAM', 'ROM'],
    chip: 'Google Tensor G4',
    screen: '6.3" LTPO OLED',
    camera: '50MP + 48MP + 48MP',
    battery: '4700 mAh',
    color: ['#e7e3d6', '#a29c85'],
    rating: 4.7,
    imported: 15,
    sold: 12,
    variants: [
      { sku: 'SP007-TRANGSU-16GB-128GB', color: 'Trắng Sứ', ram: '16GB', rom: '128GB', cost: 19800000, price: 22990000, stock: 2 },
      { sku: 'SP007-DENOBSIDIAN-16GB-256GB', color: 'Đen Obsidian', ram: '16GB', rom: '256GB', cost: 21500000, price: 24990000, stock: 1 }
    ]
  },
  {
    id: 8,
    code: 'SP008',
    name: 'iPad Pro M4 11 inch Wi-Fi',
    brand: 'Apple',
    category: 'Máy tính bảng',
    description: 'Màn hình Ultra Retina XDR công nghệ Tandem OLED đột phá, thiết kế siêu mỏng chỉ 5.3mm và sức mạnh không đối thủ từ bộ vi xử lý Apple M4.',
    image: '',
    createdAt: '2026-07-15',
    isDeleted: false,
    attributes: ['Màu sắc', 'RAM', 'ROM'],
    chip: 'Apple M4',
    screen: '11" Tandem OLED',
    camera: '12MP',
    battery: '31.29 Wh',
    color: ['#c6c8cc', '#6e7076'],
    rating: 4.9,
    imported: 20,
    sold: 6,
    variants: [
      { sku: 'SP008-BAC-8GB-256GB', color: 'Bạc Ánh Kim', ram: '8GB', rom: '256GB', cost: 25200000, price: 28990000, stock: 9 },
      { sku: 'SP008-DEN-8GB-512GB', color: 'Đen Không Gian', ram: '8GB', rom: '512GB', cost: 28500000, price: 32490000, stock: 5 }
    ]
  },
  {
    id: 9,
    code: 'SP009',
    name: 'AirPods Pro 2 USB-C',
    brand: 'Apple',
    category: 'Tai nghe',
    description: 'Chống ồn chủ động ANC gấp 2 lần, chế độ Âm thanh thích ứng mượt mà và hộp sạc MagSafe trang bị cổng USB-C tiện lợi kèm loa định vị Precision Finding.',
    image: '',
    createdAt: '2026-06-10',
    isDeleted: false,
    attributes: ['Màu sắc', 'RAM', 'ROM'],
    chip: 'Apple H2',
    screen: '-',
    camera: '-',
    battery: '6 giờ',
    color: ['#f4f4f6', '#c9cad0'],
    rating: 4.8,
    imported: 100,
    sold: 38,
    variants: [
      { sku: 'SP009-TRANG-STD', color: 'Trắng', ram: 'Tiêu chuẩn', rom: 'Tiêu chuẩn', cost: 4700000, price: 5990000, stock: 62 }
    ]
  },
  {
    id: 10,
    code: 'SP010',
    name: 'Apple Watch Series 10 46mm',
    brand: 'Apple',
    category: 'Đồng hồ thông minh',
    description: 'Màn hình OLED góc nhìn rộng siêu sáng, thiết kế mỏng nhẹ tinh tế nhất từ trước đến nay với tính năng đo điện tâm đồ ECG và phát hiện ngưng thở khi ngủ.',
    image: '',
    createdAt: '2026-09-20',
    isDeleted: false,
    attributes: ['Màu sắc', 'RAM', 'ROM'],
    chip: 'Apple S10',
    screen: '46mm LTPO OLED',
    camera: '-',
    battery: '18 giờ',
    color: ['#2a2b30', '#0e0e11'],
    rating: 4.6,
    imported: 30,
    sold: 24,
    variants: [
      { sku: 'SP010-DENBONG-64GB', color: 'Nhôm Đen Bóng', ram: 'Tiêu chuẩn', rom: '64GB', cost: 9900000, price: 11990000, stock: 4 },
      { sku: 'SP010-NHOMBAC-64GB', color: 'Nhôm Bạc', ram: 'Tiêu chuẩn', rom: '64GB', cost: 9900000, price: 11990000, stock: 2 }
    ]
  },
  {
    id: 11,
    code: 'SP011',
    name: 'Galaxy Tab S10+ 12GB/256GB',
    brand: 'Samsung',
    category: 'Máy tính bảng',
    description: 'Màn hình Dynamic AMOLED 2X 12.4" phủ lớp chống chói cao cấp, bút S-Pen kháng nước đi kèm và hiệu năng tối ưu hóa đồ họa cùng Galaxy AI.',
    image: '',
    createdAt: '2026-09-26',
    isDeleted: false,
    attributes: ['Màu sắc', 'RAM', 'ROM'],
    chip: 'Dimensity 9300+',
    screen: '12.4" Dynamic AMOLED',
    camera: '13MP + 8MP',
    battery: '10090 mAh',
    color: ['#cfd3da', '#8a909c'],
    rating: 4.5,
    imported: 25,
    sold: 6,
    variants: [
      { sku: 'SP011-XAMMOON-12GB-256GB', color: 'Xám Moonstone', ram: '12GB', rom: '256GB', cost: 20400000, price: 23990000, stock: 12 },
      { sku: 'SP011-BACPLAT-12GB-512GB', color: 'Bạc Platinum', ram: '12GB', rom: '512GB', cost: 23500000, price: 27490000, stock: 7 }
    ]
  },
  {
    id: 12,
    code: 'SP012',
    name: 'Sạc nhanh MagSafe 25W',
    brand: 'Apple',
    category: 'Phụ kiện',
    description: 'Đế sạc không dây nam châm từ tính MagSafe chính hãng, hỗ trợ sạc nhanh lên đến 25W khi kết hợp với củ sạc công suất từ 30W trở lên.',
    image: '',
    createdAt: '2026-09-18',
    isDeleted: false,
    attributes: ['Màu sắc', 'RAM', 'ROM'],
    chip: '-',
    screen: '-',
    camera: '-',
    battery: '-',
    color: ['#fafafa', '#d4d5da'],
    rating: 4.4,
    imported: 200,
    sold: 80,
    variants: [
      { sku: 'SP012-TRANG-1M', color: 'Trắng 1 mét', ram: 'Tiêu chuẩn', rom: 'Tiêu chuẩn', cost: 720000, price: 1090000, stock: 80 },
      { sku: 'SP012-TRANG-2M', color: 'Trắng 2 mét', ram: 'Tiêu chuẩn', rom: 'Tiêu chuẩn', cost: 950000, price: 1390000, stock: 40 }
    ]
  }
];

// Chuẩn hóa và tự động tính basePrice, stock cho danh sách sản phẩm mẫu
defaultProducts.forEach(p => {
  if (p.variants && p.variants.length > 0) {
    p.basePrice = Math.min(...p.variants.map(v => v.price));
    p.stock = p.variants.reduce((sum, v) => sum + (v.stock || 0), 0);
    p.price = p.basePrice; // Alias tương thích
    p.cost = Math.min(...p.variants.map(v => v.cost || 0));
  }
});

// ==========================================================================
// 3. ĐƠN HÀNG MẪU (CHUẨN HÓA LƯU THEO SKU BIẾN THỂ)
// ==========================================================================
const defaultOrders = [
  {
    id: 'DH24101',
    customer: 'Nguyễn Minh Anh',
    date: '02/10/2026',
    total: 34990000,
    status: 'Mới đặt',
    pay: 'Chuyển khoản',
    items: [
      { sku: 'SP001-TITANDEN-8GB-256GB', productId: 1, name: 'iPhone 16 Pro Max (Titan Đen - 8GB/256GB)', price: 34990000, qty: 1 }
    ]
  },
  {
    id: 'DH24100',
    customer: 'Trần Quốc Bảo',
    date: '02/10/2026',
    total: 7080000,
    status: 'Đã xác nhận',
    pay: 'Tiền mặt',
    items: [
      { sku: 'SP009-TRANG-STD', productId: 9, name: 'AirPods Pro 2 USB-C (Trắng)', price: 5990000, qty: 1 },
      { sku: 'SP012-TRANG-1M', productId: 12, name: 'Sạc nhanh MagSafe 25W (Trắng 1 mét)', price: 1090000, qty: 1 }
    ]
  },
  {
    id: 'DH24099',
    customer: 'Lê Thu Hà',
    date: '01/10/2026',
    total: 21990000,
    status: 'Đang giao',
    pay: 'Thẻ tín dụng',
    items: [
      { sku: 'SP005-XANHMAYA-12GB-256GB', productId: 5, name: 'Galaxy Z Flip6 (Xanh Maya - 12GB/256GB)', price: 21990000, qty: 1 }
    ]
  },
  {
    id: 'DH24098',
    customer: 'Phạm Đức Long',
    date: '30/09/2026',
    total: 18990000,
    status: 'Đã giao',
    pay: 'Tiền mặt',
    items: [
      { sku: 'SP003-HONG-6GB-128GB', productId: 3, name: 'iPhone 15 (Hồng Pastel - 6GB/128GB)', price: 18990000, qty: 1 }
    ]
  },
  {
    id: 'DH24097',
    customer: 'Võ Thanh Tâm',
    date: '29/09/2026',
    total: 33490000,
    status: 'Đã giao',
    pay: 'Chuyển khoản',
    items: [
      { sku: 'SP002-DENTITAN-12GB-512GB', productId: 2, name: 'Samsung Galaxy S25 Ultra (Đen Titan - 12GB/512GB)', price: 33490000, qty: 1 }
    ]
  },
  {
    id: 'DH24096',
    customer: 'Đặng Hoàng Nam',
    date: '28/09/2026',
    total: 11990000,
    status: 'Đã huỷ',
    pay: 'Thẻ tín dụng',
    items: [
      { sku: 'SP010-DENBONG-64GB', productId: 10, name: 'Apple Watch Series 10 (Nhôm Đen Bóng - 64GB)', price: 11990000, qty: 1 }
    ]
  },
  {
    id: 'DH24095',
    customer: 'Bùi Khánh Linh',
    date: '27/09/2026',
    total: 28990000,
    status: 'Đã giao',
    pay: 'Chuyển khoản',
    items: [
      { sku: 'SP008-BAC-8GB-256GB', productId: 8, name: 'iPad Pro M4 11 inch Wi-Fi (Bạc Ánh Kim - 8GB/256GB)', price: 28990000, qty: 1 }
    ]
  }
];

// ==========================================================================
// 4. DANH SÁCH KHÁCH HÀNG & PHIẾU NHẬP
// ==========================================================================
const defaultCustomers = [
  { id: 'KH001', name: 'Nguyễn Minh Anh', email: 'minhanh@mail.com', phone: '0901 234 567', joined: '12/03/2025', orders: 8, locked: false },
  { id: 'KH002', name: 'Trần Quốc Bảo', email: 'quocbao@mail.com', phone: '0912 345 678', joined: '28/05/2025', orders: 3, locked: false },
  { id: 'KH003', name: 'Lê Thu Hà', email: 'thuha@mail.com', phone: '0933 456 789', joined: '02/07/2025', orders: 5, locked: false },
  { id: 'KH004', name: 'Phạm Đức Long', email: 'duclong@mail.com', phone: '0944 567 890', joined: '19/08/2025', orders: 1, locked: true },
  { id: 'KH005', name: 'Võ Thanh Tâm', email: 'thanhtam@mail.com', phone: '0977 678 901', joined: '04/01/2026', orders: 12, locked: false },
  { id: 'KH006', name: 'Đặng Hoàng Nam', email: 'hoangnam@mail.com', phone: '0988 789 012', joined: '15/02/2026', orders: 2, locked: false },
];

const defaultReceipts = [
  {
    id: 'PN0012',
    date: '28/09/2026',
    lines: 3,
    qty: 85,
    total: 1862000000,
    status: 'Hoàn thành',
    items: [
      { sku: 'SP001-TITANDEN-8GB-256GB', name: 'iPhone 16 Pro Max - Titan Đen 256GB', cost: 30200000, qty: 25 },
      { sku: 'SP002-XANHTITAN-12GB-256GB', name: 'Galaxy S25 Ultra - Xanh Titan 256GB', cost: 26000000, qty: 20 },
      { sku: 'SP009-TRANG-STD', name: 'AirPods Pro 2 USB-C', cost: 4700000, qty: 40 }
    ]
  },
  {
    id: 'PN0011',
    date: '20/09/2026',
    lines: 2,
    qty: 40,
    total: 904000000,
    status: 'Hoàn thành',
    items: [
      { sku: 'SP003-HONG-6GB-128GB', name: 'iPhone 15 - Hồng 128GB', cost: 16400000, qty: 20 },
      { sku: 'SP008-BAC-8GB-256GB', name: 'iPad Pro M4 - Bạc 256GB', cost: 25200000, qty: 20 }
    ]
  },
  {
    id: 'PN0010',
    date: '11/09/2026',
    lines: 2,
    qty: 120,
    total: 1215000000,
    status: 'Hoàn thành',
    items: [
      { sku: 'SP012-TRANG-1M', name: 'Sạc nhanh MagSafe 25W - 1m', cost: 720000, qty: 100 },
      { sku: 'SP010-DENBONG-64GB', name: 'Apple Watch Series 10 - 64GB', cost: 9900000, qty: 20 }
    ]
  },
  {
    id: 'PN0009',
    date: '03/10/2026',
    lines: 2,
    qty: 30,
    total: 612000000,
    status: 'Nháp',
    items: [
      { sku: 'SP005-XANHMAYA-12GB-256GB', name: 'Galaxy Z Flip6 - 256GB', cost: 18700000, qty: 15 },
      { sku: 'SP006-TRANGNGOC-16GB-512GB', name: 'OPPO Find X8 Pro - 512GB', cost: 24100000, qty: 15 }
    ]
  }
];

// ==========================================================================
// 5. CÁC HÀM HELPER TRUY XUẤT LOCALSTORAGE & BẢO TOÀN DỮ LIỆU
// ==========================================================================
function getStorage(key, fallback) {
  try {
    const val = localStorage.getItem(key);
    return val ? JSON.parse(val) : fallback;
  } catch (e) {
    console.error(`[LocalStorage] Lỗi đọc khóa "${key}":`, e);
    return fallback;
  }
}

function setStorage(key, val) {
  try {
    localStorage.setItem(key, JSON.stringify(val));
  } catch (e) {
    console.error(`[LocalStorage] Lỗi lưu khóa "${key}":`, e);
  }
}

/**
 * Tự động đồng bộ hóa và chuẩn hóa sản phẩm:
 * - Đảm bảo variants luôn là mảng hợp lệ
 * - Tính lại basePrice = Min(variant.price)
 * - Tính lại stock = Sum(variant.stock)
 */
function normalizeProduct(p) {
  if (!p) return null;
  p.isDeleted = Boolean(p.isDeleted);
  p.attributes = Array.isArray(p.attributes) ? p.attributes : ['Màu sắc', 'RAM', 'ROM'];

  if (!Array.isArray(p.variants) || p.variants.length === 0) {
    // Nếu dữ liệu cũ chưa có variants, sinh biến thể mặc định
    const defaultSku = `${p.code || 'SP00' + p.id}-STD`;
    p.variants = [
      {
        sku: defaultSku,
        color: Array.isArray(p.color) ? 'Tiêu chuẩn' : (p.color || 'Tiêu chuẩn'),
        ram: p.ram || 'Tiêu chuẩn',
        rom: p.rom || 'Tiêu chuẩn',
        cost: p.cost || Math.round((p.price || 10000000) * 0.85),
        price: p.price || 10000000,
        stock: typeof p.stock === 'number' ? p.stock : 10
      }
    ];
  }

  // Luôn quét lại basePrice và tồn kho thực tế
  const prices = p.variants.map(v => Number(v.price) || 0);
  p.basePrice = Math.min(...prices);
  p.price = p.basePrice; // Alias cho các bộ lọc cũ
  p.cost = Math.min(...p.variants.map(v => Number(v.cost) || 0));
  p.stock = p.variants.reduce((sum, v) => sum + (Number(v.stock) || 0), 0);

  return p;
}

// Getters và Setters cho Products
function getProducts() {
  const raw = getStorage('techno_products', null);
  if (!raw) {
    // Khởi tạo lần đầu
    setStorage('techno_products', defaultProducts);
    return defaultProducts.map(normalizeProduct);
  }
  return raw.map(normalizeProduct);
}

function saveProducts(data) {
  const normalized = data.map(normalizeProduct);
  setStorage('techno_products', normalized);
}

/**
 * Lấy danh sách sản phẩm hiển thị phía Khách hàng (bỏ các sp đã bị Xóa mềm)
 */
function getActiveProducts() {
  return getProducts().filter(p => !p.isDeleted);
}

// Getters và Setters cho Orders, Customers, Receipts, Categories
function getOrders() {
  const raw = getStorage('techno_orders', defaultOrders);
  // Chuẩn hóa item trong đơn hàng (nếu là dạng cũ [id, qty] thì map sang object đầy đủ)
  const allProducts = getProducts();
  return raw.map(order => {
    if (Array.isArray(order.items)) {
      order.items = order.items.map(it => {
        if (Array.isArray(it)) {
          const [pid, q] = it;
          const p = allProducts.find(x => x.id === pid);
          const firstVariant = (p && p.variants && p.variants[0]) ? p.variants[0] : null;
          return {
            sku: firstVariant ? firstVariant.sku : `SP00${pid}-STD`,
            productId: pid,
            name: p ? p.name : 'Sản phẩm',
            price: firstVariant ? firstVariant.price : (p ? p.price : 0),
            qty: q
          };
        }
        return it;
      });
    }
    return order;
  });
}
function saveOrders(data) {
  setStorage('techno_orders', data);
}

function getCustomers() {
  return getStorage('techno_customers', defaultCustomers);
}
function saveCustomers(data) {
  setStorage('techno_customers', data);
}

function getReceipts() {
  return getStorage('techno_receipts', defaultReceipts);
}
function saveReceipts(data) {
  setStorage('techno_receipts', data);
}

function getCategories() {
  return getStorage('techno_categories', defaultCategories);
}
function saveCategories(data) {
  setStorage('techno_categories', data);
}

// ==========================================================================
// 6. CÁC HÀM TỰ ĐỘNG SINH KHÓA CHÍNH (AUTO-ID GENERATION)
// Nghiệp vụ: Quét max ID cũ + 1 (tính cả sản phẩm đã xóa mềm)
// ==========================================================================

/**
 * Tự động sinh Mã Sản phẩm (SPxxx) và ID số kế tiếp
 * @returns {{ id: number, code: string }}
 */
function generateNextProductId() {
  const products = getProducts(); // Quét tất cả, kể cả isDeleted = true
  let maxNum = 0;

  products.forEach(p => {
    // Trích xuất số từ code hoặc id
    if (typeof p.id === 'number' && p.id > maxNum) {
      maxNum = p.id;
    }
    if (p.code && /^SP\d+$/i.test(p.code)) {
      const numPart = parseInt(p.code.replace(/^SP/i, ''), 10);
      if (!isNaN(numPart) && numPart > maxNum) {
        maxNum = numPart;
      }
    }
  });

  const nextId = maxNum + 1;
  const nextCode = 'SP' + String(nextId).padStart(3, '0');
  return { id: nextId, code: nextCode };
}

/**
 * Tự động sinh Mã Phiếu nhập kế tiếp (PNxxxx)
 * @returns {string} Mã phiếu nhập (VD: PN0013)
 */
function generateNextReceiptId() {
  const receipts = getReceipts();
  let maxNum = 0;

  receipts.forEach(r => {
    if (r.id && /^PN\d+$/i.test(r.id)) {
      const num = parseInt(r.id.replace(/^PN/i, ''), 10);
      if (!isNaN(num) && num > maxNum) {
        maxNum = num;
      }
    }
  });

  const nextNum = maxNum + 1;
  return 'PN' + String(nextNum).padStart(4, '0');
}

/**
 * Tự động sinh Mã Đơn hàng kế tiếp (DH24xxx)
 * @returns {string} Mã đơn hàng (VD: DH24102)
 */
function generateNextOrderId() {
  const orders = getOrders();
  let maxNum = 24100;

  orders.forEach(o => {
    if (o.id && /^DH\d+$/i.test(o.id)) {
      const num = parseInt(o.id.replace(/^DH/i, ''), 10);
      if (!isNaN(num) && num > maxNum) {
        maxNum = num;
      }
    }
  });

  const nextNum = maxNum + 1;
  return 'DH' + nextNum;
}

/**
 * Tự động sinh mã SKU chuẩn cho biến thể
 * @param {string} productCode - Mã SP (VD: "SP001")
 * @param {string} color - Màu sắc (VD: "Titan Đen")
 * @param {string} ram - Dung lượng RAM (VD: "8GB")
 * @param {string} rom - Dung lượng ROM (VD: "256GB")
 * @returns {string} SKU chuẩn (VD: "SP001-TITAN_DEN-8GB-256GB")
 */
function generateVariantSku(productCode, color, ram, rom) {
  const c = slugifySkuPart(color);
  const r = slugifySkuPart(ram);
  const m = slugifySkuPart(rom);
  return `${productCode}-${c}-${r}-${m}`.toUpperCase();
}

/**
 * Tìm biến thể theo SKU trong toàn bộ kho dữ liệu
 * @param {string} sku - Mã SKU
 * @returns {{ product: Object, variant: Object } | null}
 */
function findVariantBySku(sku) {
  if (!sku) return null;
  const products = getProducts();
  for (const prod of products) {
    if (Array.isArray(prod.variants)) {
      const v = prod.variants.find(item => item.sku === sku);
      if (v) {
        return { product: prod, variant: v };
      }
    }
  }
  return null;
}

// ==========================================================================
// 7. QUẢN LÝ GIỎ HÀNG THEO SKU (SKU-BASED CART MANAGEMENT)
// Nghiệp vụ: Giỏ hàng lưu trữ mảng các item theo sku duy nhất.
// VD: iPhone 16 Pro Max 256GB Titan Đen và 512GB Titan Trắng là 2 item riêng biệt.
// ==========================================================================

function getCart() {
  const raw = getStorage('techno_cart', [
    { sku: 'SP001-TITANDEN-8GB-256GB', productId: 1, qty: 1 },
    { sku: 'SP009-TRANG-STD', productId: 9, qty: 1 }
  ]);
  // Lọc bỏ các item có SKU không còn tồn tại trong Data
  return raw.filter(item => Boolean(findVariantBySku(item.sku)));
}

function saveCart(cart) {
  setStorage('techno_cart', cart);
  // Phát sự kiện toàn cục để cập nhật số đếm giỏ hàng trên Header & Badge
  window.dispatchEvent(new CustomEvent('cartUpdated', { detail: { count: getCartCount() } }));
}

/**
 * Thêm sản phẩm vào giỏ hàng theo SKU với ràng buộc kiểm tra tồn kho
 * @param {string|number} skuOrId - SKU biến thể (hoặc productId để tương thích)
 * @param {number} qty - Số lượng thêm
 * @returns {{ success: boolean, message: string }}
 */
function addToCart(skuOrId, qty = 1) {
  let sku = skuOrId;
  let targetProduct = null;
  let targetVariant = null;

  // Hỗ trợ tương thích ngược nếu gọi hàm bằng productId
  if (typeof skuOrId === 'number') {
    const prod = getProducts().find(p => p.id === skuOrId && !p.isDeleted);
    if (!prod) return { success: false, message: 'Không tìm thấy sản phẩm!' };
    // Lấy biến thể còn hàng đầu tiên
    const v = prod.variants.find(x => x.stock > 0) || prod.variants[0];
    if (!v) return { success: false, message: 'Sản phẩm này chưa có phiên bản khả dụng!' };
    sku = v.sku;
    targetProduct = prod;
    targetVariant = v;
  } else {
    const found = findVariantBySku(sku);
    if (!found) return { success: false, message: 'Phiên bản sản phẩm không tồn tại!' };
    targetProduct = found.product;
    targetVariant = found.variant;
  }

  // Ràng buộc 1: Kiểm tra trạng thái tồn kho thực tế
  if (targetVariant.stock <= 0) {
    return { success: false, message: 'Phiên bản này hiện đã hết hàng, vui lòng chọn phiên bản khác!' };
  }

  const cart = getCart();
  const existing = cart.find(item => item.sku === sku);
  const currentInCart = existing ? existing.qty : 0;
  const newTotalQty = currentInCart + qty;

  // Ràng buộc 2: Kiểm tra tổng số lượng mua không vượt quá tồn kho
  if (newTotalQty > targetVariant.stock) {
    return {
      success: false,
      message: `Tồn kho chỉ còn ${targetVariant.stock} sản phẩm. Bạn đã có ${currentInCart} trong giỏ hàng!`
    };
  }

  if (existing) {
    existing.qty = newTotalQty;
  } else {
    cart.push({
      sku: sku,
      productId: targetProduct.id,
      qty: qty
    });
  }

  saveCart(cart);
  return { success: true, message: 'Đã thêm vào giỏ hàng thành công!' };
}

/**
 * Cập nhật số lượng của một SKU trong giỏ hàng
 */
function setCartQty(sku, qty) {
  let cart = getCart();
  if (qty <= 0) {
    cart = cart.filter(item => item.sku !== sku);
  } else {
    const item = cart.find(i => i.sku === sku);
    if (item) {
      const found = findVariantBySku(sku);
      const maxStock = found ? found.variant.stock : 999;
      item.qty = Math.min(qty, maxStock);
    }
  }
  saveCart(cart);
}

/**
 * Xóa một SKU khỏi giỏ hàng
 */
function removeFromCart(sku) {
  let cart = getCart();
  cart = cart.filter(item => item.sku !== sku);
  saveCart(cart);
}

function clearCart() {
  saveCart([]);
}

function getCartCount() {
  const cart = getCart();
  return cart.reduce((total, item) => total + (item.qty || 0), 0);
}

// ==========================================================================
// 8. TRẠNG THÁI XÁC THỰC (CUSTOMER & ADMIN AUTH)
// ==========================================================================
function getCurrentUser() {
  return getStorage('techno_user', null);
}

function setCurrentUser(user) {
  setStorage('techno_user', user);
}

function logoutUser() {
  localStorage.removeItem('techno_user');
}

function getAdminUser() {
  return getStorage('techno_admin', null);
}

function setAdminUser(status) {
  setStorage('techno_admin', status);
}

function logoutAdmin() {
  localStorage.removeItem('techno_admin');
}
