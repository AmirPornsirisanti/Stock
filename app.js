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

const USERS_KEY = 'stockManagerUsers';
const CURRENT_USER_KEY = 'stockManagerCurrentUser';
const THEME_KEY = 'stockManagerTheme';

function getUsers() {
  const stored = localStorage.getItem(USERS_KEY);
  return stored ? JSON.parse(stored) : [];
}

function saveUsers(users) {
  localStorage.setItem(USERS_KEY, JSON.stringify(users));
}

function getCurrentUser() {
  return localStorage.getItem(CURRENT_USER_KEY);
}

function setCurrentUser(username) {
  if (username) {
    localStorage.setItem(CURRENT_USER_KEY, username);
  } else {
    localStorage.removeItem(CURRENT_USER_KEY);
  }
}

function getTheme() {
  return localStorage.getItem(THEME_KEY) || 'light';
}

function applyTheme(theme) {
  document.documentElement.setAttribute('data-theme', theme);
  if (themeToggleBtn) {
    themeToggleBtn.textContent = theme === 'dark' ? 'โหมดสว่าง' : 'โหมดมืด';
  }
}

function setTheme(theme) {
  localStorage.setItem(THEME_KEY, theme);
  applyTheme(theme);
}

function toggleTheme() {
  setTheme(getTheme() === 'dark' ? 'light' : 'dark');
}

function getInventory(username) {
  const data = localStorage.getItem(`stockManagerData_${username}`);
  if (!data) return [];
  return JSON.parse(data);
}

function saveInventory(username, items) {
  localStorage.setItem(`stockManagerData_${username}`, JSON.stringify(items));
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

function showStockView() {
  authSection.classList.add('hidden');
  stockSection.classList.remove('hidden');
  const currentUser = getCurrentUser();
  welcomeUser.textContent = `ยินดีต้อนรับ ${currentUser}`;
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

function renderInventory() {
  const currentUser = getCurrentUser();
  if (!currentUser) return;

  const inventory = getInventory(currentUser);
  inventoryBody.innerHTML = '';

  if (inventory.length === 0) {
    inventoryBody.innerHTML = '<tr><td colspan="5" style="color: var(--muted);">ยังไม่มีสินค้าคงคลัง</td></tr>';
    return;
  }

  inventory.forEach((item) => {
    const row = document.createElement('tr');
    row.innerHTML = `
      <td>${item.name}</td>
      <td>${item.quantity}</td>
      <td>${item.price.toLocaleString('th-TH', { style: 'currency', currency: 'THB' })}</td>
      <td>${item.category}</td>
      <td>
        <button class="edit" data-id="${item.id}">แก้ไข</button>
        <button class="delete" data-id="${item.id}">ลบ</button>
      </td>
    `;
    inventoryBody.appendChild(row);
  });
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

function findUser(username) {
  const users = getUsers();
  return users.find((user) => user.username === username);
}

function handleRegister() {
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

  if (findUser(username)) {
    showFeedback(registerFeedback, 'มีชื่อผู้ใช้นี้แล้ว กรุณาเลือกชื่ออื่น');
    return;
  }

  const users = getUsers();
  users.push({ username, password });
  saveUsers(users);
  localStorage.setItem(`stockManagerData_${username}`, JSON.stringify([]));
  showFeedback(registerFeedback, 'สมัครสมาชิกสำเร็จ! สามารถเข้าสู่ระบบได้', true);
  registerUsername.value = '';
  registerPassword.value = '';
  registerPasswordConfirm.value = '';
  switchTab('login');
}

function handleLogin() {
  const username = loginUsername.value.trim();
  const password = loginPassword.value;

  if (!username || !password) {
    showFeedback(loginFeedback, 'กรุณากรอกชื่อผู้ใช้และรหัสผ่าน');
    return;
  }

  const user = findUser(username);
  if (!user || user.password !== password) {
    showFeedback(loginFeedback, 'ชื่อผู้ใช้หรือรหัสผ่านไม่ถูกต้อง');
    return;
  }

  setCurrentUser(username);
  loginUsername.value = '';
  loginPassword.value = '';
  showStockView();
}

function handleLogout() {
  setCurrentUser(null);
  showAuthView();
}

function handleSaveItem() {
  const currentUser = getCurrentUser();
  if (!currentUser) return;

  const name = productName.value.trim();
  const quantity = Number(productQty.value);
  const price = Number(productPrice.value);
  const category = productCategory.value.trim();

  if (!name || isNaN(quantity) || quantity < 0 || isNaN(price) || price < 0 || !category) {
    showFeedback(itemFeedback, 'กรุณากรอกข้อมูลสินค้าให้ครบและถูกต้อง');
    return;
  }

  const inventory = getInventory(currentUser);

  if (editingItemId) {
    const itemIndex = inventory.findIndex((item) => item.id === editingItemId);
    if (itemIndex !== -1) {
      inventory[itemIndex] = {
        ...inventory[itemIndex],
        name,
        quantity,
        price,
        category,
      };
      showFeedback(itemFeedback, 'แก้ไขสินค้าเรียบร้อย', true);
    }
  } else {
    inventory.push({
      id: `item_${Date.now()}`,
      name,
      quantity,
      price,
      category,
    });
    showFeedback(itemFeedback, 'เพิ่มสินค้าเรียบร้อย', true);
  }

  saveInventory(currentUser, inventory);
  renderInventory();
  clearItemForm();
}

function handleInventoryClick(event) {
  const button = event.target.closest('button');
  if (!button) return;
  const id = button.dataset.id;
  const currentUser = getCurrentUser();
  const inventory = getInventory(currentUser);

  if (button.classList.contains('edit')) {
    const item = inventory.find((product) => product.id === id);
    if (!item) return;
    editingItemId = item.id;
    productName.value = item.name;
    productQty.value = item.quantity;
    productPrice.value = item.price;
    productCategory.value = item.category;
    saveItemBtn.textContent = 'บันทึกการแก้ไข';
    cancelEditBtn.classList.remove('hidden');
    itemFeedback.textContent = '';
  }

  if (button.classList.contains('delete')) {
    const updated = inventory.filter((product) => product.id !== id);
    saveInventory(currentUser, updated);
    renderInventory();
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
  const currentUser = getCurrentUser();
  if (currentUser) {
    showStockView();
  } else {
    showAuthView();
  }
});
