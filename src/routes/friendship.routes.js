'use strict';

const express = require('express');
const router  = express.Router();

const ctrl    = require('../controllers/friendship.controller');
const { protect } = require('../middleware/auth.middleware');

router.post  ('/request/:recipientId',             protect, ctrl.sendRequest);
router.get   ('/requests/incoming',                protect, ctrl.getIncoming);
router.get   ('/requests/outgoing',                protect, ctrl.getOutgoing);
router.patch ('/requests/:friendshipId/:action',   protect, ctrl.respond);   // :action = accept|reject
router.get   ('/',                                 protect, ctrl.getFriends);
router.delete('/:friendshipId',                    protect, ctrl.removeFriend);
router.post  ('/block/:userId',                    protect, ctrl.blockUser);

module.exports = router;
