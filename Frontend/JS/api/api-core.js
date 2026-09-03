// Khi backend Node phục vụ frontend (localhost:4000 hoặc Railway), dùng cùng
// origin. Chỉ khi mở file frontend qua web server local riêng mới gọi API local.
const isStandaloneLocalFrontend = ['127.0.0.1', 'localhost'].includes(window.location.hostname)
  && window.location.port !== '4000';
window.ERP_API_BASE_URL = window.ERP_API_BASE_URL || (isStandaloneLocalFrontend
  ? 'http://127.0.0.1:4000/api'
  : `${window.location.origin}/api`);

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
