'use strict';

const { Notification }   = require('../models');
const { EVENTS }         = require('../config/socket');

/**
 * Notification Socket Handler
 *
 * Server → Client (pushed from services via getIO()):
 *   notification:new      New notification arrived
 *
 * Client → Server:
 *   notification:markRead  Client acknowledges a notification as read
 *
 * Server → Client (response):
 *   notification:updated   Confirm the read status was saved
 */
module.exports = (io, socket) => {
  socket.on(EVENTS.NOTIF_READ, async ({ notificationId }) => {
    if (!notificationId) return;
    try {
      const notif = await Notification.findOneAndUpdate(
        { _id: notificationId, userId: socket.userId },
        { read: true, readAt: new Date() },
        { new: true }
      ).lean();

      if (notif) {
        socket.emit(EVENTS.NOTIF_UPDATED, {
          notificationId,
          read: true,
          readAt: notif.readAt,
        });
      }
    } catch (err) {
      socket.emit(EVENTS.ERROR, { message: err.message });
    }
  });
};
