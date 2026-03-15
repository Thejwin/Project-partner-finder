const mongoose = require('mongoose');

const { Schema } = mongoose;

// ─── Sub-schemas ──────────────────────────────────────────────────────────────

const adminActionsSchema = new Schema(
  {
    deleteProject:            { type: Boolean, default: false },
    editCollaboratorRoles:    { type: Boolean, default: false },
    deleteCollaborators:      { type: Boolean, default: false },
    editCollaboratorStatus:   { type: Boolean, default: false },
    connectToGroupMedia:      { type: Boolean, default: false },
  },
  { _id: false }
);

/**
 * RequiredSkillEntry — embedded in Project.requiredSkills[].
 * Stores the human-readable skill name, how important it is,
 * and a ref to the canonical SkillVector for AI matching.
 */
const requiredSkillEntrySchema = new Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
      maxlength: 100,
    },
    importance: {
      type: String,
      enum: {
        values: ['nice-to-have', 'required', 'critical'],
        message: 'Importance must be nice-to-have, required, or critical',
      },
      default: 'required',
    },
    skillVectorId: {
      type: Schema.Types.ObjectId,
      ref: 'SkillVector',
      required: true,
    },
  },
  { _id: false }
);

// ─── Project Schema ────────────────────────────────────────────────────────────

const projectSchema = new Schema(
  {
    ownerId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Project must have an owner'],
      index: true,
    },

    title: {
      type: String,
      required: [true, 'Project title is required'],
      trim: true,
      minlength: [3, 'Title must be at least 3 characters'],
      maxlength: [120, 'Title cannot exceed 120 characters'],
    },

    description: {
      type: String,
      required: [true, 'Project description is required'],
      trim: true,
      minlength: [10, 'Description must be at least 10 characters'],
      maxlength: [5000, 'Description cannot exceed 5000 characters'],
    },

    date: {
      type: Date,
      required: [true, 'Project start date is required'],
    },

    type: {
      type: String,
      enum: {
        values: ['Chat', 'Free'],
        message: 'Project type must be Chat or Free',
      },
      required: [true, 'Project type is required'],
    },

    status: {
      type: String,
      enum: {
        values: ['open', 'in-progress', 'completed', 'closed'],
        message: 'Invalid project status',
      },
      default: 'open',
    },

    tags: {
      type: [String],
      default: [],
      validate: {
        validator: (arr) => arr.length <= 20,
        message: 'Cannot have more than 20 tags',
      },
    },

    // ── AI Skill Matching fields ─────────────────────────────────────────────
    requiredSkills: {
      type: [requiredSkillEntrySchema],
      default: [],
      validate: {
        validator: (arr) => arr.length <= 30,
        message: 'A project cannot require more than 30 skills',
      },
    },

    /**
     * Mean-pooled embedding of all requiredSkills vectors.
     * Cached by the AI service; cleared when requiredSkills changes.
     * Never sent to the client.
     */
    aggregateRequiredVector: {
      type: [Number],
      default: [],
      select: false,
    },

    requiredVectorUpdatedAt: {
      type: Date,
      default: null,
    },
    // ─────────────────────────────────────────────────────────────────────────

    collaborators: {
      type: [{ type: Schema.Types.ObjectId, ref: 'User' }],
      default: [],
    },

    proposalList: [
      {
        userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
        status: {
          type: String,
          enum: ['pending', 'accepted', 'rejected'],
          default: 'pending',
        },
        appliedAt: { type: Date, default: Date.now },
        _id: false,
      },
    ],

    adminActions: {
      type: adminActionsSchema,
      default: {},
    },

    visibility: {
      type: String,
      enum: {
        values: ['public', 'private'],
        message: 'Visibility must be public or private',
      },
      default: 'public',
    },

    tasks: {
      type: [{ type: Schema.Types.ObjectId, ref: 'Task' }],
      default: [],
    },

    mediaUrl: {
      type: String,
      trim: true,
      default: null,
    },
  },
  {
    timestamps: true,
    versionKey: false,
  }
);

// ─── Indexes ──────────────────────────────────────────────────────────────────
projectSchema.index({ status: 1 });
projectSchema.index({ visibility: 1 });
projectSchema.index({ type: 1 });
projectSchema.index({ tags: 1 });                                   // Tag-based search & filtering
projectSchema.index({ 'requiredSkills.skillVectorId': 1 });        // AI matching joins
projectSchema.index({ 'requiredSkills.name': 1 });
projectSchema.index({ status: 1, visibility: 1 });                 // Feed queries (open + public)
projectSchema.index({ ownerId: 1, status: 1 });                    // Owner dashboard
projectSchema.index({ 'collaborators': 1 });
projectSchema.index({ 'proposalList.userId': 1 });
projectSchema.index(
  { title: 'text', description: 'text', tags: 'text', 'requiredSkills.name': 'text' },
  { name: 'project_text_search' }
);

// ─── Middleware: invalidate aggregateRequiredVector when requiredSkills changes ─
projectSchema.pre('save', function (next) {
  if (this.isModified('requiredSkills')) {
    this.aggregateRequiredVector = [];
    this.requiredVectorUpdatedAt = null;
  }
  next();
});

const Project = mongoose.model('Project', projectSchema);

module.exports = Project;
