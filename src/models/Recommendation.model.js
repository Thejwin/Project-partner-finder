const mongoose = require('mongoose');

const { Schema } = mongoose;

const recommendationSchema = new Schema(
  {
    targetUserId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Target user is required'],
      index: true,
    },

    type: {
      type: String,
      enum: {
        values: ['people', 'project'],
        message: 'Type must be people or project',
      },
      required: [true, 'Recommendation type is required'],
    },

    // ID of the recommended User (for type='people') or Project (for type='project')
    referenceId: {
      type: Schema.Types.ObjectId,
      required: [true, 'Reference ID is required'],
    },

    referenceModel: {
      type: String,
      enum: ['User', 'Project'],
      required: true,
    },

    // Composite relevance score (0–1) combining all signals below
    score: {
      type: Number,
      required: true,
      min: 0,
      max: 1,
    },

    // Linked SkillMatchScore (for type='project' recommendations)
    matchScoreId: {
      type: Schema.Types.ObjectId,
      ref: 'SkillMatchScore',
      default: null,
    },

    // Breakdown of score components for explainability (shown in UI)
    scoreBreakdown: {
      skillSimilarity:   { type: Number, default: 0, min: 0, max: 1 },
      interestOverlap:   { type: Number, default: 0, min: 0, max: 1 },
      mutualConnections: { type: Number, default: 0, min: 0, max: 1 },
    },

    // Soft expiry: re-run recommendation engine periodically
    expiresAt: {
      type: Date,
      default: () => new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
    },
  },
  {
    timestamps: true,
    versionKey: false,
  }
);

// ─── Indexes ──────────────────────────────────────────────────────────────────
// One active recommendation per (user, reference) pair
recommendationSchema.index({ targetUserId: 1, referenceId: 1, type: 1 }, { unique: true });
recommendationSchema.index({ targetUserId: 1, score: -1 });         // Feed sorted by relevance
recommendationSchema.index({ targetUserId: 1, type: 1, score: -1 }); // Filtered feed
recommendationSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 }); // TTL — auto-delete stale recs

const Recommendation = mongoose.model('Recommendation', recommendationSchema);

module.exports = Recommendation;
