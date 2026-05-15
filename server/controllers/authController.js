const { validateCredentials } = require('../middlewares/authMiddleware');
const { signToken } = require('../utils/jwt');

async function login(req, res) {
  const { username, password } = req.body;

  if (!username || !password) {
    return res.status(400).json({ success: false, message: 'Username and password are required' });
  }

  if (!validateCredentials(username, password)) {
    return res.status(401).json({ success: false, message: 'Invalid credentials' });
  }

  const token = signToken({ username, role: 'admin' });

  res.cookie('token', token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 8 * 60 * 60 * 1000,
  });

  res.json({ success: true, message: 'Login successful', token, user: { username } });
}

async function logout(req, res) {
  res.clearCookie('token');
  res.json({ success: true, message: 'Logged out successfully' });
}

module.exports = { login, logout };
