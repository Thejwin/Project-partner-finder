'use strict';

const { EVENTS, ROOMS } = require('../config/socket');

/**
 * Presence Socket Handler
 *
 * Tracks which users are connected. In a single-process deployment
 * the onlineUsers Map is sufficient. For multi-instance/cluster,
 * replace with a Redis Set (via ioredis + socket.io-redis adapter).
 *
 * Server → Client events:
 *   user:online    A tracked user just connected
 *   user:offline   A tracked user disconnected
 *   user:typing    Typing indicator (re-emitted from chat handler)
 *   user:stopTyping Typing stopped
 */

// In-process store: userId → Set of socketIds (supports multiple tabs)
const onlineUsers = new Map();

module.exports = (io, socket) => {
  const userId = socket.userId;

  // ── Mark online ──────────────────────────────────────────────────────────────
  if (!onlineUsers.has(userId)) {
    onlineUsers.set(userId, new Set());
  }
  onlineUsers.get(userId).add(socket.id);

  // Only broadcast "came online" when first socket for this user connects
  if (onlineUsers.get(userId).size === 1) {
    socket.broadcast.emit(EVENTS.USER_ONLINE, { userId });
  }

  // ── Mark offline ─────────────────────────────────────────────────────────────
  socket.on(EVENTS.DISCONNECT, () => {
    const sockets = onlineUsers.get(userId);
    if (sockets) {
      sockets.delete(socket.id);
      if (sockets.size === 0) {
        onlineUsers.delete(userId);
        io.emit(EVENTS.USER_OFFLINE, { userId, lastSeen: new Date() });
      }
    }
  });
};

/** @returns {string[]} Array of currently online userIds */
const getOnlineUsers = () => Array.from(onlineUsers.keys());

/** @param {string} userId @returns {boolean} */
const isOnline = (userId) => onlineUsers.has(userId);

module.exports.getOnlineUsers = getOnlineUsers;
module.exports.isOnline       = isOnline;
