'use strict';

const { Server } = require('socket.io');
const env = require('./env');
const { verifyAccessToken } = require('../utils/token');

let io;

/* ─────────────────────────────────────────────────────────────────────────────
 * Room naming convention (used everywhere in the codebase):
 *
 *   user:<userId>              Personal room — notifications, DM receipts
 *   project:<projectId>        Project room  — task updates, project events
 *   conversation:<friendshipId> DM chat room  — private messages
 *
 * These constants are exported so handlers stay in sync.
 * ───────────────────────────────────────────────────────────────────────────*/
const ROOMS = {
  user:         (id) => `user:${id}`,
  project:      (id) => `project:${id}`,
  conversation: (id) => `conversation:${id}`,
};

/* ─────────────────────────────────────────────────────────────────────────────
 * Socket.io Events Catalogue
 * Single source of truth — import EVENTS in every handler and service.
 * ───────────────────────────────────────────────────────────────────────────*/
const EVENTS = {
  /* ── Connection ─────────────────────────────────────────────── */
  CONNECT:    'connect',
  DISCONNECT: 'disconnect',
  ERROR:      'error',

  /* ── Presence ───────────────────────────────────────────────── */
  USER_ONLINE:   'user:online',
  USER_OFFLINE:  'user:offline',
  USER_TYPING:   'user:typing',
  USER_STOPPED:  'user:stopTyping',

  /* ── Project rooms ──────────────────────────────────────────── */
  JOIN_PROJECT:  'project:join',
  LEAVE_PROJECT: 'project:leave',

  /* ── Chat (DM) ──────────────────────────────────────────────── */
  JOIN_CONV:    'conversation:join',
  LEAVE_CONV:   'conversation:leave',
  MSG_SEND:     'message:send',
  MSG_RECEIVED: 'message:received',
  MSG_READ:     'message:read',
  MSG_DELIVERED:'message:delivered',

  /* ── Tasks ──────────────────────────────────────────────────── */
  TASK_CREATED: 'task:created',
  TASK_UPDATED: 'task:updated',
  TASK_STATUS:  'task:statusChanged',
  TASK_DELETED: 'task:deleted',
  TASK_ASSIGNED:'task:assigned',

  /* ── Notifications ──────────────────────────────────────────── */
  NOTIF_NEW:     'notification:new',
  NOTIF_READ:    'notification:markRead',
  NOTIF_UPDATED: 'notification:updated',

  /* ── Project membership ─────────────────────────────────────── */
  MEMBER_JOINED:  'project:memberJoined',
  MEMBER_LEFT:    'project:memberLeft',
};

/* ─────────────────────────────────────────────────────────────────────────────
 * initSocket — attach Socket.io to the underlying HTTP server.
 * ───────────────────────────────────────────────────────────────────────────*/
const initSocket = (httpServer) => {
  io = new Server(httpServer, {
    cors: {
      origin:      env.CLIENT_URL,
      methods:     ['GET', 'POST'],
      credentials: true,
    },
    pingTimeout:  60_000,
    pingInterval: 25_000,
  });

  /* ── Auth middleware: runs before every connection ─────────── */
  io.use((socket, next) => {
    const token = socket.handshake.auth?.token;
    if (!token) return next(new Error('AUTH_REQUIRED'));
    try {
      const payload = verifyAccessToken(token);
      socket.userId = payload._id;
      return next();
    } catch {
      return next(new Error('AUTH_INVALID'));
    }
  });

  /* ── Load handlers ─────────────────────────────────────────── */
  const chatHandler         = require('../sockets/chat.socket');
  const notificationHandler = require('../sockets/notification.socket');
  const presenceHandler     = require('../sockets/presence.socket');
  const taskHandler         = require('../sockets/task.socket');

  io.on(EVENTS.CONNECT, (socket) => {
    /* Every authenticated socket joins their personal room immediately */
    socket.join(ROOMS.user(socket.userId));

    /* Delegate to feature handlers */
    presenceHandler(io, socket);
    chatHandler(io, socket);
    taskHandler(io, socket);
    notificationHandler(io, socket);

    socket.on(EVENTS.DISCONNECT, (reason) => {
      console.log(`🔌 Disconnected: ${socket.userId} (${reason})`);
    });
  });

  console.log('✅ Socket.io initialised');
  return io;
};

/* ──────────────────────────────────────────────────────────────────────────────
 * getIO — safe accessor used by services to emit from outside handlers.
 * ─────────────────────────────────────────────────────────────────────────────*/
const getIO = () => {
  if (!io) throw new Error('Socket.io not yet initialised');
  return io;
};

module.exports = { initSocket, getIO, ROOMS, EVENTS };
