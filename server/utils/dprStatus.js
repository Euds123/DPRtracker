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

function getDprStatus(notFilledCount) {
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
