let state = { page: 1, limit: 10, sortBy: 'employee_name', sortOrder: 'asc', search: '', editId: null };
let employeeModal;
let deleteModal;
let currentWorkbook = null;
let currentSheetName = '';
let currentHeaders = [];
let selectedFile = null;
const MAPPING_FIELDS = [
  { key: 'employee_name', label: 'Employee Name' },
  { key: 'employee_id', label: 'Employee ID' },
  { key: 'email', label: 'Email ID' },
  { key: 'joining_date', label: 'Joining Date' },
];

document.addEventListener('DOMContentLoaded', () => {
  if (!requireAuth()) return;
  initTheme();
  initLayout('employees', 'Employee Master');
  document.getElementById('page-content').innerHTML = getPageHTML();
  employeeModal = new bootstrap.Modal(document.getElementById('employeeModal'));
  deleteModal = new bootstrap.Modal(document.getElementById('deleteModal'));
  bindEvents();
  loadEmployees();
});

function getPageHTML() {
  const close = '</' + 'div>';
  return `
    <div class="card border-0 shadow-sm mb-3">
      <div class="card-body">
        <motion-div class="row g-2 align-items-end">
          <div class="col-md-6">
            <label class="form-label">Search</label>
            <input type="text" id="searchInput" class="form-control" placeholder="Name, ID or email" />
          </div>
          <div class="col-md-6 text-md-end d-flex justify-content-end gap-2 align-items-center">
            <button class="btn btn-secondary" id="uploadExcelBtn"><i class="bi bi-file-earmark-spreadsheet me-1"></i>Upload Excel</button>
            <button class="btn btn-primary" id="addEmployeeBtn"><i class="bi bi-plus-lg me-1"></i>Add Employee</button>
          </div>
        ${close}
      ${close}
    </div>
    <div class="card border-0 shadow-sm">
      <div class="table-responsive">
        <table class="table table-hover mb-0">
          <thead class="table-dark">
            <tr>
              <th class="sortable" data-sort="employee_name">Employee Name</th>
              <th class="sortable" data-sort="employee_id">Employee ID</th>
              <th class="sortable" data-sort="email">Email ID</th>
              <th class="sortable" data-sort="joining_date">Joining Date</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody id="employeeBody"></tbody>
        </table>
      </div>
      <div class="card-footer d-flex justify-content-between align-items-center">
        <span id="paginationInfo" class="text-muted small"></span>
        <nav><ul class="pagination pagination-sm mb-0" id="pagination"></ul></nav>
      </div>
    </motion-div>

    <div class="excel-upload-panel" id="excelUploadPanel">
      <div class="panel-header">
        <div>
          <h5 class="mb-0">Excel Upload</h5>
          <small class="text-muted">Map SQL columns to Excel columns</small>
        </div>
        <button type="button" class="btn-close" id="closeExcelPanel"></button>
      </div>
      <div class="panel-body">
        <div class="mb-3">
          <label class="form-label">Choose Excel File</label>
          <input type="file" id="excelFileInput" accept=".xlsx,.xls,.csv" class="form-control" />
        </div>
        <div class="sheet-select-wrapper">
          <label class="form-label">Worksheet</label>
          <select id="excelSheetSelect" class="form-select" disabled></select>
        </div>
        <div class="form-check mb-3">
          <input class="form-check-input" type="checkbox" id="autoMapCheckbox" checked />
          <label class="form-check-label" for="autoMapCheckbox">Auto Map Columns</label>
        </div>
        <div class="mapping-table-wrapper">
          <table class="table table-sm mapping-table">
            <thead>
              <tr><th>SQL COLUMNS</th><th>EXCEL COLUMNS</th></tr>
            </thead>
            <tbody id="mappingRows"></tbody>
          </table>
        </div>
      </div>
      <div class="panel-footer">
        <button class="btn btn-outline-secondary" id="downloadTemplateBtn"><i class="bi bi-download me-1"></i>Download Template</button>
        <button class="btn btn-secondary" id="cancelExcelUpload">Cancel</button>
        <button class="btn btn-primary" id="proceedExcelUpload">Proceed</button>
      </div>
    </div>
    <div class="excel-upload-overlay" id="excelUploadOverlay"></div>

    <div class="modal fade" id="employeeModal" tabindex="-1">
      <div class="modal-dialog">
        <div class="modal-content">
          <div class="modal-header">
            <h5 class="modal-title" id="modalTitle">Add Employee</h5>
            <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
          </div>
          <form id="employeeForm">
            <div class="modal-body">
              <div id="formError" class="alert alert-danger d-none"></div>
              <div class="mb-3">
                <label class="form-label">Employee Name *</label>
                <input type="text" class="form-control" id="empName" required />
              </div>
              <div class="mb-3">
                <label class="form-label">Employee ID *</label>
                <input type="text" class="form-control" id="empId" required />
              </div>
              <div class="mb-3">
                <label class="form-label">Email ID *</label>
                <input type="email" class="form-control" id="empEmail" required />
              </div>
              <div class="mb-3">
                <label class="form-label">Joining Date *</label>
                <input type="date" class="form-control" id="empJoinDate" required />
              </div>
            </div>
            <div class="modal-footer">
              <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Cancel</button>
              <button type="submit" class="btn btn-primary" id="saveEmployeeBtn">Save</button>
            </div>
          </form>
        </div>
      </div>
    </div>

    <div class="modal fade" id="deleteModal" tabindex="-1">
      <div class="modal-dialog">
        <div class="modal-content">
          <motion-div class="modal-header"><h5 class="modal-title">Confirm Delete</h5><button type="button" class="btn-close" data-bs-dismiss="modal"></button></motion-div>
          <div class="modal-body">Are you sure you want to delete <strong id="deleteEmpName"></strong>?</div>
          <div class="modal-footer">
            <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Cancel</button>
            <button type="button" class="btn btn-danger" id="confirmDeleteBtn">Delete</button>
          </div>
        </div>
      </div>
    </div>`.replace(/motion-div/g, 'div');
}

function bindEvents() {
  document.getElementById('addEmployeeBtn').addEventListener('click', openAddModal);
  document.getElementById('uploadExcelBtn').addEventListener('click', openExcelUploadPanel);
  document.getElementById('closeExcelPanel').addEventListener('click', closeExcelUploadPanel);
  document.getElementById('cancelExcelUpload').addEventListener('click', closeExcelUploadPanel);
  document.getElementById('downloadTemplateBtn').addEventListener('click', downloadTemplate);
  document.getElementById('excelUploadOverlay').addEventListener('click', closeExcelUploadPanel);
  document.getElementById('excelFileInput').addEventListener('change', handleExcelFileSelect);
  document.getElementById('excelSheetSelect').addEventListener('change', handleSheetChange);
  document.getElementById('autoMapCheckbox').addEventListener('change', () => {
    if (document.getElementById('autoMapCheckbox').checked) autoMapHeaders();
  });
  document.getElementById('proceedExcelUpload').addEventListener('click', submitExcelUpload);
  document.getElementById('employeeForm').addEventListener('submit', saveEmployee);
  document.getElementById('searchInput').addEventListener('input', debounce(() => {
    state.page = 1;
    state.search = document.getElementById('searchInput').value;
    loadEmployees();
  }));
  document.querySelectorAll('.sortable').forEach((th) => {
    th.addEventListener('click', () => {
      const field = th.dataset.sort;
      if (state.sortBy === field) state.sortOrder = state.sortOrder === 'asc' ? 'desc' : 'asc';
      else { state.sortBy = field; state.sortOrder = 'asc'; }
      loadEmployees();
    });
  });
  document.getElementById('confirmDeleteBtn').addEventListener('click', confirmDelete);
}

async function loadEmployees() {
  showLoader(true);
  try {
    const res = await api.getEmployees({
      search: state.search,
      page: state.page,
      limit: state.limit,
      sortBy: state.sortBy,
      sortOrder: state.sortOrder,
    });
    renderTable(res.data);
    renderPagination(res.page, res.totalPages, res.total);
  } catch (err) {
    showToast(err.message, 'error');
  } finally {
    showLoader(false);
  }
}

function renderTable(rows) {
  const tbody = document.getElementById('employeeBody');
  if (!rows.length) {
    tbody.innerHTML = '<tr><td colspan="5" class="text-center text-muted py-4">No employees found</td></tr>';
    return;
  }
  tbody.innerHTML = rows.map((r) => `
    <tr>
      <td>${r.employee_name}</td>
      <td>${r.employee_id}</td>
      <td>${r.email}</td>
      <td>${formatDate(r.joining_date)}</td>
      <td>
        <button class="btn btn-sm btn-outline-primary me-1" data-edit="${r.id}"><i class="bi bi-pencil"></i></button>
        <button class="btn btn-sm btn-outline-danger" data-delete="${r.id}" data-name="${r.employee_name}"><i class="bi bi-trash"></i></button>
      </td>
    </tr>`).join('');

  tbody.querySelectorAll('[data-edit]').forEach((btn) => {
    btn.addEventListener('click', () => openEditModal(Number(btn.dataset.edit), rows.find((r) => r.id === Number(btn.dataset.edit))));
  });
  tbody.querySelectorAll('[data-delete]').forEach((btn) => {
    btn.addEventListener('click', () => openDeleteModal(Number(btn.dataset.delete), btn.dataset.name));
  });
}

function renderPagination(page, totalPages, total) {
  document.getElementById('paginationInfo').textContent = `Page ${page} of ${totalPages || 1} (${total} employees)`;
  const ul = document.getElementById('pagination');
  ul.innerHTML = Array.from({ length: totalPages }, (_, i) => i + 1)
    .map((i) => `<li class="page-item ${i === page ? 'active' : ''}"><a class="page-link" href="#" data-page="${i}">${i}</a></li>`)
    .join('');
  ul.querySelectorAll('.page-link').forEach((a) => {
    a.addEventListener('click', (e) => { e.preventDefault(); state.page = Number(a.dataset.page); loadEmployees(); });
  });
}

function openAddModal() {
  state.editId = null;
  document.getElementById('modalTitle').textContent = 'Add Employee';
  document.getElementById('employeeForm').reset();
  document.getElementById('formError').classList.add('d-none');
  employeeModal.show();
}

function openEditModal(id, emp) {
  state.editId = id;
  document.getElementById('modalTitle').textContent = 'Edit Employee';
  document.getElementById('empName').value = emp.employee_name;
  document.getElementById('empId').value = emp.employee_id;
  document.getElementById('empEmail').value = emp.email;
  document.getElementById('empJoinDate').value = emp.joining_date.split('T')[0];
  document.getElementById('formError').classList.add('d-none');
  employeeModal.show();
}

function openDeleteModal(id, name) {
  state.editId = id;
  document.getElementById('deleteEmpName').textContent = name;
  deleteModal.show();
}

function openExcelUploadPanel() {
  document.getElementById('excelUploadPanel').classList.add('show');
  document.getElementById('excelUploadOverlay').classList.add('show');
  resetExcelPanel();
}

function closeExcelUploadPanel() {
  document.getElementById('excelUploadPanel').classList.remove('show');
  document.getElementById('excelUploadOverlay').classList.remove('show');
  resetExcelPanel();
}

function resetExcelPanel() {
  selectedFile = null;
  currentWorkbook = null;
  currentSheetName = '';
  currentHeaders = [];
  document.getElementById('excelFileInput').value = '';
  document.getElementById('excelSheetSelect').innerHTML = '';
  document.getElementById('excelSheetSelect').disabled = true;
  document.getElementById('autoMapCheckbox').checked = true;
  renderMappingRows();
}

function renderMappingRows() {
  const mappingBody = document.getElementById('mappingRows');
  const headerOptions = currentHeaders.map((header) => `<option value="${header}">${header}</option>`).join('');
  mappingBody.innerHTML = MAPPING_FIELDS.map((field) => `
    <tr>
      <td class="fw-semibold">${field.label}</td>
      <td>
        <select class="form-select" data-mapping-key="${field.key}">
          <option value="">Select column</option>
          ${headerOptions}
        </select>
      </td>
    </tr>
  `).join('');
}

function autoMapHeaders() {
  const normalize = (value) => String(value || '').trim().toLowerCase();
  const headerMap = Object.fromEntries(currentHeaders.map((h) => [normalize(h), h]));
  const mappingOptions = {
    employee_name: ['employee name', 'name', 'empname', 'emp name', 'employee_name'],
    employee_id: ['employee id', 'id', 'employee_id', 'emp id', 'empid'],
    email: ['email id', 'email', 'email_id', 'employee email', 'employee email id'],
    joining_date: ['joining date', 'joining_date', 'date of joining', 'doj'],
  };

  MAPPING_FIELDS.forEach((field) => {
    const select = document.querySelector(`select[data-mapping-key="${field.key}"]`);
    if (!select) return;
    const match = mappingOptions[field.key].map((candidate) => headerMap[candidate]).find(Boolean);
    if (match) select.value = match;
  });
}

function handleExcelFileSelect(event) {
  const file = event.target.files?.[0];
  if (!file) return;
  selectedFile = file;

  const reader = new FileReader();
  reader.onload = (e) => {
    try {
      const data = new Uint8Array(e.target.result);
      const workbook = XLSX.read(data, { type: 'array' });
      currentWorkbook = workbook;
      currentSheetName = workbook.SheetNames[0] || '';
      const sheetSelect = document.getElementById('excelSheetSelect');
      sheetSelect.disabled = workbook.SheetNames.length === 0;
      sheetSelect.innerHTML = workbook.SheetNames.map((name) => `<option value="${name}">${name}</option>`).join('');
      if (currentSheetName) sheetSelect.value = currentSheetName;
      updateHeadersFromSheet();
    } catch (err) {
      showToast('Unable to read Excel file', 'error');
      resetExcelPanel();
    }
  };
  reader.readAsArrayBuffer(file);
}

function handleSheetChange(event) {
  currentSheetName = event.target.value;
  updateHeadersFromSheet();
}

function updateHeadersFromSheet() {
  if (!currentWorkbook || !currentSheetName) return;
  const sheet = currentWorkbook.Sheets[currentSheetName];
  if (!sheet) return;
  const rows = XLSX.utils.sheet_to_json(sheet, { header: 1 });
  currentHeaders = Array.isArray(rows[0]) ? rows[0].map((h) => (h ?? '').toString().trim()).filter(Boolean) : [];
  renderMappingRows();
  if (document.getElementById('autoMapCheckbox').checked) autoMapHeaders();
}

async function submitExcelUpload() {
  if (!selectedFile) {
    showToast('Please choose an Excel file first', 'error');
    return;
  }

  const mapping = {};
  let valid = true;
  MAPPING_FIELDS.forEach((field) => {
    const select = document.querySelector(`select[data-mapping-key="${field.key}"]`);
    mapping[field.key] = select?.value || '';
    if (!mapping[field.key]) valid = false;
  });

  if (!valid) {
    showToast('Please map all required columns', 'error');
    return;
  }

  showLoader(true);
  try {
    const res = await api.bulkUploadEmployees(selectedFile, mapping, currentSheetName);
    showToast(res.message);
    closeExcelUploadPanel();
    loadEmployees();
  } catch (err) {
    showToast(err.message, 'error');
  } finally {
    showLoader(false);
  }
}

function downloadTemplate() {
  const templateData = [
    {
      'Employee Name': '',
      'Employee ID': '',
      'Email ID': '',
      'Joining Date': '',
    },
  ];
  exportToExcel(templateData, 'employee-upload-template.csv');
}

async function saveEmployee(e) {
  e.preventDefault();
  const body = {
    employee_name: document.getElementById('empName').value.trim(),
    employee_id: document.getElementById('empId').value.trim(),
    email: document.getElementById('empEmail').value.trim(),
    joining_date: document.getElementById('empJoinDate').value,
  };
  const errEl = document.getElementById('formError');
  errEl.classList.add('d-none');
  showLoader(true);
  try {
    if (state.editId) await api.updateEmployee(state.editId, body);
    else await api.createEmployee(body);
    employeeModal.hide();
    showToast(state.editId ? 'Employee updated' : 'Employee added');
    loadEmployees();
  } catch (err) {
    errEl.textContent = err.message;
    errEl.classList.remove('d-none');
  } finally {
    showLoader(false);
  }
}

async function confirmDelete() {
  showLoader(true);
  try {
    await api.deleteEmployee(state.editId);
    deleteModal.hide();
    showToast('Employee deleted');
    loadEmployees();
  } catch (err) {
    showToast(err.message, 'error');
  } finally {
    showLoader(false);
  }
}

