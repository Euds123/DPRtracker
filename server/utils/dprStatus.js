const STATUS_RULES = [
  { max: 0, label: 'Excellent', badgeClass: 'bg-success' },
  { max: 2, label: 'Best', badgeClass: 'bg-primary' },
  { max: 5, label: 'Better', badgeClass: 'bg-info' },
  { max: 7, label: 'Good', badgeClass: 'bg-warning text-dark' },
  { max: 10, label: 'Improvement', badgeClass: 'bg-orange' },
  { max: Infinity, label: 'Critical', badgeClass: 'bg-danger' },
];

function countNotFilled(entries) {
  return entries.filter((e) => e.status === 'Not_Filled').length;
}

function getDprStatus(entriesOrCount) {
  if (Array.isArray(entriesOrCount)) {
    const entries = entriesOrCount;
    if (entries.length > 0 && entries.every((entry) => entry.status === 'NA')) {
      return { label: 'NA', badgeClass: 'bg-secondary', notFilledCount: 0 };
    }

    const notFilledCount = countNotFilled(entries);
    if (notFilledCount === 0) {
      return { label: 'Excellent', badgeClass: 'bg-success', notFilledCount };
    }

    if (notFilledCount === 1) {
      return { label: 'Good', badgeClass: 'bg-warning text-dark', notFilledCount };
    }
    if (notFilledCount >= 2 && notFilledCount <= 5) {
      return { label: 'Better', badgeClass: 'bg-info', notFilledCount };
    }
    if (notFilledCount >= 6 && notFilledCount <= 7) {
      return { label: 'Improvement', badgeClass: 'bg-orange', notFilledCount };
    }
    return { label: 'Critical', badgeClass: 'bg-danger', notFilledCount };
  }

  const notFilledCount = Number(entriesOrCount || 0);
  for (const rule of STATUS_RULES) {
    if (notFilledCount <= rule.max) {
      return { label: rule.label, badgeClass: rule.badgeClass, notFilledCount };
    }
  }
  return { label: 'Critical', badgeClass: 'bg-danger', notFilledCount };
}

function getLastDayOfMonth(year, month) {
  return new Date(year, month, 0);
}

function isEmployeeVisibleForMonth(joiningDate, year, month) {
  const join = new Date(joiningDate);
  const lastDay = getLastDayOfMonth(year, month);
  const joinOnly = new Date(join.getFullYear(), join.getMonth(), join.getDate());
  return joinOnly <= lastDay;
}

function getDaysInMonth(year, month) {
  return new Date(year, month, 0).getDate();
}

function getMonthDateRange(year, month) {
  const days = getDaysInMonth(year, month);
  const start = new Date(year, month - 1, 1);
  const end = new Date(year, month - 1, days);
  return { start, end, days };
}

module.exports = {
  STATUS_RULES,
  countNotFilled,
  getDprStatus,
  getLastDayOfMonth,
  isEmployeeVisibleForMonth,
  getDaysInMonth,
  getMonthDateRange,
};
