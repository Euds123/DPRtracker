const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function validateEmployeeBody(req, res, next) {
  const { employee_name, employee_id, email, joining_date } = req.body;
  const errors = [];

  if (!employee_name?.trim()) errors.push('Employee name is required');
  if (!employee_id?.trim()) errors.push('Employee ID is required');
  if (!email?.trim()) errors.push('Email is required');
  else if (!EMAIL_REGEX.test(email)) errors.push('Invalid email format');
  if (!joining_date) errors.push('Joining date is required');

  if (errors.length) {
    return res.status(400).json({ success: false, message: errors.join(', ') });
  }
  next();
}

module.exports = { validateEmployeeBody, EMAIL_REGEX };
