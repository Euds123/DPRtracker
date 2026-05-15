const { PrismaClient } = require('@prisma/client');
const { getMonthDateRange } = require('../utils/dprStatus');
const employeeService = require('./employeeService');

const prisma = new PrismaClient();

const STATUS_MAP = {
  NA: 'NA',
  Filled: 'Filled',
  'Not Filled': 'Not_Filled',
  Holiday: 'Holiday',
  'Comp Off': 'Comp_Off',
};

const STATUS_REVERSE = {
  NA: 'NA',
  Filled: 'Filled',
  Not_Filled: 'Not Filled',
  Holiday: 'Holiday',
  Comp_Off: 'Comp Off',
};

async function getDprMatrix(month, year, search = '') {
  const employees = await employeeService.getAllVisibleEmployees(year, month);
  const filtered = search
    ? employees.filter(
        (e) =>
          e.employee_name.toLowerCase().includes(search.toLowerCase()) ||
          e.employee_id.toLowerCase().includes(search.toLowerCase())
      )
    : employees;

  const { start, end, days } = getMonthDateRange(year, month);
  const entries = await prisma.dprEntry.findMany({
    where: {
      employee_id: { in: filtered.map((e) => e.id) },
      dpr_date: { gte: start, lte: end },
    },
  });

  const entryMap = {};
  for (const entry of entries) {
    const dateKey = entry.dpr_date.toISOString().split('T')[0];
    if (!entryMap[entry.employee_id]) entryMap[entry.employee_id] = {};
    entryMap[entry.employee_id][dateKey] = STATUS_REVERSE[entry.status] || 'NA';
  }

  const dates = [];
  for (let d = 1; d <= days; d++) {
    const date = new Date(year, month - 1, d);
    dates.push({
      day: d,
      date: date.toISOString().split('T')[0],
      label: `${month}/${d}/${year}`,
    });
  }

  const rows = filtered.map((emp) => {
    const cells = {};
    for (const dt of dates) {
      cells[dt.date] = entryMap[emp.id]?.[dt.date] || 'NA';
    }
    return {
      id: emp.id,
      employee_name: emp.employee_name,
      employee_id: emp.employee_id,
      cells,
    };
  });

  return { dates, rows, month, year };
}

async function bulkSave(entries) {
  const operations = entries.map((item) => {
    const status = STATUS_MAP[item.status] || 'NA';
    const dprDate = new Date(item.dpr_date);
    return prisma.dprEntry.upsert({
      where: {
        employee_id_dpr_date: {
          employee_id: Number(item.employee_id),
          dpr_date: dprDate,
        },
      },
      update: { status },
      create: {
        employee_id: Number(item.employee_id),
        dpr_date: dprDate,
        status,
      },
    });
  });

  return prisma.$transaction(operations);
}

async function getStatusSummary(month, year) {
  const { getDprStatus, countNotFilled } = require('../utils/dprStatus');
  const employees = await employeeService.getAllVisibleEmployees(year, month);
  const { start, end } = getMonthDateRange(year, month);

  const entries = await prisma.dprEntry.findMany({
    where: {
      employee_id: { in: employees.map((e) => e.id) },
      dpr_date: { gte: start, lte: end },
    },
  });

  const byEmployee = {};
  for (const entry of entries) {
    if (!byEmployee[entry.employee_id]) byEmployee[entry.employee_id] = [];
    byEmployee[entry.employee_id].push(entry);
  }

  const summary = {
    Excellent: 0,
    Best: 0,
    Better: 0,
    Good: 0,
    Improvement: 0,
    Critical: 0,
    total: employees.length,
  };

  for (const emp of employees) {
    const empEntries = byEmployee[emp.id] || [];
    const notFilled = countNotFilled(empEntries);
    const status = getDprStatus(notFilled);
    summary[status.label]++;
  }

  return summary;
}

module.exports = { getDprMatrix, bulkSave, getStatusSummary, STATUS_MAP, STATUS_REVERSE };
