const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function getEmployees({ search = '', page = 1, limit = 10, sortBy = 'employee_name', sortOrder = 'asc' }) {
  const skip = (page - 1) * limit;
  const where = search
    ? {
        OR: [
          { employee_name: { contains: search, mode: 'insensitive' } },
          { employee_id: { contains: search, mode: 'insensitive' } },
          { email: { contains: search, mode: 'insensitive' } },
        ],
      }
    : {};

  const allowedSort = ['employee_name', 'employee_id', 'email', 'joining_date', 'created_at'];
  const orderField = allowedSort.includes(sortBy) ? sortBy : 'employee_name';
  const order = sortOrder === 'desc' ? 'desc' : 'asc';

  const [data, total] = await Promise.all([
    prisma.employee.findMany({
      where,
      skip,
      take: limit,
      orderBy: { [orderField]: order },
    }),
    prisma.employee.count({ where }),
  ]);

  return { data, total, page, limit, totalPages: Math.ceil(total / limit) };
}

async function getEmployeeById(id) {
  return prisma.employee.findUnique({ where: { id: Number(id) } });
}

async function createEmployee({ employee_name, employee_id, email, joining_date }) {
  const existing = await prisma.employee.findUnique({ where: { employee_id } });
  if (existing) {
    const err = new Error('Employee ID already exists');
    err.statusCode = 409;
    throw err;
  }
  return prisma.employee.create({
    data: {
      employee_name,
      employee_id,
      email,
      joining_date: new Date(joining_date),
    },
  });
}

async function updateEmployee(id, { employee_name, employee_id, email, joining_date }) {
  const existing = await prisma.employee.findFirst({
    where: { employee_id, NOT: { id: Number(id) } },
  });
  if (existing) {
    const err = new Error('Employee ID already exists');
    err.statusCode = 409;
    throw err;
  }
  return prisma.employee.update({
    where: { id: Number(id) },
    data: {
      employee_name,
      employee_id,
      email,
      joining_date: new Date(joining_date),
    },
  });
}

async function deleteEmployee(id) {
  return prisma.employee.delete({ where: { id: Number(id) } });
}

async function bulkCreateEmployees(buffer, mapping = {}, sheetName = '') {
  const xlsx = require('xlsx');
  const workbook = xlsx.read(buffer, { type: 'buffer' });
  const selectedSheetName = sheetName && workbook.SheetNames.includes(sheetName) ? sheetName : workbook.SheetNames[0];
  const sheet = workbook.Sheets[selectedSheetName];
  if (!sheet) {
    const err = new Error('Uploaded file must contain at least one worksheet');
    err.statusCode = 400;
    throw err;
  }

  const rows = xlsx.utils.sheet_to_json(sheet, { defval: '' });
  if (!rows.length) {
    const err = new Error('Uploaded file contains no employee records');
    err.statusCode = 400;
    throw err;
  }

  const normalizedRows = rows.map((row, index) => {
    const employee_name = row[mapping.employee_name] ?? row['Employee Name'] ?? row['employee name'] ?? row['Name'] ?? row['name'];
    const employee_id = row[mapping.employee_id] ?? row['Employee ID'] ?? row['employee id'] ?? row['ID'] ?? row['id'];
    const email = row[mapping.email] ?? row['Email ID'] ?? row['email id'] ?? row['Email'] ?? row['email'];
    const joining_date = row[mapping.joining_date] ?? row['Joining Date'] ?? row['joining date'] ?? row['Date of Joining'] ?? row['DOJ'];

    if (!employee_name || !employee_id || !email || !joining_date) {
      const err = new Error(`Row ${index + 2} is missing required mapped values. Please verify your column mapping.`);
      err.statusCode = 400;
      throw err;
    }

    const parsedDate = joining_date instanceof Date ? joining_date : new Date(joining_date);
    if (Number.isNaN(parsedDate.valueOf())) {
      const err = new Error(`Row ${index + 2} has invalid Joining Date`);
      err.statusCode = 400;
      throw err;
    }

    return {
      employee_name: String(employee_name).trim(),
      employee_id: String(employee_id).trim(),
      email: String(email).trim(),
      joining_date: parsedDate,
    };
  });

  const duplicateIds = normalizedRows.reduce((acc, row) => {
    const key = row.employee_id.toLowerCase();
    acc[key] = (acc[key] || 0) + 1;
    return acc;
  }, {});
  const duplicates = Object.keys(duplicateIds).filter((key) => duplicateIds[key] > 1);
  if (duplicates.length) {
    const err = new Error(`Duplicate Employee ID values found in file: ${duplicates.join(', ')}`);
    err.statusCode = 400;
    throw err;
  }

  const existing = await prisma.employee.findMany({ where: { employee_id: { in: normalizedRows.map((row) => row.employee_id) } } });
  if (existing.length) {
    const existingIds = existing.map((e) => e.employee_id).join(', ');
    const err = new Error(`Employee ID(s) already exist: ${existingIds}`);
    err.statusCode = 409;
    throw err;
  }

  const result = await prisma.employee.createMany({ data: normalizedRows });
  return result;
}

async function getAllVisibleEmployees(year, month) {
  const { isEmployeeVisibleForMonth } = require('../utils/dprStatus');
  const all = await prisma.employee.findMany({ orderBy: { employee_name: 'asc' } });
  return all.filter((emp) => isEmployeeVisibleForMonth(emp.joining_date, year, month));
}

module.exports = {
  getEmployees,
  getEmployeeById,
  createEmployee,
  updateEmployee,
  deleteEmployee,
  bulkCreateEmployees,
  getAllVisibleEmployees,
};
