const mongoose = require('mongoose');

const { Schema } = mongoose;

const reportSchema = new Schema(
  {
    reporter: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    reportedUser: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      // Either reportedUser or reportedProject is required
    },
    reportedProject: {
      type: Schema.Types.ObjectId,
      ref: 'Project',
    },
    reason: {
      type: String,
      required: [true, 'Reason is required'],
      enum: [
        'Spam',
        'Harassment',
        'Inappropriate Content',
        'Scam/Fraud',
        'Other',
      ],
    },
    description: {
      type: String,
      maxlength: [1000, 'Description cannot exceed 1000 characters'],
    },
    status: {
      type: String,
      enum: ['pending', 'reviewed', 'resolved'],
      default: 'pending',
    },
  },
  {
    timestamps: true,
    versionKey: false,
  }
);

// Optional: Virtual to check what kind of report it is
reportSchema.virtual('reportType').get(function () {
  if (this.reportedUser) return 'User';
  if (this.reportedProject) return 'Project';
  return 'Unknown';
});

// Ensure at least one target is provided
reportSchema.pre('validate', function (next) {
  if (!this.reportedUser && !this.reportedProject) {
    this.invalidate('reportedUser', 'A report must target a user or a project.');
  }
  next();
});

const Report = mongoose.model('Report', reportSchema);

module.exports = Report;
