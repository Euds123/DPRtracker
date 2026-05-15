const express = require('express');
const dashboardController = require('../controllers/dashboardController');
const { authenticate } = require('../middlewares/authMiddleware');
const { asyncHandler } = require('../middlewares/errorHandler');

const router = express.Router();

router.use(authenticate);

router.get('/status', asyncHandler(dashboardController.getStatus));

module.exports = router;
