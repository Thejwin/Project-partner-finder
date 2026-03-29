'use strict';

const express = require('express');
const router  = express.Router();

router.use('/auth',          require('./auth.routes'));
router.use('/users',         require('./user.routes'));
router.use('/profiles',      require('./profile.routes'));
router.use('/projects',      require('./project.routes'));
router.use('/friends',       require('./friendship.routes'));
router.use('/messages',      require('./message.routes'));
router.use('/notifications', require('./notification.routes'));
router.use('/admin',         require('./admin.routes'));
router.use('/reports',       require('./report.routes'));

module.exports = router;
