const mongoose = require('mongoose');

const { Schema } = mongoose;

const friendshipSchema = new Schema(
  {
    requester: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Requester is required'],
      index: true,
    },

    recipient: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Recipient is required'],
      index: true,
    },

    status: {
      type: String,
      enum: {
        values: ['pending', 'accepted', 'rejected', 'blocked'],
        message: 'Invalid friendship status',
      },
      default: 'pending',
    },
  },
  {
    timestamps: true,
    versionKey: false,
  }
);

// ─── Indexes ──────────────────────────────────────────────────────────────────
// Compound unique: ensures only one Friendship document exists per pair
friendshipSchema.index({ requester: 1, recipient: 1 }, { unique: true });
friendshipSchema.index({ recipient: 1, status: 1 });   // Incoming requests
friendshipSchema.index({ requester: 1, status: 1 });   // Sent requests
// Used to fetch the full friend list for a given user
friendshipSchema.index({ status: 1 });

// ─── Validation: a user cannot friend themselves ───────────────────────────
friendshipSchema.pre('save', function (next) {
  if (this.requester.equals(this.recipient)) {
    return next(new Error('A user cannot send a friend request to themselves'));
  }
  return next();
});

const Friendship = mongoose.model('Friendship', friendshipSchema);

module.exports = Friendship;
