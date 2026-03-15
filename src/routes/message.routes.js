'use strict';

const express = require('express');
const router  = express.Router();

const ctrl    = require('../controllers/message.controller');
const { protect } = require('../middleware/auth.middleware');

router.get   ('/conversations',                      protect, ctrl.getConversations);
router.get   ('/conversations/:friendshipId',         protect, ctrl.getMessages);
router.post  ('/conversations/:friendshipId',         protect, ctrl.sendMessage);
router.patch ('/conversations/:friendshipId/read',    protect, ctrl.markAsRead);

module.exports = router;
