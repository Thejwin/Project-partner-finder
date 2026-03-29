'use strict';

const mongoose = require('mongoose');
const { Schema } = mongoose;

const ratingSchema = new Schema(
  {
    projectId: {
      type: Schema.Types.ObjectId,
      ref: 'Project',
      required: [true, 'Project reference is required'],
    },

    raterId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Rater reference is required'],
    },

    rateeId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Ratee reference is required'],
    },

    score: {
      type: Number,
      required: [true, 'Rating score is required'],
      min: [1, 'Score must be at least 1'],
      max: [5, 'Score cannot exceed 5'],
    },

    comment: {
      type: String,
      trim: true,
      maxlength: [500, 'Comment cannot exceed 500 characters'],
      default: '',
    },
  },
  {
    timestamps: true,
    versionKey: false,
  }
);

// ─── Indexes ──────────────────────────────────────────────────────────────────
// Prevent duplicate ratings: one rating per rater→ratee pair per project
ratingSchema.index({ projectId: 1, raterId: 1, rateeId: 1 }, { unique: true });
// Quickly look up all ratings a user has received (for reputation calc)
ratingSchema.index({ rateeId: 1 });
// All ratings within a project
ratingSchema.index({ projectId: 1 });

const Rating = mongoose.model('Rating', ratingSchema);

module.exports = Rating;
