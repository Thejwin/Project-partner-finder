const mongoose = require('mongoose');

const { Schema } = mongoose;

const notificationSchema = new Schema(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Target user is required'],
      index: true,
    },

    type: {
      type: String,
      enum: {
        values: ['friend_request', 'project_invite', 'message', 'recommendation', 'system'],
        message: 'Invalid notification type',
      },
      required: [true, 'Notification type is required'],
    },

    // The ID of the entity that triggered this notification (Friendship, Project, Message, etc.)
    referenceId: {
      type: Schema.Types.ObjectId,
      default: null,
    },

    // The collection the referenceId belongs to, for client-side routing
    referenceModel: {
      type: String,
      enum: ['Friendship', 'Project', 'Message', 'Recommendation', null],
      default: null,
    },

    message: {
      type: String,
      required: [true, 'Notification message is required'],
      trim: true,
      maxlength: [300, 'Notification message cannot exceed 300 characters'],
    },

    read: {
      type: Boolean,
      default: false,
    },

    readAt: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
    versionKey: false,
  }
);

// ─── Indexes ──────────────────────────────────────────────────────────────────
notificationSchema.index({ userId: 1, read: 1, createdAt: -1 }); // Unread feed
notificationSchema.index({ userId: 1, type: 1 });                 // Filtered view by type
notificationSchema.index({ userId: 1, createdAt: -1 });           // Full notification history

const Notification = mongoose.model('Notification', notificationSchema);

module.exports = Notification;
