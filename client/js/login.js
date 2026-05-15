initTheme();
if (localStorage.getItem('dpr_token')) window.location.href = '/pages/dashboard.html';

document.getElementById('loginForm').addEventListener('submit', async (e) => {
  e.preventDefault();
  const errorEl = document.getElementById('loginError');
  const btn = document.getElementById('loginBtn');
  const spinner = document.getElementById('loginSpinner');
  const btnText = document.getElementById('loginBtnText');
  errorEl.classList.add('d-none');
  btn.disabled = true;
  spinner.classList.remove('d-none');
  btnText.textContent = 'Signing in...';
  try {
    const res = await api.login(
      document.getElementById('username').value.trim(),
      document.getElementById('password').value
    );
    setToken(res.token);
    window.location.href = '/pages/dashboard.html';
  } catch (err) {
    errorEl.textContent = err.message || 'Invalid credentials';
    errorEl.classList.remove('d-none');
  } finally {
    btn.disabled = false;
    spinner.classList.add('d-none');
    btnText.textContent = 'Login';
  }
});
