const STORE_PAGE_PATHS = Object.freeze({
  home: 'index.html',
  detail: 'detail.html',
  cart: 'checkout.html',
  checkout: 'checkout.html',
  history: 'checkout.html',
  profile: 'checkout.html',
  login: 'checkout.html',
  register: 'checkout.html',
  admin: 'admin.html'
});

function getStorePageUrl(page = 'home', params = {}) {
  const requestedPage = String(page || 'home');
  const aliases = { orders: 'history', auth: 'login' };
  const pageKey = aliases[requestedPage] || requestedPage;
  const path = STORE_PAGE_PATHS[pageKey] || STORE_PAGE_PATHS.home;
  const query = new URLSearchParams();

  if (['cart', 'checkout', 'history', 'profile', 'login', 'register'].includes(pageKey)) {
    query.set('page', pageKey);
  }
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== '') {
      query.set(key, String(value));
    }
  });

  const queryString = query.toString();
  return queryString ? `${path}?${queryString}` : path;
}

function getProductImageUrl(imagePath) {
  const image = String(imagePath || '').trim();
  if (!image) return '';
  if (/^(?:https?:|data:|blob:|file:)/i.test(image)) return image;

  const componentsScript = Array.from(document.scripts).find(script =>
    script.src && script.src.includes('/js/components.js')
  );
  const appRoot = componentsScript
    ? componentsScript.src.slice(0, componentsScript.src.lastIndexOf('/js/components.js') + 1)
    : document.baseURI;
  return new URL(image.replace(/^\/+/, ''), appRoot).href;
}

function renderProductImage(product, frameStyle = '', imageId = null, fallbackPath = null) {
  if (!product) return '';
  const imagePath = fallbackPath || product.image || product.img || `assets/img/${product.code || 'SP000'}.png`;
  const imageUrl = getProductImageUrl(imagePath);
  const storageId = imageId || product.imageId || product.code;
  return `
    <span class="product-image-frame" style="${frameStyle}">
      <img src="${imageUrl}" data-fallback-src="${imageUrl}" data-image-id="${storageId || ''}" alt="${product.name || ''}" onerror="this.hidden=true;this.nextElementSibling.hidden=false" />
      <span class="product-image-placeholder" hidden aria-hidden="true">▧</span>
    </span>
  `;
}

function hydrateProductImages(root = document) {
  const images = [];
  if (root instanceof HTMLImageElement && root.dataset.imageId) images.push(root);
  if (root.querySelectorAll) {
    images.push(...root.querySelectorAll('img[data-image-id]:not([data-image-hydrated])'));
  }

  images.forEach(async image => {
    image.dataset.imageHydrated = 'true';
    const imageId = image.dataset.imageId;
    const fallbackUrl = image.dataset.fallbackSrc || image.src;
    try {
      const storedImageUrl = await getImageFromIndexedDB(imageId);
      if (image.isConnected && image.dataset.imageId === imageId && storedImageUrl) {
        image.src = storedImageUrl;
        image.hidden = false;
        if (image.nextElementSibling) image.nextElementSibling.hidden = true;
      } else if (image.isConnected && image.dataset.imageId === imageId && image.src !== fallbackUrl) {
        image.src = fallbackUrl;
      }
    } catch (error) {
      console.error(`[TechnoStore] Không thể tải ảnh "${imageId}" từ IndexedDB:`, error);
      if (image.isConnected && image.dataset.imageId === imageId && image.src !== fallbackUrl) {
        image.src = fallbackUrl;
      }
    }
  });
}

function refreshProductImage(image) {
  if (!image) return;
  delete image.dataset.imageHydrated;
  hydrateProductImages(image);
}

function refreshProductImagesById(imageId) {
  document.querySelectorAll('img[data-image-id]').forEach(image => {
    if (image.dataset.imageId === imageId) refreshProductImage(image);
  });
}

window.hydrateProductImages = hydrateProductImages;
window.refreshProductImage = refreshProductImage;
window.refreshProductImagesById = refreshProductImagesById;

if (typeof MutationObserver !== 'undefined' && document.documentElement) {
  const productImageObserver = new MutationObserver(records => {
    records.forEach(record => {
      record.addedNodes.forEach(node => {
        if (node.nodeType === Node.ELEMENT_NODE) hydrateProductImages(node);
      });
    });
  });
  productImageObserver.observe(document.documentElement, { childList: true, subtree: true });
}

/**
 * Hiển thị phần đầu trang cửa hàng.
 * @param {Object} options - Các tùy chọn { basePath, activePage, query }
 */
function renderStoreHeader(containerId, options = {}) {
  const container = document.getElementById(containerId);
  if (!container) return;

  const basePath = options.basePath || '';
  const iconPath = `${basePath}assets/icon/`;
  const homeUrl = getStorePageUrl('home');

  const user = getCurrentUser();
  const customer = user && typeof getCustomers === 'function' ? getCustomers().find(item => String(item.id) === String(user.id)) : null;
  const escapeHeader = value => String(value ?? '').replace(/[&<>"']/g, char => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[char]));
  const activeCategories = typeof getActiveCategories === 'function'
    ? getActiveCategories()
    : ['Điện thoại', 'Máy tính bảng', 'Tai nghe', 'Đồng hồ thông minh', 'Phụ kiện'];
  const accountName = (customer && customer.name) || (user && (user.name || user.fullName || user.username)) || 'Tài khoản';
  const initials = String(accountName).trim().split(/\s+/).filter(Boolean).slice(-2).map(part => part[0].toUpperCase()).join('') || 'KH';
  const avatar = customer && /^data:image\/(png|jpeg|webp);base64,/i.test(customer.avatar || '') ? customer.avatar : '';
  const accountAvatar = avatar
    ? `<img src="${escapeHeader(avatar)}" alt="" />`
    : escapeHeader(initials);
  const cartCount = getCartCount();
  const q = options.query || '';

  container.innerHTML = `
    <header class="store-header">
      <div class="header-container">
        <button type="button" class="mobile-menu-toggle" aria-label="Mở menu" aria-expanded="false" aria-controls="storeMobileMenu">
          <img src="${iconPath}menu.svg" class="icon" alt="" />
        </button>

        <!-- Logo cửa hàng -->
        <a href="${homeUrl}" class="brand-logo">
          <img src="${iconPath}dien-thoai.svg" class="icon icon-32" alt="TechnoStore Logo" />
          Techno<span class="brand-accent">Store</span>
        </a>

        <!-- Liên kết điều hướng chính (tự động lọc các danh mục đang hoạt động) -->
        <nav class="store-nav">
          ${activeCategories.slice(0, 4)
      .map(c => `
              <a href="${homeUrl}?cat=${encodeURIComponent(c)}" class="nav-link ${options.activeCategory === c ? 'active' : ''}">${c}</a>
            `).join('')}
          <a href="${user ? getStorePageUrl('history') : getStorePageUrl('login', { redirect: 'history' })}" class="nav-link ${options.activePage === 'orders' ? 'active' : ''}">Đơn hàng</a>
        </nav>

        <!-- Thanh tìm kiếm và nút tải lại -->
        <div class="header-search-group">
          <div class="header-search">
            <img src="${iconPath}tim-kiem.svg" class="header-search-icon icon icon-16" alt="Tìm kiếm" />
            <form action="${homeUrl}" method="GET" onsubmit="handleHeaderSearch(event)">
              <input
                type="text"
                name="q"
                id="headerSearchInput"
                value="${q}"
                placeholder="Tìm iPhone, Galaxy, AirPods..."
                class="header-search-input"
              />
            </form>
          </div>
          <button type="button" class="header-refresh-btn" onclick="window.location.reload()" aria-label="Tải lại trang" title="Tải lại trang">
            <img src="${iconPath}refresh.svg" class="icon icon-18" alt="" />
          </button>
        </div>

        <!-- Thao tác tài khoản và giỏ hàng -->
<div class="header-actions">
  ${user ? `
  <div class="account-menu-wrap">
    <button type="button" class="user-btn account-menu-trigger" aria-label="Tài khoản: ${escapeHeader(accountName)}" aria-expanded="false" aria-controls="accountDropdown">
      <span class="account-avatar">${avatar ? `<img src="${escapeHeader(avatar)}" alt="" />` : escapeHeader(initials)}</span>
      <span class="account-name">${escapeHeader(accountName)}</span>
    </button>
    <div class="account-dropdown" id="accountDropdown" hidden>
      <a class="account-menu-item" href="${getStorePageUrl('profile', { tab: 'info' })}">Thông tin cá nhân</a>
      <div class="account-menu-phone">SĐT: ${escapeHeader((customer && customer.phone) || user.phone || 'Chưa cập nhật')}</div>
      <div class="account-menu-divider"></div>
      <button class="account-menu-logout" type="button">Đăng xuất</button>
    </div>
  </div>` : `
  <a href="${getStorePageUrl('login')}" class="user-btn"><img src="${iconPath}con-nguoi.svg" class="icon icon-18" alt="" /><span>Đăng nhập</span></a>`}

          <a href="${getStorePageUrl('cart')}" class="cart-btn" aria-label="Giỏ hàng">
            <img src="${iconPath}gio-hang.svg" class="icon icon-20" alt="Giỏ hàng" />
            <span class="cart-count-badge" id="headerCartCount" style="${cartCount > 0 ? '' : 'display:none;'}">
              ${cartCount}
            </span>
          </a>
        </div>
      </div>
    </header>

    <div class="mobile-menu-layer" id="storeMobileMenu" aria-hidden="true">
      <button type="button" class="mobile-menu-backdrop" aria-label="Đóng menu"></button>
      <aside class="mobile-menu-drawer" role="dialog" aria-modal="true" aria-label="Menu điều hướng" inert>
        <div class="mobile-menu-header">
          <a href="${homeUrl}" class="brand-logo">
            <img src="${iconPath}dien-thoai.svg" class="icon icon-32" alt="" />
            Techno<span class="brand-accent">Store</span>
          </a>
          <button type="button" class="mobile-menu-close" aria-label="Đóng menu">×</button>
        </div>
        <div class="mobile-menu-content">
          ${user ? `
            <a class="mobile-menu-account" href="${getStorePageUrl('profile', { tab: 'info' })}">
              <span class="account-avatar">${accountAvatar}</span>
              <span class="mobile-menu-account-details">
                <strong>${escapeHeader(accountName)}</strong>
                <span>${escapeHeader((customer && customer.phone) || user.phone || 'Đã đăng nhập')}</span>
              </span>
            </a>
          ` : ''}
          <div class="mobile-menu-section">
            <h2 class="mobile-menu-section-title">Danh mục sản phẩm</h2>
            <nav class="mobile-menu-nav" aria-label="Danh mục sản phẩm">
              ${activeCategories.map(category => `
                <a class="mobile-menu-link" href="${homeUrl}?cat=${encodeURIComponent(category)}">${escapeHeader(category)}</a>
              `).join('')}
            </nav>
          </div>
          <div class="mobile-menu-section">
            <h2 class="mobile-menu-section-title">Tiện ích</h2>
            <a class="mobile-menu-link" href="${user ? getStorePageUrl('history') : getStorePageUrl('login', { redirect: 'history' })}">
              Đơn hàng của tôi
            </a>
          </div>
        </div>
        <div class="mobile-menu-footer">
          ${user
      ? `<button type="button" class="mobile-menu-auth-action mobile-menu-logout">Đăng xuất</button>`
      : `<a class="mobile-menu-auth-action" href="${getStorePageUrl('login')}">Đăng nhập / Đăng ký</a>`}
        </div>
      </aside>
    </div>
  `;

  const menuLayer = container.querySelector('.mobile-menu-layer');
  const menuToggle = container.querySelector('.mobile-menu-toggle');
  const menuDrawer = container.querySelector('.mobile-menu-drawer');
  const closeMobileMenu = () => {
    menuLayer.classList.remove('is-open');
    menuLayer.setAttribute('aria-hidden', 'true');
    menuDrawer.inert = true;
    menuToggle.setAttribute('aria-expanded', 'false');
    document.body.classList.remove('mobile-menu-scroll-locked');
  };
  const openMobileMenu = () => {
    menuLayer.classList.add('is-open');
    menuLayer.setAttribute('aria-hidden', 'false');
    menuDrawer.inert = false;
    menuToggle.setAttribute('aria-expanded', 'true');
    document.body.classList.add('mobile-menu-scroll-locked');
    menuDrawer.querySelector('.mobile-menu-close').focus();
  };

  menuToggle.addEventListener('click', openMobileMenu);
  menuLayer.querySelector('.mobile-menu-close').addEventListener('click', () => {
    closeMobileMenu();
    menuToggle.focus();
  });
  menuLayer.querySelector('.mobile-menu-backdrop').addEventListener('click', () => {
    closeMobileMenu();
    menuToggle.focus();
  });
  menuDrawer.addEventListener('click', event => {
    if (event.target.closest('a')) closeMobileMenu();
  });
  menuDrawer.addEventListener('click', event => {
    if (!event.target.closest('.mobile-menu-logout')) return;
    closeMobileMenu();
    logoutUser();
    window.location.href = homeUrl;
  });
  menuLayer.addEventListener('keydown', event => {
    if (event.key !== 'Escape') return;
    closeMobileMenu();
    menuToggle.focus();
  });
  window.addEventListener('resize', () => {
    if (window.matchMedia('(min-width: 1101px)').matches && menuLayer.classList.contains('is-open')) {
      closeMobileMenu();
    }
  });

  const accountWrap = container.querySelector('.account-menu-wrap');
  if (accountWrap) {
    const trigger = accountWrap.querySelector('.account-menu-trigger');
    const dropdown = accountWrap.querySelector('.account-dropdown');
    const setOpen = open => { dropdown.hidden = !open; trigger.setAttribute('aria-expanded', String(open)); };
    trigger.addEventListener('click', () => setOpen(dropdown.hidden));
    accountWrap.addEventListener('pointerenter', event => { if (event.pointerType === 'mouse') setOpen(true); });
    accountWrap.addEventListener('pointerleave', event => { if (event.pointerType === 'mouse' && !accountWrap.contains(document.activeElement)) setOpen(false); });
    accountWrap.addEventListener('focusout', event => { if (!accountWrap.contains(event.relatedTarget) && !accountWrap.matches(':hover')) setOpen(false); });
    document.addEventListener('click', event => { if (!accountWrap.contains(event.target)) setOpen(false); });
    accountWrap.addEventListener('keydown', event => { if (event.key === 'Escape') { setOpen(false); trigger.focus(); } });
    accountWrap.querySelector('.account-menu-logout').addEventListener('click', () => { logoutUser(); window.location.href = homeUrl; });
    window.addEventListener('profileAvatarUpdated', event => {
      if (String(event.detail.id) !== String(user.id)) return;
      const avatarElement = accountWrap.querySelector('.account-avatar');
      const image = document.createElement('img');
      image.src = event.detail.avatar;
      image.alt = '';
      avatarElement.replaceChildren(image);
    });
  }

  // Lắng nghe sự kiện thay đổi giỏ hàng.
  window.addEventListener('cartUpdated', (e) => {
    const badge = document.getElementById('headerCartCount');
    if (badge) {
      const count = e.detail.count;
      badge.textContent = count;
      badge.style.display = count > 0 ? 'grid' : 'none';
    }
  });
}

function handleHeaderSearch(e) {
  e.preventDefault();
  const input = document.getElementById('headerSearchInput');
  const val = input ? input.value.trim() : '';
  window.location.href = getStorePageUrl('home', val ? { q: val } : {});
}

/**
 * Hiển thị chân trang cửa hàng.
 * @param {string} containerId - ID của phần tử chứa nội dung
 * @param {Object} options - Các tùy chọn hiển thị
 */
function renderStoreFooter(containerId, options = {}) {
  const container = document.getElementById(containerId);
  if (!container) return;

  const basePath = options.basePath || '';
  const iconPath = `${basePath}assets/icon/`;
  const homeUrl = getStorePageUrl('home');

  container.innerHTML = `
    <footer class="store-footer">
      <div class="footer-container">
        <!-- Cột 1: Thông tin thương hiệu -->
        <div>
          <div class="brand-logo">
            <img src="${iconPath}dien-thoai.svg" class="icon icon-32" alt="TechnoStore Logo" />
            Techno<span class="brand-accent">Store</span>
          </div>
          <p class="footer-brand-desc">
            Điện thoại và thiết bị công nghệ chính hãng. Bảo hành 12 tháng, đổi trả trong 30 ngày.
          </p>
        </div>

        <!-- Cột 2: Danh mục sản phẩm -->
        <div>
          <h4 class="footer-col-title">Sản phẩm</h4>
          <ul class="footer-links-list">
            <li><a href="${homeUrl}?cat=Điện thoại" class="footer-link">Điện thoại</a></li>
            <li><a href="${homeUrl}?cat=Máy tính bảng" class="footer-link">Máy tính bảng</a></li>
            <li><a href="${homeUrl}?cat=Tai nghe" class="footer-link">Tai nghe</a></li>
            <li><a href="${homeUrl}?cat=Đồng hồ thông minh" class="footer-link">Đồng hồ thông minh</a></li>
            <li><a href="${homeUrl}?cat=Phụ kiện" class="footer-link">Phụ kiện</a></li>
          </ul>
        </div>

        <!-- Cột 3: Hỗ trợ khách hàng -->
        <div>
          <h4 class="footer-col-title">Hỗ trợ</h4>
          <ul class="footer-links-list">
            <li><a href="#" class="footer-link">Chính sách bảo hành</a></li>
            <li><a href="#" class="footer-link">Chính sách đổi trả</a></li>
            <li><a href="#" class="footer-link">Hướng dẫn mua hàng</a></li>
            <li><a href="#" class="footer-link">Liên hệ</a></li>
          </ul>
        </div>

        <!-- Cột 4: Thông tin cửa hàng -->
        <div>
          <h4 class="footer-col-title">Cửa hàng</h4>
          <ul class="footer-links-list">
            <li class="footer-link">123 Nguyễn Huệ, Quận 1, TP.HCM</li>
            <li class="footer-link">Hotline: 1900 6868</li>
            <li class="footer-link">cskh@technostore.vn</li>
            <li class="footer-link">08:00 – 21:30 hàng ngày</li>
          </ul>
        </div>
      </div>

      <div class="footer-bottom-bar">
        © 2026 TechnoStore. Bảo lưu mọi quyền.
      </div>
    </footer>
  `;
}

/**
 * Hiển thị thanh điều hướng nhanh dạng nổi (đã loại bỏ hoàn toàn nút chuyển vai trò [Khách hàng | Quản trị]).
 */
function renderFloatingNav(containerId, options = {}) {
  const container = document.getElementById(containerId);
  if (!container) return;

  // Loại bỏ hoàn toàn thanh hoặc nút nổi [Khách hàng | Quản trị] trên toàn bộ website.
  container.innerHTML = '';
  container.style.display = 'none';
}

/**
 * Hàm hỗ trợ hiển thị phân trang.
 */
function renderPagination(currentPage, totalPages, clickCallbackName, iconPath = 'assets/icon/') {
  if (totalPages <= 1) return '';
  let html = `<nav class="pagination" aria-label="Phân trang">`;

  // Nút chuyển về trang trước.
  html += `
    <button class="page-btn" ${currentPage === 1 ? 'disabled' : ''} onclick="${clickCallbackName}(${currentPage - 1})" aria-label="Trang trước">
      <img src="${iconPath}chevron-left.svg" class="icon icon-16" alt="Trang trước" />
    </button>
  `;

  // Các nút số trang.
  for (let i = 1; i <= totalPages; i++) {
    html += `
      <button class="page-btn ${i === currentPage ? 'active' : ''}" onclick="${clickCallbackName}(${i})">
        ${i}
      </button>
    `;
  }

  // Nút chuyển sang trang tiếp theo.
  html += `
    <button class="page-btn" ${currentPage === totalPages ? 'disabled' : ''} onclick="${clickCallbackName}(${currentPage + 1})" aria-label="Trang sau">
      <img src="${iconPath}chevron-right.svg" class="icon icon-16" alt="Trang sau" />
    </button>
  `;

  html += `</nav>`;
  return html;
}

/**
 * Tự động hiển thị danh sách ô chọn hãng sản xuất.
 * Lấy toàn bộ thương hiệu từ defaultBrands hoặc danh sách sản phẩm hiện có trong kho.
 * @param {string} containerId - ID phần tử chứa ô chọn hãng (mặc định là 'brandCheckboxList')
 */
function renderBrandCheckboxes(containerId = 'brandCheckboxList') {
  const container = document.getElementById(containerId) || document.querySelector('.brand-checkbox-list');
  if (!container) return;

  // Lấy danh sách thương hiệu từ defaultBrands hoặc quét danh sách sản phẩm hiện có.
  let brands = (typeof defaultBrands !== 'undefined' && Array.isArray(defaultBrands))
    ? [...defaultBrands]
    : [];

  if (typeof getProducts === 'function') {
    const activeProds = getActiveProducts();
    const prodBrands = Array.from(new Set(activeProds.map(p => p.brand).filter(Boolean)));
    prodBrands.forEach(b => {
      if (!brands.includes(b)) brands.push(b);
    });
  }

  // Hiển thị danh sách ô chọn hãng sản xuất.
  container.innerHTML = brands.map(brand => `
    <label class="checkbox-label">
      <input type="checkbox" class="brand-filter-cb" value="${brand}" /> ${brand}
    </label>
  `).join('');
}
window.renderBrandCheckboxes = renderBrandCheckboxes;

/* Cách sử dụng: showCustomDialog(message, title, type, onConfirm, options)
   - message: Nội dung thông báo / câu hỏi xác nhận
   - title: Tiêu đề hộp thoại (mặc định 'Thông báo')
   - type: 'info' | 'success' | 'warning' | 'error' (loại thông báo)
   - onConfirm: Hàm gọi lại khi người dùng bấm [Xác nhận] / [Đồng ý]. Nếu truyền hàm này, hộp thoại hiển thị hai nút [Huỷ bỏ] và [Xác nhận] (thay cho window.confirm).
   - options: { confirmText, cancelText, onCancel }
*/
window.showCustomDialog = function (message, title = 'Thông báo', type = 'warning', onConfirm = null, options = {}) {
  // Xóa hộp thoại cũ nếu đang mở.
  const existing = document.getElementById('customSystemDialog');
  if (existing) existing.remove();

  // Cho phép truyền hàm gọi lại linh hoạt ở tham số thứ ba hoặc thứ tư.
  if (typeof type === 'function') {
    onConfirm = type;
    type = 'warning';
  }

  // Biểu tượng tương ứng với loại trạng thái.
  const iconMap = {
    info: { symbol: 'ℹ', bg: '#e0f2fe', color: '#0369a1' },
    success: { symbol: '✓', bg: '#dcfce7', color: '#15803d' },
    warning: { symbol: '⚠', bg: '#fef9c3', color: '#a16207' },
    error: { symbol: '✕', bg: '#fee2e2', color: '#dc2626' }
  };
  const icon = iconMap[type] || iconMap.warning;

  const isConfirmDialog = typeof onConfirm === 'function';
  const confirmText = options.confirmText || (isConfirmDialog ? 'Xác nhận' : 'Đồng ý');
  const cancelText = options.cancelText || 'Huỷ bỏ';

  const overlay = document.createElement('div');
  overlay.id = 'customSystemDialog';
  overlay.style.cssText = 'position:fixed; inset:0; background:rgba(0,0,0,0.5); z-index:9999; display:grid; place-items:center; animation: fadeIn 0.18s ease;';

  const confirmBtnBg = (type === 'error' || type === 'danger') ? '#dc2626' : 'var(--color-brand-700, #4f46e5)';

  overlay.innerHTML = `
    <div style="
      background: var(--color-card, #fff);
      border-radius: var(--radius-xl, 16px);
      box-shadow: 0 20px 60px rgba(0,0,0,0.25);
      max-width: 440px;
      width: 90%;
      padding: 32px 28px 24px;
      text-align: center;
      animation: popIn 0.22s cubic-bezier(0.34, 1.56, 0.64, 1);
    ">
      <div style="
        width: 52px; height: 52px; border-radius: 50%;
        background: ${icon.bg}; color: ${icon.color};
        display: grid; place-items: center;
        font-size: 24px; font-weight: 700;
        margin: 0 auto 16px;
      ">${icon.symbol}</div>

      <h3 style="
        margin: 0 0 8px; font-size: 18px; font-weight: 700;
        color: var(--color-ink, #111);
      ">${title}</h3>

      <div style="
        margin: 0 0 24px; font-size: 14px; line-height: 1.6;
        color: var(--color-ink-2, #555);
      ">${message}</div>

      ${isConfirmDialog ? `
        <div style="display: flex; justify-content: center; gap: 12px; flex-wrap: wrap;">
          <button id="customDialogCancelBtn" style="
            display: inline-flex; align-items: center; justify-content: center;
            min-width: 110px; height: 42px; padding: 0 20px;
            background: #f1f5f9; color: var(--color-ink-2, #475569);
            border: 1px solid var(--color-line, #cbd5e1); border-radius: var(--radius-md, 10px);
            font-size: 14px; font-weight: 600; cursor: pointer;
            transition: background 0.2s;
          " onmouseover="this.style.background='#e2e8f0'" onmouseout="this.style.background='#f1f5f9'">
            ${cancelText}
          </button>
          <button id="customDialogConfirmBtn" style="
            display: inline-flex; align-items: center; justify-content: center;
            min-width: 110px; height: 42px; padding: 0 20px;
            background: ${confirmBtnBg}; color: #fff;
            border: none; border-radius: var(--radius-md, 10px);
            font-size: 14px; font-weight: 600; cursor: pointer;
            transition: opacity 0.2s;
          " onmouseover="this.style.opacity='0.9'" onmouseout="this.style.opacity='1'">
            ${confirmText}
          </button>
        </div>
      ` : `
        <button id="customDialogOkBtn" style="
          display: inline-flex; align-items: center; justify-content: center;
          min-width: 120px; height: 42px; padding: 0 24px;
          background: var(--color-brand-700, #4f46e5); color: #fff;
          border: none; border-radius: var(--radius-md, 10px);
          font-size: 14px; font-weight: 600; cursor: pointer;
          transition: background 0.2s, transform 0.1s;
        " onmouseover="this.style.opacity='0.9'" onmouseout="this.style.opacity='1'">
          Đồng ý
        </button>
      `}
    </div>
  `;

  const closeDialog = () => {
    overlay.remove();
    document.removeEventListener('keydown', escHandler);
  };

  if (isConfirmDialog) {
    const confirmBtn = overlay.querySelector('#customDialogConfirmBtn');
    const cancelBtn = overlay.querySelector('#customDialogCancelBtn');
    if (confirmBtn) {
      confirmBtn.addEventListener('click', () => {
        closeDialog();
        onConfirm();
      });
    }
    if (cancelBtn) {
      cancelBtn.addEventListener('click', () => {
        closeDialog();
        if (typeof options.onCancel === 'function') options.onCancel();
      });
    }
  } else {
    const okBtn = overlay.querySelector('#customDialogOkBtn');
    if (okBtn) {
      okBtn.addEventListener('click', closeDialog);
    }
  }

  // Bấm vào vùng phủ bên ngoài hộp thoại cũng sẽ đóng hộp thoại.
  overlay.addEventListener('click', function (e) {
    if (e.target === overlay) {
      closeDialog();
      if (isConfirmDialog && typeof options.onCancel === 'function') options.onCancel();
    }
  });

  // Nhấn phím Escape cũng sẽ đóng hộp thoại.
  const escHandler = function (e) {
    if (e.key === 'Escape') {
      closeDialog();
      if (isConfirmDialog && typeof options.onCancel === 'function') options.onCancel();
    }
  };
  document.addEventListener('keydown', escHandler);

  document.body.appendChild(overlay);
};
