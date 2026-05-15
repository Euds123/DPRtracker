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

module.exports = { getStatus };
