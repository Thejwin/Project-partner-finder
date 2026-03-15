'use strict';

const { Message, Friendship } = require('../models');
const paginate = require('../utils/paginate');
const { getIO } = require('../config/socket');

const AppError = (msg, code) => Object.assign(new Error(msg), { statusCode: code });

const assertFriendship = async (friendshipId, userId) => {
  const friendship = await Friendship.findById(friendshipId).lean();
  if (!friendship) throw AppError('Conversation not found', 404);
  if (friendship.status !== 'accepted') throw AppError('Chat is only available between friends', 403);
  const isParty =
    friendship.requester.toString() === userId.toString() ||
    friendship.recipient.toString() === userId.toString();
  if (!isParty) throw AppError('Access denied to this conversation', 403);
  return friendship;
};

const getConversations = async (userId) => {
  // Get all accepted friendships
  const friendships = await Friendship.find({
    status: 'accepted',
    $or: [{ requester: userId }, { recipient: userId }],
  })
    .populate('requester', 'username')
    .populate('recipient', 'username')
    .lean();

  // For each, get the last message and unread count
  const conversations = await Promise.all(
    friendships.map(async (f) => {
      const friend = f.requester._id.toString() === userId.toString() ? f.recipient : f.requester;
      const [lastMessage, unreadCount] = await Promise.all([
        Message.findOne({ friendshipId: f._id }).sort({ createdAt: -1 }).lean(),
        Message.countDocuments({ friendshipId: f._id, recipientId: userId, read: false }),
      ]);
      return { friendshipId: f._id, friend, lastMessage, unreadCount };
    })
  );

  // Sort by latest message
  return conversations.sort((a, b) => {
    const aTime = a.lastMessage?.createdAt || 0;
    const bTime = b.lastMessage?.createdAt || 0;
    return bTime - aTime;
  });
};

const getMessages = async (friendshipId, userId, query) => {
  await assertFriendship(friendshipId, userId);
  const { skip, limit, buildMeta } = paginate(query);

  const filter = { friendshipId };
  const [total, messages] = await Promise.all([
    Message.countDocuments(filter),
    Message.find(filter)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean(),
  ]);

  return { messages: messages.reverse(), pagination: buildMeta(total) };
};

const sendMessage = async (friendshipId, senderId, data) => {
  const friendship = await assertFriendship(friendshipId, senderId);
  const recipientId =
    friendship.requester.toString() === senderId.toString()
      ? friendship.recipient.toString()
      : friendship.requester.toString();

  const message = await Message.create({
    friendshipId,
    senderId,
    recipientId,
    ...data,
  });

  try {
    getIO().to(`user:${recipientId}`).emit('message:received', {
      message,
      friendshipId,
    });
  } catch (_) {}

  return message;
};

const markAsRead = async (friendshipId, userId) => {
  await assertFriendship(friendshipId, userId);
  const result = await Message.updateMany(
    { friendshipId, recipientId: userId, read: false },
    { read: true, readAt: new Date() }
  );

  try {
    const friendship = await Friendship.findById(friendshipId).lean();
    const senderId =
      friendship.requester.toString() === userId.toString()
        ? friendship.recipient.toString()
        : friendship.requester.toString();
    getIO().to(`user:${senderId}`).emit('message:read', { friendshipId, readAt: new Date() });
  } catch (_) {}

  return { updated: result.modifiedCount };
};

module.exports = { getConversations, getMessages, sendMessage, markAsRead };
