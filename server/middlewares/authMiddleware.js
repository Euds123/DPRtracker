const { verifyToken } = require('../utils/jwt');

const HARDCODED_USER = { username: 'Admin', password: 'Admin@786' };

function authenticate(req, res, next) {
  const authHeader = req.headers.authorization;
  const token = authHeader?.startsWith('Bearer ') ? authHeader.slice(7) : req.cookies?.token;

  if (!token) {
    return res.status(401).json({ success: false, message: 'Unauthorized. Please login.' });
  }

  try {
    const decoded = verifyToken(token);
    req.user = decoded;
    next();
  } catch {
    return res.status(401).json({ success: false, message: 'Invalid or expired token.' });
  }
}

function validateCredentials(username, password) {
  return username === HARDCODED_USER.username && password === HARDCODED_USER.password;
}

module.exports = { authenticate, validateCredentials, HARDCODED_USER };
