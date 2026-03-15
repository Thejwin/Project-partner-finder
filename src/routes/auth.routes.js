'use strict';

const express = require('express');
const router  = express.Router();

const ctrl    = require('../controllers/auth.controller');
const { protect } = require('../middleware/auth.middleware');
const validate    = require('../middleware/validate.middleware');
const { authLimiter } = require('../middleware/rateLimiter.middleware');
const schema  = require('../validators/auth.validator');

router.post('/register',      authLimiter, validate(schema.register),      ctrl.register);
router.post('/login',         authLimiter, validate(schema.login),          ctrl.login);
router.post('/refresh-token', authLimiter, validate(schema.refreshToken),  ctrl.refreshToken);
router.post('/logout',        protect,                                       ctrl.logout);
router.get ('/me',            protect,                                       ctrl.getMe);

module.exports = router;
