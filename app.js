const API_BASE = 'http://localhost:5000/api';

const loginTab = document.getElementById('loginTab');
const registerTab = document.getElementById('registerTab');
const loginForm = document.getElementById('loginForm');
const registerForm = document.getElementById('registerForm');
const authSection = document.getElementById('authSection');
const stockSection = document.getElementById('stockSection');
const welcomeUser = document.getElementById('welcomeUser');

const loginUsername = document.getElementById('loginUsername');
const loginPassword = document.getElementById('loginPassword');
const loginBtn = document.getElementById('loginBtn');
const loginFeedback = document.getElementById('loginFeedback');

const registerUsername = document.getElementById('registerUsername');
const registerPassword = document.getElementById('registerPassword');
const registerPasswordConfirm = document.getElementById('registerPasswordConfirm');
const registerBtn = document.getElementById('registerBtn');
const registerFeedback = document.getElementById('registerFeedback');

const logoutBtn = document.getElementById('logoutBtn');
const inventoryBody = document.getElementById('inventoryBody');
const productName = document.getElementById('productName');
const productQty = document.getElementById('productQty');
const productPrice = document.getElementById('productPrice');
const productCategory = document.getElementById('productCategory');
const saveItemBtn = document.getElementById('saveItemBtn');
const cancelEditBtn = document.getElementById('cancelEditBtn');
const itemFeedback = document.getElementById('itemFeedback');
const themeToggleBtn = document.getElementById('themeToggleBtn');

let editingItemId = null;

const TOKEN_KEY = 'stockManagerToken';
const THEME_KEY = 'stockManagerTheme';

function getToken() {
  return localStorage.getItem(TOKEN_KEY);
}

function setToken(token) {
  localStorage.setItem(TOKEN_KEY, token);
}

function removeToken() {
  localStorage.removeItem(TOKEN_KEY);
}

function getTheme() {
  return localStorage.getItem(THEME_KEY) || 'light';
}

function applyTheme(theme) {
  document.documentElement.setAttribute('data-theme', theme);
  if (themeToggleBtn) {
    themeToggleBtn.textContent = theme === 'dark' ? '☀️' : '🌙';
  }
}

function setTheme(theme) {
  localStorage.setItem(THEME_KEY, theme);
  applyTheme(theme);
}

function toggleTheme() {
  setTheme(getTheme() === 'dark' ? 'light' : 'dark');
}

async function apiRequest(url, options = {}) {
  const token = getToken();
  const headers = {
    'Content-Type': 'application/json',
    ...options.headers,
  };
  if (token) {
    headers.Authorization = token;
  }
  const response = await fetch(`${API_BASE}${url}`, {
    ...options,
    headers,
  });
  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.message || 'Something went wrong');
  }
  return data;
}

function switchTab(activeTab) {
  if (activeTab === 'login') {
    loginTab.classList.add('active');
    registerTab.classList.remove('active');
    loginForm.classList.remove('hidden');
    registerForm.classList.add('hidden');
  } else {
    registerTab.classList.add('active');
    loginTab.classList.remove('active');
    registerForm.classList.remove('hidden');
    loginForm.classList.add('hidden');
  }
}

function showStockView(user) {
  authSection.classList.add('hidden');
  stockSection.classList.remove('hidden');
  welcomeUser.textContent = `ยินดีต้อนรับ ${user.username}`;
  renderInventory();
}

function showAuthView() {
  authSection.classList.remove('hidden');
  stockSection.classList.add('hidden');
  loginFeedback.textContent = '';
  registerFeedback.textContent = '';
  itemFeedback.textContent = '';
  clearItemForm();
}

async function renderInventory() {
  try {
    const products = await apiRequest('/products');
    inventoryBody.innerHTML = '';

    if (products.length === 0) {
      inventoryBody.innerHTML = '<tr><td colspan="5" style="color: var(--muted);">ยังไม่มีสินค้าคงคลัง</td></tr>';
      return;
    }

    products.forEach((item) => {
      const row = document.createElement('tr');
      row.innerHTML = `
        <td>${item.name}</td>
        <td>${item.quantity}</td>
        <td>${item.price.toLocaleString('th-TH', { style: 'currency', currency: 'THB' })}</td>
        <td>${item.category}</td>
        <td>
          <button class="edit" data-id="${item._id}">แก้ไข</button>
          <button class="delete" data-id="${item._id}">ลบ</button>
        </td>
      `;
      inventoryBody.appendChild(row);
    });
  } catch (err) {
    console.error(err);
    inventoryBody.innerHTML = '<tr><td colspan="5" style="color: var(--error);">เกิดข้อผิดพลาดในการโหลดข้อมูล</td></tr>';
  }
}

function clearItemForm() {
  editingItemId = null;
  productName.value = '';
  productQty.value = '';
  productPrice.value = '';
  productCategory.value = '';
  saveItemBtn.textContent = 'บันทึกสินค้า';
  cancelEditBtn.classList.add('hidden');
  itemFeedback.textContent = '';
}

function showFeedback(element, message, isSuccess = false) {
  element.textContent = message;
  element.style.color = isSuccess ? '#15803d' : 'var(--danger)';
}

async function handleRegister() {
  const username = registerUsername.value.trim();
  const password = registerPassword.value;
  const confirm = registerPasswordConfirm.value;

  if (!username || !password || !confirm) {
    showFeedback(registerFeedback, 'กรุณากรอกข้อมูลให้ครบทุกช่อง');
    return;
  }

  if (password !== confirm) {
    showFeedback(registerFeedback, 'รหัสผ่านไม่ตรงกัน');
    return;
  }

  try {
    await apiRequest('/register', {
      method: 'POST',
      body: JSON.stringify({ username, password }),
    });
    showFeedback(registerFeedback, 'สมัครสมาชิกสำเร็จ! สามารถเข้าสู่ระบบได้', true);
    registerUsername.value = '';
    registerPassword.value = '';
    registerPasswordConfirm.value = '';
    switchTab('login');
  } catch (err) {
    showFeedback(registerFeedback, err.message);
  }
}

async function handleLogin() {
  const username = loginUsername.value.trim();
  const password = loginPassword.value;

  if (!username || !password) {
    showFeedback(loginFeedback, 'กรุณากรอกชื่อผู้ใช้และรหัสผ่าน');
    return;
  }

  try {
    const data = await apiRequest('/login', {
      method: 'POST',
      body: JSON.stringify({ username, password }),
    });
    setToken(data.token);
    loginUsername.value = '';
    loginPassword.value = '';
    showStockView(data.user);
  } catch (err) {
    showFeedback(loginFeedback, err.message);
  }
}

function handleLogout() {
  removeToken();
  showAuthView();
}

async function handleSaveItem() {
  const name = productName.value.trim();
  const quantity = Number(productQty.value);
  const price = Number(productPrice.value);
  const category = productCategory.value.trim();

  if (!name || isNaN(quantity) || quantity < 0 || isNaN(price) || price < 0 || !category) {
    showFeedback(itemFeedback, 'กรุณากรอกข้อมูลสินค้าให้ครบและถูกต้อง');
    return;
  }

  try {
    if (editingItemId) {
      await apiRequest(`/products/${editingItemId}`, {
        method: 'PUT',
        body: JSON.stringify({ name, quantity, price, category }),
      });
      showFeedback(itemFeedback, 'แก้ไขสินค้าเรียบร้อย', true);
    } else {
      await apiRequest('/products', {
        method: 'POST',
        body: JSON.stringify({ name, quantity, price, category }),
      });
      showFeedback(itemFeedback, 'เพิ่มสินค้าเรียบร้อย', true);
    }
    renderInventory();
    clearItemForm();
  } catch (err) {
    showFeedback(itemFeedback, err.message);
  }
}

async function handleInventoryClick(event) {
  const button = event.target.closest('button');
  if (!button) return;
  const id = button.dataset.id;

  if (button.classList.contains('edit')) {
    try {
      const products = await apiRequest('/products');
      const item = products.find((product) => product._id === id);
      if (!item) return;
      editingItemId = item._id;
      productName.value = item.name;
      productQty.value = item.quantity;
      productPrice.value = item.price;
      productCategory.value = item.category;
      saveItemBtn.textContent = 'บันทึกการแก้ไข';
      cancelEditBtn.classList.remove('hidden');
      itemFeedback.textContent = '';
    } catch (err) {
      console.error(err);
    }
  }

  if (button.classList.contains('delete')) {
    try {
      await apiRequest(`/products/${id}`, {
        method: 'DELETE',
      });
      renderInventory();
    } catch (err) {
      console.error(err);
    }
  }
}

loginTab.addEventListener('click', () => switchTab('login'));
registerTab.addEventListener('click', () => switchTab('register'));
registerBtn.addEventListener('click', handleRegister);
loginBtn.addEventListener('click', handleLogin);
logoutBtn.addEventListener('click', handleLogout);
saveItemBtn.addEventListener('click', handleSaveItem);
cancelEditBtn.addEventListener('click', clearItemForm);
inventoryBody.addEventListener('click', handleInventoryClick);
themeToggleBtn?.addEventListener('click', toggleTheme);

document.addEventListener('DOMContentLoaded', () => {
  applyTheme(getTheme());
  const token = getToken();
  if (token) {
    // Optionally verify token, but for simplicity, assume it's valid
    // You might want to add a /me endpoint to get user info
    showStockView({ username: 'User' }); // Placeholder, replace with actual user data
  } else {
    showAuthView();
  }
});
