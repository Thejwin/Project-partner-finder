const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth.middleware');
const reportController = require('../controllers/report.controller');

// All report routes require authentication
router.use(protect);

router.post('/', reportController.submitReport);

module.exports = router;
