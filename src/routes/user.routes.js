'use strict';

const express = require('express');
const router  = express.Router();

const ctrl = require('../controllers/user.controller');
const { protect } = require('../middleware/auth.middleware');

router.get('/search', protect, ctrl.searchUsers);
router.get('/:userId', protect, ctrl.getUserById);

module.exports = router;
