function showToast(message, type = 'success') {
  const container = document.getElementById('toast-container');
  if (!container) return;
  const id = `toast-${Date.now()}`;
  const bg = type === 'success' ? 'bg-success' : type === 'error' ? 'bg-danger' : 'bg-warning';
  const toast = document.createElement('div');
  toast.id = id;
  toast.className = `toast align-items-center text-white ${bg} border-0 show`;
  toast.setAttribute('role', 'alert');
  const flex = document.createElement('div');
  flex.className = 'd-flex';
  const body = document.createElement('div');
  body.className = 'toast-body';
  body.textContent = message;
  const close = document.createElement('button');
  close.type = 'button';
  close.className = 'btn-close btn-close-white me-2 m-auto';
  close.setAttribute('data-bs-dismiss', 'toast');
  flex.appendChild(body);
  flex.appendChild(close);
  toast.appendChild(flex);
  container.appendChild(toast);
  setTimeout(() => document.getElementById(id)?.remove(), 4000);
}

function showLoader(show = true) {
  let el = document.getElementById('global-loader');
  if (!el && show) {
    el = document.createElement('div');
    el.id = 'global-loader';
    el.className = 'overlay-loader';
    const spinner = document.createElement('div');
    spinner.className = 'spinner-border text-light';
    spinner.style.cssText = 'width:3rem;height:3rem';
    el.appendChild(spinner);
    document.body.appendChild(el);
  }
  if (el) el.style.display = show ? 'flex' : 'none';
}

function formatDate(iso) {
  if (!iso) return '';
  const d = new Date(iso);
  return d.toLocaleDateString('en-IN', { year: 'numeric', month: 'short', day: 'numeric' });
}

function getMonthYearOptions() {
  const months = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December',
  ];
  const now = new Date();
  const years = [];
  for (let y = now.getFullYear() - 2; y <= now.getFullYear() + 2; y++) years.push(y);
  return { months, years, currentMonth: now.getMonth() + 1, currentYear: now.getFullYear() };
}

function populateMonthYear(monthEl, yearEl, selectedMonth, selectedYear) {
  const { months, years, currentMonth, currentYear } = getMonthYearOptions();
  monthEl.innerHTML = months
    .map(
      (m, i) =>
        `<option value="${i + 1}" ${i + 1 === (selectedMonth || currentMonth) ? 'selected' : ''}>${m}</option>`
    )
    .join('');
  yearEl.innerHTML = years
    .map((y) => `<option value="${y}" ${y === (selectedYear || currentYear) ? 'selected' : ''}>${y}</option>`)
    .join('');
}

function exportToExcel(data, filename) {
  if (!data.length) return;
  const headers = Object.keys(data[0]);
  const csv = [
    headers.join(','),
    ...data.map((row) =>
      headers.map((h) => `"${String(row[h] ?? '').replace(/"/g, '""')}"`).join(',')
    ),
  ].join('\n');
  const blob = new Blob(['\ufeff' + csv], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  link.href = URL.createObjectURL(blob);
  link.download = filename;
  link.click();
}

function debounce(fn, delay = 300) {
  let timer;
  return (...args) => {
    clearTimeout(timer);
    timer = setTimeout(() => fn(...args), delay);
  };
}

function toggleTheme() {
  const html = document.documentElement;
  const isDark = html.getAttribute('data-theme') === 'dark';
  html.setAttribute('data-theme', isDark ? 'light' : 'dark');
  localStorage.setItem('dpr_theme', isDark ? 'light' : 'dark');
}

function initTheme() {
  document.documentElement.setAttribute('data-theme', localStorage.getItem('dpr_theme') || 'light');
}

function dprSelectClass(status) {
  const map = {
    Filled: 'status-filled',
    'Not Filled': 'status-not-filled',
    Holiday: 'status-holiday',
    'Comp Off': 'status-comp-off',
    'On Leave': 'status-on-leave',
    NA: 'status-na',
  };
  return map[status] || 'status-na';
}

function statusBadgeClass(label) {
  const map = {
    Excellent: 'bg-success',
    NA: 'bg-secondary',
    Best: 'bg-primary',
    Better: 'bg-info',
    Good: 'bg-warning text-dark',
    Improvement: 'bg-orange',
    Critical: 'bg-danger',
  };
  return map[label] || 'bg-secondary';
}
