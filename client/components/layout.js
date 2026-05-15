function renderLayout(activePage, pageTitle) {
  const pages = [
    { id: 'dashboard', label: 'Dashboard', href: '/pages/dashboard.html', icon: 'bi-speedometer2' },
    { id: 'employees', label: 'Employee Master', href: '/pages/employee-master.html', icon: 'bi-people' },
    { id: 'dpr', label: 'DPR Detailing', href: '/pages/dpr-detailing.html', icon: 'bi-table' },
  ];

  const nav = pages
    .map(
      (p) =>
        `<a class="nav-link ${p.id === activePage ? 'active' : ''}" href="${p.href}">
          <i class="bi ${p.icon} me-2"></i>${p.label}
        </a>`
    )
    .join('');

  return `
    <aside class="sidebar" id="sidebar">
      <div class="p-3 border-bottom border-secondary">
        <h5 class="mb-0 text-white"><i class="bi bi-clipboard-data me-2"></i>DPR Tracker</h5>
        <small class="text-secondary">Admin Panel</small>
      </div>
      <nav class="nav flex-column py-3">${nav}</nav>
    </aside>
    <div class="main-content">
      <header class="top-navbar d-flex align-items-center justify-content-between">
        <div class="d-flex align-items-center gap-2">
          <button class="btn btn-outline-secondary btn-sm" id="sidebarToggle" type="button" title="Toggle sidebar">
            <i class="bi bi-layout-sidebar-inset"></i>
          </button>
          <h5 class="mb-0">${pageTitle}</h5>
        </div>
        <div class="d-flex align-items-center gap-2">
          <button class="btn btn-outline-secondary btn-sm" id="themeToggle" type="button" title="Toggle theme">
            <i class="bi bi-moon-stars"></i>
          </button>
          <button class="btn btn-outline-danger btn-sm" id="logoutBtn" type="button">
            <i class="bi bi-box-arrow-right me-1"></i>Logout
          </button>
        </div>
      </header>
      <main class="page-content" id="page-content"></main>
    </div>`;
}

function initLayout(activePage, pageTitle) {
  const shell = document.getElementById('app-shell');
  if (shell) shell.innerHTML = renderLayout(activePage, pageTitle);

  document.getElementById('themeToggle')?.addEventListener('click', toggleTheme);
  document.getElementById('logoutBtn')?.addEventListener('click', logout);
  document.getElementById('sidebarToggle')?.addEventListener('click', () => {
    const sidebar = document.getElementById('sidebar');
    const main = document.querySelector('.main-content');
    if (window.innerWidth <= 768) {
      sidebar?.classList.toggle('show');
    } else {
      sidebar?.classList.toggle('collapsed');
      main?.classList.toggle('collapsed');
    }
  });
}
