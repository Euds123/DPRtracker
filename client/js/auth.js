function requireAuth() {
  if (!localStorage.getItem('dpr_token')) {
    window.location.href = '/pages/login.html';
    return false;
  }
  return true;
}

function logout() {
  api.logout().catch(() => {});
  localStorage.removeItem('dpr_token');
  window.location.href = '/pages/login.html';
}
