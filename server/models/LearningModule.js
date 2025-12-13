const mongoose = require('mongoose');

const learningModuleSchema = new mongoose.Schema({
  title: {
    type: String,
    required: [true, 'Module title is required'],
    trim: true,
    maxlength: [200, 'Title cannot exceed 200 characters']
  },
  slug: {
    type: String,
    required: true,
    unique: true,
    lowercase: true
  },
  description: {
    type: String,
    required: [true, 'Module description is required'],
    maxlength: [500, 'Description cannot exceed 500 characters']
  },
  category: {
    type: String,
    required: true,
    enum: [
      'digital-safety-basics',
      'social-media-privacy',
      'online-harassment',
      'child-protection',
      'password-security',
      'safe-communication',
      'reporting-abuse',
      'legal-rights',
      'emotional-support',
      'prevention-strategies'
    ]
  },
  targetAudience: {
    type: [String],
    enum: ['children', 'teenagers', 'adults', 'parents', 'educators', 'all'],
    default: ['all']
  },
  difficulty: {
    type: String,
    enum: ['beginner', 'intermediate', 'advanced'],
    default: 'beginner'
  },
  estimatedTime: {
    type: Number, // in minutes
    required: true,
    min: [1, 'Estimated time must be at least 1 minute']
  },
  content: {
    introduction: {
      type: String,
      required: true
    },
    sections: [{
      title: {
        type: String,
        required: true
      },
      content: {
        type: String,
        required: true
      },
      type: {
        type: String,
        enum: ['text', 'video', 'interactive', 'quiz'],
        default: 'text'
      },
      mediaUrl: String,
      order: {
        type: Number,
        required: true
      }
    }],
    keyTakeaways: [String],
    resources: [{
      title: String,
      url: String,
      type: {
        type: String,
        enum: ['article', 'video', 'tool', 'hotline', 'organization']
      }
    }]
  },
  quiz: [{
    question: {
      type: String,
      required: true
    },
    options: [{
      text: String,
      isCorrect: Boolean
    }],
    explanation: String,
    order: Number
  }],
  tags: [String],
  isPublished: {
    type: Boolean,
    default: false
  },
  publishedAt: Date,
  author: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  lastUpdatedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  version: {
    type: Number,
    default: 1
  },
  statistics: {
    views: {
      type: Number,
      default: 0
    },
    completions: {
      type: Number,
      default: 0
    },
    averageRating: {
      type: Number,
      default: 0,
      min: 0,
      max: 5
    },
    totalRatings: {
      type: Number,
      default: 0
    }
  },
  feedback: [{
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    rating: {
      type: Number,
      min: 1,
      max: 5
    },
    comment: String,
    isAnonymous: {
      type: Boolean,
      default: false
    },
    createdAt: {
      type: Date,
      default: Date.now
    }
  }],
  prerequisites: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'LearningModule'
  }],
  relatedModules: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'LearningModule'
  }],
  languages: {
    type: [String],
    default: ['en']
  },
  accessibility: {
    hasAudioDescription: {
      type: Boolean,
      default: false
    },
    hasSubtitles: {
      type: Boolean,
      default: false
    },
    isScreenReaderFriendly: {
      type: Boolean,
      default: true
    }
  }
}, {
  timestamps: true
});

// Indexes
learningModuleSchema.index({ slug: 1 });
learningModuleSchema.index({ category: 1 });
learningModuleSchema.index({ isPublished: 1 });
learningModuleSchema.index({ targetAudience: 1 });
learningModuleSchema.index({ 'statistics.views': -1 });
learningModuleSchema.index({ 'statistics.averageRating': -1 });

// Generate slug before saving
learningModuleSchema.pre('save', function(next) {
  if (this.isModified('title') && !this.slug) {
    this.slug = this.title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '');
  }
  
  if (this.isModified('isPublished') && this.isPublished && !this.publishedAt) {
    this.publishedAt = new Date();
  }
  
  next();
});

// Method to increment view count
learningModuleSchema.methods.incrementViews = function() {
  this.statistics.views += 1;
  return this.save();
};

// Method to add completion
learningModuleSchema.methods.addCompletion = function() {
  this.statistics.completions += 1;
  return this.save();
};

// Method to add rating
learningModuleSchema.methods.addRating = function(rating, comment, userId, isAnonymous = false) {
  // Check if user already rated
  const existingFeedback = this.feedback.find(f => 
    f.user && f.user.toString() === userId.toString()
  );
  
  if (existingFeedback) {
    // Update existing rating
    const oldRating = existingFeedback.rating;
    existingFeedback.rating = rating;
    existingFeedback.comment = comment;
    
    // Recalculate average
    const totalScore = (this.statistics.averageRating * this.statistics.totalRatings) - oldRating + rating;
    this.statistics.averageRating = totalScore / this.statistics.totalRatings;
  } else {
    // Add new rating
    this.feedback.push({
      user: isAnonymous ? null : userId,
      rating,
      comment,
      isAnonymous
    });
    
    // Recalculate average
    const totalScore = (this.statistics.averageRating * this.statistics.totalRatings) + rating;
    this.statistics.totalRatings += 1;
    this.statistics.averageRating = totalScore / this.statistics.totalRatings;
  }
  
  return this.save();
};

// Static method to get popular modules
learningModuleSchema.statics.getPopular = function(limit = 10) {
  return this.find({ isPublished: true })
    .sort({ 'statistics.views': -1, 'statistics.averageRating': -1 })
    .limit(limit)
    .populate('author', 'name')
    .select('-content.sections.content -quiz');
};

// Static method to get recommended modules
learningModuleSchema.statics.getRecommended = function(category, excludeId, limit = 5) {
  const query = { 
    isPublished: true,
    category
  };
  
  if (excludeId) {
    query._id = { $ne: excludeId };
  }
  
  return this.find(query)
    .sort({ 'statistics.averageRating': -1, 'statistics.views': -1 })
    .limit(limit)
    .select('title slug description estimatedTime difficulty statistics');
};

// Virtual for completion rate
learningModuleSchema.virtual('completionRate').get(function() {
  if (this.statistics.views === 0) return 0;
  return Math.round((this.statistics.completions / this.statistics.views) * 100);
});

module.exports = mongoose.model('LearningModule', learningModuleSchema);