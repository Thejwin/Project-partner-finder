'use strict';

const messageService    = require('../services/message.service');
const { success, created } = require('../utils/apiResponse');
const asyncHandler = require('../utils/asyncHandler');

exports.getConversations = asyncHandler(async (req, res) => {
  const conversations = await messageService.getConversations(req.user._id);
  success(res, { conversations });
});

exports.getMessages = asyncHandler(async (req, res) => {
  const result = await messageService.getMessages(
    req.params.friendshipId,
    req.user._id,
    req.query
  );
  success(res, result);
});

exports.sendMessage = asyncHandler(async (req, res) => {
  const message = await messageService.sendMessage(
    req.params.friendshipId,
    req.user._id,
    req.body
  );
  created(res, { message });
});

exports.markAsRead = asyncHandler(async (req, res) => {
  const result = await messageService.markAsRead(req.params.friendshipId, req.user._id);
  success(res, result);
});
