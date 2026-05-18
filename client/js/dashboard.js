let state = { page: 1, limit: 10, sortBy: 'employee_name', sortOrder: 'asc', search: '', exportData: [] };

document.addEventListener('DOMContentLoaded', () => {
  if (!requireAuth()) return;
  initTheme();
  initLayout('dashboard', 'DPR Dashboard');
  document.getElementById('page-content').innerHTML = getDashboardHTML();
  populateMonthYear(document.getElementById('filterMonth'), document.getElementById('filterYear'));
  bindEvents();
  loadDashboard();
});

function getDashboardHTML() {
  return `
    <div class="row g-3 mb-4" id="summaryCards"></div>
    <div class="card border-0 shadow-sm mb-3">
      <div class="card-body">
        <div class="row g-2 align-items-end">
          <div class="col-md-2"><label class="form-label">Month</label><select id="filterMonth" class="form-select"></select></div>
          <div class="col-md-2"><label class="form-label">Year</label><select id="filterYear" class="form-select"></select></div>
          <div class="col-md-4"><label class="form-label">Search</label><input type="text" id="searchInput" class="form-control" placeholder="Name, ID or email" /></div>
          <div class="col-md-4 d-flex gap-2">
            <button class="btn btn-primary" id="applyFilter"><i class="bi bi-funnel me-1"></i>Apply</button>
            <button class="btn btn-success" id="exportBtn"><i class="bi bi-file-earmark-excel me-1"></i>Export</button>
            <button class="btn btn-info" id="sendToAllBtn" title="Send notifications to all employees with missing days"><i class="bi bi-envelope-paper me-1"></i>Send to All</button>
          </div>
        </div>
      </div>
    </div>
    <div class="card border-0 shadow-sm">
      <div class="table-responsive">
        <table class="table table-hover mb-0">
          <thead class="table-dark">
            <tr>
              <th class="sortable" data-sort="employee_name">Employee Name</th>
          <th class="sortable" data-sort="employee_id">Employee ID</th>
          <th class="sortable" data-sort="dpr_status">DPR Status</th>
          <th class="sortable" data-sort="not_filled_count">Missing Days</th>
          <th class="sortable" data-sort="email">Email ID</th>
          <th>Action</th>
            </tr>
          </thead>
          <tbody id="dashboardBody"></tbody>
        </table>
      </div>
      <div class="card-footer d-flex justify-content-between align-items-center">
        <span id="paginationInfo" class="text-muted small"></span>
        <nav><ul class="pagination pagination-sm mb-0" id="pagination"></ul></nav>
      </div>
    </div>`;
}

function bindEvents() {
  document.getElementById('applyFilter').addEventListener('click', () => { state.page = 1; loadDashboard(); });
  document.getElementById('searchInput').addEventListener('input', debounce(() => { state.page = 1; state.search = document.getElementById('searchInput').value; loadDashboard(); }));
  document.getElementById('exportBtn').addEventListener('click', () => {
    if (!state.exportData.length) { showToast('No data to export', 'error'); return; }
    exportToExcel(state.exportData, `dpr-dashboard-${Date.now()}.csv`);
  });
  document.getElementById('sendToAllBtn').addEventListener('click', sendNotificationsToAll);
  document.querySelectorAll('.sortable').forEach((th) => {
    th.addEventListener('click', () => {
      const field = th.dataset.sort;
      if (state.sortBy === field) state.sortOrder = state.sortOrder === 'asc' ? 'desc' : 'asc';
      else { state.sortBy = field; state.sortOrder = 'asc'; }
      loadDashboard();
    });
  });
}

async function loadDashboard() {
  const month = document.getElementById('filterMonth').value;
  const year = document.getElementById('filterYear').value;
  state.search = document.getElementById('searchInput').value;
  showLoader(true);
  try {
    const res = await api.getDashboard({ month, year, search: state.search, page: state.page, limit: state.limit, sortBy: state.sortBy, sortOrder: state.sortOrder });
    renderSummary(res.summary);
    renderTable(res.data);
    renderPagination(res.page, res.totalPages, res.total);
    state.exportData = res.data.map((r) => ({
      'Employee Name': r.employee_name,
      'Employee ID': r.employee_id,
      'DPR Status': r.dpr_status,
      'Missing Days': r.not_filled_count,
      'Email': r.email,
    }));
  } catch (err) {
    showToast(err.message, 'error');
  } finally {
    showLoader(false);
  }
}

function renderSummary(summary) {
  const cards = [
    { label: 'Total', key: 'total', class: 'text-primary' },
    { label: 'Excellent', key: 'Excellent', class: 'text-success' },
    { label: 'Best', key: 'Best', class: 'text-primary' },
    { label: 'Better', key: 'Better', class: 'text-info' },
    { label: 'Good', key: 'Good', class: 'text-warning' },
    { label: 'Improvement', key: 'Improvement', class: 'text-orange' },
    { label: 'Critical', key: 'Critical', class: 'text-danger' },
  ];
  document.getElementById('summaryCards').innerHTML = cards.map((c) => `
    <div class="col-6 col-md-4 col-lg">
      <div class="card card-stat p-3">
        <div class="text-muted small">${c.label}</div>
        <div class="stat-value ${c.class}">${summary[c.key] || 0}</div>
      </div>
    </div>`).join('');
}

function renderTable(rows) {
  const tbody = document.getElementById('dashboardBody');
  if (!rows.length) {
    tbody.innerHTML = '<tr><td colspan="6" class="text-center text-muted py-4">No employees found</td></tr>';
    return;
  }
  tbody.innerHTML = rows.map((r) => `
    <tr>
      <td>${r.employee_name}</td>
      <td>${r.employee_id}</td>
      <td><span class="badge ${r.badge_class}">${r.dpr_status}</span></td>
      <td>${r.not_filled_count}</td>
      <td>${r.email}</td>
      <td>
        <a href="/pages/dpr-detailing.html?employee=${encodeURIComponent(r.employee_id)}&month=${document.getElementById('filterMonth').value}&year=${document.getElementById('filterYear').value}" class="btn btn-sm btn-outline-primary me-1">
          <i class="bi bi-table me-1"></i>DPR Detailing
        </a>
        <button class="btn btn-sm btn-outline-success send-notify" data-emp="${encodeURIComponent(r.employee_id)}" title="Send missing DPR notification">
          <i class="bi bi-envelope-paper"></i>
        </button>
      </td>
    </tr>`).join('');
  // attach send notification handlers
  tbody.querySelectorAll('.send-notify').forEach((btn) => {
    btn.addEventListener('click', async () => {
      const empId = decodeURIComponent(btn.dataset.emp);
      const month = document.getElementById('filterMonth').value;
      const year = document.getElementById('filterYear').value;
      if (!confirm('Send missing DPR notification to this employee?')) return;
      showLoader(true);
      try {
        const res = await api.sendMissingDaysNotification(empId, month, year);
        showToast(res.message || 'Notification sent');
      } catch (err) {
        showToast(err.message || 'Failed to send notification', 'error');
      } finally {
        showLoader(false);
      }
    });
  });
}

async function sendNotificationsToAll() {
  const month = document.getElementById('filterMonth').value;
  const year = document.getElementById('filterYear').value;
  if (!month || !year) { showToast('Please select Month and Year', 'error'); return; }
  const confirm = window.confirm('Send notifications to all employees with missing DPR days?');
  if (!confirm) return;
  showLoader(true);
  try {
    const res = await api.sendNotificationsToAll({ month: Number(month), year: Number(year) });
    showToast(`Notifications sent to ${res.sentCount} employee(s)`);
  } catch (err) {
    showToast(err.message, 'error');
  } finally {
    showLoader(false);
  }
}

function renderPagination(page, totalPages, total) {
  document.getElementById('paginationInfo').textContent = `Page ${page} of ${totalPages || 1} (${total} employees)`;
  const ul = document.getElementById('pagination');
  let html = '';
  for (let i = 1; i <= totalPages; i++) {
    html += `<li class="page-item ${i === page ? 'active' : ''}"><a class="page-link" href="#" data-page="${i}">${i}</a></li>`;
  }
  ul.innerHTML = html;
  ul.querySelectorAll('.page-link').forEach((a) => {
    a.addEventListener('click', (e) => { e.preventDefault(); state.page = Number(a.dataset.page); loadDashboard(); });
  });
}
