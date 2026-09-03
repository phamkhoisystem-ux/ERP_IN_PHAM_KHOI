export const ROLES = Object.freeze({
  ADMIN: 'ADMIN', SALE: 'SALE', DESIGNER: 'DESIGNER', WORKER: 'WORKER',
  THUQUY: 'THUQUY', ACCOUNTANT: 'ACCOUNTANT', OTHER: 'OTHER'
});

export const MODULES = Object.freeze([
  'planning', 'kanban', 'inventory', 'sales', 'debts', 'production_dashboard',
  'payroll', 'assets', 'loans', 'wallet', 'finance', 'history', 'directory'
]);

const MODULE_BY_PERMISSION = Object.freeze({
  'customers:read': 'sales', 'customers:write': 'sales', 'suppliers:read': 'planning', 'suppliers:write': 'planning',
  'products:read': 'inventory', 'products:write': 'inventory', 'materials:read': 'inventory', 'materials:write': 'inventory',
  'plans:read': 'planning', 'plans:write': 'planning', 'orders:read': 'kanban', 'orders:update_status': 'kanban',
  'production_logs:read': 'production_dashboard', 'production_logs:write': 'production_dashboard',
  'sales:read': 'sales', 'sales:write': 'sales', 'supplier_debts:read': 'debts', 'supplier_debts:write': 'debts',
  'supplier_payments:read': 'debts', 'supplier_payments:write': 'debts', 'wallet:read': 'wallet', 'wallet:write': 'wallet',
  'employees:read': 'payroll', 'employees:write': 'payroll', 'salary:read': 'payroll', 'salary:write': 'payroll',
  'assets:read': 'assets', 'assets:write': 'assets', 'loans:read': 'loans', 'loans:write': 'loans', 'reports:read': 'history'
});

// Permission is enforced on the server; hiding buttons in the UI is only a convenience.
export const PERMISSIONS = Object.freeze({
  ADMIN: ['*'],
  SALE: ['customers:read', 'customers:write', 'products:read', 'sales:read', 'sales:write'],
  DESIGNER: ['customers:read', 'suppliers:read', 'products:read', 'plans:read', 'plans:write', 'orders:read'],
  WORKER: ['orders:read', 'orders:update_status', 'production_logs:read', 'production_logs:write', 'materials:read'],
  THUQUY: ['wallet:read', 'wallet:write', 'supplier_debts:read', 'supplier_payments:read', 'supplier_payments:write'],
  ACCOUNTANT: ['employees:read', 'employees:write', 'customers:read', 'suppliers:read', 'materials:read', 'materials:write', 'products:read', 'sales:read', 'supplier_debts:read', 'supplier_debts:write', 'supplier_payments:read', 'supplier_payments:write', 'wallet:read', 'wallet:write', 'assets:read', 'assets:write', 'loans:read', 'loans:write', 'salary:read', 'salary:write', 'reports:read'],
  OTHER: []
});

export function hasPermission(role, permission, modules = []) {
  const granted = PERMISSIONS[role] || [];
  if (granted.includes('*')) return true;
  // Once ADMIN has assigned explicit modules, those modules take precedence over
  // the role template; old accounts without assignments keep legacy role access.
  // Danh bạ là module độc lập: cho phép quản lý nhân viên, khách hàng và đối tác
  // mà không phải cấp thêm các module Lương, Bán hàng hoặc Kế hoạch.
  if (modules.length && modules.includes('directory') && /^(employees|customers|suppliers):(read|write)$/.test(permission)) return true;
  if (modules.length) return modules.includes(MODULE_BY_PERMISSION[permission]);
  return granted.includes(permission);
}
