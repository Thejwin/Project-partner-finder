const mongoose = require('mongoose');

const { Schema } = mongoose;

// ─── Sub-schemas ──────────────────────────────────────────────────────────────

const educationEntrySchema = new Schema(
  {
    institution: { type: String, required: true, trim: true, maxlength: 150 },
    degree: { type: String, trim: true, maxlength: 100 },
    fieldOfStudy: { type: String, trim: true, maxlength: 100 },
    startYear: { type: Number, min: 1900, max: 2100 },
    endYear: { type: Number, min: 1900, max: 2100 },
  },
  { _id: false }
);

const experienceEntrySchema = new Schema(
  {
    company: { type: String, required: true, trim: true, maxlength: 150 },
    role: { type: String, required: true, trim: true, maxlength: 100 },
    description: { type: String, trim: true, maxlength: 500 },
    startDate: { type: Date },
    endDate: { type: Date },
    current: { type: Boolean, default: false },
  },
  { _id: false }
);

const linkEntrySchema = new Schema(
  {
    platform: {
      type: String,
      enum: ['github', 'linkedin', 'twitter', 'portfolio', 'other'],
      required: true,
    },
    url: {
      type: String,
      required: true,
      trim: true,
      match: [/^https?:\/\/.+/, 'URL must start with http:// or https://'],
    },
  },
  { _id: false }
);

/**
 * SkillEntry — embedded in Profile.skills[].
 * Each entry stores the user-facing label, self-reported proficiency,
 * and a reference to the canonical SkillVector document.
 */
const skillEntrySchema = new Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
      maxlength: 100,
    },
    level: {
      type: String,
      enum: {
        values: ['beginner', 'intermediate', 'expert'],
        message: 'Level must be beginner, intermediate, or expert',
      },
      default: 'intermediate',
    },
    skillVectorId: {
      type: Schema.Types.ObjectId,
      ref: 'SkillVector',
      required: true,
    },
  },
  { _id: false }
);

const offlineProfileSchema = new Schema(
  {
    phone: { type: String, trim: true, maxlength: 20 },
    contactEmail: {
      type: String,
      trim: true,
      lowercase: true,
      match: [/^\S+@\S+\.\S+$/, 'Please provide a valid email'],
    },
  },
  { _id: false }
);

const performanceAnalyticsSchema = new Schema(
  {
    profileViews: { type: Number, default: 0, min: 0 },
    projectApplicationsReceived: { type: Number, default: 0, min: 0 },
    collaborationsCompleted: { type: Number, default: 0, min: 0 },
    averageMatchScore: { type: Number, default: 0, min: 0, max: 1 },
  },
  { _id: false }
);

// ─── Profile Schema ────────────────────────────────────────────────────────────

const profileSchema = new Schema(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'User reference is required'],
      unique: true, // Enforces 1-to-1 relationship
    },

    name: {
      type: String,
      trim: true,
      maxlength: [80, 'Display name cannot exceed 80 characters'],
    },

    age: {
      type: Number,
      min: [13, 'Age must be at least 13'],
      max: [120, 'Age cannot exceed 120'],
    },

    description: {
      type: String,
      trim: true,
      maxlength: [1000, 'Bio cannot exceed 1000 characters'],
    },

    header: {
      type: String,
      trim: true,
      maxlength: [160, 'Headline cannot exceed 160 characters'],
    },

    location: {
      type: String,
      trim: true,
      maxlength: [100, 'Location cannot exceed 100 characters'],
    },

    website: {
      type: String,
      trim: true,
      match: [/^https?:\/\/.+/, 'Website URL must start with http:// or https://'],
    },

    profilePicture: {
      type: String,
      trim: true,
      default: null,
    },

    portfolioLink: {
      type: String,
      trim: true,
      match: [/^https?:\/\/.+/, 'Portfolio URL must start with http:// or https://'],
    },

    // ── AI Skill Matching fields ─────────────────────────────────────────────
    skills: {
      type: [skillEntrySchema],
      default: [],
      validate: {
        validator: (arr) => arr.length <= 50,
        message: 'A profile cannot have more than 50 skills',
      },
    },

    /**
     * Mean-pooled NLP embedding across all user skills.
     * Computed and cached by the AI service; invalidated and recomputed
     * whenever skills array changes. Never sent to the client.
     */
    aggregateSkillVector: {
      type: [Number],
      default: [],
      select: false,
    },

    skillVectorUpdatedAt: {
      type: Date,
      default: null,
    },
    // ─────────────────────────────────────────────────────────────────────────

    areasOfInterest: {
      type: [String],
      default: [],
      validate: {
        validator: (arr) => arr.length <= 20,
        message: 'Cannot have more than 20 areas of interest',
      },
    },

    education: {
      type: [educationEntrySchema],
      default: [],
    },

    experience: {
      type: [experienceEntrySchema],
      default: [],
    },

    links: {
      type: [linkEntrySchema],
      default: [],
    },

    profileVisibility: {
      type: String,
      enum: {
        values: ['public', 'private'],
        message: 'Visibility must be public or private',
      },
      default: 'public',
    },

    // References to projects this user has worked on (populated separately)
    previousProjects: {
      type: [{ type: Schema.Types.ObjectId, ref: 'Project' }],
      default: [],
    },

    popularProjects: {
      type: [{ type: Schema.Types.ObjectId, ref: 'Project' }],
      default: [],
      validate: {
        validator: (arr) => arr.length <= 6,
        message: 'Cannot feature more than 6 popular projects',
      },
    },

    offlineProfile: {
      type: offlineProfileSchema,
      default: {},
    },

    // Visible ONLY to the owner — enforced at the service layer
    performanceAnalytics: {
      type: performanceAnalyticsSchema,
      default: {},
    },

    others: {
      type: Schema.Types.Mixed,
      default: {},
    },
  },
  {
    timestamps: true,
    versionKey: false,
  }
);

// ─── Indexes ──────────────────────────────────────────────────────────────────
profileSchema.index({ profileVisibility: 1 });
profileSchema.index({ 'skills.name': 1 });           // Filter/search by skill name
profileSchema.index({ areasOfInterest: 1 });         // Recommendation matching
profileSchema.index({ 'skills.skillVectorId': 1 });  // AI matching joins
profileSchema.index(
  { name: 'text', description: 'text', 'skills.name': 'text', header: 'text' },
  { name: 'profile_text_search' }
);

// ─── Middleware: invalidate aggregateSkillVector when skills change ────────────
profileSchema.pre('save', function (next) {
  if (this.isModified('skills')) {
    this.aggregateSkillVector = [];      // Cleared; AI job will recompute
    this.skillVectorUpdatedAt = null;
  }
  next();
});

const Profile = mongoose.model('Profile', profileSchema);

module.exports = Profile;
