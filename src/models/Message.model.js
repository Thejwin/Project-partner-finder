const mongoose = require('mongoose');

const { Schema } = mongoose;

const messageSchema = new Schema(
  {
    friendshipId: {
      type: Schema.Types.ObjectId,
      ref: 'Friendship',
      required: [true, 'Friendship context is required'],
      index: true,
    },

    senderId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Sender is required'],
      index: true,
    },

    recipientId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Recipient is required'],
      index: true,
    },

    content: {
      type: String,
      trim: true,
      maxlength: [5000, 'Message content cannot exceed 5000 characters'],
    },

    type: {
      type: String,
      enum: {
        values: ['text', 'media'],
        message: 'Message type must be text or media',
      },
      default: 'text',
    },

    // For type = 'media': URL of the uploaded file (e.g. Cloudinary URL)
    mediaUrl: {
      type: String,
      trim: true,
      default: null,
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
    timestamps: true, // createdAt acts as sentAt
    versionKey: false,
  }
);

// ─── Validation: text messages must have content; media messages must have URL ─
messageSchema.pre('validate', function (next) {
  if (this.type === 'text' && !this.content) {
    return next(new Error('Text messages must have content'));
  }
  if (this.type === 'media' && !this.mediaUrl) {
    return next(new Error('Media messages must have a mediaUrl'));
  }
  return next();
});

// ─── Indexes ──────────────────────────────────────────────────────────────────
// Primary conversation thread query: all messages for a friendship, newest first
messageSchema.index({ friendshipId: 1, createdAt: -1 });
// Unread messages for a recipient
messageSchema.index({ recipientId: 1, read: 1 });
// All messages sent by a user
messageSchema.index({ senderId: 1, createdAt: -1 });

const Message = mongoose.model('Message', messageSchema);

module.exports = Message;
