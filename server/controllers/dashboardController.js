const dashboardService = require('../services/dashboardService');

async function getStatus(req, res) {
  const month = Number(req.query.month) || new Date().getMonth() + 1;
  const year = Number(req.query.year) || new Date().getFullYear();
  const { search = '', page = 1, limit = 10, sortBy, sortOrder } = req.query;

  const result = await dashboardService.getDashboardStatus({
    month,
    year,
    search,
    page: Number(page),
    limit: Number(limit),
    sortBy,
    sortOrder,
  });

  res.json({ success: true, ...result });
}

async function sendNotification(req, res) {
  const { employee_id, month, year } = req.body;
  if (!employee_id) return res.status(400).json({ success: false, message: 'employee_id is required' });
  const m = Number(month) || new Date().getMonth() + 1;
  const y = Number(year) || new Date().getFullYear();
  const result = await dashboardService.sendMissingDaysNotification({ employee_id, month: m, year: y });
  res.json({ success: true, message: 'Notification sent', data: result });
}

async function sendNotificationsToAll(req, res) {
  const { month, year } = req.body;
  if (!month || !year) return res.status(400).json({ success: false, message: 'month and year are required' });
  const m = Number(month);
  const y = Number(year);
  const result = await dashboardService.sendNotificationsToAll({ month: m, year: y });
  res.json({ success: true, message: 'Bulk notifications processed', data: result });
}

module.exports = { getStatus, sendNotification, sendNotificationsToAll };
