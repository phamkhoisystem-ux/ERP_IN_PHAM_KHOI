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

window.openChangePassword = function openChangePassword() {
  const overlay = document.getElementById('change-password-overlay');
  if (!overlay) return;
  ['password_current', 'password_new', 'password_confirm'].forEach(id => { document.getElementById(id).value = ''; });
  const error = document.getElementById('change-password-error');
  error.style.display = 'none'; error.textContent = '';
  overlay.style.display = 'flex';
  document.getElementById('password_current').focus();
};

window.closeChangePassword = function closeChangePassword() {
  const overlay = document.getElementById('change-password-overlay');
  if (overlay) overlay.style.display = 'none';
};

window.changePassword = async function changePassword() {
  const currentPassword = document.getElementById('password_current').value;
  const newPassword = document.getElementById('password_new').value;
  const confirmPassword = document.getElementById('password_confirm').value;
  const error = document.getElementById('change-password-error');
  try {
    if (newPassword.length < 8) throw new Error('Mật khẩu mới cần ít nhất 8 ký tự.');
    if (newPassword !== confirmPassword) throw new Error('Xác nhận mật khẩu mới chưa khớp.');
    await window.erpApi('/auth/change-password', { method: 'POST', body: JSON.stringify({ currentPassword, newPassword }) });
    closeChangePassword();
    alert('Đổi mật khẩu thành công. Bạn hãy dùng mật khẩu mới ở lần đăng nhập sau.');
  } catch (e) { error.textContent = `❌ ${e.message}`; error.style.display = 'block'; }
};

window.applyRolePermissions = function applyNodeRolePermissions() {
  const role = sessionStorage.getItem('userRole');
  const isAdmin = role === 'ADMIN';
  const modules = JSON.parse(sessionStorage.getItem('userModules') || '[]');
  const tabModules = { 'tab-kehoach': 'planning', 'tab-sanxuat': 'kanban', 'tab-tonkho': 'inventory', 'tab-danhba': 'directory', 'tab-banhang': 'sales', 'tab-congno': 'debts', 'tab-baocao': 'production_dashboard', 'tab-luong': 'payroll', 'tab-taisan': 'assets', 'tab-khoanvay': 'loans', 'tab-vitien': 'wallet', 'tab-taichinh': 'finance', 'tab-history-log': 'history' };
  document.querySelectorAll('.sidebar .nav-btn').forEach(button => {
    const match = button.getAttribute('onclick')?.match(/'(tab-[^']+)'/);
    if (match && !isAdmin) button.style.display = tabModules[match[1]] === 'directory' ? (modules.some(module => ['directory','payroll','sales','planning'].includes(module)) ? '' : 'none') : (modules.includes(tabModules[match[1]]) ? '' : 'none');
  });
  document.getElementById('nav-admin').style.display = isAdmin ? '' : 'none';
  const adminDataTools = document.getElementById('admin-data-tools');
  if (adminDataTools) adminDataTools.style.display = isAdmin ? '' : 'none';
  if (!isAdmin && document.getElementById('tab-admin').classList.contains('active')) openTab(null, 'tab-kehoach');
};

window.loadAdminAccounts = async function loadAdminAccounts() {
  try {
    const [users, employees] = await Promise.all([window.erpApi('/users'), window.erpApi('/resources/employees')]);
    const employeeSelect = document.getElementById('admin_employee_id');
    employeeSelect.innerHTML = '<option value="">Không liên kết hồ sơ</option>' + employees.map(e => `<option value="${e.id}">${e.employee_code || 'NV-' + e.id} — ${e.name}</option>`).join('');
    document.getElementById('admin_users_table').innerHTML = users.map(u => `<tr><td>${escapeHtml(u.username)}<br><small>${u.modules.map(escapeHtml).join(', ') || 'Theo role mặc định'}</small></td><td>${escapeHtml(u.role)}</td><td>${u.is_active ? '<span class="text-success">Đang hoạt động</span>' : '<span class="text-danger">Đã khóa</span>'}</td><td>${new Date(u.created_at).toLocaleDateString('vi-VN')}</td><td><button class="btn-small ${u.is_active ? 'btn-danger' : 'btn-success'}" onclick="toggleAdminUser(${u.id}, ${!u.is_active})">${u.is_active ? 'Khóa' : 'Mở khóa'}</button> <button class="btn-small btn-danger" onclick="deleteAdminUser(${u.id})">Xóa</button></td></tr>`).join('') || '<tr><td colspan="5">Chưa có tài khoản</td></tr>';
    await loadAdminPinStatus();
  } catch (e) { alert(e.message); }
};

window.loadAdminPinStatus = async function loadAdminPinStatus() {
  try {
    const result = await window.erpApi('/users/security-pin/status');
    const status = document.getElementById('admin_pin_status');
    const currentGroup = document.getElementById('admin_pin_current_group');
    const submit = document.getElementById('admin_pin_submit');
    if (!status || !currentGroup || !submit) return;
    status.textContent = result.isSet ? 'Mã PIN đã được tạo. Nhập PIN hiện tại để đổi.' : 'Chưa có mã PIN. Hãy tạo mã PIN đầu tiên.';
    currentGroup.style.display = result.isSet ? '' : 'none';
    submit.textContent = result.isSet ? 'Đổi mã PIN' : 'Tạo mã PIN';
    submit.dataset.pinIsSet = result.isSet ? 'true' : 'false';
  } catch (e) { const status = document.getElementById('admin_pin_status'); if (status) status.textContent = e.message; }
};

window.saveAdminPin = async function saveAdminPin() {
  const currentPin = document.getElementById('admin_pin_current').value;
  const newPin = document.getElementById('admin_pin_new').value;
  const confirmPin = document.getElementById('admin_pin_confirm').value;
  const submit = document.getElementById('admin_pin_submit');
  try {
    if (!/^\d{4,12}$/.test(newPin)) throw new Error('Mã PIN mới phải gồm từ 4 đến 12 chữ số.');
    if (newPin !== confirmPin) throw new Error('Xác nhận mã PIN chưa khớp.');
    if (submit.dataset.pinIsSet === 'true' && !currentPin) throw new Error('Vui lòng nhập mã PIN hiện tại.');
    const result = await window.erpApi('/users/security-pin', { method: 'PUT', body: JSON.stringify({ currentPin: currentPin || undefined, newPin }) });
    ['admin_pin_current', 'admin_pin_new', 'admin_pin_confirm'].forEach(id => { document.getElementById(id).value = ''; });
    alert(result.message); await loadAdminPinStatus();
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

window.deleteAdminUser = async function deleteAdminUser(id) {
  if (!confirm('Xóa vĩnh viễn tài khoản này? Tài khoản sẽ không thể đăng nhập lại.')) return;
  try {
    const result = await window.erpApi(`/users/${id}`, { method: 'DELETE' });
    alert(result.message); await loadAdminAccounts();
  } catch (e) { alert(e.message); }
};

const originalOpenTabForApi = window.openTab;
window.openTab = function (event, tabId) {
  const tabModules = { 'tab-kehoach': 'planning', 'tab-sanxuat': 'kanban', 'tab-tonkho': 'inventory', 'tab-danhba': 'directory', 'tab-banhang': 'sales', 'tab-congno': 'debts', 'tab-baocao': 'production_dashboard', 'tab-luong': 'payroll', 'tab-taisan': 'assets', 'tab-khoanvay': 'loans', 'tab-vitien': 'wallet', 'tab-taichinh': 'finance', 'tab-history-log': 'history' };
  const modules = JSON.parse(sessionStorage.getItem('userModules') || '[]');
  if (sessionStorage.getItem('userRole') !== 'ADMIN' && tabModules[tabId] === 'directory' && !modules.some(module => ['directory','payroll','sales','planning'].includes(module))) return alert('Bạn chưa được cấp quyền dùng Danh bạ.');
  if (sessionStorage.getItem('userRole') !== 'ADMIN' && tabModules[tabId] && tabModules[tabId] !== 'directory' && !modules.includes(tabModules[tabId])) return alert('Bạn chưa được cấp quyền dùng module này.');
  originalOpenTabForApi(event, tabId);
  if (tabId === 'tab-admin') loadAdminAccounts();
  if (tabId === 'tab-banhang') loadSalesCustomerDirectory();
  if (tabId === 'tab-danhba') { loadDirectoryBirthdays(); switchDirectoryTab(sessionStorage.getItem('userRole') === 'ADMIN' || modules.includes('directory') || modules.includes('payroll') ? 'employees' : (modules.includes('sales') ? 'customers' : 'suppliers')); }
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
