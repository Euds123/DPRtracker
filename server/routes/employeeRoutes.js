const express = require('express');
const employeeController = require('../controllers/employeeController');
const { authenticate } = require('../middlewares/authMiddleware');
const { validateEmployeeBody } = require('../middlewares/validateEmployee');
const { asyncHandler } = require('../middlewares/errorHandler');

const router = express.Router();

router.use(authenticate);

router.get('/', asyncHandler(employeeController.list));
router.get('/:id', asyncHandler(employeeController.getOne));
router.post('/', validateEmployeeBody, asyncHandler(employeeController.create));
router.put('/:id', validateEmployeeBody, asyncHandler(employeeController.update));
router.delete('/:id', asyncHandler(employeeController.remove));

module.exports = router;
