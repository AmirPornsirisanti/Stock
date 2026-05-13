const API_BASE = 'http://localhost:5000/api';

// Auth Elements
const authSection = document.getElementById('authSection');
const loginForm = document.getElementById('loginForm');
const registerForm = document.getElementById('registerForm');

const loginUsername = document.getElementById('loginUsername');
const loginPassword = document.getElementById('loginPassword');
const loginBtn = document.getElementById('loginBtn');
const loginFeedback = document.getElementById('loginFeedback');

const registerUsername = document.getElementById('registerUsername');
const registerPassword = document.getElementById('registerPassword');
const registerPasswordConfirm = document.getElementById('registerPasswordConfirm');
const registerBtn = document.getElementById('registerBtn');
const registerFeedback = document.getElementById('registerFeedback');

const toggleAuthBtn = document.getElementById('toggleAuthBtn');
const authTitle = document.getElementById('authTitle');
const authSubtitle = document.getElementById('authSubtitle');
const authToggleText = document.getElementById('authToggleText');

// Stock Elements
const stockSection = document.getElementById('stockSection');
const welcomeUser = document.getElementById('welcomeUser');
const logoutBtn = document.getElementById('logoutBtn');
const inventoryBody = document.getElementById('inventoryBody');
const itemCountDisplay = document.getElementById('itemCountDisplay');
const emptyState = document.getElementById('emptyState');

const productName = document.getElementById('productName');
const productQty = document.getElementById('productQty');
const productPrice = document.getElementById('productPrice');
const productCategory = document.getElementById('productCategory');
const saveItemBtn = document.getElementById('saveItemBtn');
const cancelEditBtn = document.getElementById('cancelEditBtn');
const itemFeedback = document.getElementById('itemFeedback');

// Stats Elements
const totalItems = document.getElementById('totalItems');
const totalValue = document.getElementById('totalValue');

// Theme
const themeToggleBtn = document.getElementById('themeToggleBtn');

let editingItemId = null;
let isLoginMode = true;

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

function toggleAuthMode() {
  isLoginMode = !isLoginMode;
  
  if (isLoginMode) {
    authTitle.textContent = 'เข้าสู่ระบบ';
    authSubtitle.textContent = 'ใส่ข้อมูลการเข้าสู่ระบบของคุณ';
    loginForm.classList.remove('hidden');
    registerForm.classList.add('hidden');
    authToggleText.innerHTML = 'ยังไม่มีบัญชี? <button id="toggleAuthBtn" class="link-btn">สมัครสมาชิกที่นี่</button>';
  } else {
    authTitle.textContent = 'สมัครสมาชิก';
    authSubtitle.textContent = 'สร้างบัญชีใหม่เพื่อเข้าใช้งาน';
    registerForm.classList.remove('hidden');
    loginForm.classList.add('hidden');
    authToggleText.innerHTML = 'มีบัญชีอยู่แล้ว? <button id="toggleAuthBtn" class="link-btn">เข้าสู่ระบบที่นี่</button>';
  }
  
  // Re-attach listener to the new button
  document.getElementById('toggleAuthBtn').addEventListener('click', toggleAuthMode);
}

function showStockView(user) {
  authSection.classList.add('hidden');
  stockSection.classList.remove('hidden');
  welcomeUser.textContent = `ยินดีต้อนรับ, ${user.username}`;
  renderInventory();
}

function showAuthView() {
  authSection.classList.remove('hidden');
  stockSection.classList.add('hidden');
  clearAuthForm();
  isLoginMode = true;
  authTitle.textContent = 'เข้าสู่ระบบ';
  authSubtitle.textContent = 'ใส่ข้อมูลการเข้าสู่ระบบของคุณ';
  loginForm.classList.remove('hidden');
  registerForm.classList.add('hidden');
}

function clearAuthForm() {
  loginUsername.value = '';
  loginPassword.value = '';
  registerUsername.value = '';
  registerPassword.value = '';
  registerPasswordConfirm.value = '';
  hideFeedback(loginFeedback);
  hideFeedback(registerFeedback);
}

async function renderInventory() {
  try {
    const products = await apiRequest('/products');
    inventoryBody.innerHTML = '';

    if (products.length === 0) {
      inventoryBody.parentElement.parentElement.querySelector('.table-wrapper').style.display = 'none';
      emptyState.classList.remove('hidden');
      itemCountDisplay.textContent = 'ทั้งหมด 0 รายการ';
      totalItems.textContent = '0';
      totalValue.textContent = '0';
      return;
    }

    inventoryBody.parentElement.parentElement.querySelector('.table-wrapper').style.display = 'block';
    emptyState.classList.add('hidden');

    let totalValueAmount = 0;
    products.forEach((item) => {
      const value = item.quantity * item.price;
      totalValueAmount += value;
      const row = document.createElement('tr');
      row.innerHTML = `
        <td>${item.name}</td>
        <td>${item.category}</td>
        <td>${item.quantity}</td>
        <td>${item.price.toLocaleString('th-TH', { style: 'currency', currency: 'THB' })}</td>
        <td>${value.toLocaleString('th-TH', { style: 'currency', currency: 'THB' })}</td>
        <td>
          <button class="edit-btn" data-id="${item._id}">แก้ไข</button>
          <button class="delete-btn" data-id="${item._id}">ลบ</button>
        </td>
      `;
      inventoryBody.appendChild(row);
    });

    itemCountDisplay.textContent = `ทั้งหมด ${products.length} รายการ`;
    totalItems.textContent = products.length;
    totalValue.textContent = totalValueAmount.toLocaleString('th-TH', { style: 'currency', currency: 'THB' });
  } catch (err) {
    console.error(err);
    showFeedback(itemFeedback, 'เกิดข้อผิดพลาดในการโหลดข้อมูล', false);
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
  hideFeedback(itemFeedback);
}

function showFeedback(element, message, isSuccess = false) {
  element.classList.remove('hidden');
  element.classList.remove('error', 'success');
  element.classList.add('show');
  element.classList.add(isSuccess ? 'success' : 'error');
  element.textContent = message;
  
  setTimeout(() => {
    element.classList.add('hidden');
    element.classList.remove('show');
  }, 5000);
}

function hideFeedback(element) {
  element.classList.add('hidden');
  element.classList.remove('show');
  element.textContent = '';
}

async function handleRegister() {
  const username = registerUsername.value.trim();
  const password = registerPassword.value;
  const confirm = registerPasswordConfirm.value;

  if (!username || !password || !confirm) {
    showFeedback(registerFeedback, 'กรุณากรอกข้อมูลให้ครบทุกช่อง', false);
    return;
  }

  if (password !== confirm) {
    showFeedback(registerFeedback, 'รหัสผ่านไม่ตรงกัน', false);
    return;
  }

  try {
    await apiRequest('/register', {
      method: 'POST',
      body: JSON.stringify({ username, password }),
    });
    showFeedback(registerFeedback, 'สมัครสมาชิกสำเร็จ! สามารถเข้าสู่ระบบได้', true);
    setTimeout(() => {
      toggleAuthMode();
    }, 1500);
  } catch (err) {
    showFeedback(registerFeedback, err.message, false);
  }
}

async function handleLogin() {
  const username = loginUsername.value.trim();
  const password = loginPassword.value;

  if (!username || !password) {
    showFeedback(loginFeedback, 'กรุณากรอกชื่อผู้ใช้และรหัสผ่าน', false);
    return;
  }

  try {
    const data = await apiRequest('/login', {
      method: 'POST',
      body: JSON.stringify({ username, password }),
    });
    setToken(data.token);
    clearAuthForm();
    showStockView(data.user);
  } catch (err) {
    showFeedback(loginFeedback, err.message, false);
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
    showFeedback(itemFeedback, 'กรุณากรอกข้อมูลสินค้าให้ครบและถูกต้อง', false);
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
    showFeedback(itemFeedback, err.message, false);
  }
}

async function handleInventoryClick(event) {
  const button = event.target.closest('button');
  if (!button) return;
  const id = button.dataset.id;

  if (button.classList.contains('edit-btn')) {
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
      hideFeedback(itemFeedback);
    } catch (err) {
      console.error(err);
    }
  }

  if (button.classList.contains('delete-btn')) {
    if (confirm('คุณต้องการลบสินค้านี้หรือไม่?')) {
      try {
        await apiRequest(`/products/${id}`, {
          method: 'DELETE',
        });
        showFeedback(itemFeedback, 'ลบสินค้าเรียบร้อย', true);
        renderInventory();
      } catch (err) {
        showFeedback(itemFeedback, err.message, false);
      }
    }
  }
}

// Event Listeners
registerBtn.addEventListener('click', handleRegister);
loginBtn.addEventListener('click', handleLogin);
logoutBtn.addEventListener('click', handleLogout);
saveItemBtn.addEventListener('click', handleSaveItem);
cancelEditBtn.addEventListener('click', clearItemForm);
inventoryBody.addEventListener('click', handleInventoryClick);
themeToggleBtn?.addEventListener('click', toggleTheme);
toggleAuthBtn?.addEventListener('click', toggleAuthMode);

document.addEventListener('DOMContentLoaded', () => {
  applyTheme(getTheme());
  const token = getToken();
  if (token) {
    showStockView({ username: 'User' });
  } else {
    showAuthView();
  }
});
