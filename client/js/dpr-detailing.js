const DPR_OPTIONS = ['NA', 'Filled', 'Not Filled', 'Holiday', 'Comp Off'];
let matrixData = { dates: [], rows: [] };

document.addEventListener('DOMContentLoaded', () => {
  if (!requireAuth()) return;
  initTheme();
  initLayout('dpr', 'DPR Detailing');
  document.getElementById('page-content').innerHTML = getPageHTML();
  const params = new URLSearchParams(window.location.search);
  const month = Number(params.get('month')) || new Date().getMonth() + 1;
  const year = Number(params.get('year')) || new Date().getFullYear();
  populateMonthYear(document.getElementById('filterMonth'), document.getElementById('filterYear'), month, year);
  if (params.get('employee')) document.getElementById('searchInput').value = params.get('employee');
  bindEvents();
  loadMatrix();
});

function getPageHTML() {
  return `
    <div class="card border-0 shadow-sm mb-3">
      <div class="card-body">
        <div class="row g-2 align-items-end">
          <div class="col-md-2"><label class="form-label">Month</label><select id="filterMonth" class="form-select"></select></div>
          <div class="col-md-2"><label class="form-label">Year</label><select id="filterYear" class="form-select"></select></div>
          <motion-div class="col-md-4"><label class="form-label">Search Employee</label><input type="text" id="searchInput" class="form-control" placeholder="Name or ID" /></motion-div>
          <div class="col-md-4 d-flex gap-2 flex-wrap">
            <button class="btn btn-primary" id="loadBtn"><i class="bi bi-arrow-clockwise me-1"></i>Load</button>
            <button class="btn btn-success" id="saveBtn"><i class="bi bi-save me-1"></i>Save</button>
            <a href="/pages/dashboard.html" class="btn btn-secondary"><i class="bi bi-arrow-left me-1"></i>Back</a>
          </div>
        </div>
      </div>
    </div>
    <div class="dpr-matrix-wrapper">
      <table class="dpr-matrix-table" id="dprMatrix">
        <thead id="matrixHead"></thead>
        <tbody id="matrixBody"></tbody>
      </table>
    </div>`.replace(/motion-div/g, 'div');
}

function bindEvents() {
  document.getElementById('loadBtn').addEventListener('click', loadMatrix);
  document.getElementById('saveBtn').addEventListener('click', saveMatrix);
  document.getElementById('searchInput').addEventListener('input', debounce(loadMatrix));
  document.getElementById('filterMonth').addEventListener('change', loadMatrix);
  document.getElementById('filterYear').addEventListener('change', loadMatrix);
}

async function loadMatrix() {
  const month = document.getElementById('filterMonth').value;
  const year = document.getElementById('filterYear').value;
  const search = document.getElementById('searchInput').value;
  showLoader(true);
  try {
    const res = await api.getDpr({ month, year, search });
    matrixData = res.data;
    renderMatrix();
  } catch (err) {
    showToast(err.message, 'error');
  } finally {
    showLoader(false);
  }
}

function renderMatrix() {
  const { dates, rows } = matrixData;
  const head = document.getElementById('matrixHead');
  const body = document.getElementById('matrixBody');

  head.innerHTML = `<tr>
    <th class="sticky-col">Employee Name</th>
    <th class="sticky-col-2">Employee ID</th>
    ${dates.map((d) => `<th>${d.label}</th>`).join('')}
  </tr>`;

  if (!rows.length) {
    body.innerHTML = `<tr><td colspan="${dates.length + 2}" class="text-center py-4">No employees for selected period</td></tr>`;
    return;
  }

  body.innerHTML = rows.map((row) => `
    <tr data-emp-id="${row.id}">
      <td class="sticky-col">${row.employee_name}</td>
      <td class="sticky-col-2">${row.employee_id}</td>
      ${dates.map((d) => {
        const val = row.cells[d.date] || 'NA';
        return `<td><select class="dpr-select ${dprSelectClass(val)}" data-date="${d.date}" data-emp="${row.id}">${DPR_OPTIONS.map((o) => `<option value="${o}" ${o === val ? 'selected' : ''}>${o}</option>`).join('')}</select></td>`;
      }).join('')}
    </tr>`).join('');

  body.querySelectorAll('.dpr-select').forEach((sel) => {
    sel.addEventListener('change', () => {
      sel.className = `dpr-select ${dprSelectClass(sel.value)}`;
    });
  });
}

async function saveMatrix() {
  const entries = [];
  document.querySelectorAll('#matrixBody tr[data-emp-id]').forEach((tr) => {
    const empId = tr.dataset.empId;
    tr.querySelectorAll('.dpr-select').forEach((sel) => {
      entries.push({
        employee_id: empId,
        dpr_date: sel.dataset.date,
        status: sel.value,
      });
    });
  });

  if (!entries.length) {
    showToast('No data to save', 'error');
    return;
  }

  showLoader(true);
  try {
    await api.bulkSaveDpr(entries);
    showToast('DPR saved successfully');
    loadMatrix();
  } catch (err) {
    showToast(err.message, 'error');
  } finally {
    showLoader(false);
  }
}
