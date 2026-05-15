const express = require('express');
const dprController = require('../controllers/dprController');
const { authenticate } = require('../middlewares/authMiddleware');
const { asyncHandler } = require('../middlewares/errorHandler');

const router = express.Router();

router.use(authenticate);

router.get('/', asyncHandler(dprController.getDpr));
router.post('/bulk-save', asyncHandler(dprController.bulkSave));
router.get('/status-summary', asyncHandler(dprController.statusSummary));

module.exports = router;
