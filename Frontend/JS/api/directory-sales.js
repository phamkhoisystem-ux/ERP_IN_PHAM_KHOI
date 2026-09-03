const directoryConfig = {
  employees: { endpoint: '/resources/employees', prefix: 'employee', fields: ['name', 'date_of_birth', 'phone', 'position'] },
  customers: { endpoint: '/catalog/customers', prefix: 'customer', fields: ['name', 'date_of_birth', 'phone'] },
  suppliers: { endpoint: '/catalog/suppliers', prefix: 'supplier', fields: ['name', 'processing_type', 'contact_name', 'contact_date_of_birth', 'phone'] }
};
window.directoryRows = window.directoryRows || {};
window.directoryEditing = window.directoryEditing || {};

const directoryActions = (type, id) => `<button class="btn-small btn-outline" onclick="editDirectory('${type}', ${Number(id)})">Sửa</button> <button class="btn-small btn-danger" onclick="deleteDirectory('${type}', ${Number(id)})">Xóa</button>`;
const directoryColspan = type => type === 'customers' ? 5 : 7;

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
      if (type === 'employees') return `<tr><td>${escapeHtml(row.employee_code || `NV-${row.id}`)}</td><td><b>${escapeHtml(row.name)}</b></td><td>${escapeHtml(row.date_of_birth || '')}</td><td>${escapeHtml(row.phone)}</td><td>${escapeHtml(row.position)}</td><td>${escapeHtml(row.status)}</td><td>${directoryActions(type, row.id)}</td></tr>`;
      const code = type === 'customers' ? row.customer_code : row.supplier_code;
      if (type === 'customers') return `<tr><td>${escapeHtml(code || '')}</td><td><b>${escapeHtml(row.name)}</b></td><td>${escapeHtml(row.date_of_birth || '')}</td><td>${escapeHtml(row.phone)}</td><td>${directoryActions(type, row.id)}</td></tr>`;
      return `<tr><td>${escapeHtml(code || '')}</td><td><b>${escapeHtml(row.name)}</b></td><td>${escapeHtml(row.processing_type || '')}</td><td>${escapeHtml(row.contact_name || '')}</td><td>${escapeHtml(row.contact_date_of_birth || '')}</td><td>${escapeHtml(row.phone)}</td><td>${directoryActions(type, row.id)}</td></tr>`;
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
  if (role !== 'ADMIN' && !modules.includes('directory') && !modules.includes(requiredModule)) return alert('Bạn chưa được cấp quyền xem danh bạ này.');
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

window.loadDirectoryBirthdays = async function loadDirectoryBirthdays() {
  const host = document.getElementById('directory_birthdays');
  const monthLabel = document.getElementById('directory_birthday_month');
  if (!host || !monthLabel) return;
  const now = new Date(); const month = now.getMonth() + 1;
  monthLabel.textContent = `Tháng ${month}/${now.getFullYear()}`;
  const dateInCurrentMonth = value => {
    const match = String(value || '').match(/^\d{4}-(\d{2})-(\d{2})/);
    return match && Number(match[1]) === month ? { day: Number(match[2]), value: String(value).slice(0, 10) } : null;
  };
  try {
    const results = await Promise.allSettled([window.erpApi('/resources/employees'), window.erpApi('/catalog/customers'), window.erpApi('/catalog/suppliers')]);
    const [employees, customers, suppliers] = results.map(result => result.status === 'fulfilled' ? result.value : []);
    const birthdays = [...employees.map(row => ({ type: 'Nhân viên', name: row.name, phone: row.phone, date: dateInCurrentMonth(row.date_of_birth) })), ...customers.map(row => ({ type: 'Khách hàng', name: row.name, phone: row.phone, date: dateInCurrentMonth(row.date_of_birth) })), ...suppliers.map(row => ({ type: 'Đối tác', name: row.contact_name || row.name, company: row.contact_name ? row.name : '', phone: row.phone, date: dateInCurrentMonth(row.contact_date_of_birth) }))].filter(item => item.date).sort((a, b) => a.date.day - b.date.day);
    host.innerHTML = birthdays.length ? birthdays.map(item => `<div class="birthday-item"><span class="birthday-date">${String(item.date.day).padStart(2, '0')}/${String(month).padStart(2, '0')}</span><div><b>${escapeHtml(item.name || '')}</b><small>${escapeHtml(item.type)}${item.company ? ` · ${escapeHtml(item.company)}` : ''}${item.phone ? ` · ${escapeHtml(item.phone)}` : ''}</small></div></div>`).join('') : '<p class="birthday-empty">Không có sinh nhật nào được cập nhật trong tháng này.</p>';
  } catch (error) { host.innerHTML = `<p class="birthday-empty">Không thể tải danh sách sinh nhật: ${escapeHtml(error.message)}</p>`; }
};

async function loadStateFromSql() {
  const result = await window.erpApi('/state');
  if (result.state && typeof db !== 'undefined') {
    db = result.state;
    localStorage.setItem('phamkhoi_db_v11', JSON.stringify(db));
    if (typeof renderAll === 'function') renderAll();
  }
}

