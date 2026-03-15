'use strict';

const messageService       = require('../services/message.service');
const { EVENTS, ROOMS }    = require('../config/socket');
const { Friendship }       = require('../models');

/**
 * Chat Socket Handler
 *
 * Rooms used:
 *   conversation:<friendshipId>  — private DM threads
 *
 * Supported events (client → server):
 *   conversation:join    Join a DM room
 *   conversation:leave   Leave a DM room
 *   message:send         Send a chat message
 *   message:read         Acknowledge messages read
 *   user:typing          Typing indicator start
 *   user:stopTyping      Typing indicator stop
 *
 * Emitted events (server → client):
 *   message:received     Delivered to recipient's personal room
 *   message:delivered    Confirm to sender on success
 *   message:read         Sent to message sender when recipient reads
 *   user:typing          Broadcast to conversation room
 *   user:stopTyping      Broadcast to conversation room
 */
module.exports = (io, socket) => {
  // ── Join / Leave DM conversation room ─────────────────────────────────────
  socket.on(EVENTS.JOIN_CONV, async ({ friendshipId }) => {
    if (!friendshipId) return;
    try {
      // Guard: socket user must be a party of this friendship
      const friendship = await Friendship.findById(friendshipId)
        .select('requester recipient status')
        .lean();

      if (!friendship || friendship.status !== 'accepted') return;
      const isParty =
        friendship.requester.toString() === socket.userId ||
        friendship.recipient.toString() === socket.userId;
      if (!isParty) return;

      socket.join(ROOMS.conversation(friendshipId));
    } catch (err) {
      socket.emit(EVENTS.ERROR, { message: err.message });
    }
  });

  socket.on(EVENTS.LEAVE_CONV, ({ friendshipId }) => {
    if (friendshipId) socket.leave(ROOMS.conversation(friendshipId));
  });

  // ── Send a message ─────────────────────────────────────────────────────────
  socket.on(EVENTS.MSG_SEND, async ({ friendshipId, content, type = 'text', mediaUrl }) => {
    try {
      const message = await messageService.sendMessage(friendshipId, socket.userId, {
        content,
        type,
        mediaUrl,
      });

      // Broadcast to both parties within the conversation room
      io.to(ROOMS.conversation(friendshipId)).emit(EVENTS.MSG_RECEIVED, {
        message,
        friendshipId,
      });

      // Confirm delivery to sender
      socket.emit(EVENTS.MSG_DELIVERED, {
        tempId: message._id,
        message,
        friendshipId,
      });
    } catch (err) {
      socket.emit(EVENTS.ERROR, { message: err.message });
    }
  });

  // ── Mark messages as read ──────────────────────────────────────────────────
  socket.on(EVENTS.MSG_READ, async ({ friendshipId }) => {
    try {
      // markAsRead emits MSG_READ to the sender internally via getIO()
      await messageService.markAsRead(friendshipId, socket.userId);
    } catch (err) {
      socket.emit(EVENTS.ERROR, { message: err.message });
    }
  });

  // ── Typing indicators ──────────────────────────────────────────────────────
  socket.on(EVENTS.USER_TYPING, ({ friendshipId }) => {
    if (!friendshipId) return;
    socket.to(ROOMS.conversation(friendshipId)).emit(EVENTS.USER_TYPING, {
      userId: socket.userId,
      friendshipId,
    });
  });

  socket.on(EVENTS.USER_STOPPED, ({ friendshipId }) => {
    if (!friendshipId) return;
    socket.to(ROOMS.conversation(friendshipId)).emit(EVENTS.USER_STOPPED, {
      userId: socket.userId,
      friendshipId,
    });
  });
};
