const employeeService = require('../services/employeeService');

async function list(req, res) {
  const { search = '', page = 1, limit = 10, sortBy, sortOrder } = req.query;
  const result = await employeeService.getEmployees({
    search,
    page: Number(page),
    limit: Number(limit),
    sortBy,
    sortOrder,
  });
  res.json({ success: true, ...result });
}

async function getOne(req, res) {
  const employee = await employeeService.getEmployeeById(req.params.id);
  if (!employee) return res.status(404).json({ success: false, message: 'Employee not found' });
  res.json({ success: true, data: employee });
}

async function create(req, res) {
  const employee = await employeeService.createEmployee(req.body);
  res.status(201).json({ success: true, message: 'Employee created', data: employee });
}

async function update(req, res) {
  const employee = await employeeService.updateEmployee(req.params.id, req.body);
  res.json({ success: true, message: 'Employee updated', data: employee });
}

async function remove(req, res) {
  await employeeService.deleteEmployee(req.params.id);
  res.json({ success: true, message: 'Employee deleted' });
}

module.exports = { list, getOne, create, update, remove };
