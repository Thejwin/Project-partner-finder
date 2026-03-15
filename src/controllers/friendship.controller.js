'use strict';

const friendshipService = require('../services/friendship.service');
const { success, created } = require('../utils/apiResponse');
const asyncHandler = require('../utils/asyncHandler');

exports.sendRequest = asyncHandler(async (req, res) => {
  const friendship = await friendshipService.sendRequest(req.user._id, req.params.recipientId);
  created(res, { friendship });
});

exports.getIncoming = asyncHandler(async (req, res) => {
  const result = await friendshipService.getIncomingRequests(req.user._id, req.query);
  success(res, result);
});

exports.getOutgoing = asyncHandler(async (req, res) => {
  const result = await friendshipService.getOutgoingRequests(req.user._id, req.query);
  success(res, result);
});

exports.respond = asyncHandler(async (req, res) => {
  const friendship = await friendshipService.respondToRequest(
    req.params.friendshipId,
    req.user._id,
    req.params.action     // 'accept' | 'reject' from route param
  );
  success(res, { friendship });
});

exports.getFriends = asyncHandler(async (req, res) => {
  const result = await friendshipService.getFriends(req.user._id, req.query);
  success(res, result);
});

exports.removeFriend = asyncHandler(async (req, res) => {
  const result = await friendshipService.removeFriend(req.params.friendshipId, req.user._id);
  success(res, result);
});

exports.blockUser = asyncHandler(async (req, res) => {
  const result = await friendshipService.blockUser(req.user._id, req.params.userId);
  success(res, result);
});
