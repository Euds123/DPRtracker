const API_BASE = '/api';

function getToken() {
  return localStorage.getItem('dpr_token');
}

function setToken(token) {
  if (token) localStorage.setItem('dpr_token', token);
  else localStorage.removeItem('dpr_token');
}

async function apiRequest(endpoint, options = {}) {
  const token = getToken();
  const headers = {
    ...((options.body instanceof FormData) ? {} : { 'Content-Type': 'application/json' }),
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...options.headers,
  };

  const res = await fetch(`${API_BASE}${endpoint}`, {
    ...options,
    headers,
    credentials: 'include',
  });

  if (res.status === 401) {
    setToken(null);
    if (!window.location.pathname.includes('login.html')) {
      window.location.href = '/pages/login.html';
    }
    throw new Error('Unauthorized');
  }

  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.message || 'Request failed');
  return data;
}

const api = {
  login: (username, password) =>
    apiRequest('/auth/login', { method: 'POST', body: JSON.stringify({ username, password }) }),
  logout: () => apiRequest('/auth/logout', { method: 'POST' }),
  getEmployees: (params) => {
    const q = new URLSearchParams(params).toString();
    return apiRequest(`/employees?${q}`);
  },
  createEmployee: (body) => apiRequest('/employees', { method: 'POST', body: JSON.stringify(body) }),
  bulkUploadEmployees: (file, mapping = {}, sheetName = '') => {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('mapping', JSON.stringify(mapping));
    if (sheetName) formData.append('sheetName', sheetName);
    return apiRequest('/employees/bulk-upload', {
      method: 'POST',
      body: formData,
      headers: {},
    });
  },
  updateEmployee: (id, body) => apiRequest(`/employees/${id}`, { method: 'PUT', body: JSON.stringify(body) }),
  deleteEmployee: (id) => apiRequest(`/employees/${id}`, { method: 'DELETE' }),
  getDashboard: (params) => {
    const q = new URLSearchParams(params).toString();
    return apiRequest(`/dashboard/status?${q}`);
  },
  sendMissingDaysNotification: (employeeId, month, year) =>
    apiRequest('/dashboard/notify', {
      method: 'POST',
      body: JSON.stringify({ employee_id: employeeId, month, year }),
    }),
    sendNotificationsToAll: (params) =>
      apiRequest('/dashboard/notify-all', {
        method: 'POST',
        body: JSON.stringify(params),
      }),
  getDpr: (params) => {
    const q = new URLSearchParams(params).toString();
    return apiRequest(`/dpr?${q}`);
  },
  bulkSaveDpr: (entries) =>
    apiRequest('/dpr/bulk-save', { method: 'POST', body: JSON.stringify({ entries }) }),
  getStatusSummary: (params) => {
    const q = new URLSearchParams(params).toString();
    return apiRequest(`/dpr/status-summary?${q}`);
  },
};
