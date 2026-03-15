'use strict';

const express  = require('express');
const router   = express.Router();

const ctrl     = require('../controllers/user.controller');
const { protect }   = require('../middleware/auth.middleware');
const validate = require('../middleware/validate.middleware');
const schema   = require('../validators/profile.validator');

router.get   ('/me',            protect, ctrl.getMyProfile);
router.put   ('/me',            protect, validate(schema.updateProfile), ctrl.updateProfile);
router.patch ('/me/skills',     protect, validate(schema.updateSkills),  ctrl.updateSkills);
router.patch ('/me/picture',    protect, ctrl.updateProfilePicture);
router.patch ('/me/offline',    protect, ctrl.updateOfflineProfile);

module.exports = router;
