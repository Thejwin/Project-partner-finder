'use strict';

const { Friendship, Notification } = require('../models');
const paginate = require('../utils/paginate');
const { getIO } = require('../config/socket');

const AppError = (msg, code) => Object.assign(new Error(msg), { statusCode: code });

const sendRequest = async (requesterId, recipientId) => {
  if (requesterId === recipientId) throw AppError('Cannot send a friend request to yourself', 422);

  const existing = await Friendship.findOne({
    $or: [
      { requester: requesterId, recipient: recipientId },
      { requester: recipientId, recipient: requesterId },
    ],
  }).lean();

  if (existing) {
    if (existing.status === 'accepted') throw AppError('Already friends', 409);
    if (existing.status === 'pending')  throw AppError('Request already sent', 409);
    if (existing.status === 'blocked')  throw AppError('Unable to send request', 422);
  }

  const friendship = await Friendship.create({
    requester: requesterId,
    recipient: recipientId,
    status: 'pending',
  });

  await Notification.create({
    userId: recipientId,
    type: 'friend_request',
    referenceId: friendship._id,
    referenceModel: 'Friendship',
    message: 'You have a new friend request.',
  });

  try {
    getIO().to(`user:${recipientId}`).emit('notification:new', { type: 'friend_request' });
  } catch (_) {}

  return friendship;
};

const getIncomingRequests = async (userId, query) => {
  const { skip, limit, buildMeta } = paginate(query);
  const filter = { recipient: userId, status: 'pending' };
  const [total, requests] = await Promise.all([
    Friendship.countDocuments(filter),
    Friendship.find(filter)
      .populate('requester', 'username')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean(),
  ]);
  return { requests, pagination: buildMeta(total) };
};

const getOutgoingRequests = async (userId, query) => {
  const { skip, limit, buildMeta } = paginate(query);
  const filter = { requester: userId, status: 'pending' };
  const [total, requests] = await Promise.all([
    Friendship.countDocuments(filter),
    Friendship.find(filter)
      .populate('recipient', 'username')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean(),
  ]);
  return { requests, pagination: buildMeta(total) };
};

const respondToRequest = async (friendshipId, userId, action) => {
  const friendship = await Friendship.findById(friendshipId);
  if (!friendship) throw AppError('Friend request not found', 404);
  if (friendship.recipient.toString() !== userId) {
    throw AppError('Only the recipient can respond to this request', 403);
  }
  if (friendship.status !== 'pending') throw AppError('Request already resolved', 422);

  friendship.status = action === 'accept' ? 'accepted' : 'rejected';
  await friendship.save();
  return friendship;
};

const getFriends = async (userId, query) => {
  const { skip, limit, buildMeta } = paginate(query);
  const filter = {
    status: 'accepted',
    $or: [{ requester: userId }, { recipient: userId }],
  };

  const [total, friendships] = await Promise.all([
    Friendship.countDocuments(filter),
    Friendship.find(filter)
      .populate('requester', 'username')
      .populate('recipient', 'username')
      .skip(skip)
      .limit(limit)
      .lean(),
  ]);

  const friends = friendships.map((f) => ({
    friendshipId: f._id,
    friend: f.requester._id.toString() === userId ? f.recipient : f.requester,
    since: f.updatedAt,
  }));

  return { friends, pagination: buildMeta(total) };
};

const removeFriend = async (friendshipId, userId) => {
  const friendship = await Friendship.findById(friendshipId);
  if (!friendship) throw AppError('Friendship not found', 404);
  const isParty =
    friendship.requester.toString() === userId ||
    friendship.recipient.toString() === userId;
  if (!isParty) throw AppError('Not your friendship to remove', 403);
  await friendship.deleteOne();
  return { message: 'Friend removed' };
};

const blockUser = async (blockerId, blockedId) => {
  await Friendship.findOneAndUpdate(
    {
      $or: [
        { requester: blockerId, recipient: blockedId },
        { requester: blockedId, recipient: blockerId },
      ],
    },
    { status: 'blocked', requester: blockerId, recipient: blockedId },
    { upsert: true, new: true }
  );
  return { message: 'User blocked' };
};

module.exports = {
  sendRequest,
  getIncomingRequests,
  getOutgoingRequests,
  respondToRequest,
  getFriends,
  removeFriend,
  blockUser,
};
