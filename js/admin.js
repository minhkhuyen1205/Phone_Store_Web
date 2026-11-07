/* ==========================================================================
   Admin Management Portal Controller (Kiến trúc Product Variant Matrix)
   TechnoStore - Pure Vanilla JavaScript (ES6+)
   ========================================================================== */

function initAdminPortal(options = {}) {
  const container = document.getElementById('adminApp');
  if (!container) return;

  const basePath = options.basePath || '../';
  const iconPath = `${basePath}assets/icon/`;
  const homeUrl = `${basePath}index.html`;
  const escapeCustomerHtml = value => String(value ?? '').replace(/[&<>"']/g, char => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[char]));

  // Trạng thái tab điều hướng
  let currentTab = 'dash'; // 'dash', 'users', 'cats', 'products', 'receipts', 'pricing', 'orders', 'stock'
  let isLoggedIn = getAdminUser() === true;

  // Dữ liệu làm việc từ LocalStorage
  let products = getProducts();
  let orders = getOrders();
  let customers = getCustomers();
  let receipts = getReceipts();
  let categories = getCategories();

  // Chuẩn hóa số đơn đã lưu của khách hàng theo dữ liệu đơn hàng hiện có.
  if (typeof syncCustomerOrderCounts === 'function') {
    customers = syncCustomerOrderCounts(orders);
  }

  // Bảng tỷ lệ % lợi nhuận (margin) cho từng sản phẩm
  let margins = {};
  products.forEach(p => {
    margins[p.id] = Math.round(((p.basePrice || p.price) / (p.cost || 1) - 1) * 100) || 15;
  });

  // Trạng thái Accordion và bản nháp điều chỉnh giá theo từng SKU
  let expandedPricing = {}; // { [productId]: boolean }
  let expandedStock = {};
  let editingPricingId = null; // productId đang ở chế độ Chỉnh sửa giá
  let skuPricingDraft = {}; // { [sku]: { margin, price } }

  // Trạng thái Form & Modal
  let showProductForm = false;
  let editingProductId = null; // null nếu là thêm mới, có ID nếu là chỉnh sửa
  let formProductCode = '';
  let formVariants = [];
  let formImagePath = '';
  let formImagePreview = '';
  let formProductImageDraft = null;
  let formVariantImageDrafts = new Map();
  let formVariantImageSources = new WeakMap();
  let removedVariantImageIds = new Set();
  let formImageSessionId = 0;
  let isSavingProductForm = false;
  let formSelectedCategory = ''; // Danh mục đang được chọn trong Form Thêm/Sửa sản phẩm

  let editingCategory = null;
  let showCategoryModal = false;

  let showReceiptModal = false;
  let receiptModalItems = []; // Danh sách các dòng biến thể nhập trong modal
  let selectedReceiptModal = null; // Modal xem chi tiết phiếu nhập (Thay thế alert)

  let selectedOrderModal = null;
  let userMessage = '';
  let stockOnlyLow = false;
  let stockWarningThreshold = 10;
  let stockSearchQuery = '';
  let stockDateFrom = '';
  let stockDateTo = '';
  let orderStatusFilter = '';
  let userSearchQuery = '';
  let prodSearchQuery = '';
  let prodCategoryFilter = '';
  let catSearchQuery = '';
  let receiptSearchQuery = '';
  let orderSearchQuery = '';
  let orderDateFrom = '';
  let orderDateTo = '';
  let receivedDateFrom = '';
  let receivedDateTo = '';
  let pricingSearchQuery = '';
  let pricingCategoryFilter = '';
  let selectedUserModal = null; // Modal xem chi tiet khach hang (dblclick)
  let editingReceiptId = null; // ID phieu dang sua (Cho duyet)
  let editingReceiptItems = []; // Ban sao items cua phieu dang sua
  const adminPageSize = 10;
  const currentPageByTab = {
    users: 1,
    cats: 1,
    products: 1,
    receipts: 1,
    pricing: 1,
    orders: 1,
    stock: 1
  };

  const navItems = [
    { id: 'dash', label: 'Tổng quan', icon: 'tong-quan.svg' },
    { id: 'users', label: 'Khách hàng', icon: 'khach-hang.svg' },
    { id: 'cats', label: 'Danh mục', icon: 'tag.svg' },
    { id: 'products', label: 'Sản phẩm', icon: 'san-pham.svg' },
    { id: 'receipts', label: 'Phiếu nhập', icon: 'phieu-nhap.svg' },
    { id: 'pricing', label: 'Giá bán', icon: 'gia.svg' },
    { id: 'orders', label: 'Đơn hàng', icon: 'gio-hang.svg' },
    { id: 'stock', label: 'Tồn kho', icon: 'kho.svg' },
  ];

  function paginateAdminList(tab, list) {
    const totalPages = Math.max(1, Math.ceil(list.length / adminPageSize));
    currentPageByTab[tab] = Math.min(Math.max(currentPageByTab[tab] || 1, 1), totalPages);
    const currentPage = currentPageByTab[tab];
    return {
      items: list.slice((currentPage - 1) * adminPageSize, currentPage * adminPageSize),
      total: list.length,
      currentPage,
      totalPages
    };
  }

  function renderAdminPagination(tab, list, unitName) {
    const page = paginateAdminList(tab, list);
    const rangeText = page.total === 0
      ? 'Hiển thị 0 kết quả'
      : `Hiển thị ${(page.currentPage - 1) * adminPageSize + 1} - ${Math.min(page.currentPage * adminPageSize, page.total)} trong ${page.total} ${unitName}`;
    const paginationButtons = page.total === 0 ? '' : `
      <div style="display: flex; align-items: center; gap: 4px;">
        <button type="button" onclick="changeAdminPage('${tab}', ${page.currentPage - 1})" ${page.currentPage === 1 ? 'disabled' : ''} aria-label="Trang trước" style="display: inline-flex; align-items: center; justify-content: center; width: 34px; height: 34px; border: 1px solid var(--color-line); border-radius: 6px; background: var(--color-white); cursor: ${page.currentPage === 1 ? 'not-allowed' : 'pointer'}; opacity: ${page.currentPage === 1 ? '0.45' : '1'};">
          <img src="${iconPath}chevron-left.svg" class="icon icon-16" alt="Trang trước" />
        </button>
        ${Array.from({ length: page.totalPages }, (_, index) => index + 1).map(pageNumber => `
          <button type="button" onclick="changeAdminPage('${tab}', ${pageNumber})" aria-current="${pageNumber === page.currentPage ? 'page' : 'false'}" style="min-width: 34px; height: 34px; padding: 0 8px; border: 1px solid ${pageNumber === page.currentPage ? 'var(--color-ink)' : 'var(--color-line)'}; border-radius: 6px; background: ${pageNumber === page.currentPage ? 'var(--color-ink)' : 'var(--color-white)'}; color: ${pageNumber === page.currentPage ? 'var(--color-white)' : 'var(--color-ink)'}; cursor: pointer;">
            ${pageNumber}
          </button>
        `).join('')}
        <button type="button" onclick="changeAdminPage('${tab}', ${page.currentPage + 1})" ${page.currentPage === page.totalPages ? 'disabled' : ''} aria-label="Trang sau" style="display: inline-flex; align-items: center; justify-content: center; width: 34px; height: 34px; border: 1px solid var(--color-line); border-radius: 6px; background: var(--color-white); cursor: ${page.currentPage === page.totalPages ? 'not-allowed' : 'pointer'}; opacity: ${page.currentPage === page.totalPages ? '0.45' : '1'};">
          <img src="${iconPath}chevron-right.svg" class="icon icon-16" alt="Trang sau" />
        </button>
      </div>
    `;

    return `
      <div id="${tab}PaginationFooter" style="display: flex; justify-content: space-between; align-items: center; gap: 12px; margin-top: 12px; font-size: 14px; color: var(--color-ink-3);">
        <span>${rangeText}</span>
        ${paginationButtons}
      </div>
    `;
  }

  function refreshAdminTable(tab, list, tbodyId, rowRenderer, unitName) {
    const tbody = document.getElementById(tbodyId);
    const footer = document.getElementById(`${tab}PaginationFooter`);
    const page = paginateAdminList(tab, list);
    if (tbody) tbody.innerHTML = rowRenderer(page.items);
    if (footer) footer.outerHTML = renderAdminPagination(tab, list, unitName);
  }

  function dateFilterKey(value) {
    if (!value) return '';
    const isoMatch = String(value).match(/^(\d{4})-(\d{1,2})-(\d{1,2})$/);
    const localMatch = String(value).match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
    if (isoMatch) return `${isoMatch[1]}${isoMatch[2].padStart(2, '0')}${isoMatch[3].padStart(2, '0')}`;
    if (localMatch) return `${localMatch[3]}${localMatch[2].padStart(2, '0')}${localMatch[1].padStart(2, '0')}`;
    return '';
  }

  function isDateInRange(value, from, to) {
    if (!from && !to) return true;
    const key = dateFilterKey(value);
    if (!key) return false;
    const fromKey = dateFilterKey(from);
    const toKey = dateFilterKey(to);
    return (!fromKey || key >= fromKey) && (!toKey || key <= toKey);
  }

  function formatAdminDate(value) {
    const key = dateFilterKey(value);
    if (!key) return value ? String(value) : '';
    const year = Number(key.slice(0, 4));
    const month = Number(key.slice(4, 6));
    const day = Number(key.slice(6, 8));
    const date = new Date(Date.UTC(year, month - 1, day));
    if (date.getUTCFullYear() !== year || date.getUTCMonth() !== month - 1 || date.getUTCDate() !== day) {
      return String(value);
    }
    return `${String(day).padStart(2, '0')}/${String(month).padStart(2, '0')}/${year}`;
  }

  function renderAdminDateInput({ textId, pickerId, value, context, range, min = '', required = false }) {
    const formattedValue = formatAdminDate(value);
    const dateKey = dateFilterKey(value);
    const pickerValue = dateKey
      ? `${dateKey.slice(0, 4)}-${dateKey.slice(4, 6)}-${dateKey.slice(6, 8)}`
      : '';
    return `
      <div class="admin-date-input-wrap">
        <input
          type="text"
          id="${textId}"
          class="input-control"
          value="${formattedValue}"
          placeholder="dd/mm/yyyy"
          inputmode="numeric"
          maxlength="10"
          data-min="${min}"
          ${required ? 'required' : ''}
          onchange="handleAdminDateTextChange(this, '${pickerId}', '${context}', '${range}')"
        />
        <span class="admin-date-picker-icon" aria-hidden="true">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <rect x="3" y="5" width="18" height="16" rx="2"></rect>
            <path d="M16 3v4M8 3v4M3 11h18"></path>
          </svg>
        </span>
        <input
          type="date"
          id="${pickerId}"
          class="admin-date-picker-trigger"
          value="${pickerValue}"
          ${min ? `min="${min}"` : ''}
          aria-label="Chọn ngày"
          onchange="handleAdminDatePickerChange(this, '${textId}', '${context}', '${range}')"
        />
      </div>
    `;
  }

  function parseAdminDateInput(value) {
    const trimmedValue = String(value || '').trim();
    if (!trimmedValue) return '';
    const match = trimmedValue.match(/^(\d{2})\/(\d{2})\/(\d{4})$/);
    if (!match) return null;
    const [, dayText, monthText, yearText] = match;
    const day = Number(dayText);
    const month = Number(monthText);
    const year = Number(yearText);
    const date = new Date(Date.UTC(year, month - 1, day));
    if (date.getUTCFullYear() !== year || date.getUTCMonth() !== month - 1 || date.getUTCDate() !== day) {
      return null;
    }
    return `${yearText}-${monthText}-${dayText}`;
  }

  function applyAdminDateFilter(context, range, value) {
    if (context === 'stock') window.handleStockDateFilter(range, value);
    if (context === 'orders') window.handleOrderDateFilter(range, value);
  }

  window.handleAdminDateTextChange = (input, pickerId, context, range) => {
    const value = parseAdminDateInput(input.value);
    if (value === null) {
      input.setCustomValidity('Vui lòng nhập ngày hợp lệ theo định dạng dd/mm/yyyy.');
      input.reportValidity();
      return;
    }
    if (value && input.dataset.min && value < input.dataset.min) {
      input.setCustomValidity(`Ngày phải từ ${formatAdminDate(input.dataset.min)} trở đi.`);
      input.reportValidity();
      return;
    }
    input.setCustomValidity('');
    const picker = document.getElementById(pickerId);
    if (picker) picker.value = value;
    if (context !== 'receipt') applyAdminDateFilter(context, range, value);
  };

  window.handleAdminDatePickerChange = (picker, textId, context, range) => {
    const textInput = document.getElementById(textId);
    if (textInput) {
      textInput.value = formatAdminDate(picker.value);
      textInput.setCustomValidity('');
    }
    if (context !== 'receipt') applyAdminDateFilter(context, range, picker.value);
  };

  /**
   * Thuat toan tim kiem theo nguyen tu (Regex Word Boundary \b)
   * const regex = new RegExp('\\b' + keyword + '\\b', 'i');
   * Loc sach danh sach bien the con:
   * - Neu SP cha khop tu khoa -> Tra ve tat ca bien the
   * - Neu tu khoa chi khop bien the con -> Chi tra ve bien the khop do
   */
  function testWordBoundary(text, regex, cleanKeyword) {
    if (!text) return false;
    const s = String(text);
    if (regex.test(s)) return true;
    // Thay thế ký tự gạch dưới bằng khoảng trắng để các thành phần SKU (VD: HONG_PASTEL) trở thành các từ độc lập
    const sSpaced = s.replace(/_/g, ' ');
    if (regex.test(sSpaced)) return true;
    // Hỗ trợ tìm kiếm tiếng Việt không dấu (VD: gõ HONG khớp Hồng Pastel nhưng tuyệt đối không bắt nhầm vào KHONG)
    if (typeof slugifySkuPart === 'function') {
      const sUnsigned = slugifySkuPart(s).replace(/_/g, ' ');
      const kwUnsigned = slugifySkuPart(cleanKeyword).replace(/_/g, ' ');
      const regexUnsigned = new RegExp('\\b' + kwUnsigned + '\\b', 'i');
      if (regexUnsigned.test(sUnsigned)) return true;
    }
    return false;
  }

  /**
   * Thuật toán tìm kiếm theo nguyên từ (Regex Word Boundary \b)
   * const regex = new RegExp('\\b' + keyword + '\\b', 'i');
   * Lọc sạch danh sách biến thể con:
   * - Nếu SP cha khớp từ khoá -> Trả về tất cả biến thể
   * - Nếu từ khoá chỉ khớp biến thể con -> Chỉ trả về biến thể khớp đó
   */
  function getFilteredProductWithVariants(product, keyword) {
    if (!keyword || !keyword.trim()) {
      return { matches: true, parentMatched: true, variants: product.variants || [] };
    }
    const cleanKeyword = keyword.trim().replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const regex = new RegExp('\\b' + cleanKeyword + '\\b', 'i');

    const parentMatched = testWordBoundary(product.name, regex, cleanKeyword) ||
      testWordBoundary(product.code, regex, cleanKeyword) ||
      testWordBoundary(product.brand, regex, cleanKeyword) ||
      testWordBoundary(product.category, regex, cleanKeyword);

    if (parentMatched) {
      return { matches: true, parentMatched: true, variants: product.variants || [] };
    }

    const matchedVariants = (product.variants || []).filter(v => {
      return testWordBoundary(v.sku, regex, cleanKeyword) ||
        testWordBoundary(v.color, regex, cleanKeyword) ||
        testWordBoundary(v.ram, regex, cleanKeyword) ||
        testWordBoundary(v.rom, regex, cleanKeyword);
    });

    if (matchedVariants.length > 0) {
      return { matches: true, parentMatched: false, variants: matchedVariants };
    }

    return { matches: false, parentMatched: false, variants: [] };
  }

  function getCustomerFullAddress(c) {
    if (!c) return 'Chưa có thông tin';
    if (Array.isArray(c.addresses) && c.addresses.length > 0) {
      const def = c.addresses.find(a => a.isDefault) || c.addresses[0];
      if (def && def.detail) return def.detail + (def.label ? ` (${def.label})` : '');
    }
    if (c.address) return c.address;
    const matchOrder = orders.find(o => o.customerId === c.id || o.customerEmail === c.email || (c.phone && o.phone === c.phone));
    if (matchOrder && matchOrder.address) return matchOrder.address;
    return 'Chưa có thông tin';
  }

  // ==========================================================================
  // RENDER GIAO DIỆN CHÍNH
  // ==========================================================================
  function render() {
    if (!isLoggedIn) {
      renderLogin();
      return;
    }
    renderShell();
  }

  function clearFormImageDrafts() {
    formImageSessionId += 1;
    formVariantImageDrafts.forEach(draft => URL.revokeObjectURL(draft.previewUrl));
    formVariantImageDrafts.clear();
    formVariantImageSources = new WeakMap();
    removedVariantImageIds.clear();
    formProductImageDraft = null;
    isSavingProductForm = false;
  }

  function initializeFormImageDrafts(variants) {
    clearFormImageDrafts();
    variants.forEach(variant => {
      formVariantImageSources.set(variant, variant.imageId || variant.sku || null);
    });
  }

  function applyFormVariantImagePreviews() {
    formVariants.forEach((variant, index) => {
      const image = document.querySelector(`#variantRow_${index} img[data-image-id]`);
      if (!image) return;

      const draft = formVariantImageDrafts.get(variant);
      const sourceId = formVariantImageSources.get(variant) || variant.imageId || variant.sku;
      image.dataset.imageId = sourceId || '';
      image.hidden = false;
      if (image.nextElementSibling) image.nextElementSibling.hidden = true;
      if (draft) {
        image.dataset.imageHydrated = 'true';
        image.src = draft.previewUrl;
      } else {
        refreshProductImage(image);
      }
    });
  }

  function renderLogin() {
    container.innerHTML = `
      <div class="admin-login-page">
        <div class="admin-login-split">
          <!-- Cột trái: Brand Hero Panel -->
          <div class="admin-login-brand-panel">
            <div class="brand-panel-header">
              <div class="brand-panel-logo">
                <div class="brand-logo-icon">
                  <img src="${iconPath}dien-thoai.svg" class="icon icon-26" alt="TechnoAdmin" />
                </div>
                <div class="brand-logo-text">Techno<span class="accent">Admin</span></div>
              </div>
              <span class="brand-system-badge">v2.6 Portal</span>
            </div>

            <div class="brand-panel-content">
              <div class="brand-pill-tag">
                <span class="tag-sparkle">✦</span> Hệ thống quản trị nội bộ
              </div>
              <h2 class="brand-hero-title">
                Quản trị bán hàng &<br />
                <span class="hero-highlight">thương mại điện tử</span><br />
                thế hệ mới
              </h2>
              <p class="brand-hero-desc">
                Quản trị danh mục sản phẩm, ma trận biến thể SKU, bảng giá niêm yết, luân chuyển kho bãi và xử lý đơn hàng tập trung tốc độ cao.
              </p>

              <div class="brand-hero-illustration">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 520 280" width="100%" style="max-height: 220px;" fill="none">
                  <defs>
                    <linearGradient id="cardGrad" x1="0" y1="0" x2="1" y2="1">
                      <stop offset="0%" stop-color="#ffffff" stop-opacity="0.18"/>
                      <stop offset="100%" stop-color="#ffffff" stop-opacity="0.04"/>
                    </linearGradient>
                    <linearGradient id="chartGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stop-color="#38bdf8" stop-opacity="0.5"/>
                      <stop offset="100%" stop-color="#1a6dff" stop-opacity="0.0"/>
                    </linearGradient>
                    <filter id="glow">
                      <feDropShadow dx="0" dy="8" stdDeviation="10" flood-color="#000" flood-opacity="0.25"/>
                    </filter>
                  </defs>

                  <!-- Dashboard Card Mockup -->
                  <g filter="url(#glow)">
                    <rect x="24" y="24" width="310" height="210" rx="16" fill="url(#cardGrad)" stroke="rgba(255,255,255,0.25)" stroke-width="1.2"/>
                    <!-- Window Controls -->
                    <circle cx="48" cy="46" r="4.5" fill="#f87171"/>
                    <circle cx="62" cy="46" r="4.5" fill="#fbbf24"/>
                    <circle cx="76" cy="46" r="4.5" fill="#34d399"/>
                    <rect x="100" y="42" width="120" height="8" rx="4" fill="rgba(255,255,255,0.15)"/>

                    <!-- Stat Chips -->
                    <rect x="42" y="66" width="78" height="42" rx="8" fill="rgba(255,255,255,0.1)"/>
                    <text x="52" y="81" fill="rgba(255,255,255,0.7)" font-size="8.5" font-family="system-ui" font-weight="500">Doanh thu</text>
                    <text x="52" y="98" fill="#ffffff" font-size="11" font-family="system-ui" font-weight="700">128.5M₫</text>

                    <rect x="128" y="66" width="78" height="42" rx="8" fill="rgba(255,255,255,0.1)"/>
                    <text x="138" y="81" fill="rgba(255,255,255,0.7)" font-size="8.5" font-family="system-ui" font-weight="500">Đơn hàng</text>
                    <text x="138" y="98" fill="#7dd3fc" font-size="11" font-family="system-ui" font-weight="700">+48 đơn</text>

                    <rect x="214" y="66" width="105" height="42" rx="8" fill="rgba(255,255,255,0.1)"/>
                    <text x="224" y="81" fill="rgba(255,255,255,0.7)" font-size="8.5" font-family="system-ui" font-weight="500">Tồn kho</text>
                    <text x="224" y="98" fill="#86efac" font-size="11" font-family="system-ui" font-weight="700">1,420 SKU</text>

                    <!-- Chart Line & Area -->
                    <path d="M 44 210 L 44 175 Q 85 140 120 170 T 190 145 T 260 125 T 315 130 L 315 210 Z" fill="url(#chartGrad)"/>
                    <path d="M 44 175 Q 85 140 120 170 T 190 145 T 260 125 T 315 130" fill="none" stroke="#38bdf8" stroke-width="2.5" stroke-linecap="round"/>
                    <circle cx="260" cy="125" r="4" fill="#ffffff" stroke="#0284c7" stroke-width="2.5"/>
                  </g>

                  <!-- Phone Device Frame -->
                  <g filter="url(#glow)">
                    <rect x="350" y="36" width="140" height="225" rx="20" fill="#0f172a" stroke="rgba(255,255,255,0.3)" stroke-width="1.5"/>
                    <rect x="395" y="46" width="50" height="10" rx="5" fill="#1e293b"/>
                    <!-- App Card in Phone -->
                    <rect x="362" y="70" width="116" height="46" rx="10" fill="rgba(255,255,255,0.08)"/>
                    <circle cx="380" cy="93" r="10" fill="#1a6dff"/>
                    <rect x="398" y="85" width="65" height="5" rx="2.5" fill="#ffffff"/>
                    <rect x="398" y="95" width="45" height="4" rx="2" fill="#7dd3fc"/>

                    <rect x="362" y="126" width="116" height="72" rx="10" fill="rgba(255,255,255,0.05)" stroke="rgba(255,255,255,0.1)"/>
                    <rect x="372" y="136" width="34" height="34" rx="6" fill="rgba(255,255,255,0.1)"/>
                    <rect x="414" y="140" width="52" height="5" rx="2.5" fill="#ffffff"/>
                    <rect x="414" y="150" width="38" height="4" rx="2" fill="#38bdf8"/>
                    <rect x="414" y="160" width="44" height="4" rx="2" fill="rgba(255,255,255,0.4)"/>

                    <rect x="370" y="208" width="100" height="22" rx="7" fill="#1a6dff"/>
                    <text x="420" y="222" fill="#ffffff" font-size="9" font-family="system-ui" font-weight="600" text-anchor="middle">Xác nhận đơn</text>
                  </g>
                </svg>
              </div>

              <div class="brand-features-list">
                <span class="feature-item"><span class="feature-dot"></span>Quản lý Matrix SKU</span>
                <span class="feature-item"><span class="feature-dot"></span>Đóng băng tồn kho</span>
                <span class="feature-item"><span class="feature-dot"></span>Bảo mật đa tầng</span>
              </div>
            </div>

            <div class="brand-panel-footer">
              © 2026 TechnoStore. Nền tảng quản trị phân quyền nội bộ.
            </div>
          </div>

          <!-- Cột phải: Form đăng nhập -->
          <div class="admin-login-form-panel">
            <div class="admin-login-card-modern">
              <div class="form-header">
                <div class="form-badge-pill">
                  <img src="${iconPath}bao-ve.svg" class="icon icon-14" alt="" />
                  Khu vực quản trị bảo mật
                </div>
                <h1 class="form-title">Đăng nhập Quản trị</h1>
                <p class="form-subtitle">Vui lòng nhập thông tin để truy cập bảng điều khiển</p>
              </div>

              <form class="admin-login-form" onsubmit="handleAdminLogin(event)">
                <div class="form-field-modern">
                  <label class="field-label" for="adminIdentifierInput">Tên đăng nhập</label>
                  <div class="field-input-wrap">
                    <span class="field-icon">
                      <img src="${iconPath}con-nguoi.svg" class="icon icon-18" alt="" />
                    </span>
                    <input
                      type="text"
                      id="adminIdentifierInput"
                      class="field-input-control"
                      placeholder="Tên đăng nhập"
                      autocomplete="username"
                      required
                    />
                  </div>
                </div>

                <div class="form-field-modern">
                  <label class="field-label" for="adminPasswordInput">Mật khẩu</label>
                  <div class="field-input-wrap">
                    <span class="field-icon">
                      <img src="${iconPath}lock.svg" class="icon icon-18" alt="" />
                    </span>
                    <input
                      type="password"
                      id="adminPasswordInput"
                      class="field-input-control"
                      placeholder="Mật khẩu"
                      autocomplete="current-password"
                      required
                    />
                    <button type="button" class="field-toggle-pwd" onclick="toggleAdminPasswordVisibility(this)" title="Hiện/ẩn mật khẩu">
                      <img src="${iconPath}view.svg" class="icon icon-18" alt="" />
                    </button>
                  </div>
                </div>

                <div class="form-options-row">
                  <label class="remember-checkbox-label">
                    <input type="checkbox" id="adminRememberMe" />
                    Ghi nhớ đăng nhập
                  </label>
                  <span class="support-hint">Hỗ trợ kỹ thuật</span>
                </div>

                <button type="submit" class="btn-admin-login-submit">
                  Đăng nhập quản trị
                  <span class="arrow-icon">→</span>
                </button>
              </form>

              <div class="form-card-footer">
                <a href="${homeUrl}" class="back-to-store-link">← Quay lại trang cửa hàng</a>
              </div>
            </div>
          </div>
        </div>
      </div>
    `;
  }

  function renderShell() {
    const activeNav = navItems.find(n => n.id === currentTab) || navItems[0];

    const sidebarLinks = navItems.map(item => `
      <button class="admin-nav-item ${item.id === currentTab ? 'active' : ''}" onclick="switchAdminTab('${item.id}')">
        <img src="${iconPath}${item.icon}" class="icon icon-18" alt="" />
        ${item.label}
      </button>
    `).join('');

    const mobileOptions = navItems.map(item => `
      <option value="${item.id}" ${item.id === currentTab ? 'selected' : ''}>${item.label}</option>
    `).join('');

    container.innerHTML = `
      <div class="admin-layout">
        <!-- Sidebar -->
        <aside class="admin-sidebar">
          <!-- TASK 4: Click vào logo/tiêu đề Techno Admin điều hướng về trang Tổng quan Admin thay vì trang User -->
          <a href="javascript:void(0)" onclick="switchAdminTab('dash')" class="admin-sidebar-logo" title="Trang tổng quan Admin">
            <span class="admin-sidebar-logo-icon">
              <img src="${iconPath}dien-thoai.svg" class="icon icon-28" alt="" />
            </span>
            <span class="admin-sidebar-logo-text">Techno<span class="brand-accent">Admin</span></span>
          </a>

          <nav class="admin-nav-list">
            ${sidebarLinks}
          </nav>

          <!-- TASK 5: Đã xóa tab "Xem cửa hàng" theo yêu cầu -->
          <button class="admin-nav-item admin-logout" onclick="handleAdminLogout()">
            <img src="${iconPath}thoat.svg" class="icon icon-18" alt="" />
            Đăng xuất
          </button>
        </aside>

        <!-- Main Content Area -->
        <main class="admin-main">
          <header class="admin-header">
            <h1 class="admin-header-title">${activeNav.label}</h1>
            <select class="mobile-nav-select" onchange="switchAdminTab(this.value)">
              ${mobileOptions}
            </select>

            <div class="admin-header-user">
              <span style="color: var(--color-ink-3); font-size: 14px;">Chủ cửa hàng</span>
              <div class="admin-avatar-circle">AD</div>
            </div>
          </header>

          <div class="admin-body">
            ${renderTabContent()}
          </div>
        </main>
      </div>
    `;
  }

  function renderTabContent() {
    switch (currentTab) {
      case 'dash': return renderDashboard();
      case 'users': return renderUsers();
      case 'cats': return renderCategories();
      case 'products': return renderProducts();
      case 'receipts': return renderReceipts();
      case 'pricing':
      case 'prices':
        // Giữ một ID ổn định để giao diện tab Giá bán được xác định nhất quán.
        return `<section id="prices-section">${renderPricing()}</section>`;
      case 'orders': return renderOrders();
      case 'stock': return renderStock();
      default: return '<div>Đang cập nhật...</div>';
    }
  }

  // ==========================================================================
  // TAB 1: TỔNG QUAN (DASHBOARD)
  // ==========================================================================
  function renderDashboard() {
    // TASK 1: Chỉ tính doanh thu từ các đơn ĐÃ GIAO (thực tế thu được)
    const revenue = orders.filter(o => o.status === 'Đã giao').reduce((s, o) => s + o.total, 0);
    const activeProds = products.filter(p => !p.isDeleted);
    // TASK 1: Chỉ đếm khách hàng đang HOẠT ĐỘNG (chưa bị khóa)
    const activeCustomers = customers.filter(c => !c.locked);
    // TASK 1: Dùng stockWarningThreshold động, không hardcode 10
    const outOfStockList = activeProds.filter(p => (Number(p.stock) || 0) <= 0);
    const lowStockList = activeProds.filter(p => (Number(p.stock) || 0) > 0 && (Number(p.stock) || 0) <= stockWarningThreshold);
    const warningList = [...outOfStockList, ...lowStockList];
    // TASK 1: Sắp xếp sản phẩm bán chạy theo số lượng đã bán giảm dần
    const sortedBySold = [...activeProds].sort((a, b) => (b.sold || 0) - (a.sold || 0));
    const maxSold = Math.max(...sortedBySold.map(p => p.sold || 0), 1);

    const bestsellersHtml = sortedBySold.slice(0, 7).map(p => {
      const pct = Math.round(((p.sold || 0) / maxSold) * 100);
      return `
        <div style="margin-bottom: 12px;">
          <div class="bestseller-header">
            <span>${p.name}</span>
            <span style="font-weight: 600;">${p.sold || 0} đã bán</span>
          </div>
          <div class="bestseller-bar-track">
            <div class="bestseller-bar-fill" style="width: ${pct}%;"></div>
          </div>
        </div>
      `;
    }).join('');

    const lowStockHtml = warningList.map(p => {
      const stock = Number(p.stock) || 0;
      const isOut = stock <= 0;
      return `
        <div class="stock-warning-item">
          <span>${p.name} (${p.code})</span>
          <span class="badge ${isOut ? 'badge-danger' : 'badge-warning'}">
            ${isOut ? 'Hết hàng' : `Còn ${stock}`}
          </span>
        </div>
      `;
    }).join('') || '<div style="color: var(--color-ink-3); font-size: 14px;">Tất cả sản phẩm đều có tồn kho ổn định.</div>';

    return `
      <div class="kpi-grid">
        <div class="kpi-card">
          <div class="kpi-label">Doanh thu tích lũy</div>
          <div class="kpi-value">${vnd(revenue)}</div>
          <div class="kpi-change positive">Tổng giá trị đơn đã giao</div>
        </div>
        <div class="kpi-card">
          <div class="kpi-label">Tổng đơn hàng</div>
          <div class="kpi-value">${orders.length}</div>
          <div class="kpi-change positive">${orders.filter(o => o.status === 'Chờ xác nhận').length} đơn chờ xác nhận</div>
        </div>
        <div class="kpi-card">
          <div class="kpi-label">Khách hàng</div>
          <div class="kpi-value">${activeCustomers.length}</div>
          <div class="kpi-change positive">Đang hoạt động</div>
        </div>
        <div class="kpi-card">
          <div class="kpi-label">Cần bổ sung kho</div>
          <div class="kpi-value">${warningList.length}</div>
          <div class="kpi-change ${outOfStockList.length > 0 ? 'negative' : 'warning'}">
            ${outOfStockList.length} hết hàng · ${lowStockList.length} sắp hết
          </div>
        </div>
      </div>

      <div class="dashboard-grid">
        <div class="chart-card">
          <h2 class="chart-card-title">Sản phẩm bán chạy</h2>
          <div class="bestseller-list">
            ${bestsellersHtml}
          </div>
        </div>

        <div class="chart-card">
          <h2 class="chart-card-title">
            <img src="${iconPath}canh-bao.svg" class="icon icon-18" alt="" />
            Cảnh báo tồn kho sản phẩm
          </h2>
          <div class="stock-warning-list">
            ${lowStockHtml}
          </div>
        </div>
      </div>
    `;
  }

  // ==========================================================================
  // TAB 2: KHÁCH HÀNG (USERS)
  // FIX FOCUS: Khi tìm kiếm chỉ cập nhật <tbody>, không re-render toàn bộ trang
  // ==========================================================================
  function generateUserRows(list) {
    if (!list || list.length === 0) {
      return `<tr><td colspan="7" class="text-center" style="padding: 24px; color: var(--color-ink-3);">Không tìm thấy khách hàng nào.</td></tr>`;
    }
    return list.map(r => {
      // Đếm trực tiếp các đơn chưa bị hủy theo mã khách hàng, email hoặc số điện thoại.
      const customerOrderCount = orders.filter(order => {
        if (order.status === 'Đã huỷ' || order.status === 'Đã hủy') return false;

        const customerEmail = (r.email || '').trim().toLowerCase();
        const customerPhone = (r.phone || '').replace(/\D/g, '');
        const orderEmail = (order.customerEmail || '').trim().toLowerCase();
        const orderPhone = (order.phone || '').replace(/\D/g, '');
        return Boolean(
          (r.id && order.customerId && String(r.id) === String(order.customerId)) ||
          (customerEmail && orderEmail && customerEmail === orderEmail) ||
          (customerPhone && orderPhone && customerPhone === orderPhone)
        );
      }).length;

      return `
      <tr style="${r.locked ? 'background-color: rgba(245, 246, 249, 0.6); opacity: 0.7;' : ''} cursor: pointer;" data-customer-id="${escapeCustomerHtml(r.id)}" ondblclick="handleCustomerDblClick(this.dataset.customerId)" title="Nhấn đúp để xem chi tiết khách hàng">
        <td><span class="admin-code-cell">${escapeCustomerHtml(r.id)}</span></td>
        <td>
          <div style="font-weight: 600; color: var(--color-ink);">${escapeCustomerHtml(r.name)}</div>
        </td>
        <td>${r.phone}</td>
        <td>${formatAdminDate(r.joined)}</td>
        <td class="text-center">${customerOrderCount}</td>
        <td>
          <span class="badge ${r.locked ? 'badge-danger' : 'badge-success'}">
            ${r.locked ? 'Bị khoá' : 'Hoạt động'}
          </span>
        </td>
        <td class="text-center">
          <div style="display: flex; justify-content: center; gap: 4px;">
            <button class="action-icon-btn" title="${r.locked ? 'Mở khoá' : 'Khoá'}" data-customer-id="${escapeCustomerHtml(r.id)}" onclick="handleToggleLockUser(this.dataset.customerId)">
              <img src="${iconPath}${r.locked ? 'unclock.svg' : 'lock.svg'}" class="icon icon-16" alt="Khoá" />
            </button>
            <button class="action-icon-btn" title="Reset mật khẩu" data-customer-id="${escapeCustomerHtml(r.id)}" data-customer-name="${escapeCustomerHtml(r.name)}" onclick="handleResetUserPass(this.dataset.customerId, this.dataset.customerName)">
              <img src="${iconPath}refresh.svg" class="icon icon-16" alt="Reset" />
            </button>
          </div>
        </td>
      </tr>
    `;
    }).join('');
  }

  function renderUsers() {
    let list = customers;
    if (userSearchQuery) {
      const q = userSearchQuery.toLowerCase();
      list = list.filter(c => c.name.toLowerCase().includes(q) || c.email.toLowerCase().includes(q) || c.phone.includes(q));
    }
    const page = paginateAdminList('users', list);

    return `
      ${userMessage ? `
        <div class="alert-banner info">
          <span>${escapeCustomerHtml(userMessage)}</span>
          <button onclick="clearUserMsg()" style="margin-left:auto; background:none; border:none; cursor:pointer;">✕</button>
        </div>
      ` : ''}

      <div class="admin-toolbar">
        <div class="admin-search-wrap">
          <img src="${iconPath}tim-kiem.svg" class="icon icon-16" alt="" />
          <input 
            type="text" 
            id="userSearchInput" 
            placeholder="Tìm theo tên, email, SĐT..." 
            class="input-control" 
            value="${escapeCustomerHtml(userSearchQuery)}"
            oninput="handleUserSearch(this.value)" 
          />
        </div>
      </div>

      <div class="table-responsive">
        <table class="data-table">
          <thead>
            <tr>
              <th>Mã KH</th>
              <th>Khách hàng</th>
              <th>Số điện thoại</th>
              <th>Ngày tham gia</th>
              <th class="text-center">Đơn hàng</th>
              <th>Trạng thái</th>
              <th class="text-center">Thao tác</th>
            </tr>
          </thead>
          <tbody id="userTableBody">
            ${generateUserRows(page.items)}
          </tbody>
        </table>
      </div>

      ${renderAdminPagination('users', list, 'khách hàng')}

      <!-- Modal Chi tiết Khách hàng (Double Click) -->
      ${selectedUserModal ? `
        <div class="modal-overlay pop">
          <div class="modal-box" style="max-width: 520px;">
            <div class="modal-header">
              <h3 class="modal-title">Thông tin chi tiết khách hàng</h3>
              <button class="modal-close-btn" onclick="closeCustomerModal()">✕</button>
            </div>
            <div class="modal-body" style="display: flex; flex-direction: column; gap: 16px;">
              <div style="display: flex; align-items: center; gap: 14px; padding-bottom: 12px; border-bottom: 1px solid var(--color-line);">
                <div class="admin-avatar-circle" style="width: 48px; height: 48px; font-size: 18px;">
                  ${escapeCustomerHtml(selectedUserModal.name ? selectedUserModal.name[0].toUpperCase() : 'K')}
                </div>
                <div>
                  <div style="font-weight: 700; font-size: 16px; color: var(--color-ink);">${escapeCustomerHtml(selectedUserModal.name)}</div>
                  <div style="margin-top: 4px;">
                    <span class="badge ${selectedUserModal.locked ? 'badge-danger' : 'badge-success'}">
                      ${selectedUserModal.locked ? 'Bị khoá' : 'Hoạt động'}
                    </span>
                  </div>
                </div>
              </div>
              <div style="display: flex; flex-direction: column; gap: 12px; font-size: 14px;">
                <div style="display: grid; grid-template-columns: 120px 1fr; gap: 8px;">
                  <span style="color: var(--color-ink-3);">Mã khách hàng:</span>
                  <span style="font-weight: 600; color: var(--color-ink);">${escapeCustomerHtml(selectedUserModal.id)}</span>
                </div>
                <div style="display: grid; grid-template-columns: 120px 1fr; gap: 8px;">
                  <span style="color: var(--color-ink-3);">Email:</span>
                  <span style="color: var(--color-ink);">${escapeCustomerHtml(selectedUserModal.email || 'Chưa cập nhật')}</span>
                </div>
                <div style="display: grid; grid-template-columns: 120px 1fr; gap: 8px;">
                  <span style="color: var(--color-ink-3);">Số điện thoại:</span>
                  <span style="color: var(--color-ink);">${escapeCustomerHtml(selectedUserModal.phone || 'Chưa cập nhật')}</span>
                </div>
                <div style="display: grid; grid-template-columns: 120px 1fr; gap: 8px;">
                  <span style="color: var(--color-ink-3);">Địa chỉ:</span>
                  <span style="color: var(--color-ink); line-height: 1.5;">${escapeCustomerHtml(getCustomerFullAddress(selectedUserModal))}</span>
                </div>
                <div style="display: grid; grid-template-columns: 120px 1fr; gap: 8px;">
                  <span style="color: var(--color-ink-3);">Ngày tham gia:</span>
                  <span style="color: var(--color-ink);">${formatAdminDate(selectedUserModal.joined) || 'Chưa cập nhật'}</span>
                </div>
              </div>
            </div>
            <div class="modal-footer">
              <button class="btn btn-primary btn-md" onclick="closeCustomerModal()">Đóng</button>
            </div>
          </div>
        </div>
      ` : ''}
    `;
  }

  // ==========================================================================
  // TAB 3: DANH MỤC (CATEGORIES)
  // FIX FOCUS: Khi tìm kiếm chỉ cập nhật <tbody>
  // ==========================================================================
  function generateCatRows(list) {
    if (!list || list.length === 0) {
      return `<tr><td colspan="6" class="text-center" style="padding: 24px; color: var(--color-ink-3);">Không tìm thấy danh mục nào.</td></tr>`;
    }
    return list.map(r => `
      <tr>
        <td><span class="admin-code-cell">${r.id}</span></td>
        <td><b style="color: var(--color-ink);">${r.name}</b></td>
        <td>${r.type}</td>
        <td class="text-center">${r.count}</td>
        <td>
          <span class="badge ${r.status === 'active' ? 'badge-success' : 'badge-neutral'}">
            ${r.status === 'active' ? 'Hoạt động' : 'Ẩn / Tạm khóa'}
          </span>
        </td>
        <td class="text-center">
          <div style="display: flex; justify-content: center; gap: 4px;">
            <button class="action-icon-btn" title="Sửa" onclick="handleEditCategory('${r.name}')">
              <img src="${iconPath}sua.svg" class="icon icon-16" alt="Sửa" />
            </button>
            <button class="action-icon-btn danger" title="Xoá" onclick="handleDeleteCategory('${r.name}')">
              <img src="${iconPath}xoa.svg" class="icon icon-16" alt="Xoá" />
            </button>
          </div>
        </td>
      </tr>
    `).join('');
  }

  function renderCategories() {
    categories = getCategories();
    let list = categories.map((c, i) => {
      const name = typeof c === 'string' ? c : (c.name || '');
      const id = (typeof c === 'object' && c.id) ? c.id : `DM0${i + 1}`;
      const type = (typeof c === 'object' && c.type) ? c.type : (i < 2 ? 'Thiết bị chính' : 'Phụ kiện & Đeo');
      const status = (typeof c === 'object' && c.status) ? c.status : 'active';
      const count = products.filter(p => !p.isDeleted && p.category === name).length;
      return { id, name, type, status, count };
    });

    if (catSearchQuery) {
      const q = catSearchQuery.toLowerCase();
      list = list.filter(item => item.name.toLowerCase().includes(q) || item.id.toLowerCase().includes(q));
    }
    const page = paginateAdminList('cats', list);

    const catObj = editingCategory
      ? categories.map((c, i) => typeof c === 'string' ? { id: `DM0${i + 1}`, name: c, type: i < 2 ? 'Thiết bị chính' : 'Phụ kiện & Đeo', status: 'active' } : c)
        .find(c => c.name === editingCategory)
      : null;

    return `
      <div class="admin-toolbar">
        <div class="admin-search-wrap">
          <img src="${iconPath}tim-kiem.svg" class="icon icon-16" alt="" />
          <input 
            type="text" 
            id="catSearchInput" 
            placeholder="Tìm danh mục..." 
            class="input-control" 
            value="${catSearchQuery}" 
            oninput="handleCatSearch(this.value)" 
          />
        </div>
        <div class="admin-toolbar-actions">
          <button class="btn btn-primary btn-md" onclick="handleAddCategory()">
            <img src="${iconPath}them.svg" class="icon icon-16" alt="" />
            Thêm danh mục
          </button>
        </div>
      </div>

      <div class="table-responsive">
        <table class="data-table">
          <thead>
            <tr>
              <th>Mã DM</th>
              <th>Tên danh mục</th>
              <th>Loại sản phẩm</th>
              <th class="text-center">Số sản phẩm</th>
              <th>Trạng thái</th>
              <th class="text-center">Thao tác</th>
            </tr>
          </thead>
          <tbody id="catTableBody">
            ${generateCatRows(page.items)}
          </tbody>
        </table>
      </div>

      ${renderAdminPagination('cats', list, 'danh mục')}

      <!-- Modal Thêm/Sửa Danh mục -->
      ${showCategoryModal ? `
        <div class="modal-overlay pop">
          <div class="modal-box">
            <div class="modal-header">
              <h3 class="modal-title">${editingCategory ? 'Sửa danh mục' : 'Thêm danh mục'}</h3>
              <button class="modal-close-btn" onclick="closeCategoryModal()">✕</button>
            </div>
            <div class="modal-body">
              <div class="form-field">
                <label class="form-label">Tên danh mục *</label>
                <input type="text" id="catNameInput" class="input-control" value="${catObj ? catObj.name : ''}" placeholder="VD: Tai nghe Bluetooth" />
              </div>
              <div class="form-field">
                <label class="form-label">Loại sản phẩm</label>
                <div class="select-wrapper">
                  <select id="catTypeSelect" class="select-control">
                    <option ${catObj && catObj.type === 'Thiết bị chính' ? 'selected' : ''}>Thiết bị chính</option>
                    <option ${catObj && catObj.type === 'Phụ kiện & Đeo' ? 'selected' : ''}>Phụ kiện & Đeo</option>
                  </select>
                  <span class="select-arrow">▼</span>
                </div>
              </div>
              <div class="form-field">
                <label class="form-label">Trạng thái</label>
                <div class="select-wrapper">
                  <select id="catStatusSelect" class="select-control">
                    <option value="active" ${(!catObj || catObj.status === 'active') ? 'selected' : ''}>Hoạt động</option>
                    <option value="inactive" ${(catObj && catObj.status === 'inactive') ? 'selected' : ''}>Ẩn / Tạm khóa</option>
                  </select>
                  <span class="select-arrow">▼</span>
                </div>
              </div>
            </div>
            <div class="modal-footer">
              <button class="btn btn-secondary btn-md" onclick="closeCategoryModal()">Huỷ</button>
              <button class="btn btn-primary btn-md" onclick="saveCategoryModal()">Lưu</button>
            </div>
          </div>
        </div>
      ` : ''}
    `;
  }

  // ==========================================================================
  // TAB 4: QUẢN LÝ SẢN PHẨM & FORM BIẾN THỂ (PRODUCT VARIANT MATRIX FORM)
  // Nghiệp vụ:
  // 1. Tự động sinh Mã SP (SPxxx) và SKU từng biến thể -> Khóa input (disabled)
  // 2. Form chia 2 tầng: Thông tin chung & Ma trận Biến thể
  // 3. Nghiệp vụ Đóng Băng Tồn Kho (Immutable Inventory): Tồn kho mặc định = 0 và bị KHÓA
  // 4. Upload ảnh thật FileReader đọc trực tiếp từ máy
  // 5. Soft Delete: Xóa chỉ đổi isDeleted = true, bảo toàn mã ID và lịch sử
  // 6. Fix Focus: Gõ tìm kiếm chỉ render <tbody>
  // ==========================================================================

  function generateProductRows(list) {
    if (!list || list.length === 0) {
      return `<tr><td colspan="8" class="text-center" style="padding: 32px; color: var(--color-ink-3);">Không tìm thấy sản phẩm nào phù hợp.</td></tr>`;
    }

    return list.map(p => {
      const variantCount = p.variants ? p.variants.length : 1;
      const filteredInfo = getFilteredProductWithVariants(p, prodSearchQuery);
      const variantsToRender = filteredInfo.variants && filteredInfo.variants.length > 0 ? filteredInfo.variants : (p.variants || []);

      const skuPreview = variantsToRender.length > 0
        ? variantsToRender.map(v => {
          const hasRam = v.ram && v.ram !== 'null' && v.ram !== 'Tiêu chuẩn';
          const hasRom = v.rom && v.rom !== 'null' && v.rom !== 'Tiêu chuẩn';
          let specStr = '';
          if (hasRam && hasRom) specStr = ` - ${v.ram}/${v.rom}`;
          else if (hasRom) specStr = ` - ${v.rom}`;
          else if (hasRam) specStr = ` - ${v.ram}`;
          return `<span class="variant-sku-display" title="${v.color || 'Mặc định'}${specStr} - Tồn: ${v.stock}">${v.sku}</span>`;
        }).join(' ')
        : `<span class="variant-sku-display">${p.code}-STD</span>`;

      return `
        <tr style="${p.isVisible ? '' : 'opacity: 0.5;'}">
          <td><span class="admin-code-cell">${p.code}</span></td>
          <td>
            <div style="display: flex; align-items: center; gap: 12px; text-align: left;">
              <div style="width: 48px; height: 48px; border-radius: var(--radius-md); background: var(--color-surface); display: grid; place-items: center; flex-shrink: 0; overflow: hidden;">
                ${renderProductImage(p, 'width:48px;height:48px;')}
              </div>
              <div>
                <div style="font-weight: 600; color: var(--color-ink);">${p.name} <span style="font-weight: 400; font-size: 12px; color: var(--color-ink-3);">· ${variantCount} Phiên bản</span></div>
              </div>
            </div>
          </td>
          <td>${p.category}</td>
          <td>${p.brand}</td>
          <td class="text-right">
            <b style="color: var(--color-brand-700);">${vnd(p.basePrice || p.price)}</b>
            ${variantCount > 1 ? '<div style="font-size:11px; color:var(--color-ink-3);">Giá thấp nhất</div>' : ''}
          </td>
          <td class="text-center">
            <b style="font-size: 15px; color: ${p.stock === 0 ? '#dc2626' : p.stock <= 5 ? '#d97706' : 'var(--color-ink)'};">${p.stock}</b>
          </td>
          <td class="product-sku-cell">
            <div class="product-sku-list">
              ${skuPreview}
            </div>
          </td>
          <td class="text-center">
            <div class="product-row-actions">
              <label class="admin-visibility-switch" title="${p.isVisible ? 'Đang hiển thị' : 'Đang ẩn'}">
                <input
                  type="checkbox"
                  aria-label="${p.isVisible ? 'Ẩn sản phẩm' : 'Hiện sản phẩm'} ${p.name}"
                  ${p.isVisible ? 'checked' : ''}
                  onchange="handleToggleProductVisibility(${p.id}, this.checked)"
                />
                <span></span>
              </label>
              <button class="action-icon-btn" title="Chỉnh sửa sản phẩm & phiên bản" onclick="openEditProductForm(${p.id})">
                <img src="${iconPath}sua.svg" class="icon icon-16" alt="Sửa" />
              </button>
              <button class="action-icon-btn danger" title="Xoá sản phẩm" onclick="handleDeleteProduct(${p.id})">
                <img src="${iconPath}xoa.svg" class="icon icon-16" alt="Xoá" />
              </button>
            </div>
          </td>
        </tr>
      `;
    }).join('');
  }

  function getProductList() {
    let list = products.filter(p => !p.isDeleted);
    if (prodCategoryFilter) {
      list = list.filter(p => p.category === prodCategoryFilter);
    }
    if (prodSearchQuery) {
      list = list.filter(p => getFilteredProductWithVariants(p, prodSearchQuery).matches);
    }
    return list;
  }

  function renderProducts() {
    // Nếu đang mở Form Thêm / Sửa sản phẩm
    if (showProductForm) {
      return renderProductMatrixForm();
    }

    // Danh sách sản phẩm chưa bị xóa mềm (Soft Delete)
    const list = getProductList();
    const page = paginateAdminList('products', list);

    return `
      <div class="admin-toolbar">
        <div class="admin-search-wrap">
          <img src="${iconPath}tim-kiem.svg" class="icon icon-16" alt="" />
          <input 
            type="text" 
            id="prodSearchInput" 
            placeholder="Tìm theo mã SP, tên, hãng, SKU..." 
            class="input-control" 
            value="${prodSearchQuery}" 
            oninput="handleProdSearch(this.value)" 
          />
        </div>
        <div style="width: 220px;">
          <div class="select-wrapper">
            <select class="select-control" aria-label="Lọc theo danh mục" onchange="handleProdCategoryFilter(this.value)">
              <option value="">Tất cả danh mục</option>
              ${Array.from(new Set(categories.map(category => typeof category === 'string' ? category : category.name).filter(Boolean))).map(category => `
                <option value="${category}" ${prodCategoryFilter === category ? 'selected' : ''}>${category}</option>
              `).join('')}
            </select>
            <span class="select-arrow">▼</span>
          </div>
        </div>
        <div class="admin-toolbar-actions">
          <button class="btn btn-primary btn-md" onclick="openCreateProductForm()">
            <img src="${iconPath}them.svg" class="icon icon-16" alt="" />
            Thêm sản phẩm mới
          </button>
        </div>
      </div>

      <div class="table-responsive">
        <table class="data-table product-list-table">
          <thead>
            <tr>
              <th>Mã SP</th>
              <th class="text-center">Sản phẩm</th>
              <th>Danh mục</th>
              <th>Hãng</th>
              <th class="text-right">Giá bán</th>
              <th class="text-center">Tổng tồn kho</th>
              <th>Danh sách phiên bản</th>
              <th class="text-center">Thao tác</th>
            </tr>
          </thead>
          <tbody id="prodTableBody">
            ${generateProductRows(page.items)}
          </tbody>
        </table>
      </div>

      ${renderAdminPagination('products', list, 'sản phẩm')}
    `;
  }

  /**
   * Render Multi-Step Variant Form (Tầng 1 & Tầng 2)
   */
  /**
   * Helper sinh HTML Thông số kỹ thuật động theo Danh mục
   */
  function renderDynamicSpecsHtml(cat, prod = null) {
    if (cat === 'Tai nghe') {
      return `
        <h2 style="font-size: 16px; font-weight: 700; color: var(--color-ink); margin-bottom: 16px;">
          Thông số kỹ thuật: Tai nghe
        </h2>
        <div style="display: grid; gap: 16px; grid-template-columns: 1fr 1fr;">
          <div class="form-field" style="margin:0;">
            <label class="form-label">Thời lượng Pin</label>
            <input type="text" id="formSpecBattery" class="input-control" placeholder="VD: 6 giờ (hộp sạc 30 giờ)" value="${prod ? (prod.battery || '') : ''}" />
          </div>
          <div class="form-field" style="margin:0;">
            <label class="form-label">Chống ồn (ANC)</label>
            <input type="text" id="formSpecAnc" class="input-control" placeholder="VD: Chống ồn chủ động ANC thế hệ 2" value="${prod ? (prod.anc || '') : ''}" />
          </div>
          <div class="form-field" style="margin:0;">
            <label class="form-label">Chuẩn Bluetooth</label>
            <input type="text" id="formSpecBluetooth" class="input-control" placeholder="VD: Bluetooth 5.3" value="${prod ? (prod.bluetooth || '') : ''}" />
          </div>
          <div class="form-field" style="margin:0;">
            <label class="form-label">Cổng sạc</label>
            <input type="text" id="formSpecPort" class="input-control" placeholder="VD: USB-C, Sạc không dây MagSafe" value="${prod ? (prod.port || '') : ''}" />
          </div>
          <div class="form-field" style="margin:0; grid-column: 1 / -1;">
            <label class="form-label">Kháng nước</label>
            <input type="text" id="formSpecWaterproof" class="input-control" placeholder="VD: IP54" value="${prod ? (prod.waterproof || '') : ''}" />
          </div>
        </div>
      `;
    }

    if (cat === 'Đồng hồ thông minh') {
      return `
        <h2 style="font-size: 16px; font-weight: 700; color: var(--color-ink); margin-bottom: 16px;">
          Thông số kỹ thuật: Đồng hồ thông minh
        </h2>
        <div style="display: grid; gap: 16px; grid-template-columns: 1fr 1fr;">
          <div class="form-field" style="margin:0;">
            <label class="form-label">Kích thước mặt</label>
            <input type="text" id="formSpecScreen" class="input-control" placeholder="VD: 42mm / 46mm" value="${prod ? (prod.caseSize || prod.screen || '') : ''}" />
          </div>
          <div class="form-field" style="margin:0;">
            <label class="form-label">Thời lượng Pin</label>
            <input type="text" id="formSpecBattery" class="input-control" placeholder="VD: 18 giờ (tiết kiệm pin 36 giờ)" value="${prod ? (prod.battery || '') : ''}" />
          </div>
          <div class="form-field" style="margin:0;">
            <label class="form-label">Kháng nước</label>
            <input type="text" id="formSpecWaterproof" class="input-control" placeholder="VD: 5ATM + IP68, WR50" value="${prod ? (prod.waterproof || '') : ''}" />
          </div>
          <div class="form-field" style="margin:0;">
            <label class="form-label">Cảm biến sức khỏe</label>
            <input type="text" id="formSpecSensors" class="input-control" placeholder="VD: ECG, SpO2, đo nhịp tim, nhiệt độ" value="${prod ? (prod.sensors || '') : ''}" />
          </div>
        </div>
      `;
    }

    if (cat === 'Phụ kiện') {
      return `
        <h2 style="font-size: 16px; font-weight: 700; color: var(--color-ink); margin-bottom: 16px;">
          Thông số kỹ thuật: Phụ kiện
        </h2>
        <div style="display: grid; gap: 16px; grid-template-columns: 1fr 1fr;">
          <div class="form-field" style="margin:0;">
            <label class="form-label">Công suất sạc (W)</label>
            <input type="text" id="formSpecPower" class="input-control" placeholder="VD: 25W / 65W Max" value="${prod ? (prod.power || '') : ''}" />
          </div>
          <div class="form-field" style="margin:0;">
            <label class="form-label">Cổng kết nối / Đầu ra</label>
            <input type="text" id="formSpecPort" class="input-control" placeholder="VD: 2 cổng USB-C, 1 cổng USB-A" value="${prod ? (prod.port || '') : ''}" />
          </div>
          <div class="form-field" style="margin:0;">
            <label class="form-label">Độ dài dây / Dung lượng</label>
            <input type="text" id="formSpecCableLength" class="input-control" placeholder="VD: Dây 1m / 2m hoặc 10000 mAh" value="${prod ? (prod.cableLength || '') : ''}" />
          </div>
          <div class="form-field" style="margin:0;">
            <label class="form-label">Chuẩn sạc hỗ trợ</label>
            <input type="text" id="formSpecStandard" class="input-control" placeholder="VD: Power Delivery 3.0, Quick Charge, Qi2" value="${prod ? (prod.standard || '') : ''}" />
          </div>
        </div>
      `;
    }

    // Mặc định: Điện thoại / Máy tính bảng
    return `
      <h2 style="font-size: 16px; font-weight: 700; color: var(--color-ink); margin-bottom: 16px;">
        Thông số kỹ thuật phần cứng
      </h2>
      <div style="display: grid; gap: 16px; grid-template-columns: 1fr 1fr;">
        <div class="form-field" style="margin:0;">
          <label class="form-label">Màn hình</label>
          <input type="text" id="formSpecScreen" class="input-control" placeholder="VD: 6.9 inch OLED 120Hz" value="${prod ? (prod.screen || '') : ''}" />
        </div>
        <div class="form-field" style="margin:0;">
          <label class="form-label">Chip xử lý (CPU)</label>
          <input type="text" id="formSpecChip" class="input-control" placeholder="VD: Apple A18 Pro / Snapdragon 8 Elite" value="${prod ? (prod.chip || '') : ''}" />
        </div>
        <div class="form-field" style="margin:0;">
          <label class="form-label">Camera</label>
          <input type="text" id="formSpecCamera" class="input-control" placeholder="VD: 48MP + 48MP + 12MP" value="${prod ? (prod.camera || '') : ''}" />
        </div>
        <div class="form-field" style="margin:0;">
          <label class="form-label">Dung lượng Pin</label>
          <input type="text" id="formSpecBattery" class="input-control" placeholder="VD: 5000 mAh, Sạc nhanh 45W" value="${prod ? (prod.battery || '') : ''}" />
        </div>
        <div class="form-field" style="margin:0; grid-column: 1 / -1;">
          <label class="form-label">Wifi / Kết nối</label>
          <input type="text" id="formSpecConnectivity" class="input-control" placeholder="VD: 5G, Wi-Fi 7, Bluetooth 5.4" value="${prod ? (prod.connectivity || '') : ''}" />
        </div>
      </div>
    `;
  }

  /**
   * Helper sinh tiêu đề cột bảng biến thể động theo danh mục
   */
  function renderVariantTableThead(cat) {
    if (cat === 'Tai nghe') {
      return `
        <tr>
          <th>Màu sắc / Phân loại</th>
          <th>Mã SKU</th>
          <th class="text-center">Tồn kho</th>
          <th class="text-center">Thao tác</th>
        </tr>
      `;
    }
    if (cat === 'Phụ kiện') {
      return `
        <tr>
          <th>Màu sắc / Quy cách</th>
          <th>Mã SKU</th>
          <th class="text-center">Tồn kho</th>
          <th class="text-center">Thao tác</th>
        </tr>
      `;
    }
    if (cat === 'Đồng hồ thông minh') {
      return `
        <tr>
          <th>Màu sắc</th>
          <th>ROM / Bộ nhớ trong</th>
          <th>Mã SKU</th>
          <th class="text-center">Tồn kho</th>
          <th class="text-center">Thao tác</th>
        </tr>
      `;
    }
    // Điện thoại / Máy tính bảng: Đủ cột RAM và ROM
    return `
      <tr>
        <th>Màu sắc</th>
        <th>RAM</th>
        <th>ROM</th>
        <th>Mã SKU</th>
        <th class="text-center">Tồn kho</th>
        <th class="text-center">Thao tác</th>
      </tr>
    `;
  }

  /**
   * Helper sinh từng dòng biến thể trong bảng
   */
  function renderVariantRowHtml(v, index, cat) {
    const isHeadphone = cat === 'Tai nghe';
    const isAccessory = cat === 'Phụ kiện';
    const isWatch = cat === 'Đồng hồ thông minh';
    const currentProduct = products.find(product => product.id === editingProductId);

    let colorPlaceholder = 'Màu (Titan Đen)';
    if (isHeadphone) colorPlaceholder = 'Màu (Trắng / Đen)';
    else if (isAccessory) colorPlaceholder = 'Quy cách (Trắng 1m)';
    else if (isWatch) colorPlaceholder = 'Màu (Nhôm Đen Bóng)';

    let middleCells = '';
    if (isHeadphone || isAccessory) {
      middleCells = ''; // ẨN RAM & ROM
    } else if (isWatch) {
      middleCells = `
        <td>
          <input 
            type="text" 
            class="input-control" 
            style="height: 38px; min-width: 90px;" 
            placeholder="32GB / 64GB" 
            value="${v.rom || ''}" 
            oninput="handleVariantFieldChange(${index}, 'rom', this.value)" 
          />
        </td>
      `; // ẨN RAM, GIỮ ROM
    } else {
      middleCells = `
        <td>
          <input 
            type="text" 
            class="input-control" 
            style="height: 38px; min-width: 80px;" 
            placeholder="8GB" 
            value="${v.ram || ''}" 
            oninput="handleVariantFieldChange(${index}, 'ram', this.value)" 
            required 
          />
        </td>
        <td>
          <input 
            type="text" 
            class="input-control" 
            style="height: 38px; min-width: 90px;" 
            placeholder="256GB" 
            value="${v.rom || ''}" 
            oninput="handleVariantFieldChange(${index}, 'rom', this.value)" 
            required 
          />
        </td>
      `; // Đủ RAM & ROM
    }

    return `
      <tr class="variant-matrix-row" id="variantRow_${index}">
        <td>
          <input 
            type="text" 
            class="input-control" 
            style="height: 38px; min-width: 120px;" 
            placeholder="${colorPlaceholder}" 
            value="${v.color || ''}" 
            oninput="handleVariantFieldChange(${index}, 'color', this.value)" 
            required 
          />
        </td>
        ${middleCells}

        <td>
          <div class="variant-sku-display" id="skuDisplay_${index}">${v.sku}</div>
        </td>
        <td>
          <input 
            type="number" 
            class="input-control variant-stock-locked" 
            style="height: 38px; width: 80px; text-align: center;" 
            value="${v.stock || 0}" 
            disabled 
            readonly 
            title="Quy tắc đóng băng tồn kho: Tồn kho chỉ được tăng qua Phiếu Nhập Hàng" 
          />
        </td>
        <td class="text-center">
          <div class="variant-row-actions">
            ${renderProductImage(
              { code: formProductCode, name: v.color || 'Ảnh phiên bản', image: v.image || (currentProduct && currentProduct.image) },
              'width:32px;height:32px;',
              formVariantImageSources.get(v) || v.imageId || v.sku
            )}
            <input
              type="file"
              id="variantImageInput_${index}"
              class="variant-image-file-input"
              accept="image/png,image/jpeg,image/webp"
              onchange="handleVariantImageSelect(event, ${index})"
            />
            <button type="button" class="action-icon-btn" title="Tải ảnh cho phiên bản này"
              onclick="document.getElementById('variantImageInput_${index}').click()">
              <img src="${iconPath}upload.svg" class="icon icon-16" alt="Tải ảnh" />
            </button>
            ${formVariants.length > 1 ? `
              <button type="button" class="action-icon-btn danger" title="Xoá phiên bản này" onclick="handleRemoveVariantRow(${index})">
                <img src="${iconPath}xoa.svg" class="icon icon-16" alt="Xoá" />
              </button>
            ` : '<span class="variant-required-note">Bắt buộc</span>'}
          </div>
        </td>
      </tr>
    `;
  }

  /**
   * Cập nhật tức thì DOM khu vực Thông số và Bảng biến thể khi đổi danh mục
   */
  window.renderDynamicSpecsAndVariants = (cat) => {
    const isEdit = editingProductId !== null;
    const currentProd = isEdit ? products.find(p => p.id === editingProductId) : null;
    const specsContainer = document.getElementById('specsFieldsContainer');
    if (specsContainer) {
      specsContainer.innerHTML = renderDynamicSpecsHtml(cat, currentProd);
    }
    const thead = document.getElementById('variantMatrixThead');
    if (thead) {
      thead.innerHTML = renderVariantTableThead(cat);
    }
    const tbody = document.getElementById('variantMatrixBody');
    if (tbody) {
      tbody.innerHTML = formVariants.map((v, i) => renderVariantRowHtml(v, i, cat)).join('');
      applyFormVariantImagePreviews();
    }
  };

  /**
   * Render Multi-Step Variant Form (Tầng 1 & Tầng 2)
   */
  function renderProductMatrixForm() {
    const isEdit = editingProductId !== null;
    const currentProd = isEdit ? products.find(p => p.id === editingProductId) : null;
    const firstCatName = categories[0] ? (typeof categories[0] === 'string' ? categories[0] : (categories[0].name || 'Điện thoại')) : 'Điện thoại';
    const currentCat = formSelectedCategory || (currentProd ? currentProd.category : firstCatName);
    formSelectedCategory = currentCat;

    const brandOptions = defaultBrands.map(b => `
      <option value="${b}" ${(currentProd && currentProd.brand === b) ? 'selected' : ''}>${b}</option>
    `).join('');

    const catOptions = categories.map(c => {
      const cName = typeof c === 'string' ? c : (c.name || '');
      return `<option value="${cName}" ${(currentCat === cName) ? 'selected' : ''}>${cName}</option>`;
    }).join('');

    return `
      <div class="pop" style="display: flex; flex-direction: column; gap: 24px;">
        <div style="display: flex; justify-content: space-between; align-items: center;">
          <button onclick="setShowProductForm(false)" class="btn btn-ghost btn-sm">
            ← Quay lại danh sách sản phẩm
          </button>
          <div style="font-size: 14px; color: var(--color-ink-3);">
            ${isEdit ? `Đang chỉnh sửa: <b>${currentProd.name}</b> (${currentProd.code})` : 'Tạo mới sản phẩm theo mô hình Matrix'}
          </div>
        </div>

        <form onsubmit="handleSaveProductMatrix(event)" style="display: flex; flex-direction: column; gap: 24px;">
          <!-- ==========================================
               TẦNG 1: THÔNG TIN CHUNG SẢN PHẨM
               ========================================== -->
          <div style="display: grid; gap: 24px; grid-template-columns: 2fr 1fr;">
            <div style="display: flex; flex-direction: column; gap: 20px;">
              <section class="variant-matrix-card">
                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px;">
                  <h2 style="font-size: 16px; font-weight: 700; color: var(--color-ink);">
                    Thông tin chung sản phẩm
                  </h2>
                </div>

                <div style="display: grid; gap: 16px; grid-template-columns: 1fr 2fr;">
                  <!-- Mã Sản phẩm: TỰ ĐỘNG SINH & KHÓA INPUT (disabled) -->
                  <div class="form-field" style="margin:0;">
                    <label class="form-label">Mã sản phẩm</label>
                    <input 
                      type="text" 
                      id="formProdCode" 
                      class="input-control variant-stock-locked" 
                      value="${formProductCode}" 
                      disabled 
                      readonly 
                    />
                  </div>

                  <div class="form-field" style="margin:0;">
                    <label class="form-label">Tên sản phẩm *</label>
                    <input 
                      type="text" 
                      id="formProdName" 
                      class="input-control" 
                      placeholder="VD: iPhone 16 Pro Max" 
                      value="${currentProd ? currentProd.name : ''}" 
                      required 
                    />
                  </div>

                  <div class="form-field" style="margin:0;">
                    <label class="form-label">Danh mục *</label>
                    <div class="select-wrapper">
                      <select id="formProdCat" class="select-control" onchange="handleFormCategoryChange(this.value)" required>
                        ${catOptions}
                      </select>
                      <span class="select-arrow">▼</span>
                    </div>
                  </div>

                  <div class="form-field" style="margin:0;">
                    <label class="form-label">Hãng sản xuất *</label>
                    <div class="select-wrapper">
                      <select id="formProdBrand" class="select-control" required>
                        ${brandOptions}
                      </select>
                      <span class="select-arrow">▼</span>
                    </div>
                  </div>

                  <div class="form-field" style="margin:0; grid-column: 1 / -1;">
                    <label class="form-label">Mô tả sản phẩm</label>
                    <textarea 
                      id="formProdDesc" 
                      class="textarea-control" 
                      rows="3" 
                      placeholder="Nhập mô tả sản phẩm, điểm nhấn công nghệ..."
                    >${currentProd ? currentProd.description : ''}</textarea>
                  </div>
                </div>
              </section>

              <!-- Thông số kỹ thuật nhanh theo danh mục -->
              <section class="variant-matrix-card" id="specsFieldsContainer">
                ${renderDynamicSpecsHtml(currentCat, currentProd)}
              </section>
            </div>

            <!-- Upload ảnh thật với FileReader & Xem trước ngay lập tức -->
            <section class="variant-matrix-card" style="height: fit-content;">
              <h2 style="font-size: 16px; font-weight: 700; color: var(--color-ink); margin-bottom: 8px;">
                Hình ảnh sản phẩm
              </h2>
              <p style="font-size: 12px; color: var(--color-ink-3); margin-bottom: 16px;">
              Tải ảnh từ máy tính
              </p>

              <div class="image-upload-wrapper" id="imageUploadWrapper">
                <input 
                  type="file" 
                  id="productImageInput" 
                  class="image-upload-input" 
                  accept="image/png,image/jpeg,image/webp"
                  onchange="handleImageFileSelect(event)" 
                />
                <div id="imagePreviewContainer" style="display: ${formImagePreview ? 'block' : 'none'};">
                  <img src="${formImagePreview}" id="imagePreviewImg" class="image-preview-thumb" data-image-id="${formProductCode}" alt="Xem trước" onerror="this.hidden=true;this.nextElementSibling.hidden=false" />
                  <span class="product-image-placeholder" hidden aria-hidden="true">▧</span>
                  <div style="font-size: 12px; color: var(--color-brand-600); margin-top: 8px; font-weight: 500;">
                    Nhấn vào đây để đổi ảnh khác
                  </div>
                </div>
                <div id="imageUploadPlaceholder" style="display: ${formImagePreview ? 'none' : 'block'};">
                  <img src="${iconPath}them.svg" class="icon icon-24" style="margin: 0 auto 8px;" alt="" />
                  <div style="font-weight: 600; color: var(--color-ink);">Bấm để chọn ảnh từ máy</div>
                  <div style="font-size: 12px; color: var(--color-ink-3); margin-top: 4px;">PNG, JPG, WebP</div>
                </div>
              </div>
            </section>
          </div>

          <!-- ==========================================
               TẦNG 2: CẤU HÌNH MA TRẬN BIẾN THỂ (VARIANT MATRIX)
               Nghiệp vụ Đóng Băng Tồn Kho (Immutable Inventory): Tồn kho = 0, disabled
               ========================================== -->
          <section class="variant-matrix-card">
            <div class="variant-matrix-header">
              <div>
                <h2 style="font-size: 16px; font-weight: 700; color: var(--color-ink);">
                  Cấu hình Phiên bản Sản Phẩm
                </h2>
                <p style="font-size: 13px; color: var(--color-ink-3); margin-top: 4px;">
                </p>
              </div>

              <button type="button" class="btn btn-secondary btn-md" onclick="handleAddVariantRow()">
                <img src="${iconPath}them.svg" class="icon icon-16" alt="" />
                [+] Thêm phiên bản
              </button>
            </div>

            <div class="table-responsive">
              <table class="variant-matrix-table">
                <thead id="variantMatrixThead">
                  ${renderVariantTableThead(currentCat)}
                </thead>
                <tbody id="variantMatrixBody">
                  ${formVariants.map((v, index) => renderVariantRowHtml(v, index, currentCat)).join('')}
                </tbody>
              </table>
            </div>
          </section>

          <!-- Action Buttons -->
          <div style="display: flex; justify-content: flex-end; gap: 12px;">
            <button type="button" class="btn btn-secondary btn-lg" onclick="setShowProductForm(false)">
              Huỷ bỏ
            </button>
            <button type="submit" class="btn btn-primary btn-lg">
              Lưu sản phẩm
            </button>
          </div>
        </form>
      </div>
    `;
  }

  // ==========================================================================
  // TAB 5: PHIẾU NHẬP HÀNG (RECEIPTS)
  // NGHIỆP VỤ ĐÓNG BĂNG TỒN KHO & LUÂN CHUYỂN KHO THỰC TẾ:
  // Tồn kho CHỈ ĐƯỢC TĂNG khi Admin tạo và bấm "Hoàn tất Phiếu Nhập Hàng".
  // ==========================================================================
  function generateReceiptRows(list) {
    if (!list || list.length === 0) {
      return `<tr><td colspan="7" class="text-center" style="padding: 24px; color: var(--color-ink-3);">Không tìm thấy phiếu nhập nào.</td></tr>`;
    }
    return list.map(r => `
      <tr>
        <td><span class="admin-code-cell">${r.id}</span></td>
        <td>${formatAdminDate(r.date)}</td>
        <td class="text-center">${r.lines || (r.items ? r.items.length : 1)}</td>
        <td class="text-center"><b style="color: var(--color-ink);">${r.qty}</b></td>
        <td class="text-right"><b style="color: var(--color-brand-700);">${vnd(r.total)}</b></td>
        <td><span class="badge ${r.status === 'Hoàn thành' ? 'badge-success' : 'badge-neutral'}">${r.status}</span></td>
        <td class="text-center">
          <div style="display: flex; justify-content: center; align-items: center; gap: 4px;">
            <button class="action-icon-btn" title="Xem chi tiết phiếu" onclick="viewReceiptDetail('${r.id}')">
              <img src="${iconPath}view.svg" class="icon icon-16" alt="Xem" />
            </button>
            ${r.status === 'Chờ duyệt' ? `
              <button class="action-icon-btn" title="Sửa phiếu nhập" onclick="openEditReceiptModal('${r.id}')">
                <img src="${iconPath}sua.svg" class="icon icon-16" alt="Sửa" />
              </button>
              <button class="btn btn-primary btn-sm" style="padding: 4px 10px; font-size: 12px; font-weight: 600;" title="Duyệt phiếu và cộng vào kho" onclick="handleApproveReceipt('${r.id}')">
                Duyệt
              </button>
            ` : ''}
          </div>
        </td>
      </tr>
    `).join('');
  }

  function renderReceipts() {
    let list = [...receipts].sort((a, b) => String(a.id).localeCompare(String(b.id), undefined, { numeric: true }));
    if (receiptSearchQuery) {
      const q = receiptSearchQuery.toLowerCase().trim();
      list = list.filter(r =>
        (r.id && r.id.toLowerCase().includes(q)) ||
        (r.date && (
          r.date.toLowerCase().includes(q) ||
          formatAdminDate(r.date).toLowerCase().includes(q)
        ))
      );
    }
    const page = paginateAdminList('receipts', list);

    // Danh sách các dòng biến thể trong Modal Nhập Hàng
    const receiptLinesHtml = receiptModalItems.map((item, idx) => {
      const costVal = (item.cost !== undefined && item.cost !== null) ? item.cost : '';
      const qtyVal = (item.qty !== undefined && item.qty !== null) ? item.qty : '';
      const numCost = Number(costVal) || 0;
      const numQty = Number(qtyVal) || 0;
      const lineTotal = (numCost > 0 && numQty > 0) ? numCost * numQty : 0;

      return `
        <div style="display: grid; gap: 12px; grid-template-columns: 2fr 1.2fr 1fr 1fr 40px; align-items: center; background: var(--color-surface); padding: 10px 14px; border-radius: var(--radius-md);" id="receiptItemRow_${idx}">
          <div>
            <div style="font-weight: 600; font-size: 13px; color: var(--color-ink);">${item.name}</div>
            <div style="font-family: var(--font-mono); font-size: 11px; color: var(--color-brand-700);">${item.sku}</div>
          </div>
          <div>
            <label style="font-size: 11px; color: var(--color-ink-3);">Giá nhập (₫) *</label>
            <input 
              type="number" 
              class="input-control" 
              style="height: 34px; font-size: 13px; text-align: right;" 
              value="${costVal}" 
              placeholder="Nhập giá vốn"
              oninput="handleReceiptItemChange(${idx}, 'cost', this.value)" 
              min="1" 
              required
            />
          </div>
          <div>
            <label style="font-size: 11px; color: var(--color-ink-3);">Số lượng nhập *</label>
            <input 
              type="number" 
              class="input-control" 
              style="height: 34px; font-size: 13px; text-align: center; font-weight: 600;" 
              value="${qtyVal}" 
              placeholder="Nhập SL"
              oninput="handleReceiptItemChange(${idx}, 'qty', this.value)" 
              min="1" 
              required
            />
          </div>
          <div style="text-align: right;">
            <label style="font-size: 11px; color: var(--color-ink-3);">Thành tiền</label>
            <div class="receipt-line-total" style="font-weight: 600; font-size: 13px; color: var(--color-ink);">${vnd(lineTotal)}</div>
          </div>
          <div>
            <button type="button" class="action-icon-btn danger" onclick="handleRemoveReceiptLine(${idx})" title="Xoá dòng">
              ✕
            </button>
          </div>
        </div>
      `;
    }).join('');

    const totalReceiptQty = receiptModalItems.reduce((s, i) => s + (Number(i.qty) || 0), 0);
    const totalReceiptAmount = receiptModalItems.reduce((s, i) => s + ((Number(i.cost) || 0) * (Number(i.qty) || 0)), 0);
    const isReceiptValid = receiptModalItems.length > 0 && receiptModalItems.every(i => {
      const c = Number(i.cost);
      const q = Number(i.qty);
      return !isNaN(c) && c > 0 && !isNaN(q) && q > 0;
    });

    // Danh sách tất cả các biến thể có trong hệ thống để chọn nhập
    const availableVariants = [];
    products.filter(p => !p.isDeleted).forEach(p => {
      if (p.variants) {
        p.variants.forEach(v => {
          const hasRam = v.ram && v.ram !== 'null' && v.ram !== 'Tiêu chuẩn';
          const hasRom = v.rom && v.rom !== 'null' && v.rom !== 'Tiêu chuẩn';
          let specText = '';
          if (hasRam && hasRom) specText = ` · ${v.ram}/${v.rom}`;
          else if (hasRom) specText = ` · ${v.rom}`;
          else if (hasRam) specText = ` · ${v.ram}`;
          availableVariants.push({
            productId: p.id,
            productName: p.name,
            sku: v.sku,
            label: `${p.name} - [${v.color || 'Màu mặc định'}${specText}] (SKU: ${v.sku}) - Tồn hiện tại: ${v.stock}`,
            cost: v.cost || Math.round(v.price * 0.85)
          });
        });
      }
    });

    const nextReceiptId = generateNextReceiptId();

    return `
      <div class="admin-toolbar">
        <div class="admin-search-wrap">
          <img src="${iconPath}tim-kiem.svg" class="icon icon-16" alt="" />
          <input 
            type="text" 
            id="receiptSearchInput" 
            placeholder="Tìm theo mã phiếu, ngày nhập..." 
            class="input-control" 
            value="${receiptSearchQuery}" 
            oninput="handleReceiptSearch(this.value)" 
          />
        </div>
        <div class="admin-toolbar-actions">
          <button class="btn btn-primary btn-md" onclick="openReceiptModal()">
            <img src="${iconPath}them.svg" class="icon icon-16" alt="" />
            Tạo phiếu nhập hàng
          </button>
        </div>
      </div>

      <div class="table-responsive">
        <table class="data-table">
          <thead>
            <tr>
              <th>Mã phiếu</th>
              <th>Ngày nhập</th>
              <th class="text-center">Số mặt hàng</th>
              <th class="text-center">Tổng SL</th>
              <th class="text-right">Tổng giá trị</th>
              <th>Trạng thái</th>
              <th class="text-center">Thao tác</th>
            </tr>
          </thead>
          <tbody id="receiptTableBody">
            ${generateReceiptRows(page.items)}
          </tbody>
        </table>
      </div>

      ${renderAdminPagination('receipts', list, 'phiếu nhập')}

      <!-- Receipt Modal (Phiếu Nhập Hàng) -->
      ${showReceiptModal ? `
        <div class="modal-overlay pop">
          <div class="modal-box modal-wide" style="max-width: 860px;">
            <div class="modal-header">
              <h3 class="modal-title">Tạo phiếu nhập hàng </h3>
              <button class="modal-close-btn" onclick="closeReceiptModal()">✕</button>
            </div>
            <div class="modal-body" style="display: flex; flex-direction: column; gap: 20px;">
              <div style="display: grid; gap: 16px; grid-template-columns: 1fr 1fr;">
                <div class="form-field" style="margin:0;">
                  <label class="form-label">Mã phiếu </label>
                  <input type="text" class="input-control variant-stock-locked" value="${nextReceiptId}" disabled readonly />
                </div>
                <div class="form-field" style="margin:0;">
                  <label class="form-label">Ngày nhập kho</label>
                  ${renderAdminDateInput({
                    textId: 'receiptDateInput',
                    pickerId: 'receiptDatePicker',
                    value: typeof formatCurrentDate === 'function' ? formatCurrentDate() : new Date().toLocaleDateString('vi-VN'),
                    context: 'receipt',
                    range: '',
                    required: true
                  })}
                </div>
              </div>

              <!-- Thêm mặt hàng vào phiếu -->
              <div style="background: var(--color-surface); padding: 16px; border-radius: var(--radius-xl); border: 1px solid var(--color-line);">
                <div style="font-size: 14px; font-weight: 600; margin-bottom: 12px; color: var(--color-ink);">
                  Chọn phiên bản sản phẩm cần nhập :
                </div>
                <div style="display: flex; gap: 12px; flex-wrap: wrap;">
                  <div class="select-wrapper" style="flex: 2; min-width: 240px;">
                    <select id="receiptVariantSelect" class="select-control">
                      ${availableVariants.map(av => `<option value="${av.sku}">${av.label}</option>`).join('')}
                    </select>
                    <span class="select-arrow">▼</span>
                  </div>
                  <button type="button" class="btn btn-secondary btn-md" onclick="handleAddVariantToReceipt()">
                    + Thêm vào danh sách nhập
                  </button>
                </div>
              </div>

              <!-- Danh sách dòng nhập -->
              <div>
                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 10px;">
                  <div style="font-size: 14px; font-weight: 600;">Danh sách SKU nhập kho:</div>
                  <span style="font-size: 13px; color: var(--color-ink-3);">${receiptModalItems.length} mặt hàng</span>
                </div>

                <div style="display: flex; flex-direction: column; gap: 8px; max-height: 240px; overflow-y: auto;">
                  ${receiptLinesHtml || '<div style="text-align:center; padding: 20px; color: var(--color-ink-3); font-size: 13px;">Chưa chọn mặt hàng nào. Vui lòng chọn SKU phía trên.</div>'}
                </div>
              </div>

              <!-- Tổng kết -->
              <div style="display: flex; justify-content: space-between; align-items: center; border-top: 1px solid var(--color-line); padding-top: 16px;">
                <div>
                  <div style="font-size: 13px; color: var(--color-ink-3);">Tổng số lượng nhập: <b id="receiptTotalQty" style="color: var(--color-ink);">${totalReceiptQty} sản phẩm</b></div>
                </div>
                <div style="text-align: right;">
                  <span style="font-size: 13px; color: var(--color-ink-3);">Tổng giá trị nhập: </span>
                  <b id="receiptTotalAmount" style="font-size: 18px; color: var(--color-brand-700);">${vnd(totalReceiptAmount)}</b>
                </div>
              </div>
            </div>

            <div class="modal-footer">
              <button class="btn btn-secondary btn-md" onclick="closeReceiptModal()">Huỷ</button>
              <button 
                class="btn btn-primary btn-md" 
                id="finishReceiptBtn"
                onclick="handleFinishReceipt()"
                ${!isReceiptValid ? 'disabled style="opacity: 0.5; cursor: not-allowed;"' : ''}
              >
                Tạo Phiếu Nhập Hàng 
              </button>
            </div>
          </div>
        </div>
      ` : ''}

      <!-- Modal Sửa Phiếu Nhập Hàng (Trạng thái Chờ duyệt) -->
      ${editingReceiptId ? (() => {
        const editReceipt = receipts.find(r => r.id === editingReceiptId);
        if (!editReceipt) return '';
        const editTotalQty = editingReceiptItems.reduce((s, i) => s + (Number(i.qty) || 0), 0);
        const editTotalAmount = editingReceiptItems.reduce((s, i) => s + ((Number(i.cost) || 0) * (Number(i.qty) || 0)), 0);
        return `
          <div class="modal-overlay pop">
            <div class="modal-box modal-wide" style="max-width: 820px;">
              <div class="modal-header">
                <div>
                  <h3 class="modal-title">Sửa phiếu nhập #${editReceipt.id}</h3>
                  <div style="font-size: 13px; color: var(--color-ink-3); margin-top: 4px;">
                    Ngày lập: <b>${formatAdminDate(editReceipt.date)}</b> · Trạng thái: <span class="badge badge-warning">Chờ duyệt</span>
                  </div>
                </div>
                <button class="modal-close-btn" onclick="closeEditReceiptModal()">✕</button>
              </div>
              <div class="modal-body" style="display: flex; flex-direction: column; gap: 16px;">
                <div style="font-size: 13px; color: var(--color-ink-3);">
                  Chỉnh sửa giá nhập và số lượng cho các phiên bản trong phiếu nhập:
                </div>
                <div style="display: flex; flex-direction: column; gap: 8px; max-height: 280px; overflow-y: auto;">
                  ${editingReceiptItems.map((item, idx) => {
          const c = Number(item.cost) || 0;
          const q = Number(item.qty) || 0;
          return `
                      <div id="editReceiptRow_${idx}" style="display: grid; gap: 12px; grid-template-columns: 2fr 1.2fr 1fr 1fr; align-items: center; background: var(--color-surface); padding: 10px 14px; border-radius: var(--radius-md);">
                        <div>
                          <div style="font-weight: 600; font-size: 13px; color: var(--color-ink);">${item.name}</div>
                          <div style="font-family: var(--font-mono); font-size: 11px; color: var(--color-brand-700);">${item.sku}</div>
                        </div>
                        <div>
                          <label style="font-size: 11px; color: var(--color-ink-3);">Giá nhập (₫) *</label>
                          <input
                            type="number"
                            class="input-control"
                            style="height: 34px; font-size: 13px; text-align: right;"
                            value="${item.cost}"
                            min="1"
                            oninput="handleEditReceiptItemChange(${idx}, 'cost', this.value)"
                            required
                          />
                        </div>
                        <div>
                          <label style="font-size: 11px; color: var(--color-ink-3);">Số lượng *</label>
                          <input
                            type="number"
                            class="input-control"
                            style="height: 34px; font-size: 13px; text-align: center; font-weight: 600;"
                            value="${item.qty}"
                            min="1"
                            oninput="handleEditReceiptItemChange(${idx}, 'qty', this.value)"
                            required
                          />
                        </div>
                        <div style="text-align: right;">
                          <label style="font-size: 11px; color: var(--color-ink-3);">Thành tiền</label>
                          <div class="edit-receipt-line-total" style="font-weight: 600; font-size: 13px; color: var(--color-ink);">${vnd(c * q)}</div>
                        </div>
                      </div>
                    `;
        }).join('')}
                </div>
                <div style="display: flex; justify-content: space-between; align-items: center; border-top: 1px solid var(--color-line); padding-top: 14px;">
                  <div style="font-size: 13px; color: var(--color-ink-2);">
                    Tổng số lượng: <b id="editReceiptTotalQty" style="color: var(--color-ink); font-size: 15px;">${editTotalQty}</b> sản phẩm
                  </div>
                  <div style="font-size: 13px; color: var(--color-ink-2);">
                    Tổng giá trị: <b id="editReceiptTotalAmount" style="color: var(--color-brand-700); font-size: 18px;">${vnd(editTotalAmount)}</b>
                  </div>
                </div>
              </div>
              <div class="modal-footer">
                <button class="btn btn-secondary btn-md" onclick="closeEditReceiptModal()">Huỷ</button>
                <button class="btn btn-primary btn-md" onclick="handleSaveEditReceipt()">Lưu</button>
              </div>
            </div>
          </div>
        `;
      })() : ''}

      <!-- Popup Modal Xem chi tiết Phiếu Nhập Hàng (Thay thế alert) -->
      ${selectedReceiptModal ? `
        <div class="modal-overlay pop">
          <div class="modal-box modal-wide" style="max-width: 820px;">
            <div class="modal-header">
              <div>
                <h3 class="modal-title" style="display: flex; align-items: center; gap: 10px;">
                  <span>Chi tiết phiếu nhập #${selectedReceiptModal.id}</span>
                  <span class="badge ${selectedReceiptModal.status === 'Hoàn thành' ? 'badge-success' : 'badge-neutral'}">
                    ${selectedReceiptModal.status}
                  </span>
                </h3>
                <div style="font-size: 13px; color: var(--color-ink-3); margin-top: 4px;">
                  Ngày lập phiếu: <b>${formatAdminDate(selectedReceiptModal.date)}</b>
                </div>
              </div>
              <button class="modal-close-btn" onclick="closeReceiptDetailModal()">✕</button>
            </div>

            <div class="modal-body" style="display: flex; flex-direction: column; gap: 16px;">
              <div class="table-responsive" style="border: 1px solid var(--color-line); border-radius: var(--radius-xl); overflow: hidden;">
                <table class="data-table" style="margin: 0;">
                  <thead>
                    <tr>
                      <th>Tên sản phẩm</th>
                      <th>Phiên bản (SKU)</th>
                      <th class="text-center">Số lượng nhập</th>
                      <th class="text-right">Đơn giá nhập</th>
                      <th class="text-right">Thành tiền</th>
                    </tr>
                  </thead>
                  <tbody>
                    ${(selectedReceiptModal.items || []).map(it => {
        const cost = Number(it.cost) || 0;
        const qty = Number(it.qty) || 0;
        const lineTotal = cost * qty;
        return `
                        <tr>
                          <td><b style="color: var(--color-ink);">${it.name || 'Sản phẩm'}</b></td>
                          <td>
                            <span class="variant-sku-display">
                              ${it.sku || 'SKU-STD'}
                            </span>
                          </td>
                          <td class="text-center"><b style="font-size: 14px;">${qty}</b></td>
                          <td class="text-right">${vnd(cost)}</td>
                          <td class="text-right"><b style="color: var(--color-brand-700);">${vnd(lineTotal)}</b></td>
                        </tr>
                      `;
      }).join('')}
                  </tbody>
                </table>
              </div>

              <!-- Chân Modal: Tổng số lượng & Tổng tiền hàng -->
              <div style="display: flex; justify-content: space-between; align-items: center; background: var(--color-surface); padding: 14px 18px; border-radius: var(--radius-lg); border: 1px solid var(--color-line);">
                <div style="font-size: 14px; color: var(--color-ink-2);">
                  Tổng số lượng nhập: <b style="color: var(--color-ink); font-size: 16px;">${selectedReceiptModal.qty}</b> sản phẩm
                </div>
                <div style="font-size: 14px; color: var(--color-ink-2);">
                  Tổng giá trị nhập kho: <b style="color: var(--color-brand-700); font-size: 20px;">${vnd(selectedReceiptModal.total)}</b>
                </div>
              </div>
            </div>

            <div class="modal-footer">
              <button class="btn btn-primary btn-md" onclick="closeReceiptDetailModal()">
                Đóng
              </button>
            </div>
          </div>
        </div>
      ` : ''}
    `;
  }

  // ==========================================================================
  // TAB 6: GIÁ BÁN (PRICING) - DẠNG ACCORDION TỪNG SKU BIẾN THỂ
  // ==========================================================================
  function getPricingList() {
    let list = products.filter(p => !p.isDeleted);
    if (pricingCategoryFilter) {
      list = list.filter(p => p.category === pricingCategoryFilter);
    }
    if (pricingSearchQuery) {
      list = list.filter(p => getFilteredProductWithVariants(p, pricingSearchQuery).matches);
    }
    return list;
  }

  function generatePricingRows(items) {
    if (!items || items.length === 0) {
      return '<tr><td colspan="6" class="text-center" style="padding: 24px; color: var(--color-ink-3);">Không tìm thấy sản phẩm nào phù hợp.</td></tr>';
    }
    const iconPath_p = `${basePath}assets/icon/`;

    return items.map(p => {
      const isExpanded = Boolean(expandedPricing[p.id]);
      const isEditing = editingPricingId === p.id;
      // Áp dụng thuật toán lọc biến thể con theo từ khóa tìm kiếm (tái sử dụng từ Task 1)
      const filteredInfo = getFilteredProductWithVariants(p, pricingSearchQuery);
      const variantList = filteredInfo.variants && filteredInfo.variants.length > 0 ? filteredInfo.variants : (p.variants || []);
      const totalVariantCount = p.variants ? p.variants.length : 1;
      const minCost = variantList.length > 0 ? Math.min(...variantList.map(v => v.cost || 0)) : (p.cost || 0);
      const minPrice = variantList.length > 0 ? Math.min(...variantList.map(v => v.price || 0)) : (p.price || 0);

      // Render danh sách SKU con
      const childRowsHtml = variantList.map(v => {
        const draft = skuPricingDraft[v.sku] || {};
        const cost = Number(v.cost) || 0;
        const currentPrice = draft.price !== undefined ? draft.price : (v.price || 0);
        const profit = currentPrice - cost;
        const currentMargin = draft.margin !== undefined
          ? draft.margin
          : (cost > 0 && currentPrice > cost ? Math.round(((currentPrice - cost) / cost) * 100) : (margins[p.id] || 15));
        const hasRam = v.ram && v.ram !== 'null' && v.ram !== 'Tiêu chuẩn';
        const hasRom = v.rom && v.rom !== 'null' && v.rom !== 'Tiêu chuẩn';
        let ramRomText = 'Tiêu chuẩn';
        if (hasRam && hasRom) ramRomText = `${v.ram}/${v.rom}`;
        else if (hasRom) ramRomText = v.rom;
        else if (hasRam) ramRomText = v.ram;

        const marginInputAttrs = isEditing
          ? `oninput="handleSkuMarginInput('${v.sku}', this.value)" title="Nhập % lợi nhuận riêng"`
          : `readonly style="pointer-events: none;" tabindex="-1" title="Nhấn biểu tượng bút chì để chỉnh sửa"`;

        const priceInputAttrs = isEditing
          ? `oninput="handleSkuPriceInput('${v.sku}', this.value)" title="Gõ trực tiếp giá bán niêm yết"`
          : `readonly style="pointer-events: none;" tabindex="-1" title="Nhấn biểu tượng bút chì để chỉnh sửa"`;

        return `
          <tr id="skuPricingRow_${v.sku}" class="sku-item-row">
            <td><span class="variant-sku-display">${v.sku}</span></td>
            <td><b>${v.color}</b></td>
            <td><span>${ramRomText}</span></td>
            <td class="text-right font-mono">${vnd(cost)}</td>
            <td class="text-center">
              <div class="sku-margin-input-wrap">
                <input
                  type="number"
                  class="input-control sku-margin-input"
                  value="${currentMargin}"
                  min="0"
                  step="1"
                  ${marginInputAttrs}
                />
                <span class="sku-margin-suffix">%</span>
              </div>
            </td>
            <td class="text-right">
              <!-- Giá bán niêm yết đổi thành màu xanh dương cho đồng bộ -->
              <input
                type="text"
                inputmode="numeric"
                class="input-control sku-price-input"
                style="color: var(--color-brand-700) !important; font-weight: 700;"
                value="${Number(currentPrice).toLocaleString('vi-VN')}"
                ${priceInputAttrs}
              />
            </td>
            <td class="text-right">
              <span class="sku-profit-text" style="font-weight: 700;">
                ${(profit >= 0 ? '+' : '') + vnd(profit)}
              </span>
            </td>
          </tr>
        `;
      }).join('');

      return `
        <!-- Dòng Sản phẩm chính: Click vào dòng để Toggle Accordion -->
        <tr
          class="pricing-parent-row ${isExpanded ? 'expanded' : ''}"
          onclick="togglePricingAccordion(${p.id})"
          style="cursor: pointer;"
        >
          <td><span class="admin-code-cell">${p.code}</span></td>
          <td>
            <div style="display: flex; align-items: center; gap: 10px; text-align: left;">
              <span class="accordion-caret" style="font-size:12px; color:var(--color-brand-500); transition:transform 0.2s; display:inline-block; transform: ${isExpanded ? 'rotate(90deg)' : 'rotate(0deg)'};">&#9658;</span>
              <div>
                <div style="font-weight: 600; color: var(--color-ink); font-size: 14px;">${p.name} <span style="font-weight: 400; font-size: 12px; color: var(--color-ink-3);">&middot; ${totalVariantCount} Phiên bản</span></div>
              </div>
            </div>
          </td>
          <td class="text-center font-mono">Từ ${vnd(minCost)}</td>
          <td class="text-center font-mono" style="color: var(--color-brand-700); font-weight: 700;">Từ ${vnd(minPrice)}</td>
          <td class="text-center">${totalVariantCount}</td>
          <td class="text-center" onclick="event.stopPropagation()">
            <div style="display: flex; justify-content: center; gap: 4px;">
              <button
                type="button"
                class="action-icon-btn ${isEditing ? 'active-edit' : ''}"
                title="${isEditing ? 'Thoát chế độ chỉnh sửa' : 'Chỉnh sửa bảng giá'}"
                onclick="togglePricingEditMode(${p.id})"
              >
                <img src="${iconPath_p}sua.svg" class="icon icon-16" alt="Sửa" />
              </button>
            </div>
          </td>
        </tr>

        <!-- Dòng mở rộng Accordion -->
        ${isExpanded ? `
          <tr class="pricing-child-row">
            <td colspan="6">
              <div class="pricing-accordion-panel">
                <div class="pricing-accordion-header">
                  <div>
                    <span style="font-weight: 700; font-size: 13px; color: var(--color-ink);">${p.name}:</span>
                    <span style="font-size: 12px; color: var(--color-ink-3); margin-left: 8px;">
                      ${isEditing
            ? 'Chế độ Chỉnh sửa '
            : 'Chế độ Xem '
          }
                    </span>
                  </div>
                  <span class="badge ${isEditing ? 'badge-warning' : 'badge-neutral'}">
                    ${isEditing ? 'Đang chỉnh sửa' : variantList.length + ' cấu hình'}
                  </span>
                </div>
                <div class="table-responsive">
                  <table class="sku-pricing-table">
                    <thead>
                      <tr>
                        <th>Mã SKU</th>
                        <th>Màu sắc</th>
                        <th>RAM/ROM</th>
                        <th class="text-right">Giá vốn</th>
                        <th class="text-center" style="width: 130px;">% Lợi nhuận</th>
                        <th class="text-right" style="width: 180px;">Giá bán niêm yết (₫)</th>
                        <th class="text-right">Lãi chênh lệch</th>
                      </tr>
                    </thead>
                    <tbody>
                      ${childRowsHtml || '<tr><td colspan="7" style="text-align:center; padding: 12px; color: var(--color-ink-3);">Không có biến thể nào.</td></tr>'}
                    </tbody>
                  </table>
                </div>
                ${isEditing ? `
                  <div style="display: flex; justify-content: flex-end; margin-top: 12px; gap: 8px;">
                    <button type="button" class="btn btn-ghost btn-sm" onclick="togglePricingEditMode(${p.id})">
                      Huỷ chỉnh sửa
                    </button>
                    <button type="button" class="btn btn-primary btn-sm" onclick="handleSavePricingForProduct(${p.id})">
                      Lưu bảng giá 
                    </button>
                  </div>
                ` : ''}
              </div>
            </td>
          </tr>
        ` : ''}
      `;
    }).join('');
  }

  function renderPricing() {
    const list = getPricingList();
    const page = paginateAdminList('pricing', list);
    const iconPath_p = `${basePath}assets/icon/`;

    return `
      <div class="admin-toolbar pricing-toolbar">
        <div class="admin-search-wrap">
          <img src="${iconPath_p}tim-kiem.svg" class="icon icon-16" alt="" />
          <input
            type="text"
            id="pricingSearchInput"
            placeholder="Tìm theo mã SP, tên, SKU, màu sắc..."
            class="input-control"
            value="${pricingSearchQuery}"
            oninput="handlePricingSearch(this.value)"
          />
        </div>
        <div style="width: 220px;">
          <div class="select-wrapper">
            <select class="select-control" aria-label="Lọc theo danh mục" onchange="handlePricingCategoryFilter(this.value)">
              <option value="">Tất cả danh mục</option>
              ${Array.from(new Set(categories.map(category => typeof category === 'string' ? category : category.name).filter(Boolean))).map(category => `
                <option value="${category}" ${pricingCategoryFilter === category ? 'selected' : ''}>${category}</option>
              `).join('')}
            </select>
            <span class="select-arrow">▼</span>
          </div>
        </div>
      </div>

      <div class="table-responsive">
        <table class="data-table">
          <thead>
            <tr>
              <th>Mã SP</th>
              <th class="text-center">Sản phẩm</th>
              <th class="text-center">Giá vốn</th>
              <th class="text-center">Giá bán</th>
              <th class="text-center">Số lượng Phiên bản</th>
              <th class="text-center">Thao tác</th>
            </tr>
          </thead>
          <tbody id="pricingTableBody">
            ${generatePricingRows(page.items)}
          </tbody>
        </table>
      </div>

      ${renderAdminPagination('pricing', list, 'sản phẩm')}
    `;
  }

  // ==========================================================================
  // TAB 7: ĐƠN HÀNG (ORDERS)
  // NGHIỆP VỤ TÌM KIẾM THEO MÃ ĐƠN, TÊN KHÁCH HÀNG HOẶC SĐT
  // ==========================================================================
  function generateOrderRows(list) {
    if (!list || list.length === 0) {
      return `<tr><td colspan="8" class="text-center" style="padding: 24px; color: var(--color-ink-3);">Không tìm thấy đơn hàng nào.</td></tr>`;
    }
    // Luồng trạng thái chuẩn mới: Chờ xác nhận | Đã xác nhận | Đang giao | Đã giao | Đã huỷ
    const statuses = ['Chờ xác nhận', 'Đã xác nhận', 'Đang giao', 'Đã giao', 'Đã huỷ'];
    return list.map(o => `
      <tr>
        <td><span class="admin-code-cell">#${o.id}</span></td>
        <td>
          <div style="font-weight: 500; color: var(--color-ink);">${escapeCustomerHtml(o.customer)}</div>
        </td>
        <td>${formatAdminDate(o.date)}</td>
        <td>${o.status === 'Đã giao' ? formatAdminDate(o.receivedDate) : ''}</td>
        <td>${o.pay}</td>
        <!-- TASK 2: Cột Tổng tiền hiển thị màu xanh dương (var(--color-brand-700)) -->
        <td class="text-right"><b style="color: var(--color-brand-700);">${vnd(o.total)}</b></td>
        <td style="width: 180px;">
          <div class="select-wrapper">
            <select class="select-control" style="height: 36px; font-size: 13px;" onchange="handleChangeOrderStatus('${o.id}', this.value)">
              ${statuses.map(s => `<option value="${s}" ${s === o.status ? 'selected' : ''}>${s}</option>`).join('')}
            </select>
            <span class="select-arrow">▼</span>
          </div>
        </td>
        <td class="text-center">
          <div style="display: flex; justify-content: center; gap: 4px;">
            <button class="action-icon-btn" title="Chi tiết" onclick="handleViewOrderDetail('${o.id}')">
              <img src="${iconPath}view.svg" class="icon icon-16" alt="Xem" />
            </button>
          </div>
        </td>
      </tr>
    `).join('');
  }

  function getFilteredOrderList() {
    let list = orders;
    if (orderStatusFilter) list = list.filter(order => order.status === orderStatusFilter);
    if (orderSearchQuery) {
      const query = orderSearchQuery.toLowerCase().trim();
      list = list.filter(order =>
        String(order.id).toLowerCase().includes(query) ||
        (order.customer && order.customer.toLowerCase().includes(query)) ||
        (order.phone && order.phone.replace(/\s+/g, '').includes(query.replace(/\s+/g, '')))
      );
    }
    if (orderDateFrom || orderDateTo) {
      list = list.filter(order => isDateInRange(order.date, orderDateFrom, orderDateTo));
    }
    if (receivedDateFrom || receivedDateTo) {
      list = list.filter(order => isDateInRange(order.receivedDate, receivedDateFrom, receivedDateTo));
    }
    return list;
  }

  function renderOrders() {
    const list = getFilteredOrderList();
    const page = paginateAdminList('orders', list);

    const statuses = ['Chờ xác nhận', 'Đã xác nhận', 'Đang giao', 'Đã giao', 'Đã huỷ'];

    return `
      <div class="admin-toolbar" style="margin-bottom: 20px;">
        <div class="admin-search-wrap" style="flex: 1; max-width: 380px;">
          <img src="${iconPath}tim-kiem.svg" class="icon icon-16" alt="" />
          <input 
            type="text" 
            id="orderSearchInput"
            placeholder="Tìm mã đơn, SĐT hoặc tên khách hàng..." 
            class="input-control" 
            value="${orderSearchQuery}" 
            oninput="handleOrderSearch(this.value)" 
          />
        </div>
        <div style="width: 200px;">
          <div class="select-wrapper">
            <select class="select-control" onchange="handleFilterOrderStatus(this.value)">
              <option value="">Tất cả trạng thái</option>
              ${statuses.map(s => `<option value="${s}" ${s === orderStatusFilter ? 'selected' : ''}>${s}</option>`).join('')}
            </select>
            <span class="select-arrow">▼</span>
          </div>
        </div>
      </div>

      <div class="admin-order-date-filters">
        <div class="admin-date-range">
          <label>Ngày đặt</label>
          ${renderAdminDateInput({ textId: 'orderDateFromInput', pickerId: 'orderDateFromPicker', value: orderDateFrom, context: 'orders', range: 'orderFrom' })}
          <span>đến</span>
          ${renderAdminDateInput({ textId: 'orderDateToInput', pickerId: 'orderDateToPicker', value: orderDateTo, context: 'orders', range: 'orderTo', min: orderDateFrom })}
        </div>
        <div class="admin-date-range">
          <label>Ngày nhận</label>
          ${renderAdminDateInput({ textId: 'receivedDateFromInput', pickerId: 'receivedDateFromPicker', value: receivedDateFrom, context: 'orders', range: 'receivedFrom' })}
          <span>đến</span>
          ${renderAdminDateInput({ textId: 'receivedDateToInput', pickerId: 'receivedDateToPicker', value: receivedDateTo, context: 'orders', range: 'receivedTo', min: receivedDateFrom })}
        </div>
      </div>

      <div class="table-responsive">
        <table class="data-table">
          <thead>
            <tr>
              <th>Mã đơn</th>
              <th>Khách hàng</th>
              <th>Ngày đặt</th>
              <th>Ngày nhận hàng</th>
              <th>Thanh toán</th>
              <th class="text-right">Tổng tiền</th>
              <th>Trạng thái</th>
              <th class="text-center">Chi tiết</th>
            </tr>
          </thead>
          <tbody id="orderTableBody">
            ${generateOrderRows(page.items)}
          </tbody>
        </table>
      </div>

      ${renderAdminPagination('orders', list, 'đơn hàng')}

      <!-- Order Detail Modal -->
      ${selectedOrderModal ? `
        <div class="modal-overlay pop">
          <div class="modal-box modal-wide">
            <div class="modal-header">
              <h3 class="modal-title">Chi tiết đơn hàng #${selectedOrderModal.id}</h3>
              <button class="modal-close-btn" onclick="closeOrderModal()">✕</button>
            </div>
            <div class="modal-body" style="display: flex; flex-direction: column; gap: 16px;">
              <div style="display: flex; justify-content: space-between; font-size: 14px; color: var(--color-ink-3);">
                <span>Khách hàng: <b>${selectedOrderModal.customer}</b> · Ngày đặt: ${formatAdminDate(selectedOrderModal.date)} · ${selectedOrderModal.pay}</span>
                <span class="badge badge-${getStatusTone(selectedOrderModal.status)}">${selectedOrderModal.status}</span>
              </div>
              <div style="font-size:14px;color:var(--color-ink-2);">
                Số điện thoại: <b style="color:var(--color-ink);">${escapeCustomerHtml(selectedOrderModal.phone || 'Chưa có thông tin')}</b>
              </div>
              <div style="font-size:14px;color:var(--color-ink-2);">
                Địa chỉ nhận hàng: <b style="color:var(--color-ink); font-weight: 500;">${escapeCustomerHtml(selectedOrderModal.address || 'Chưa có thông tin')}</b>
              </div>

              <!-- Chi tiết danh sách sản phẩm theo SKU -->
              <div style="border: 1px solid var(--color-line); border-radius: var(--radius-2xl); overflow: hidden;">
                ${(selectedOrderModal.items || []).map(it => {
      const sku = it.sku || (it.productId ? `SP00${it.productId}-STD` : 'SP-ITEM');
      const name = it.name || 'Sản phẩm';
      const price = it.price || 0;
      const qty = it.qty || 1;
      const found = findVariantBySku(sku);

      return `
                    <div style="display: flex; align-items: center; gap: 12px; padding: 12px; border-bottom: 1px solid var(--color-line);">
                      <div style="width: 48px; height: 48px; border-radius: var(--radius-md); background: var(--color-surface); display: grid; place-items: center; flex-shrink: 0; overflow:hidden;">
                        ${found ? renderProductImage(found.product, 'width:48px;height:48px;') : '📦'}
                      </div>
                      <div style="flex: 1; font-size: 14px;">
                        <div style="font-weight: 600; color: var(--color-ink);">${name}</div>
                        <div style="font-size: 11px; color: var(--color-brand-700);">${sku}</div>
                        <div style="color: var(--color-ink-3); font-size: 12px;">Số lượng: ${qty} × ${vnd(price)}</div>
                      </div>
                      <b style="font-size: 14px; color: var(--color-ink);">${vnd(price * qty)}</b>
                    </div>
                  `;
    }).join('')}
              </div>

              <div style="display: flex; justify-content: space-between; font-size: 14px; padding: 0 4px;">
                <span style="color: var(--color-ink-3);">Tổng thanh toán:</span>
                <b style="font-size: 18px; color: var(--color-brand-700);">${vnd(selectedOrderModal.total)}</b>
              </div>

              <div class="form-field" style="margin:0;">
                <label class="form-label">Cập nhật trạng thái đơn hàng</label>
                <div class="select-wrapper">
                  <select class="select-control" onchange="handleChangeOrderStatus('${selectedOrderModal.id}', this.value)">
                    ${statuses.map(s => `<option value="${s}" ${s === selectedOrderModal.status ? 'selected' : ''}>${s}</option>`).join('')}
                  </select>
                  <span class="select-arrow">▼</span>
                </div>
              </div>
            </div>
            <div class="modal-footer">
              <button class="btn btn-primary btn-md" onclick="closeOrderModal()">Đóng</button>
            </div>
          </div>
        </div>
      ` : ''}
    `;
  }

  // ==========================================================================
  // TAB 8: TỒN KHO (STOCK)
  // ==========================================================================
  function getStockData() {
    const hasDateRange = Boolean(stockDateFrom || stockDateTo);
    const importedBySku = new Map();
    const soldBySku = new Map();
    const activeSkuSet = new Set();

    if (hasDateRange) {
      receipts.filter(receipt =>
        receipt.status === 'Hoàn thành' && isDateInRange(receipt.date, stockDateFrom, stockDateTo)
      ).forEach(receipt => {
        (receipt.items || []).forEach(item => {
          const qty = Number(item.qty) || 0;
          if (!item.sku || qty <= 0) return;
          importedBySku.set(item.sku, (importedBySku.get(item.sku) || 0) + qty);
          activeSkuSet.add(item.sku);
        });
      });

      orders.filter(order =>
        order.status !== 'Đã huỷ' &&
        order.status !== 'Đã hủy' &&
        isDateInRange(order.date, stockDateFrom, stockDateTo)
      ).forEach(order => {
        (order.items || []).forEach(item => {
          const qty = Number(item.qty) || 0;
          if (!item.sku || qty <= 0) return;
          soldBySku.set(item.sku, (soldBySku.get(item.sku) || 0) + qty);
          activeSkuSet.add(item.sku);
        });
      });
    }

    const stockData = products.filter(product => !product.isDeleted).map(product => {
      const variants = (product.variants || [])
        .filter(variant => !hasDateRange || activeSkuSet.has(variant.sku))
        .map(variant => {
          const imported = hasDateRange
            ? importedBySku.get(variant.sku) || 0
            : Number(variant.imported) || 0;
          const sold = hasDateRange
            ? soldBySku.get(variant.sku) || 0
            : Number(variant.sold) || 0;
          return {
            ...variant,
            imported,
            sold,
            stock: Number(variant.stock) || 0
          };
        });
      const imported = variants.reduce((sum, variant) => sum + variant.imported, 0);
      const sold = variants.reduce((sum, variant) => sum + variant.sold, 0);
      const stock = Number(product.stock) || 0;
      return { ...product, variants, imported, sold, stock };
    });
    return hasDateRange
      ? stockData.filter(product => product.variants.length > 0)
      : stockData;
  }

  function getFilteredStockList() {
    let list = getStockData();
    if (stockSearchQuery) {
      const query = stockSearchQuery.toLowerCase();
      list = list.filter(product =>
        product.name.toLowerCase().includes(query) ||
        product.code.toLowerCase().includes(query) ||
        product.variants.some(variant => variant.sku.toLowerCase().includes(query))
      );
    }
    if (stockOnlyLow) list = list.filter(product => product.stock <= stockWarningThreshold);
    return list;
  }

  function renderStockStatus(stock) {
    const isOut = stock <= 0;
    const isLow = !isOut && stock <= stockWarningThreshold;
    return `<span class="badge ${isOut ? 'badge-danger' : isLow ? 'badge-warning' : 'badge-success'}">${isOut ? 'Hết hàng' : isLow ? 'Sắp hết hàng' : 'Còn hàng'}</span>`;
  }

  function generateStockRows(list) {
    if (!list.length) {
      return '<tr><td colspan="6" class="text-center" style="padding:24px;color:var(--color-ink-3);">Không tìm thấy sản phẩm phù hợp.</td></tr>';
    }
    return list.map(product => {
      const expanded = Boolean(expandedStock[product.id]);
      const variantRows = expanded ? product.variants.map(variant => {
        const hasRam = variant.ram && variant.ram !== 'null' && variant.ram !== 'Tiêu chuẩn';
        const hasRom = variant.rom && variant.rom !== 'null' && variant.rom !== 'Tiêu chuẩn';
        const specs = hasRam && hasRom ? ` · ${variant.ram}/${variant.rom}` : hasRom ? ` · ${variant.rom}` : hasRam ? ` · ${variant.ram}` : '';
        return `
          <tr class="inventory-variant-row">
            <td></td>
            <td><span class="variant-sku-display">${variant.sku}</span><span style="color:var(--color-ink-3); margin-left: 6px;">· ${variant.color || 'Mặc định'}${specs}</span></td>
            <td class="text-center">${variant.imported}</td>
            <td class="text-center">${variant.sold}</td>
            <!-- TASK 3: Số tồn kho phiên bản con hiển thị màu xanh dương -->
            <td class="text-center"><b style="color: var(--color-brand-700);">${variant.stock}</b></td>
            <td>${renderStockStatus(variant.stock)}</td>
          </tr>
        `;
      }).join('') : '';
      return `
        <tr class="inventory-product-row" onclick="toggleStockAccordion(${product.id})" aria-expanded="${expanded}">
          <td><span class="admin-code-cell">${product.code}</span></td>
          <td>
            <!-- TASK 2: Màu caret xanh giống tab Giá bán, đổi SKU → Phiên bản -->
            <span class="accordion-caret" style="display:inline-block;transform:rotate(${expanded ? '90deg' : '0deg'});transition:transform .2s;color:var(--color-brand-700);">&#9658;</span>
            <b style="color:var(--color-ink);">${product.name}</b>
            <span style="color:var(--color-ink-3);"> · ${product.variants.length} Phiên bản</span>
          </td>
          <td class="text-center">${product.imported}</td>
          <td class="text-center">${product.sold}</td>
          <!-- TASK 3: Số tồn kho thực tế của sản phẩm cha hiển thị màu xanh dương -->
          <td class="text-center"><b style="font-size:16px; color: var(--color-brand-700);">${product.stock}</b></td>
          <td>${renderStockStatus(product.stock)}</td>
        </tr>
        ${variantRows}
      `;
    }).join('');
  }

  function renderStock() {
    const list = getFilteredStockList();
    const page = paginateAdminList('stock', list);
    const activeList = products.filter(product => !product.isDeleted);
    const outOfStockCount = activeList.filter(product => (Number(product.stock) || 0) <= 0).length;
    const lowStockCount = activeList.filter(product => (Number(product.stock) || 0) > 0 && (Number(product.stock) || 0) <= stockWarningThreshold).length;

    return `
      ${(outOfStockCount > 0 || lowStockCount > 0) ? `
        <div class="alert-banner warning">
          <img src="${iconPath}canh-bao.svg" class="icon icon-20" alt="" />
          <div>Có <b>${outOfStockCount} sản phẩm ĐÃ HẾT HÀNG</b> và <b>${lowStockCount} sản phẩm SẮP HẾT HÀNG</b>. Hãy lập Phiếu Nhập Hàng để bổ sung tồn kho.</div>
        </div>
      ` : ''}

      <div class="admin-toolbar stock-filters-toolbar">
        <div class="admin-search-wrap">
          <img src="${iconPath}tim-kiem.svg" class="icon icon-16" alt="" />
          <input type="search" id="stockSearchInput" class="input-control" placeholder="Tìm tên, mã hoặc SKU..." value="${stockSearchQuery}" oninput="handleStockSearch(this.value)" />
        </div>
        <label class="admin-filter-field">Mức cảnh báo
          <input type="number" class="input-control" min="0" step="1" value="${stockWarningThreshold}" onchange="handleStockThreshold(this.value)" />
        </label>
        <label class="admin-filter-field">Từ ngày
          ${renderAdminDateInput({ textId: 'stockDateFromInput', pickerId: 'stockDateFromPicker', value: stockDateFrom, context: 'stock', range: 'from' })}
        </label>
        <label class="admin-filter-field">Đến ngày
          ${renderAdminDateInput({ textId: 'stockDateToInput', pickerId: 'stockDateToPicker', value: stockDateTo, context: 'stock', range: 'to', min: stockDateFrom })}
        </label>
      </div>

      <div class="admin-toolbar">
        <label class="checkbox-label">
          <input type="checkbox" ${stockOnlyLow ? 'checked' : ''} onchange="toggleStockLowOnly(this.checked)" />
          Chỉ hiện sản phẩm cần bổ sung
        </label>
      </div>

      <div class="table-responsive">
        <table class="data-table">
          <thead>
            <tr>
              <th>Mã SP</th>
              <th>Sản phẩm & Phiên bản</th>
              <th class="text-center">Tổng nhập</th>
              <th class="text-center">Đã bán</th>
              <th class="text-center">Tồn kho thực tế</th>
              <th>Tình trạng</th>
            </tr>
          </thead>
          <tbody id="stockTableBody">
            ${generateStockRows(page.items)}
          </tbody>
        </table>
      </div>

      ${renderAdminPagination('stock', list, 'sản phẩm')}
    `;
  }

  // ==========================================================================
  // EVENT HANDLERS & CALLBACKS
  // ==========================================================================

  window.changeAdminPage = (tab, page) => {
    if (!Object.prototype.hasOwnProperty.call(currentPageByTab, tab)) return;
    currentPageByTab[tab] = page;
    render();
  };

  window.switchAdminTab = (tab) => {
    // Tự động map alias tab 'prices' về 'pricing' (Giá bán)
    if (tab === 'prices') tab = 'pricing';
    currentTab = tab;
    if (Object.prototype.hasOwnProperty.call(currentPageByTab, tab)) {
      currentPageByTab[tab] = 1;
    }
    if (showProductForm) clearFormImageDrafts();
    showProductForm = false;
    showCategoryModal = false;
    showReceiptModal = false;
    selectedReceiptModal = null;
    selectedOrderModal = null;
    selectedUserModal = null;
    editingReceiptId = null;
    editingReceiptItems = [];
    userMessage = '';
    render();
  };

  window.handleAdminLogin = (e) => {
    e.preventDefault();
    const form = e.currentTarget;
    const identifierEl = document.getElementById('adminIdentifierInput') || form.querySelector('input[type="text"]');
    const passwordEl = document.getElementById('adminPasswordInput') || form.querySelector('input[type="password"]');
    const rememberEl = document.getElementById('adminRememberMe');
    const identifier = (identifierEl ? identifierEl.value : '').trim().toLowerCase();
    const password = passwordEl ? passwordEl.value : '';
    const remember = rememberEl ? rememberEl.checked : false;

    const validIdentifier = identifier === 'admin' || identifier === 'admin@technostore.vn';
    const validPassword = password === 'admin123' || password === '123';

    if (!validIdentifier || !validPassword) {
      showCustomDialog('Tên đăng nhập hoặc mật khẩu quản trị không chính xác!', 'Đăng nhập thất bại', 'error');
      return;
    }

    isLoggedIn = true;
    setAdminUser(true, remember);
    render();
  };

  window.toggleAdminPasswordVisibility = (btn) => {
    const wrap = btn.closest('.field-input-wrap');
    if (!wrap) return;
    const input = wrap.querySelector('input');
    if (!input) return;
    input.type = input.type === 'password' ? 'text' : 'password';
  };

  window.handleAdminLogout = () => {
    isLoggedIn = false;
    logoutAdmin();
    render();
  };

  // --------------------------------------------------------------------------
  // SỬA LỖI MẤT FOCUS: CHỈ CẬP NHẬT TBODY KHI GÕ TÌM KIẾM
  // --------------------------------------------------------------------------
  window.handleProdSearch = (val) => {
    prodSearchQuery = val;
    currentPageByTab.products = 1;
    refreshAdminTable('products', getProductList(), 'prodTableBody', generateProductRows, 'sản phẩm');
  };

  window.handleProdCategoryFilter = (category) => {
    prodCategoryFilter = category;
    currentPageByTab.products = 1;
    render();
  };

  window.handleToggleProductVisibility = (id, isVisible) => {
    products = products.map(product => product.id === id ? { ...product, isVisible } : product);
    saveProducts(products);
    products = getProducts();
    showToast(isVisible ? 'Sản phẩm đã được hiển thị.' : 'Sản phẩm đã được ẩn.');
    render();
  };

  window.handleUserSearch = (val) => {
    userSearchQuery = val;
    currentPageByTab.users = 1;
    let list = customers;
    if (userSearchQuery) {
      const q = userSearchQuery.toLowerCase();
      list = list.filter(c => c.name.toLowerCase().includes(q) || c.email.toLowerCase().includes(q) || c.phone.includes(q));
    }
    refreshAdminTable('users', list, 'userTableBody', generateUserRows, 'khách hàng');
  };

  window.handleCatSearch = (val) => {
    catSearchQuery = val;
    currentPageByTab.cats = 1;
    categories = getCategories();
    let list = categories.map((c, i) => {
      const name = typeof c === 'string' ? c : (c.name || '');
      const id = (typeof c === 'object' && c.id) ? c.id : `DM0${i + 1}`;
      const type = (typeof c === 'object' && c.type) ? c.type : (i < 2 ? 'Thiết bị chính' : 'Phụ kiện & Đeo');
      const status = (typeof c === 'object' && c.status) ? c.status : 'active';
      const count = products.filter(p => !p.isDeleted && p.category === name).length;
      return { id, name, type, status, count };
    });
    if (catSearchQuery) {
      const q = catSearchQuery.toLowerCase();
      list = list.filter(item => item.name.toLowerCase().includes(q) || item.id.toLowerCase().includes(q));
    }
    refreshAdminTable('cats', list, 'catTableBody', generateCatRows, 'danh mục');
  };

  window.handleReceiptSearch = (val) => {
    receiptSearchQuery = val;
    currentPageByTab.receipts = 1;
    let list = receipts;
    if (receiptSearchQuery) {
      const q = receiptSearchQuery.toLowerCase().trim();
      list = list.filter(r =>
        (r.id && r.id.toLowerCase().includes(q)) ||
        (r.date && (
          r.date.toLowerCase().includes(q) ||
          formatAdminDate(r.date).toLowerCase().includes(q)
        ))
      );
    }
    refreshAdminTable('receipts', list, 'receiptTableBody', generateReceiptRows, 'phiếu nhập');
  };

  window.handleOrderSearch = (val) => {
    orderSearchQuery = val;
    currentPageByTab.orders = 1;
    refreshAdminTable('orders', getFilteredOrderList(), 'orderTableBody', generateOrderRows, 'đơn hàng');
  };

  window.handleOrderDateFilter = (filter, value) => {
    if (filter === 'orderFrom') orderDateFrom = value;
    if (filter === 'orderTo') orderDateTo = value;
    if (filter === 'receivedFrom') receivedDateFrom = value;
    if (filter === 'receivedTo') receivedDateTo = value;
    currentPageByTab.orders = 1;
    render();
  };

  // --------------------------------------------------------------------------
  // NGHIỆP VỤ FORM SẢN PHẨM & BIẾN THỂ (PRODUCT VARIANT MATRIX)
  // --------------------------------------------------------------------------
  window.openCreateProductForm = () => {
    clearFormImageDrafts();
    editingProductId = null;
    const nextId = generateNextProductId();
    formProductCode = generateNextProductCode();
    formImagePath = '';
    formImagePreview = '';
    const firstCatName = categories[0] ? (typeof categories[0] === 'string' ? categories[0] : (categories[0].name || 'Điện thoại')) : 'Điện thoại';
    formSelectedCategory = firstCatName;

    // Khởi tạo 1 dòng biến thể TRỐNG chuẩn hóa theo danh mục
    formVariants = [
      {
        color: '',
        ram: '',
        rom: '',
        cost: 0,
        price: 0,
        sku: generateSku(formProductCode, '', '', ''),
        stock: 0 // Quy tắc: Mặc định là 0 và bị khóa (Immutable Stock)
      }
    ];
    initializeFormImageDrafts(formVariants);

    showProductForm = true;
    render();
  };

  window.openEditProductForm = (id) => {
    const p = products.find(x => x.id === id);
    if (!p) return;

    editingProductId = id;
    formProductCode = p.code;
    formImagePath = p.image || `assets/img/${p.code}.png`;
    formImagePreview = getProductImageUrl(formImagePath);
    const firstCatName = categories[0] ? (typeof categories[0] === 'string' ? categories[0] : (categories[0].name || 'Điện thoại')) : 'Điện thoại';
    formSelectedCategory = p.category || firstCatName;

    // Sao chép sâu mảng biến thể khi chỉnh sửa sản phẩm
    formVariants = JSON.parse(JSON.stringify(p.variants || []));
    if (formVariants.length === 0) {
      formVariants = [
        {
          color: '',
          ram: '',
          rom: '',
          cost: 0,
          price: 0,
          sku: generateSku(formProductCode, '', '', ''),
          stock: 0
        }
      ];
    }
    initializeFormImageDrafts(formVariants);

    showProductForm = true;
    render();
  };

  window.setShowProductForm = (val) => {
    if (!val) clearFormImageDrafts();
    showProductForm = val;
    render();
  };

  /**
   * Thay đổi thông tin 1 ô trong bảng biến thể -> Tự động sinh lại SKU tương ứng
   */
  window.handleVariantFieldChange = (index, field, val) => {
    if (!formVariants[index]) return;

    if (field === 'cost' || field === 'price') {
      formVariants[index][field] = Number(val) || 0;
    } else {
      formVariants[index][field] = val;
    }

    // Tự động sinh SKU mới dựa trên các giá trị Màu/RAM/ROM người dùng vừa nhập
    const sku = generateSku(
      formProductCode,
      formVariants[index].color || '',
      formVariants[index].ram || '',
      formVariants[index].rom || ''
    );
    updateVariantSku(formVariants[index], sku, index);

    const skuDisplayEl = document.getElementById(`skuDisplay_${index}`);
    if (skuDisplayEl) {
      skuDisplayEl.textContent = sku;
    }
  };

  function updateVariantSku(variant, nextSku, index = null) {
    if (variant.sku === nextSku) return;
    variant.sku = nextSku;
    variant.imageId = formVariantImageSources.get(variant) || nextSku;
    if (index !== null) refreshVariantImagePreview(index);
  }

  function refreshVariantImagePreview(index) {
    const previewImage = document.querySelector(`#variantRow_${index} img[data-image-id]`);
    if (!previewImage) return;
    applyFormVariantImagePreviews();
  }

  /**
   * Thêm 1 dòng cấu hình biến thể động (Khởi tạo dòng trống)
   */
  /**
   * Thay đổi danh mục trong form -> Tự động chuyển đổi giao diện Thông số và Bảng biến thể
   */
  window.handleFormCategoryChange = (newCat) => {
    formSelectedCategory = newCat;
    formVariants.forEach(v => {
      if (newCat === 'Tai nghe' || newCat === 'Phụ kiện') {
        v.ram = '';
        v.rom = '';
      } else if (newCat === 'Đồng hồ thông minh') {
        v.ram = '';
      }
      updateVariantSku(v, generateSku(formProductCode, v.color || '', v.ram || '', v.rom || ''));
    });
    if (typeof renderDynamicSpecsAndVariants === 'function') {
      renderDynamicSpecsAndVariants(newCat);
    }
  };

  /**
   * Thêm 1 dòng cấu hình biến thể động (Khởi tạo dòng trống theo danh mục)
   */
  window.handleAddVariantRow = () => {
    const cat = formSelectedCategory || (document.getElementById('formProdCat') ? document.getElementById('formProdCat').value : 'Điện thoại');
    const newSku = generateSku(formProductCode, '', '', '');

    formVariants.push({
      color: '',
      ram: '',
      rom: '',
      cost: 0,
      price: 0,
      sku: newSku,
      imageId: newSku,
      stock: 0 // Quy tắc: Mặc định là 0 và bị khóa (Immutable Stock)
    });
    formVariantImageSources.set(formVariants[formVariants.length - 1], null);

    if (typeof renderDynamicSpecsAndVariants === 'function') {
      renderDynamicSpecsAndVariants(cat);
    } else {
      render();
    }
  };

  /**
   * Xoá 1 dòng biến thể
   */
  window.handleRemoveVariantRow = (index) => {
    if (formVariants.length <= 1) {
      showCustomDialog('Sản phẩm phải có ít nhất 1 phiên bản biến thể!', 'Cảnh báo', 'warning');
      return;
    }
    const targetVariant = formVariants[index];
    if (targetVariant && (Number(targetVariant.stock) > 0 || Number(targetVariant.sold) > 0 || Number(targetVariant.imported) > 0)) {
      showCustomDialog('Không thể xóa phiên bản đã phát sinh tồn kho hoặc giao dịch.', 'Không thể xóa phiên bản', 'warning');
      return;
    }
    const variantDesc = targetVariant
      ? `${targetVariant.color || ''} ${targetVariant.ram ? targetVariant.ram + '/' : ''}${targetVariant.rom || ''} (${targetVariant.sku || ''})`
      : `dòng ${index + 1}`;

    showCustomDialog(
      `Bạn có chắc chắn muốn xoá phiên bản biến thể "${variantDesc}" không?`,
      'Xác nhận xoá phiên bản',
      'warning',
      () => {
        if (targetVariant) {
          const sourceId = formVariantImageSources.get(targetVariant);
          if (sourceId) removedVariantImageIds.add(sourceId);
          const draft = formVariantImageDrafts.get(targetVariant);
          if (draft) URL.revokeObjectURL(draft.previewUrl);
          formVariantImageDrafts.delete(targetVariant);
        }
        formVariants.splice(index, 1);
        const cat = formSelectedCategory || (document.getElementById('formProdCat') ? document.getElementById('formProdCat').value : 'Điện thoại');
        if (typeof renderDynamicSpecsAndVariants === 'function') {
          renderDynamicSpecsAndVariants(cat);
        } else {
          render();
        }
        applyFormVariantImagePreviews();
      }
    );
  };

  /**
   * Đọc file ảnh từ máy tính bằng FileReader và hiển thị xem trước tức thì
   */
  window.handleImageFileSelect = (e) => {
    const file = e.target.files && e.target.files[0];
    if (!file) return;

    const extensionByType = {
      'image/png': 'png',
      'image/jpeg': 'jpg',
      'image/webp': 'webp'
    };
    const extension = extensionByType[file.type];
    if (!extension) {
      showCustomDialog('Vui lòng chọn ảnh PNG, JPG hoặc WebP!');
      return;
    }

    const sessionId = formImageSessionId;
    const reader = new FileReader();
    reader.onload = async (event) => {
      if (!showProductForm || sessionId !== formImageSessionId) return;
      formProductImageDraft = file;
      formImagePath = `assets/img/${formProductCode}.${extension}`;
      formImagePreview = event.target.result;
      const previewImg = document.getElementById('imagePreviewImg');
      const previewFallback = previewImg && previewImg.nextElementSibling;
      const previewContainer = document.getElementById('imagePreviewContainer');
      const placeholder = document.getElementById('imageUploadPlaceholder');

      if (previewImg && previewContainer && placeholder) {
        previewImg.hidden = false;
        if (previewFallback) previewFallback.hidden = true;
        previewImg.src = formImagePreview;
        previewContainer.style.display = 'block';
        placeholder.style.display = 'none';
      }
    };
    reader.onerror = () => {
      showCustomDialog('Lỗi đọc file ảnh, vui lòng thử lại!');
    };
    reader.readAsDataURL(file);
  };

  window.handleVariantImageSelect = (e, index) => {
    const file = e.target.files && e.target.files[0];
    const variant = formVariants[index];
    if (!file || !variant) return;
    if (!['image/png', 'image/jpeg', 'image/webp'].includes(file.type)) {
      showCustomDialog('Vui lòng chọn ảnh PNG, JPG hoặc WebP!');
      e.target.value = '';
      return;
    }

    try {
      const previousDraft = formVariantImageDrafts.get(variant);
      if (previousDraft) URL.revokeObjectURL(previousDraft.previewUrl);
      formVariantImageDrafts.set(variant, {
        file,
        previewUrl: URL.createObjectURL(file)
      });
      variant.imageId = formVariantImageSources.get(variant) || variant.sku;
      refreshVariantImagePreview(index);
      showToast('Đã chọn ảnh. Nhấn "Lưu sản phẩm" để áp dụng.');
    } catch (error) {
      console.error(`[TechnoStore] Không thể lưu ảnh phiên bản "${variant.sku}":`, error);
      showCustomDialog(`Không thể xem trước ảnh phiên bản: ${error.message}`);
    } finally {
      e.target.value = '';
    }
  };

  /**
   * Lưu Sản phẩm & Toàn bộ Ma trận Biến thể
   */
  window.handleSaveProductMatrix = (e) => {
    e.preventDefault();

    try {
      const name = document.getElementById('formProdName').value.trim();
      const cat = document.getElementById('formProdCat').value;
      const brand = document.getElementById('formProdBrand').value;
      const desc = document.getElementById('formProdDesc').value.trim();

      const getVal = (id) => {
        const el = document.getElementById(id);
        return el ? el.value.trim() : '';
      };

      const screen = getVal('formSpecScreen');
      const chip = getVal('formSpecChip');
      const camera = getVal('formSpecCamera');
      const battery = getVal('formSpecBattery');
      const connectivity = getVal('formSpecConnectivity');
      const anc = getVal('formSpecAnc');
      const bluetooth = getVal('formSpecBluetooth');
      const port = getVal('formSpecPort');
      const waterproof = getVal('formSpecWaterproof');
      const caseSize = getVal('formSpecCaseSize') || screen;
      const sensors = getVal('formSpecSensors');
      const power = getVal('formSpecPower');
      const cableLength = getVal('formSpecCableLength');
      const standard = getVal('formSpecStandard');

      // Validation đầu vào
      if (!name) {
        showCustomDialog('Vui lòng nhập tên sản phẩm!');
        return;
      }
      if (formVariants.length === 0) {
        showCustomDialog('Sản phẩm bắt buộc phải có ít nhất 1 phiên bản!');
        return;
      }

      // Kiểm tra tính hợp lệ của từng biến thể theo đặc thù từng danh mục
      for (let i = 0; i < formVariants.length; i++) {
        const v = formVariants[i];
        if (cat === 'Điện thoại' || cat === 'Máy tính bảng') {
          if (!v.color || !v.ram || !v.rom) {
            showCustomDialog(`Biến thể dòng ${i + 1} chưa điền đủ Màu sắc / RAM / ROM!`, 'Thiếu thông tin biến thể', 'warning');
            return;
          }
        } else if (cat === 'Đồng hồ thông minh') {
          if (!v.color) {
            showCustomDialog(`Biến thể dòng ${i + 1} chưa điền Màu sắc!`, 'Thiếu thông tin biến thể', 'warning');
            return;
          }
        } else {
          // Tai nghe, Phụ kiện
          if (!v.color) {
            showCustomDialog(`Biến thể dòng ${i + 1} chưa điền Màu sắc / Phân loại!`, 'Thiếu thông tin biến thể', 'warning');
            return;
          }
        }
      }

      const saveMatrix = async () => {
        if (isSavingProductForm) return;
        isSavingProductForm = true;
        try {
        const currentProd = editingProductId !== null ? products.find(p => p.id === editingProductId) : null;
        const obsoleteImageIds = new Set(removedVariantImageIds);
        const retainedImageSources = new Set(formVariants
          .filter(variant => !formVariantImageDrafts.has(variant))
          .map(variant => {
            const sourceId = formVariantImageSources.get(variant);
            return sourceId === variant.sku ? sourceId : null;
          })
          .filter(Boolean));

        if (formProductImageDraft) {
          await saveImageToIndexedDB(formProductCode, formProductImageDraft);
        }

        for (const variant of formVariants) {
          const sourceId = formVariantImageSources.get(variant);
          const imageDraft = formVariantImageDrafts.get(variant);
          if (imageDraft) {
            await saveImageToIndexedDB(variant.sku, imageDraft.file);
            if (sourceId && sourceId !== variant.sku) obsoleteImageIds.add(sourceId);
          } else if (sourceId && sourceId !== variant.sku && await hasImageInIndexedDB(sourceId)) {
            await copyImageInIndexedDB(sourceId, variant.sku);
            obsoleteImageIds.add(sourceId);
          }
        }

        retainedImageSources.forEach(imageId => obsoleteImageIds.delete(imageId));
        // Giu nguyen gia von va gia ban hien co neu dang sua, hoac lay gia tri mac dinh
        const validFormPrices = formVariants.map(v => Number(v.price) || 0).filter(p => p > 0);
        const basePrice = validFormPrices.length > 0 ? Math.min(...validFormPrices) : (currentProd ? (currentProd.basePrice || currentProd.price || 0) : 0);
        const validFormCosts = formVariants.map(v => Number(v.cost) || 0).filter(c => c > 0);
        const minCost = validFormCosts.length > 0 ? Math.min(...validFormCosts) : (currentProd ? (currentProd.cost || 0) : 0);
        const totalStock = formVariants.reduce((s, v) => s + (Number(v.stock) || 0), 0);

        const specData = {
          screen: screen || (currentProd ? currentProd.screen : ''),
          chip: chip || (currentProd ? currentProd.chip : ''),
          camera: camera || (currentProd ? currentProd.camera : ''),
          battery: battery || (currentProd ? currentProd.battery : ''),
          connectivity: connectivity || (currentProd ? currentProd.connectivity : ''),
          anc: anc || (currentProd ? currentProd.anc : ''),
          bluetooth: bluetooth || (currentProd ? currentProd.bluetooth : ''),
          port: port || (currentProd ? currentProd.port : ''),
          waterproof: waterproof || (currentProd ? currentProd.waterproof : ''),
          caseSize: caseSize || (currentProd ? currentProd.caseSize : ''),
          sensors: sensors || (currentProd ? currentProd.sensors : ''),
          power: power || (currentProd ? currentProd.power : ''),
          cableLength: cableLength || (currentProd ? currentProd.cableLength : ''),
          standard: standard || (currentProd ? currentProd.standard : '')
        };

        if (editingProductId !== null) {
          // Cập nhật sản phẩm hiện có
          products = products.map(p => {
            if (p.id === editingProductId) {
              return {
                ...p,
                name,
                category: cat,
                brand,
                description: desc,
                ...specData,
                image: formImagePath || p.image || `assets/img/${p.code}.png`,
                basePrice,
                price: basePrice,
                cost: minCost,
                stock: totalStock,
                variants: formVariants.map(variant => {
                  const previous = p.variants.find(item => item.sku === variant.sku);
                  const sold = previous ? Number(previous.sold) || 0 : 0;
                  return {
                    ...variant,
                    image: variant.image || (previous && previous.image) || '',
                    sold,
                    imported: (Number(variant.stock) || 0) + sold
                  };
                })
              };
            }
            return p;
          });
          showToast('Đã cập nhật sản phẩm & biến thể thành công!');
        } else {
          // Thêm sản phẩm mới
          const nextId = generateNextProductId();
          const nextCode = generateNextProductCode();
          const newProduct = {
            id: nextId,
            code: formProductCode || nextCode,
            name,
            category: cat,
            brand,
            description: desc,
            ...specData,
            image: formImagePath || `assets/img/${formProductCode || nextCode}.png`,
            createdAt: new Date().toISOString().split('T')[0],
            isDeleted: false,
            isVisible: true,
            attributes: cat === 'Tai nghe' || cat === 'Phụ kiện' ? ['Màu sắc'] : (cat === 'Đồng hồ thông minh' ? ['Màu sắc', 'ROM'] : ['Màu sắc', 'RAM', 'ROM']),
            rating: 5.0,
            isNew: true,
            imported: 0,
            sold: 0,
            basePrice,
            price: basePrice,
            cost: minCost,
            stock: totalStock, // Mặc định là 0 nếu mới tạo
            variants: formVariants
          };

          // TASK 3: Thêm vào cuối danh sách (sắp xếp tăng dần theo ID)
          products.push(newProduct);
          showToast(`Đã tạo mới sản phẩm ${newProduct.code} thành công!`);
        }

        saveProducts(products);
        for (const imageId of obsoleteImageIds) {
          try {
            await deleteImageFromIndexedDB(imageId);
          } catch (error) {
            console.error(`[TechnoStore] Không thể xóa ảnh phiên bản "${imageId}":`, error);
            showCustomDialog(`Sản phẩm đã được lưu nhưng không thể dọn ảnh phiên bản cũ: ${error.message}`);
          }
        }
        clearFormImageDrafts();
        showProductForm = false;
        render();
        } catch (error) {
          console.error('Lỗi lưu sản phẩm hoặc ảnh:', error);
          showCustomDialog(`Không thể lưu sản phẩm: ${error.message}`);
          isSavingProductForm = false;
        }
      };

      // Chỉ cảnh báo nếu có gán giá bán > 0 nhưng thấp hơn giá vốn
      const lowPriceVar = formVariants.find(v => Number(v.price) > 0 && Number(v.cost) > 0 && Number(v.price) < Number(v.cost));
      if (lowPriceVar) {
        showCustomDialog(
          `Biến thể (${lowPriceVar.sku}): Giá bán (${vnd(lowPriceVar.price)}) thấp hơn Giá vốn (${vnd(lowPriceVar.cost)}). Bạn có chắc chắn muốn lưu?`,
          'Cảnh báo giá bán',
          'warning',
          () => saveMatrix()
        );
        return;
      }

      saveMatrix();
    } catch (err) {
      console.error('Lỗi lưu sản phẩm:', err);
      showCustomDialog('Đã xảy ra lỗi khi lưu sản phẩm: ' + err.message);
    }
  };

  /**
   * XÓA MỀM SẢN PHẨM (SOFT DELETE)
   * Nghiệp vụ: Đổi isDeleted = true, bảo toàn mã ID, phiếu nhập và lịch sử mua hàng
   */
  window.handleDeleteProduct = (id) => {
    const p = products.find(x => x.id === id);
    if (!p) return;

    showCustomDialog(
      `Bạn có chắc muốn xoá sản phẩm "${p.name}" (${p.code}) không?<br><span style="font-size:12px; color:var(--color-ink-3);">(Áp dụng xóa mềm bảo toàn lịch sử đơn hàng và phiếu nhập)</span>`,
      'Xác nhận xoá sản phẩm',
      'warning',
      () => {
        products = products.map(item => item.id === id ? { ...item, isDeleted: true } : item);
        saveProducts(products);
        showToast(`Đã xoá mềm sản phẩm ${p.code} thành công!`);
        render();
      }
    );
  };

  // --------------------------------------------------------------------------
  // NGHIỆP VỤ NHẬP HÀNG & CỘNG DỒN TỒN KHO THỰC TẾ
  // --------------------------------------------------------------------------
  window.openReceiptModal = () => {
    receiptModalItems = [];
    showReceiptModal = true;
    render();
  };

  window.closeReceiptModal = () => {
    showReceiptModal = false;
    receiptModalItems = [];
    render();
  };

  window.handleAddVariantToReceipt = () => {
    const sel = document.getElementById('receiptVariantSelect');
    if (!sel) return;
    const sku = sel.value;
    const found = findVariantBySku(sku);
    if (!found) return;

    // Kiểm tra xem đã có trong danh sách nhập chưa
    const existing = receiptModalItems.find(i => i.sku === sku);
    if (existing) {
      showToast(`Mặt hàng (SKU: ${sku}) đã có trong danh sách nhập kho!`);
      return;
    }

    // Yêu cầu: Bắt buộc khởi tạo ô Giá nhập và Số lượng là chuỗi rỗng ("") để Admin gõ tay
    receiptModalItems.push({
      sku: sku,
      productId: found.product.id,
      name: `${found.product.name} (${found.variant.color} · ${found.variant.ram}/${found.variant.rom})`,
      cost: '',
      qty: ''
    });

    render();
  };
  window.handleAddReceiptItem = window.handleAddVariantToReceipt; // Alias tương thích nghiệp vụ

  window.handleReceiptItemChange = (idx, field, val) => {
    if (!receiptModalItems[idx]) return;
    receiptModalItems[idx][field] = val;

    // Cập nhật DOM trực tiếp để tránh giật lag và không bị mất focus input khi gõ phím
    const cost = Number(receiptModalItems[idx].cost) || 0;
    const qty = Number(receiptModalItems[idx].qty) || 0;
    const rowEl = document.getElementById(`receiptItemRow_${idx}`);
    if (rowEl) {
      const lineTotalEl = rowEl.querySelector('.receipt-line-total');
      if (lineTotalEl) lineTotalEl.textContent = vnd(cost * qty);
    }

    const totalQty = receiptModalItems.reduce((s, i) => s + (Number(i.qty) || 0), 0);
    const totalAmount = receiptModalItems.reduce((s, i) => s + ((Number(i.cost) || 0) * (Number(i.qty) || 0)), 0);

    const qtyEl = document.getElementById('receiptTotalQty');
    if (qtyEl) qtyEl.textContent = `${totalQty} sản phẩm`;
    const amtEl = document.getElementById('receiptTotalAmount');
    if (amtEl) amtEl.textContent = vnd(totalAmount);

    const isValid = receiptModalItems.length > 0 && receiptModalItems.every(i => {
      const c = Number(i.cost);
      const q = Number(i.qty);
      return !isNaN(c) && c > 0 && !isNaN(q) && q > 0;
    });

    const finishBtn = document.getElementById('finishReceiptBtn');
    if (finishBtn) {
      finishBtn.disabled = !isValid;
      finishBtn.style.opacity = isValid ? '1' : '0.5';
      finishBtn.style.cursor = isValid ? 'pointer' : 'not-allowed';
    }
  };

  window.handleRemoveReceiptLine = (idx) => {
    receiptModalItems.splice(idx, 1);
    render();
  };

  /**
   * HOÀN TẤT PHIẾU NHẬP HÀNG
   * Nghiệp vụ: Bắt buộc các ô Giá nhập và Số lượng > 0 mới cho phép hoàn tất, cộng dồn stock
   */
  window.handleFinishReceipt = () => {
    if (receiptModalItems.length === 0) {
      showCustomDialog('Vui lòng thêm ít nhất 1 mặt hàng vào phiếu nhập!');
      return;
    }

    const isValid = receiptModalItems.every(i => {
      const c = Number(i.cost);
      const q = Number(i.qty);
      return !isNaN(c) && c > 0 && !isNaN(q) && q > 0;
    });

    if (!isValid) {
      showCustomDialog('Vui lòng điền đầy đủ số liệu hợp lệ (> 0) cho Giá nhập và Số lượng của tất cả mặt hàng!');
      return;
    }

    const dateInput = document.getElementById('receiptDateInput');
    const receiptDateValue = dateInput ? parseAdminDateInput(dateInput.value) : null;
    if (!receiptDateValue) {
      if (dateInput) {
        dateInput.setCustomValidity('Vui lòng nhập ngày hợp lệ theo định dạng dd/mm/yyyy.');
        dateInput.reportValidity();
      }
      return;
    }
    const receiptId = generateNextReceiptId();
    const receiptDate = formatAdminDate(receiptDateValue);

    let totalQty = 0;
    let totalAmount = 0;

    // 1. Tính tổng số lượng và thành tiền (KHÔNG cộng dồn kho khi chưa duyệt)
    receiptModalItems.forEach(line => {
      const q = Number(line.qty) || 0;
      const c = Number(line.cost) || 0;
      totalQty += q;
      totalAmount += (q * c);
    });

    // 2. Tạo bản ghi Phiếu Nhập Hàng mới với trạng thái "Chờ duyệt"
    const newReceipt = {
      id: receiptId,
      date: receiptDate,
      lines: receiptModalItems.length,
      qty: totalQty,
      total: totalAmount,
      status: 'Chờ duyệt',
      items: receiptModalItems
    };

    receipts.push(newReceipt);
    saveReceipts(receipts);

    showReceiptModal = false;
    receiptModalItems = [];
    showToast(`Đã tạo phiếu nhập ${receiptId} (Trạng thái: Chờ duyệt).`);
    render();
  };

  // Xem chi tiết Phiếu Nhập Hàng bằng Popup Modal (Thay thế alert)
  window.viewReceiptDetail = (id) => {
    selectedReceiptModal = receipts.find(x => x.id === id) || null;
    render();
  };
  window.handleViewReceiptDetail = window.viewReceiptDetail; // Giữ alias tương thích

  window.closeReceiptDetailModal = () => {
    selectedReceiptModal = null;
    render();
  };

  // --------------------------------------------------------------------------
  // NGHIỆP VỤ GIÁ BÁN SKU & TỶ LỆ LỢI NHUẬN (ACCORDION PRICING)
  // --------------------------------------------------------------------------
  window.togglePricingAccordion = (prodId) => {
    // Nếu accordion chưa mở, mở ra ở chế độ Xem (không set editingPricingId)
    expandedPricing[prodId] = !expandedPricing[prodId];
    // Khi đóng accordion, cũng thoát chế độ chỉnh sửa
    if (!expandedPricing[prodId] && editingPricingId === prodId) {
      editingPricingId = null;
    }
    render();
  };

  window.togglePricingEditMode = (prodId) => {
    if (editingPricingId === prodId) {
      // Thoát chế độ chỉnh sửa
      editingPricingId = null;
    } else {
      // Vào chế độ chỉnh sửa: đảm bảo accordion được mở
      editingPricingId = prodId;
      expandedPricing[prodId] = true;
    }
    render();
  };

  window.handleSkuMarginInput = (sku, marginVal) => {
    const m = Number(marginVal);
    const found = findVariantBySku(sku);
    if (!found) return;
    const cost = Number(found.variant.cost) || 0;
    const newPrice = cost > 0 ? Math.round(cost * (1 + m / 100)) : (found.variant.price || 0);

    if (!skuPricingDraft[sku]) {
      skuPricingDraft[sku] = { ...found.variant };
    }
    skuPricingDraft[sku].margin = m;
    skuPricingDraft[sku].price = newPrice;

    // Cập nhật DOM trực tiếp để không mất focus ô input
    const row = document.getElementById(`skuPricingRow_${sku}`);
    if (row) {
      const priceInput = row.querySelector('.sku-price-input');
      if (priceInput) priceInput.value = newPrice.toLocaleString('vi-VN');
      const profitEl = row.querySelector('.sku-profit-text');
      if (profitEl) {
        const profit = newPrice - cost;
        profitEl.textContent = (profit >= 0 ? '+' : '') + vnd(profit);
      }
    }
  };

  window.handleSkuPriceInput = (sku, priceVal) => {
    const found = findVariantBySku(sku);
    if (!found) return;
    const row = document.getElementById(`skuPricingRow_${sku}`);
    const priceInput = row ? row.querySelector('.sku-price-input') : null;
    const digitsBeforeCursor = priceInput
      ? priceInput.value.slice(0, priceInput.selectionStart).replace(/\D/g, '').length
      : 0;
    const digits = String(priceVal).replace(/\D/g, '');
    const p = Number(digits) || 0;
    const cost = Number(found.variant.cost) || 0;
    const newMargin = cost > 0 ? Math.round(((p - cost) / cost) * 100) : 0;

    if (!skuPricingDraft[sku]) {
      skuPricingDraft[sku] = { ...found.variant };
    }
    skuPricingDraft[sku].price = p;
    skuPricingDraft[sku].margin = newMargin;
    // Cập nhật DOM trực tiếp
    if (row) {
      const priceField = row.querySelector('.sku-price-input');
      if (priceField) {
        priceField.value = digits ? p.toLocaleString('vi-VN') : '';
        let caretPosition = 0;
        let countedDigits = 0;
        while (caretPosition < priceField.value.length && countedDigits < digitsBeforeCursor) {
          if (/\d/.test(priceField.value[caretPosition])) countedDigits++;
          caretPosition++;
        }
        priceField.setSelectionRange(caretPosition, caretPosition);
      }
      const marginInput = row.querySelector('.sku-margin-input');
      if (marginInput) marginInput.value = newMargin;
      const profitEl = row.querySelector('.sku-profit-text');
      if (profitEl) {
        const profit = p - cost;
        profitEl.textContent = (profit >= 0 ? '+' : '') + vnd(profit);
      }
    }
  };


  window.handleSavePricingForProduct = (prodId) => {
    const p = products.find(x => x.id === prodId);
    if (!p || !p.variants) return;
    let updatedCount = 0;
    p.variants.forEach(v => {
      if (skuPricingDraft[v.sku] && skuPricingDraft[v.sku].price !== undefined) {
        const newPrice = Number(skuPricingDraft[v.sku].price);
        if (!isNaN(newPrice) && newPrice > 0) {
          v.price = newPrice;
          updatedCount++;
        }
      }
    });
    const validPrices = p.variants.map(v => v.price).filter(pr => pr > 0);
    if (validPrices.length > 0) {
      p.basePrice = Math.min(...validPrices);
      p.price = p.basePrice;
    }
    saveProducts(products);
    products = getProducts();
    editingPricingId = null;
    expandedPricing[prodId] = true;
    showToast(`Đã lưu bảng giá “${p.name}” thành công (${updatedCount} SKU)!`);
    render();
  };

  // --------------------------------------------------------------------------
  // NGHIỆP VỤ ĐƠN HÀNG (ORDERS)
  // --------------------------------------------------------------------------
  window.handleFilterOrderStatus = (st) => {
    orderStatusFilter = st;
    currentPageByTab.orders = 1;
    render();
  };

  window.handleChangeOrderStatus = (id, newStatus) => {
    const targetOrder = orders.find(o => o.id === id);
    if (!targetOrder) return;

    const oldStatus = targetOrder.status;
    if (newStatus === oldStatus) return;
    const wasCancelled = oldStatus === 'Đã huỷ' || oldStatus === 'Đã hủy';
    const willBeCancelled = newStatus === 'Đã huỷ' || newStatus === 'Đã hủy';

    if (willBeCancelled && !wasCancelled) {
      const inventoryResult = applyOrderInventory(targetOrder.items || [], -1);
      if (!inventoryResult.success) {
        showCustomDialog(inventoryResult.message, 'Không thể hủy đơn', 'error');
        render();
        return;
      }
      showToast(`Đã hủy đơn #${id}, hoàn trả tồn kho và cập nhật lượt bán!`);
    } else if (wasCancelled && !willBeCancelled) {
      const inventoryResult = applyOrderInventory(targetOrder.items || [], 1, false);
      if (!inventoryResult.success) {
        showCustomDialog(inventoryResult.message, 'Không thể khôi phục đơn', 'error');
        render();
        return;
      }
      showToast(`Đã phục hồi đơn #${id}, trừ tồn kho và cập nhật lượt bán!`);
    }

    targetOrder.status = newStatus;
    if (newStatus === 'Đã giao' && oldStatus !== 'Đã giao') {
      targetOrder.receivedDate = formatCurrentDate();
    } else if (newStatus !== 'Đã giao') {
      delete targetOrder.receivedDate;
    }
    saveOrders(orders);
    // Đồng bộ số đơn đã lưu của khách khi trạng thái đơn hàng thay đổi.
    if (typeof syncCustomerOrderCounts === 'function') {
      customers = syncCustomerOrderCounts(orders);
    }

    selectedOrderModal = orders.find(order => order.id === id) || null;
    products = getProducts();
    render();
  };

  window.handleViewOrderDetail = (id) => {
    selectedOrderModal = orders.find(o => o.id === id) || null;
    render();
  };

  window.closeOrderModal = () => {
    selectedOrderModal = null;
    render();
  };

  // --------------------------------------------------------------------------
  // CÁC HÀM DANH MỤC & KHÁCH HÀNG
  // --------------------------------------------------------------------------
  window.handleAddCategory = () => {
    editingCategory = null;
    showCategoryModal = true;
    render();
  };

  window.handleEditCategory = (name) => {
    editingCategory = name;
    showCategoryModal = true;
    render();
  };

  window.closeCategoryModal = () => {
    showCategoryModal = false;
    render();
  };

  window.saveCategoryModal = () => {
    const nameInput = document.getElementById('catNameInput');
    const typeSelect = document.getElementById('catTypeSelect');
    const statusSelect = document.getElementById('catStatusSelect');
    const val = nameInput ? nameInput.value.trim() : '';
    const typeVal = typeSelect ? typeSelect.value : 'Thiết bị chính';
    const statusVal = statusSelect ? statusSelect.value : 'active';

    if (!val) {
      showCustomDialog('Vui lòng nhập tên danh mục!', 'Thiếu thông tin', 'warning');
      return;
    }

    categories = getCategories();
    const catNames = categories.map(c => typeof c === 'string' ? c : c.name);

    if (editingCategory) {
      // Cập nhật danh mục đang chỉnh sửa
      categories = categories.map((c, i) => {
        const cName = typeof c === 'string' ? c : c.name;
        if (cName === editingCategory) {
          return {
            id: (typeof c === 'object' && c.id) ? c.id : `DM0${i + 1}`,
            name: val,
            type: typeVal,
            status: statusVal
          };
        }
        return typeof c === 'string' ? { id: `DM0${i + 1}`, name: c, type: i < 2 ? 'Thiết bị chính' : 'Phụ kiện & Đeo', status: 'active' } : c;
      });

      // Nếu đổi tên danh mục -> Đồng bộ cập nhật trường category của toàn bộ sản phẩm thuộc danh mục cũ
      if (val !== editingCategory) {
        products = products.map(p => {
          if (p.category === editingCategory) {
            return { ...p, category: val };
          }
          return p;
        });
        saveProducts(products);
      }

      saveCategories(categories);
      showToast('Đã cập nhật danh mục thành công!');
    } else {
      // Thêm danh mục mới
      if (catNames.includes(val)) {
        showCustomDialog(`Danh mục "${val}" đã tồn tại trong hệ thống!`, 'Trùng tên danh mục', 'warning');
        return;
      }
      const nextId = `DM0${categories.length + 1}`;
      categories.push({
        id: nextId,
        name: val,
        type: typeVal,
        status: statusVal
      });
      saveCategories(categories);
      showToast('Đã thêm danh mục mới thành công!');
    }

    showCategoryModal = false;
    editingCategory = null;
    render();
  };

  window.handleDeleteCategory = (name) => {
    // Bảo vệ toàn vẹn dữ liệu: Đếm số lượng sản phẩm đang hoạt động thuộc danh mục chuẩn bị xóa
    const count = products.filter(p => !p.isDeleted && p.category === name).length;
    if (count > 0) {
      showCustomDialog(`Không thể xoá danh mục "${name}" vì đang có ${count} sản phẩm thuộc danh mục này! Vui lòng chuyển danh mục sản phẩm trước hoặc chọn Ẩn / Tạm khóa.`, 'Không thể xoá danh mục', 'warning');
      return;
    }

    showCustomDialog(
      `Bạn có chắc muốn xoá danh mục "${name}" này không?`,
      'Xác nhận xoá danh mục',
      'warning',
      () => {
        categories = categories.filter(c => (typeof c === 'string' ? c : c.name) !== name);
        saveCategories(categories);
        showToast(`Đã xoá danh mục "${name}"`);
        render();
      }
    );
  };

  window.handleToggleLockUser = (id) => {
    customers = customers.map(c => c.id === id ? { ...c, locked: !c.locked } : c);
    saveCustomers(customers);
    render();
  };

  window.handleResetUserPass = (idOrName, maybeName) => {
    const id = maybeName ? idOrName : null;
    const name = maybeName || idOrName;
    customers = customers.map(c => {
      if ((id && c.id === id) || (c.name === name)) {
        return { ...c, password: '123456' };
      }
      return c;
    });
    saveCustomers(customers);
    userMessage = `Đã reset mật khẩu cho tài khoản "${name}". Mật khẩu tạm thời: 123456`;
    render();
  };

  window.clearUserMsg = () => {
    userMessage = '';
    render();
  };

  window.toggleStockLowOnly = (checked) => {
    stockOnlyLow = checked;
    currentPageByTab.stock = 1;
    render();
  };

  window.handleStockSearch = (query) => {
    stockSearchQuery = query;
    currentPageByTab.stock = 1;
    refreshAdminTable('stock', getFilteredStockList(), 'stockTableBody', generateStockRows, 'sản phẩm');
  };

  window.handleStockThreshold = (value) => {
    const threshold = Number(value);
    if (!Number.isInteger(threshold) || threshold < 0) {
      showCustomDialog('Mức cảnh báo phải là số nguyên không âm.', 'Giá trị không hợp lệ', 'warning');
      render();
      return;
    }
    stockWarningThreshold = threshold;
    currentPageByTab.stock = 1;
    render();
  };

  window.handleStockDateFilter = (range, value) => {
    if (range === 'from') stockDateFrom = value;
    if (range === 'to') stockDateTo = value;
    currentPageByTab.stock = 1;
    render();
  };

  window.toggleStockAccordion = (productId) => {
    expandedStock[productId] = !expandedStock[productId];
    render();
  };


  // --------------------------------------------------------------------------
  // CÁC HÀM XỬ LÝ KHÁCH HÀNG, PHIẾU NHẬP & GIÁ BÁN BỔ SUNG
  // --------------------------------------------------------------------------
  window.handleCustomerDblClick = (id) => {
    selectedUserModal = customers.find(c => String(c.id) === String(id)) || null;
    render();
  };

  window.closeCustomerModal = () => {
    selectedUserModal = null;
    render();
  };

  window.openEditReceiptModal = (id) => {
    const r = receipts.find(x => x.id === id);
    if (!r || r.status !== 'Chờ duyệt') return;
    editingReceiptId = id;
    editingReceiptItems = JSON.parse(JSON.stringify(r.items || []));
    render();
  };

  window.closeEditReceiptModal = () => {
    editingReceiptId = null;
    editingReceiptItems = [];
    render();
  };

  window.handleEditReceiptItemChange = (idx, field, val) => {
    if (!editingReceiptItems[idx]) return;
    editingReceiptItems[idx][field] = val;
    const c = Number(editingReceiptItems[idx].cost) || 0;
    const q = Number(editingReceiptItems[idx].qty) || 0;
    const rowEl = document.getElementById(`editReceiptRow_${idx}`);
    if (rowEl) {
      const lineTotalEl = rowEl.querySelector('.edit-receipt-line-total');
      if (lineTotalEl) lineTotalEl.textContent = vnd(c * q);
    }
    const totalQty = editingReceiptItems.reduce((s, i) => s + (Number(i.qty) || 0), 0);
    const totalAmount = editingReceiptItems.reduce((s, i) => s + ((Number(i.cost) || 0) * (Number(i.qty) || 0)), 0);
    const qtyEl = document.getElementById('editReceiptTotalQty');
    if (qtyEl) qtyEl.textContent = totalQty;
    const amtEl = document.getElementById('editReceiptTotalAmount');
    if (amtEl) amtEl.textContent = vnd(totalAmount);
  };

  window.handleSaveEditReceipt = () => {
    const r = receipts.find(x => x.id === editingReceiptId);
    if (!r) return;
    const isValid = editingReceiptItems.length > 0 && editingReceiptItems.every(i => {
      const c = Number(i.cost);
      const q = Number(i.qty);
      return !isNaN(c) && c > 0 && !isNaN(q) && q > 0;
    });
    if (!isValid) {
      showCustomDialog('Vui lòng nhập giá nhập và số lượng hợp lệ (> 0) cho tất cả các dòng!', 'Thiếu thông tin', 'warning');
      return;
    }
    r.items = editingReceiptItems.map(i => ({
      ...i,
      cost: Number(i.cost),
      qty: Number(i.qty)
    }));
    r.lines = r.items.length;
    r.qty = r.items.reduce((s, i) => s + i.qty, 0);
    r.total = r.items.reduce((s, i) => s + (i.cost * i.qty), 0);
    saveReceipts(receipts);
    editingReceiptId = null;
    editingReceiptItems = [];
    showToast(`Đã lưu thay đổi cho phiếu nhập ${r.id}!`);
    render();
  };

  window.handleApproveReceipt = (id) => {
    const r = receipts.find(x => x.id === id);
    if (!r || r.status !== 'Chờ duyệt') return;
    showCustomDialog(
      `Bạn có chắc chắn muốn duyệt phiếu nhập "${r.id}" và CỘNG DỒN ${r.qty} sản phẩm vào tồn kho thực tế?`,
      'Xác nhận duyệt phiếu nhập',
      'warning',
      () => {
        // CỘNG DỒN SỐ LƯỢNG VÀO TỒN KHO THỰC TẾ
        (r.items || []).forEach(line => {
          const q = Number(line.qty) || 0;
          const c = Number(line.cost) || 0;
          products.forEach(p => {
            if (p.variants) {
              const targetVariant = p.variants.find(v => v.sku === line.sku);
              if (targetVariant) {
                targetVariant.stock = (targetVariant.stock || 0) + q;
                targetVariant.imported = (targetVariant.imported || 0) + q;
                if (c > 0) targetVariant.cost = c;
                p.imported = (p.imported || 0) + q;
                p.stock = p.variants.reduce((sum, v) => sum + (v.stock || 0), 0);
              }
            }
          });
        });
        saveProducts(products);
        products = getProducts();
        r.status = 'Hoàn thành';
        saveReceipts(receipts);
        showToast(`Đã duyệt thành công phiếu nhập ${r.id} và cộng dồn ${r.qty} sản phẩm vào kho!`);
        render();
      }
    );
  };

  window.handlePricingSearch = (val) => {
    pricingSearchQuery = val;
    currentPageByTab.pricing = 1;
    refreshAdminTable('pricing', getPricingList(), 'pricingTableBody', generatePricingRows, 'sản phẩm');
  };

  window.handlePricingCategoryFilter = (val) => {
    pricingCategoryFilter = val;
    currentPageByTab.pricing = 1;
    render();
  };

  // Khởi chạy render đầu tiên
  render();
}
