let state = { page: 1, limit: 10, sortBy: 'employee_name', sortOrder: 'asc', search: '', editId: null };
let employeeModal;
let deleteModal;

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
          <div class="col-md-6 text-md-end">
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
