'use strict';

const { Notification } = require('../models');
const paginate = require('../utils/paginate');

const AppError = (msg, code) => Object.assign(new Error(msg), { statusCode: code });

const getNotifications = async (userId, query) => {
  const { read, type, page: p, limit: l } = query;
  const { skip, limit, buildMeta } = paginate({ page: p, limit: l });

  const filter = { userId };
  if (read !== undefined) filter.read = read === 'true';
  if (type)               filter.type = type;

  const [total, unreadCount, notifications] = await Promise.all([
    Notification.countDocuments(filter),
    Notification.countDocuments({ userId, read: false }),
    Notification.find(filter)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean(),
  ]);

  return { notifications, unreadCount, pagination: buildMeta(total) };
};

const markOneRead = async (notificationId, userId) => {
  const notif = await Notification.findOneAndUpdate(
    { _id: notificationId, userId },
    { read: true, readAt: new Date() },
    { new: true }
  );
  if (!notif) throw AppError('Notification not found', 404);
  return notif;
};

const markAllRead = async (userId) => {
  const result = await Notification.updateMany(
    { userId, read: false },
    { read: true, readAt: new Date() }
  );
  return { updated: result.modifiedCount };
};

const deleteNotification = async (notificationId, userId) => {
  const notif = await Notification.findOneAndDelete({ _id: notificationId, userId });
  if (!notif) throw AppError('Notification not found', 404);
  return { message: 'Notification deleted' };
};

module.exports = { getNotifications, markOneRead, markAllRead, deleteNotification };
