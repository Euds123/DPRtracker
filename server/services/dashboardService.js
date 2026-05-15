const { PrismaClient } = require('@prisma/client');
const { getDprStatus, countNotFilled, getMonthDateRange } = require('../utils/dprStatus');
const employeeService = require('./employeeService');

const prisma = new PrismaClient();

async function getDashboardStatus({ month, year, search = '', page = 1, limit = 10, sortBy = 'employee_name', sortOrder = 'asc' }) {
  const employees = await employeeService.getAllVisibleEmployees(year, month);
  const filtered = search
    ? employees.filter(
        (e) =>
          e.employee_name.toLowerCase().includes(search.toLowerCase()) ||
          e.employee_id.toLowerCase().includes(search.toLowerCase()) ||
          e.email.toLowerCase().includes(search.toLowerCase())
      )
    : employees;

  const { start, end } = getMonthDateRange(year, month);
  const entries = await prisma.dprEntry.findMany({
    where: {
      employee_id: { in: filtered.map((e) => e.id) },
      dpr_date: { gte: start, lte: end },
    },
  });

  const byEmployee = {};
  for (const entry of entries) {
    if (!byEmployee[entry.employee_id]) byEmployee[entry.employee_id] = [];
    byEmployee[entry.employee_id].push(entry);
  }

  let rows = filtered.map((emp) => {
    const empEntries = byEmployee[emp.id] || [];
    const notFilledCount = countNotFilled(empEntries);
    const status = getDprStatus(notFilledCount);
    return {
      id: emp.id,
      employee_name: emp.employee_name,
      employee_id: emp.employee_id,
      email: emp.email,
      dpr_status: status.label,
      badge_class: status.badgeClass,
      not_filled_count: notFilledCount,
    };
  });

  const allowedSort = ['employee_name', 'employee_id', 'email', 'dpr_status', 'not_filled_count'];
  const field = allowedSort.includes(sortBy) ? sortBy : 'employee_name';
  const dir = sortOrder === 'desc' ? -1 : 1;

  rows.sort((a, b) => {
    const av = a[field];
    const bv = b[field];
    if (typeof av === 'number') return (av - bv) * dir;
    return String(av).localeCompare(String(bv)) * dir;
  });

  const total = rows.length;
  const skip = (page - 1) * limit;
  const paginated = rows.slice(skip, skip + limit);

  const summary = {
    Excellent: 0,
    Best: 0,
    Better: 0,
    Good: 0,
    Improvement: 0,
    Critical: 0,
    total: rows.length,
  };

  for (const row of rows) {
    summary[row.dpr_status]++;
  }

  return {
    data: paginated,
    summary,
    total,
    page,
    limit,
    totalPages: Math.ceil(total / limit),
    month,
    year,
  };
}

module.exports = { getDashboardStatus };
