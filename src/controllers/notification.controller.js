'use strict';

const notifService = require('../services/notification.service');
const { success }  = require('../utils/apiResponse');
const asyncHandler = require('../utils/asyncHandler');

exports.getNotifications = asyncHandler(async (req, res) => {
  const result = await notifService.getNotifications(req.user._id, req.query);
  success(res, result);
});

exports.markOneRead = asyncHandler(async (req, res) => {
  const notif = await notifService.markOneRead(req.params.notificationId, req.user._id);
  success(res, { notification: notif });
});

exports.markAllRead = asyncHandler(async (req, res) => {
  const result = await notifService.markAllRead(req.user._id);
  success(res, result);
});

exports.deleteNotification = asyncHandler(async (req, res) => {
  const result = await notifService.deleteNotification(req.params.notificationId, req.user._id);
  success(res, result);
});
