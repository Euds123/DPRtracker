const dprService = require('../services/dprService');

async function getDpr(req, res) {
  const month = Number(req.query.month) || new Date().getMonth() + 1;
  const year = Number(req.query.year) || new Date().getFullYear();
  const search = req.query.search || '';
  const data = await dprService.getDprMatrix(month, year, search);
  res.json({ success: true, data });
}

async function bulkSave(req, res) {
  const { entries } = req.body;
  if (!Array.isArray(entries) || !entries.length) {
    return res.status(400).json({ success: false, message: 'No entries to save' });
  }
  await dprService.bulkSave(entries);
  res.json({ success: true, message: 'DPR saved successfully', count: entries.length });
}

async function statusSummary(req, res) {
  const month = Number(req.query.month) || new Date().getMonth() + 1;
  const year = Number(req.query.year) || new Date().getFullYear();
  const summary = await dprService.getStatusSummary(month, year);
  res.json({ success: true, data: summary });
}

module.exports = { getDpr, bulkSave, statusSummary };
