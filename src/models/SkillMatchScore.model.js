const mongoose = require('mongoose');

const { Schema } = mongoose;

/**
 * SkillPairScore — embedded in SkillMatchScore.skillBreakdown[].
 * Shows how closely one user skill maps to one project required skill.
 */
const skillPairScoreSchema = new Schema(
  {
    userSkill:    { type: String, required: true, trim: true },  // From Profile.skills[].name
    projectSkill: { type: String, required: true, trim: true },  // From Project.requiredSkills[].name
    similarity:   { type: Number, required: true, min: 0, max: 1 }, // Cosine similarity for this pair
  },
  { _id: false }
);

/**
 * SkillMatchScore — the join entity produced by the AI matching pipeline.
 * Stores precomputed cosine similarity between a user's skill vector
 * and a project's required skill vector, with full explainability data.
 */
const skillMatchScoreSchema = new Schema(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'User reference is required'],
      index: true,
    },

    projectId: {
      type: Schema.Types.ObjectId,
      ref: 'Project',
      required: [true, 'Project reference is required'],
      index: true,
    },

    /**
     * Cosine similarity ∈ [0, 1] between:
     *   Profile.aggregateSkillVector  ↔  Project.aggregateRequiredVector
     * Threshold for "strong match": ≥ 0.70
     */
    cosineSimilarity: {
      type: Number,
      required: [true, 'Cosine similarity score is required'],
      min: 0,
      max: 1,
    },

    // Per-skill pair breakdown — human-readable, sent to client for explainability
    skillBreakdown: {
      type: [skillPairScoreSchema],
      default: [],
    },

    // Derived arrays from skillBreakdown, for fast UI rendering
    matchedSkills: {
      type: [String],
      default: [],
    },

    missingSkills: {
      type: [String],
      default: [],
    },

    // Similarity threshold used when this score was computed
    threshold: {
      type: Number,
      default: 0.70,
    },

    // Which embedding model version generated this score
    modelVersion: {
      type: String,
      required: [true, 'Model version is required'],
      default: 'all-MiniLM-L6-v2',
    },

    computedAt: {
      type: Date,
      default: Date.now,
    },

    // Stale flag: set to true when profile or project skills change
    // The recompute job filters on this flag
    stale: {
      type: Boolean,
      default: false,
      index: true,
    },
  },
  {
    timestamps: false, // computedAt is used instead
    versionKey: false,
  }
);

// ─── Indexes ──────────────────────────────────────────────────────────────────
// Primary lookup: one score per (user, project) pair
skillMatchScoreSchema.index({ userId: 1, projectId: 1 }, { unique: true });

// Score-sorted project recommendations for a given user
skillMatchScoreSchema.index({ userId: 1, cosineSimilarity: -1 });

// Score-sorted collaborator suggestions for a given project
skillMatchScoreSchema.index({ projectId: 1, cosineSimilarity: -1 });

// Background recompute job filter: find all stale scores
skillMatchScoreSchema.index({ stale: 1, computedAt: 1 });

// Model migration: find all scores for a given model version
skillMatchScoreSchema.index({ modelVersion: 1 });

const SkillMatchScore = mongoose.model('SkillMatchScore', skillMatchScoreSchema);

module.exports = SkillMatchScore;
