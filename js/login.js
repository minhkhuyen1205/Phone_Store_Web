const card = document.getElementById('authCard');
const loginPanel = document.getElementById('loginPanel');
const registerPanel = document.getElementById('registerPanel');
document.querySelectorAll('[data-mode]').forEach(button => button.addEventListener('click', () => {
  const register = button.dataset.mode === 'register';
  card.classList.toggle('is-register', register);
  loginPanel.inert = register;
  registerPanel.inert = !register;
  loginPanel.setAttribute('aria-hidden', String(register));
  registerPanel.setAttribute('aria-hidden', String(!register));
}));
document.querySelectorAll('[data-password]').forEach(button => {
  button.innerHTML = '<svg viewBox="0 0 24 24" aria-hidden="true">' +
    '<path d="M2 12s3.6-6 10-6 10 6 10 6-3.6 6-10 6S2 12 2 12Z"/>' +
    '<circle cx="12" cy="12" r="3"/><path class="eye-slash" d="M4 4l16 16"/></svg>';
  button.setAttribute('aria-pressed', 'false');
  button.addEventListener('click', () => {
    const input = document.getElementById(button.dataset.password);
    const show = input.type === 'password';
    input.type = show ? 'text' : 'password';
    button.setAttribute('aria-label', show ? 'Ẩn mật khẩu' : 'Hiện mật khẩu');
    button.setAttribute('aria-pressed', String(show));
    button.classList.toggle('is-visible', show);
  });
});
const target = new URLSearchParams(location.search).get('redirect');
const destination = ['cart.html', 'checkout.html', 'profile.html', 'history.html'].includes(target) ? target : '../../index.html';
const normalizePhone = value => value.replace(/\D/g, '');
const loginForm = loginPanel.querySelector('form');
const registerForm = registerPanel.querySelector('form');
const testCustomers = getCustomers();
if ((location.protocol === 'file:' || ['localhost', '127.0.0.1', '[::1]'].includes(location.hostname)) && !testCustomers.some(customer => customer.email === '1' || customer.phone === '1')) {
  const usedTestIds = new Set(testCustomers.map(customer => customer.id));
  let testId = 'KH-TEST';
  let suffix = 1;
  while (usedTestIds.has(testId)) testId = `KH-TEST-${suffix++}`;
  testCustomers.push({ id: testId, name: 'Khách hàng thử nghiệm', email: '1', phone: '', password: '1', joined: new Date().toLocaleDateString('vi-VN'), orders: 0, locked: false, addresses: [] });
  saveCustomers(testCustomers);
}
function clearErrors(form) {
  form.querySelectorAll('.field-error').forEach(error => error.remove());
  form.querySelectorAll('[aria-invalid]').forEach(input => {
    input.removeAttribute('aria-invalid');
    input.removeAttribute('aria-describedby');
  });
}
function showError(input, message) {
  const label = input.form.querySelector(`label[for="${input.id}"]`);
  const error = document.createElement('span');
  error.className = 'field-error';
  error.id = `${input.id}-error`;
  error.setAttribute('role', 'alert');
  error.textContent = message;
  label.insertAdjacentElement('afterend', error);
  input.setAttribute('aria-invalid', 'true');
  input.setAttribute('aria-describedby', error.id);
}
[loginForm, registerForm].forEach(form => {
  form.noValidate = true;
  form.addEventListener('input', event => {
    const input = event.target;
    if (!input.matches('[aria-invalid]')) return;
    const error = document.getElementById(input.getAttribute('aria-describedby'));
    if (error) error.remove();
    input.removeAttribute('aria-invalid');
    input.removeAttribute('aria-describedby');
  });
});
function finishLogin(customer) {
  const { password, ...sessionUser } = customer;
  setCurrentUser(sessionUser);
  location.href = customer.mustChangePassword ? 'profile.html?tab=security' : destination;
}
loginForm.addEventListener('submit', event => {
  event.preventDefault();
  clearErrors(loginForm);
  const identity = document.getElementById('identity').value.trim();
  const phone = normalizePhone(identity);
  const password = document.getElementById('loginPassword').value;
  if (!identity || !password) {
    if (!identity) showError(document.getElementById('identity'), 'Vui lòng nhập email hoặc số điện thoại.');
    if (!password) showError(document.getElementById('loginPassword'), 'Vui lòng nhập mật khẩu.');
    return;
  }
  const customer = getCustomers().find(item =>
    (item.email && item.email.toLowerCase() === identity.toLowerCase()) ||
    (phone && item.phone && normalizePhone(item.phone) === phone)
  );
  if (!customer || !(customer.password ? customer.password === password : ['password123', '123456'].includes(password))) {
    showError(document.getElementById('identity'), 'Thông tin đăng nhập không chính xác.');
    document.getElementById('loginPassword').setAttribute('aria-invalid', 'true');
    return;
  }
  if (customer.locked) {
    showError(document.getElementById('identity'), 'Tài khoản đã bị khóa. Vui lòng liên hệ cửa hàng.');
    return;
  }
  finishLogin(customer);
});
registerForm.addEventListener('submit', event => {
  event.preventDefault();
  clearErrors(registerForm);
  const name = document.getElementById('name').value.trim();
  const phone = normalizePhone(document.getElementById('phone').value);
  const email = document.getElementById('email').value.trim();
  const password = document.getElementById('registerPassword').value;
  let invalid = false;
  if (!name) { showError(document.getElementById('name'), 'Vui lòng nhập họ tên.'); invalid = true; }
  if (!/^0\d{9}$/.test(phone)) { showError(document.getElementById('phone'), 'Số điện thoại cần có 10 chữ số, bắt đầu bằng 0.'); invalid = true; }
  if (!document.getElementById('email').validity.valid || !email) { showError(document.getElementById('email'), 'Vui lòng nhập email hợp lệ.'); invalid = true; }
  if (password.length < 6) { showError(document.getElementById('registerPassword'), 'Mật khẩu cần có ít nhất 6 ký tự.'); invalid = true; }
  if (invalid) return;
  const customers = getCustomers();
  if (customers.some(item => item.phone && normalizePhone(item.phone) === phone)) { showError(document.getElementById('phone'), 'Số điện thoại đã được đăng ký.'); invalid = true; }
  if (customers.some(item => item.email && item.email.toLowerCase() === email.toLowerCase())) { showError(document.getElementById('email'), 'Email đã được đăng ký.'); invalid = true; }
  if (invalid) return;
  const usedIds = new Set(customers.map(item => item.id));
  let number = 1;
  while (usedIds.has('KH' + String(number).padStart(3, '0'))) number++;
  const customer = { id: 'KH' + String(number).padStart(3, '0'), name, phone, email, password, joined: new Date().toLocaleDateString('vi-VN'), orders: 0, locked: false, addresses: [] };
  customers.push(customer);
  saveCustomers(customers);
  finishLogin(customer);
});
document.getElementById('forgot').addEventListener('click', () => {
  clearErrors(loginForm);
  showError(document.getElementById('identity'), 'Chức năng khôi phục mật khẩu đang được phát triển.');
});
renderStoreFooter('footerContainer', { basePath: '../../', viewPath: '../' });
