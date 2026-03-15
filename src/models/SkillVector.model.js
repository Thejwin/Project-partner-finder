const mongoose = require('mongoose');

const { Schema } = mongoose;

/**
 * SkillVector — canonical NLP embedding for a named skill.
 * Acts as a shared lookup table referenced by Profile.skills[].skillVectorId
 * and Project.requiredSkills[].skillVectorId.
 * Raw vectors are NEVER sent to the client.
 */
const skillVectorSchema = new Schema(
  {
    name: {
      type: String,
      required: [true, 'Skill name is required'],
      unique: true,
      trim: true,
      lowercase: true, // normalised storage: "react", "machine learning"
      maxlength: [100, 'Skill name cannot exceed 100 characters'],
    },

    // Alternative spellings / user-entered variants resolved to this canonical name
    aliases: {
      type: [String],
      default: [],
    },

    category: {
      type: String,
      enum: {
        values: ['technical', 'soft', 'domain'],
        message: 'Category must be technical, soft, or domain',
      },
      required: [true, 'Skill category is required'],
    },

    // Dense NLP embedding vector (e.g. 384-dim for all-MiniLM-L6-v2)
    // Stored as an array of floats. Never returned to the client (select: false).
    vector: {
      type: [Number],
      required: [true, 'Embedding vector is required'],
      validate: {
        validator: (v) => Array.isArray(v) && v.length > 0,
        message: 'Vector must be a non-empty array of numbers',
      },
      select: false,
    },

    // Which embedding model generated this vector
    modelVersion: {
      type: String,
      required: [true, 'Model version is required'],
      trim: true,
      default: 'all-MiniLM-L6-v2',
    },
  },
  {
    timestamps: true,
    versionKey: false,
  }
);

// ─── Indexes ──────────────────────────────────────────────────────────────────
skillVectorSchema.index({ aliases: 1 }); // Fast alias lookup on skill input
skillVectorSchema.index({ category: 1 });
skillVectorSchema.index({ modelVersion: 1 }); // For bulk re-embedding on model update

const SkillVector = mongoose.model('SkillVector', skillVectorSchema);

module.exports = SkillVector;
