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
  getAllVisibleEmployees,
};
