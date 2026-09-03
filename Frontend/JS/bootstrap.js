// Nạp các màn hình và script theo từng miền nghiệp vụ. Thứ tự là bắt buộc vì
// giao diện cũ dùng hàm toàn cục qua thuộc tính onclick.
(async function bootstrapErp() {
  const root = document.getElementById('erp-app-root');
  const viewBase = 'views/';
  const views = [
    'planning.html', 'production.html', 'inventory.html', 'sales.html',
    'debts.html', 'dashboard.html', 'hr-payroll.html', 'wallet.html',
    'assets.html', 'finance.html', 'loans.html', 'history.html', 'directory-admin.html'
  ];
  const scripts = [
    'JS/core/app-core.js',
    'JS/modules/planning-production.js',
    'JS/modules/inventory-sales.js',
    'JS/modules/debts-dashboard.js',
    'JS/modules/hr-payroll.js',
    'JS/modules/finance-assets-loans.js',
    'JS/modules/system-wallet-mobile.js',
    'JS/api/api-core.js',
    'JS/api/directory-sales.js',
    'JS/api/auth-users-roles.js'
  ];

  const loadText = async path => {
    const response = await fetch(path, { cache: 'no-cache' });
    if (!response.ok) throw new Error(`Không thể tải ${path}`);
    return response.text();
  };
  const loadScript = src => new Promise((resolve, reject) => {
    const script = document.createElement('script');
    script.src = src;
    script.onload = resolve;
    script.onerror = () => reject(new Error(`Không thể tải ${src}`));
    document.body.appendChild(script);
  });

  try {
    root.innerHTML = await loadText(`${viewBase}app-shell.html`);
    const main = document.createElement('div');
    main.className = 'main-content';
    main.innerHTML = (await Promise.all(views.map(view => loadText(`${viewBase}${view}`)))).join('\n');
    root.appendChild(main);
    for (const script of scripts) await loadScript(script);
    if (typeof window.initializeFrontendDefaults === 'function') window.initializeFrontendDefaults();
    // Nếu fragment tải hoàn thành sau sự kiện load, chủ động khôi phục phiên.
    if (document.readyState === 'complete' && typeof window.onload === 'function') await window.onload();
  } catch (error) {
    console.error(error);
    root.innerHTML = `<div style="padding:24px;color:#b91c1c">Không thể khởi tạo ERP: ${error.message}</div>`;
  }
}());
