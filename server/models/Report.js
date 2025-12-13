const mongoose = require('mongoose');

const reportSchema = new mongoose.Schema({
  caseId: {
    type: String,
    required: true,
    unique: true,
    uppercase: true
  },
  reporter: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: function() { return !this.isAnonymous; }
  },
  isAnonymous: {
    type: Boolean,
    default: false
  },
  incidentType: {
    type: [String],
    required: true,
    enum: [
      'cyberbullying',
      'harassment',
      'non-consensual-image-sharing',
      'online-threats',
      'child-exploitation',
      'stalking',
      'doxxing',
      'impersonation',
      'other'
    ]
  },
  severity: {
    type: String,
    enum: ['low', 'medium', 'high', 'critical'],
    default: 'medium'
  },
  status: {
    type: String,
    enum: ['pending', 'under-review', 'investigating', 'resolved', 'closed'],
    default: 'pending'
  },
  incident: {
    description: {
      type: String,
      required: [true, 'Incident description is required'],
      maxlength: [2000, 'Description cannot exceed 2000 characters']
    },
    dateOccurred: {
      type: Date,
      required: true
    },
    timeOccurred: String,
    platform: {
      type: [String],
      required: true,
      enum: [
        'facebook',
        'instagram',
        'twitter',
        'tiktok',
        'snapchat',
        'whatsapp',
        'telegram',
        'discord',
        'email',
        'sms',
        'dating-app',
        'gaming-platform',
        'other'
      ]
    },
    otherPlatform: String,
    location: {
      country: String,
      state: String,
      city: String
    }
  },
  suspect: {
    knownIdentity: {
      type: Boolean,
      default: false
    },
    name: String,
    username: String,
    profileUrl: String,
    relationship: {
      type: String,
      enum: ['stranger', 'acquaintance', 'friend', 'family', 'partner', 'ex-partner', 'colleague', 'other']
    },
    additionalInfo: String
  },
  evidence: [{
    type: {
      type: String,
      enum: ['screenshot', 'video', 'audio', 'document', 'url'],
      required: true
    },
    filename: String,
    originalName: String,
    path: String,
    url: String,
    description: String,
    uploadedAt: {
      type: Date,
      default: Date.now
    },
    size: Number,
    mimetype: String
  }],
  impact: {
    emotional: {
      type: [String],
      enum: ['anxiety', 'depression', 'fear', 'anger', 'shame', 'isolation', 'sleep-issues', 'other']
    },
    physical: {
      type: [String],
      enum: ['headaches', 'fatigue', 'appetite-changes', 'other']
    },
    social: {
      type: [String],
      enum: ['relationship-issues', 'work-problems', 'school-problems', 'social-withdrawal', 'other']
    },
    financial: {
      type: [String],
      enum: ['job-loss', 'medical-costs', 'therapy-costs', 'legal-costs', 'other']
    },
    description: String
  },
  actionsTaken: {
    reportedToPlatform: Boolean,
    blockedUser: Boolean,
    changedPrivacySettings: Boolean,
    contactedPolice: Boolean,
    soughtSupport: Boolean,
    other: String
  },
  supportNeeded: {
    type: [String],
    enum: [
      'legal-advice',
      'counseling',
      'safety-planning',
      'technical-support',
      'platform-reporting',
      'police-report',
      'emergency-help',
      'other'
    ]
  },
  adminNotes: [{
    note: String,
    addedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    addedAt: {
      type: Date,
      default: Date.now
    },
    isInternal: {
      type: Boolean,
      default: true
    }
  }],
  assignedTo: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  priority: {
    type: String,
    enum: ['low', 'normal', 'high', 'urgent'],
    default: 'normal'
  },
  tags: [String],
  followUpDate: Date,
  closedAt: Date,
  closedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  resolution: {
    outcome: String,
    actionTaken: String,
    referrals: [String],
    followUpRequired: Boolean
  },
  privacy: {
    shareWithPartners: {
      type: Boolean,
      default: false
    },
    allowResearch: {
      type: Boolean,
      default: false
    },
    retentionPeriod: {
      type: Number,
      default: 365 // days
    }
  },
  metadata: {
    ipAddress: String,
    userAgent: String,
    source: {
      type: String,
      enum: ['web', 'mobile', 'api'],
      default: 'web'
    },
    referrer: String
  }
}, {
  timestamps: true
});

// Indexes for performance
reportSchema.index({ caseId: 1 });
reportSchema.index({ reporter: 1 });
reportSchema.index({ status: 1 });
reportSchema.index({ severity: 1 });
reportSchema.index({ 'incident.dateOccurred': -1 });
reportSchema.index({ createdAt: -1 });
reportSchema.index({ assignedTo: 1 });

// Generate case ID before saving
reportSchema.pre('save', async function(next) {
  if (!this.caseId) {
    const year = new Date().getFullYear();
    const count = await this.constructor.countDocuments({
      createdAt: {
        $gte: new Date(year, 0, 1),
        $lt: new Date(year + 1, 0, 1)
      }
    });
    
    const typePrefix = this.incidentType[0] ? this.incidentType[0].substring(0, 3).toUpperCase() : 'GEN';
    this.caseId = `${typePrefix}-${year}-${String(count + 1).padStart(4, '0')}`;
  }
  next();
});

// Virtual for age of report
reportSchema.virtual('ageInDays').get(function() {
  return Math.floor((Date.now() - this.createdAt) / (1000 * 60 * 60 * 24));
});

// Method to add admin note
reportSchema.methods.addAdminNote = function(note, adminId, isInternal = true) {
  this.adminNotes.push({
    note,
    addedBy: adminId,
    isInternal
  });
  return this.save();
};

// Method to update status
reportSchema.methods.updateStatus = function(newStatus, adminId) {
  this.status = newStatus;
  
  if (newStatus === 'closed' || newStatus === 'resolved') {
    this.closedAt = new Date();
    this.closedBy = adminId;
  }
  
  return this.save();
};

// Static method to get statistics
reportSchema.statics.getStatistics = async function() {
  const stats = await this.aggregate([
    {
      $facet: {
        totalReports: [{ $count: 'count' }],
        byStatus: [
          { $group: { _id: '$status', count: { $sum: 1 } } }
        ],
        bySeverity: [
          { $group: { _id: '$severity', count: { $sum: 1 } } }
        ],
        byType: [
          { $unwind: '$incidentType' },
          { $group: { _id: '$incidentType', count: { $sum: 1 } } },
          { $sort: { count: -1 } }
        ],
        recentTrends: [
          {
            $match: {
              createdAt: { $gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) }
            }
          },
          {
            $group: {
              _id: {
                $dateToString: { format: '%Y-%m-%d', date: '$createdAt' }
              },
              count: { $sum: 1 }
            }
          },
          { $sort: { _id: 1 } }
        ]
      }
    }
  ]);
  
  return stats[0];
};

module.exports = mongoose.model('Report', reportSchema);