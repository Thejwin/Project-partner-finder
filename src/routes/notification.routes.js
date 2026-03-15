'use strict';

const express = require('express');
const router  = express.Router();

const ctrl    = require('../controllers/notification.controller');
const { protect } = require('../middleware/auth.middleware');

router.get   ('/',                          protect, ctrl.getNotifications);
router.patch ('/read-all',                  protect, ctrl.markAllRead);
router.patch ('/:notificationId/read',      protect, ctrl.markOneRead);
router.delete('/:notificationId',           protect, ctrl.deleteNotification);

module.exports = router;
