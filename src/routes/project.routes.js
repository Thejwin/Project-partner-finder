'use strict';

const express = require('express');
const router  = express.Router();

const ctrl     = require('../controllers/project.controller');
const { protect } = require('../middleware/auth.middleware');
const { requireProjectOwner, requireProjectMember } = require('../middleware/ownership.middleware');
const validate = require('../middleware/validate.middleware');
const schema   = require('../validators/project.validator');

// ── Browse & Search ──────────────────────────────────────────────────────────
router.get  ('/',          ctrl.getProjects);                      // Public
router.get  ('/search',    ctrl.searchProjects);                   // Public
router.get  ('/me',        protect, ctrl.getMyProjects);
router.get  ('/collaborating', protect, ctrl.getCollaboratingProjects);

// ── Single project ────────────────────────────────────────────────────────────
router.post ('/',              protect, validate(schema.createProject), ctrl.createProject);
router.get  ('/:projectId',    protect, ctrl.getProjectById);
router.put  ('/:projectId',    protect, requireProjectOwner, validate(schema.updateProject), ctrl.updateProject);
router.delete('/:projectId',   protect, requireProjectOwner, ctrl.deleteProject);

// ── Membership ────────────────────────────────────────────────────────────────
router.post  ('/:projectId/membership/apply',                  protect, ctrl.applyToProject);
router.get   ('/:projectId/membership/proposals',              protect, requireProjectOwner, ctrl.getProposals);
router.patch ('/:projectId/membership/proposals/:userId/accept', protect, requireProjectOwner, ctrl.acceptProposal);
router.patch ('/:projectId/membership/proposals/:userId/reject', protect, requireProjectOwner, ctrl.rejectProposal);
router.delete('/:projectId/membership/collaborators/:userId',  protect, requireProjectOwner, ctrl.removeCollaborator);
router.post  ('/:projectId/membership/invite/:userId',         protect, requireProjectOwner, ctrl.inviteUser);
router.post  ('/:projectId/membership/add/:userId',            protect, requireProjectOwner, ctrl.addCollaborator);

// ── Tasks (nested) ────────────────────────────────────────────────────────────
const taskCtrl   = require('../controllers/task.controller');
const taskSchema = require('../validators/task.validator');

router.post  ('/:projectId/tasks',           protect, requireProjectOwner, validate(taskSchema.createTask), taskCtrl.createTask);
router.get   ('/:projectId/tasks',           protect, requireProjectMember, taskCtrl.getTasks);
router.get   ('/:projectId/tasks/:taskId',   protect, requireProjectMember, taskCtrl.getTaskById);
router.put   ('/:projectId/tasks/:taskId',   protect, requireProjectMember, validate(taskSchema.updateTask), taskCtrl.updateTask);
router.patch ('/:projectId/tasks/:taskId/status', protect, requireProjectMember, validate(taskSchema.updateStatus), taskCtrl.updateStatus);
router.delete('/:projectId/tasks/:taskId',   protect, requireProjectOwner, taskCtrl.deleteTask);

module.exports = router;
