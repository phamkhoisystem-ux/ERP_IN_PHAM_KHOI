// Khi Node phục vụ frontend (http://localhost:4000), dùng cùng origin để tránh CORS.
window.ERP_API_BASE_URL = window.ERP_API_BASE_URL || (window.location.port === '4000'
  ? `${window.location.origin}/api`
  : 'http://127.0.0.1:4000/api');

window.erpApi = async function erpApi(path, options = {}) {
  const token = sessionStorage.getItem('accessToken');
  const response = await fetch(`${window.ERP_API_BASE_URL}${path}`, {
    ...options,
    headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}), ...(options.headers || {}) }
  });
  const body = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(body.message || 'Không thể gọi máy chủ ERP.');
  return body;
};

const escapeHtml = value => String(value ?? '').replace(/[&<>'"]/g, char => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;' })[char]);
const directoryConfig = {
  employees: { endpoint: '/resources/employees', prefix: 'employee', fields: ['name', 'phone', 'position'] },
  customers: { endpoint: '/catalog/customers', prefix: 'customer', fields: ['name', 'date_of_birth', 'phone'] },
  suppliers: { endpoint: '/catalog/suppliers', prefix: 'supplier', fields: ['name', 'processing_type', 'contact_name', 'phone'] }
};
window.directoryRows = window.directoryRows || {};
window.directoryEditing = window.directoryEditing || {};

const directoryActions = (type, id) => `<button class="btn-small btn-outline" onclick="editDirectory('${type}', ${Number(id)})">Sửa</button> <button class="btn-small btn-danger" onclick="deleteDirectory('${type}', ${Number(id)})">Xóa</button>`;
const directoryColspan = type => type === 'customers' ? 5 : 6;

function resetDirectoryForm(type) {
  const config = directoryConfig[type];
  config.fields.forEach(field => { const input = document.getElementById(`directory_${config.prefix}_${field}`); if (input) input.value = ''; });
  delete window.directoryEditing[type];
  const saveButton = document.getElementById(`directory_${type}_save`);
  const cancelButton = document.getElementById(`directory_${type}_cancel`);
  if (saveButton) saveButton.textContent = type === 'employees' ? 'LƯU NHÂN VIÊN' : (type === 'customers' ? 'LƯU KHÁCH HÀNG' : 'LƯU NHÀ CUNG CẤP');
  if (cancelButton) cancelButton.style.display = 'none';
}

window.loadDirectory = async function loadDirectory(type) {
  try {
    const config = directoryConfig[type]; const rows = await window.erpApi(config.endpoint);
    window.directoryRows[type] = rows;
    const html = rows.map(row => {
      if (type === 'employees') return `<tr><td>${escapeHtml(row.employee_code || `NV-${row.id}`)}</td><td><b>${escapeHtml(row.name)}</b></td><td>${escapeHtml(row.phone)}</td><td>${escapeHtml(row.position)}</td><td>${escapeHtml(row.status)}</td><td>${directoryActions(type, row.id)}</td></tr>`;
      const code = type === 'customers' ? row.customer_code : row.supplier_code;
      if (type === 'customers') return `<tr><td>${escapeHtml(code || '')}</td><td><b>${escapeHtml(row.name)}</b></td><td>${escapeHtml(row.date_of_birth || '')}</td><td>${escapeHtml(row.phone)}</td><td>${directoryActions(type, row.id)}</td></tr>`;
      return `<tr><td>${escapeHtml(code || '')}</td><td><b>${escapeHtml(row.name)}</b></td><td>${escapeHtml(row.processing_type || '')}</td><td>${escapeHtml(row.contact_name || '')}</td><td>${escapeHtml(row.phone)}</td><td>${directoryActions(type, row.id)}</td></tr>`;
    }).join('');
    document.getElementById(`directory_${type}_table`).innerHTML = html || `<tr><td colspan="${directoryColspan(type)}" style="text-align:center">Chưa có dữ liệu</td></tr>`;
  } catch (error) { alert(error.message); }
};

window.saveDirectory = async function saveDirectory(type) {
  try {
    const config = directoryConfig[type]; const payload = {};
    config.fields.forEach(field => { payload[field] = document.getElementById(`directory_${config.prefix}_${field}`).value.trim(); });
    if (!payload.name) throw new Error('Vui lòng nhập tên.');
    const editing = window.directoryEditing[type];
    if (editing) await window.erpApi(`${config.endpoint}/${editing.id}`, { method: 'PATCH', body: JSON.stringify(payload) });
    else {
      if (type === 'employees') { payload.employee_code = `NV-${Date.now()}`; payload.status = 'ACTIVE'; }
      await window.erpApi(config.endpoint, { method: 'POST', body: JSON.stringify(payload) });
    }
    resetDirectoryForm(type);
    await loadDirectory(type); alert(editing ? 'Đã cập nhật danh bạ.' : 'Đã lưu danh bạ vào MySQL.');
  } catch (error) { alert(error.message); }
};

window.editDirectory = function editDirectory(type, id) {
  const config = directoryConfig[type]; const row = (window.directoryRows[type] || []).find(item => Number(item.id) === Number(id));
  if (!row) return alert('Không tìm thấy dữ liệu cần sửa. Hãy tải lại danh bạ.');
  config.fields.forEach(field => { const input = document.getElementById(`directory_${config.prefix}_${field}`); if (input) input.value = row[field] || ''; });
  window.directoryEditing[type] = row;
  const saveButton = document.getElementById(`directory_${type}_save`);
  const cancelButton = document.getElementById(`directory_${type}_cancel`);
  if (saveButton) saveButton.textContent = 'CẬP NHẬT THÔNG TIN';
  if (cancelButton) cancelButton.style.display = '';
  const firstField = document.getElementById(`directory_${config.prefix}_name`);
  if (firstField) { firstField.scrollIntoView({ behavior: 'smooth', block: 'center' }); firstField.focus(); }
};

window.cancelDirectoryEdit = function cancelDirectoryEdit(type) { resetDirectoryForm(type); };

window.deleteDirectory = async function deleteDirectory(type, id) {
  const config = directoryConfig[type];
  if (!confirm('Xóa dữ liệu danh bạ này? Thao tác không thể hoàn tác.')) return;
  try {
    await window.erpApi(`${config.endpoint}/${id}`, { method: 'DELETE' });
    if (window.directoryEditing[type]?.id === id) resetDirectoryForm(type);
    await loadDirectory(type);
    alert('Đã xóa danh bạ.');
  } catch (error) { alert(error.message); }
};

// Phần Xuất bán hàng vẫn cho phép khách lẻ/tự nhập; danh sách này chỉ hỗ trợ chọn nhanh từ Danh bạ.
window.loadSalesCustomerDirectory = async function loadSalesCustomerDirectory() {
  const selector = document.getElementById('bh_customer_directory');
  if (!selector) return;
  try {
    const customers = await window.erpApi('/catalog/customers');
    selector.innerHTML = '<option value="">— Chọn từ Danh bạ (không bắt buộc) —</option>' + customers.map(customer => {
      const label = `${customer.name || ''}${customer.phone ? ` — ${customer.phone}` : ''}`;
      return `<option value="${escapeHtml(customer.name || '')}">${escapeHtml(label)}</option>`;
    }).join('');
  } catch (error) {
    // Không chặn thao tác bán hàng: người dùng vẫn có thể tự nhập khách hàng.
    selector.innerHTML = '<option value="">— Không tải được Danh bạ, hãy tự nhập —</option>';
  }
};

window.selectSalesCustomer = function selectSalesCustomer(name) {
  const input = document.getElementById('bh_kh');
  if (input) input.value = name || '';
};

window.clearSalesDirectorySelection = function clearSalesDirectorySelection() {
  const selector = document.getElementById('bh_customer_directory');
  if (selector) selector.value = '';
};

window.switchDirectoryTab = function switchDirectoryTab(type) {
  const requiredModule = { employees: 'payroll', customers: 'sales', suppliers: 'planning' }[type];
  const role = sessionStorage.getItem('userRole');
  const modules = JSON.parse(sessionStorage.getItem('userModules') || '[]');
  if (role !== 'ADMIN' && !modules.includes(requiredModule)) return alert('Bạn chưa được cấp quyền xem danh bạ này.');
  const sections = { employees: 'tab-nhanvien', customers: 'tab-khachhang', suppliers: 'tab-doitac' };
  const host = document.getElementById('directory_tab_host');
  Object.entries(sections).forEach(([key, id]) => {
    const section = document.getElementById(id);
    if (!section) return;
    if (section.parentElement !== host) { section.classList.remove('module'); section.classList.add('directory-section'); host.appendChild(section); }
    section.style.display = key === type ? 'block' : 'none';
  });
  document.querySelectorAll('[data-directory-tab]').forEach(button => button.classList.toggle('active', button.dataset.directoryTab === type));
  loadDirectory(type);
};

async function loadStateFromSql() {
  const result = await window.erpApi('/state');
  if (result.state && typeof db !== 'undefined') {
    db = result.state;
    localStorage.setItem('phamkhoi_db_v11', JSON.stringify(db));
    if (typeof renderAll === 'function') renderAll();
  }
}

window.verifyLogin = async function verifyLoginWithNodeApi() {
  const username = document.getElementById('username-input').value.trim();
  const password = document.getElementById('password-input').value;
  const error = document.getElementById('login-error');
  const button = document.querySelector('button[onclick="verifyLogin()"]');
  if (!username || !password) { error.textContent = '❌ Nhập tên đăng nhập và mật khẩu.'; error.style.display = 'block'; return; }
  button.disabled = true;
  try {
    const result = await window.erpApi('/auth/login', { method: 'POST', body: JSON.stringify({ username, password }) });
    sessionStorage.setItem('accessToken', result.accessToken);
    sessionStorage.setItem('isLoggedIn', 'true');
    sessionStorage.setItem('userRole', result.user.role);
    sessionStorage.setItem('userModules', JSON.stringify(result.user.modules || []));
    sessionStorage.setItem('userPermissions', JSON.stringify(result.user.permissions));
    await loadStateFromSql();
    document.getElementById('login-overlay').style.display = 'none';
    applyRolePermissions();
  } catch (e) { error.textContent = `❌ ${e.message}`; error.style.display = 'block'; }
  finally { button.disabled = false; }
};

window.logoutAccount = function logoutAccount() {
  if (!confirm('Bạn muốn đăng xuất khỏi tài khoản này?')) return;
  ['accessToken', 'isLoggedIn', 'userRole', 'userModules', 'userPermissions'].forEach(key => sessionStorage.removeItem(key));
  window.location.reload();
};

window.applyRolePermissions = function applyNodeRolePermissions() {
  const role = sessionStorage.getItem('userRole');
  const isAdmin = role === 'ADMIN';
  const modules = JSON.parse(sessionStorage.getItem('userModules') || '[]');
  const tabModules = { 'tab-kehoach': 'planning', 'tab-sanxuat': 'kanban', 'tab-tonkho': 'inventory', 'tab-danhba': 'directory', 'tab-banhang': 'sales', 'tab-congno': 'debts', 'tab-baocao': 'production_dashboard', 'tab-luong': 'payroll', 'tab-taisan': 'assets', 'tab-khoanvay': 'loans', 'tab-vitien': 'wallet', 'tab-taichinh': 'finance', 'tab-history-log': 'history' };
  document.querySelectorAll('.sidebar .nav-btn').forEach(button => {
    const match = button.getAttribute('onclick')?.match(/'(tab-[^']+)'/);
    if (match && !isAdmin) button.style.display = tabModules[match[1]] === 'directory' ? (modules.some(module => ['payroll','sales','planning'].includes(module)) ? '' : 'none') : (modules.includes(tabModules[match[1]]) ? '' : 'none');
  });
  document.getElementById('nav-admin').style.display = isAdmin ? '' : 'none';
  if (!isAdmin && document.getElementById('tab-admin').classList.contains('active')) openTab(null, 'tab-kehoach');
};

window.loadAdminAccounts = async function loadAdminAccounts() {
  try {
    const [users, employees] = await Promise.all([window.erpApi('/users'), window.erpApi('/resources/employees')]);
    const employeeSelect = document.getElementById('admin_employee_id');
    employeeSelect.innerHTML = '<option value="">Không liên kết hồ sơ</option>' + employees.map(e => `<option value="${e.id}">${e.employee_code || 'NV-' + e.id} — ${e.name}</option>`).join('');
    document.getElementById('admin_users_table').innerHTML = users.map(u => `<tr><td>${u.username}<br><small>${u.modules.join(', ') || 'Theo role mặc định'}</small></td><td>${u.role}</td><td>${u.is_active ? '<span class="text-success">Đang hoạt động</span>' : '<span class="text-danger">Đã khóa</span>'}</td><td>${new Date(u.created_at).toLocaleDateString('vi-VN')}</td><td><button class="btn-small ${u.is_active ? 'btn-danger' : 'btn-success'}" onclick="toggleAdminUser(${u.id}, ${!u.is_active})">${u.is_active ? 'Khóa' : 'Mở khóa'}</button></td></tr>`).join('') || '<tr><td colspan="5">Chưa có tài khoản</td></tr>';
  } catch (e) { alert(e.message); }
};

window.createEmployeeAccount = async function createEmployeeAccount() {
  try {
    const payload = { username: document.getElementById('admin_username').value.trim(), password: document.getElementById('admin_password').value, role: document.getElementById('admin_role').value, modules: [...document.querySelectorAll('#admin_modules input:checked')].map(input => input.value) };
    const employeeId = document.getElementById('admin_employee_id').value;
    if (employeeId) payload.employeeId = Number(employeeId);
    await window.erpApi('/users', { method: 'POST', body: JSON.stringify(payload) });
    document.getElementById('admin_username').value = ''; document.getElementById('admin_password').value = ''; document.querySelectorAll('#admin_modules input:checked').forEach(input => { input.checked = false; });
    alert('Đã tạo tài khoản nhân viên.'); loadAdminAccounts();
  } catch (e) { alert(e.message); }
};

window.toggleAdminUser = async function toggleAdminUser(id, isActive) {
  try { await window.erpApi(`/users/${id}`, { method: 'PATCH', body: JSON.stringify({ isActive }) }); loadAdminAccounts(); }
  catch (e) { alert(e.message); }
};

const originalOpenTabForApi = window.openTab;
window.openTab = function (event, tabId) {
  const tabModules = { 'tab-kehoach': 'planning', 'tab-sanxuat': 'kanban', 'tab-tonkho': 'inventory', 'tab-danhba': 'directory', 'tab-banhang': 'sales', 'tab-congno': 'debts', 'tab-baocao': 'production_dashboard', 'tab-luong': 'payroll', 'tab-taisan': 'assets', 'tab-khoanvay': 'loans', 'tab-vitien': 'wallet', 'tab-taichinh': 'finance', 'tab-history-log': 'history' };
  const modules = JSON.parse(sessionStorage.getItem('userModules') || '[]');
  if (sessionStorage.getItem('userRole') !== 'ADMIN' && tabModules[tabId] === 'directory' && !modules.some(module => ['payroll','sales','planning'].includes(module))) return alert('Bạn chưa được cấp quyền dùng Danh bạ.');
  if (sessionStorage.getItem('userRole') !== 'ADMIN' && tabModules[tabId] && tabModules[tabId] !== 'directory' && !modules.includes(tabModules[tabId])) return alert('Bạn chưa được cấp quyền dùng module này.');
  originalOpenTabForApi(event, tabId);
  if (tabId === 'tab-admin') loadAdminAccounts();
  if (tabId === 'tab-banhang') loadSalesCustomerDirectory();
  if (tabId === 'tab-danhba') switchDirectoryTab(sessionStorage.getItem('userRole') === 'ADMIN' || modules.includes('payroll') ? 'employees' : (modules.includes('sales') ? 'customers' : 'suppliers'));
};

window.onload = async function restoreNodeSession() {
  if (sessionStorage.getItem('accessToken')) {
    try {
      const result = await window.erpApi('/auth/me');
      sessionStorage.setItem('userRole', result.user.role);
      sessionStorage.setItem('userModules', JSON.stringify(result.user.modules || []));
      sessionStorage.setItem('userPermissions', JSON.stringify(result.permissions));
      await loadStateFromSql();
      document.getElementById('login-overlay').style.display = 'none'; applyRolePermissions(); return;
    } catch (_) { sessionStorage.clear(); }
  }
  document.getElementById('login-overlay').style.display = 'flex';
};
