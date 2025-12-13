const Report = require('../models/Report');
const { sanitizeInput } = require('../utils/validators');
const path = require('path');
const fs = require('fs').promises;

// @desc    Submit new report
// @route   POST /api/reports
// @access  Public
const submitReport = async (req, res) => {
  try {
    const {
      incidentType,
      severity = 'medium',
      incident,
      suspect,
      impact,
      actionsTaken,
      supportNeeded,
      privacy,
      isAnonymous = false
    } = req.body;

    // Process uploaded evidence files
    const evidence = [];
    if (req.files && req.files.length > 0) {
      req.files.forEach(file => {
        evidence.push({
          type: file.mimetype.startsWith('image/') ? 'screenshot' : 
                file.mimetype.startsWith('video/') ? 'video' : 'document',
          filename: file.filename,
          originalName: file.originalname,
          path: `/uploads/evidence/${file.filename}`,
          size: file.size,
          mimetype: file.mimetype,
          uploadedAt: new Date()
        });
      });
    }

    // Create report data
    const reportData = {
      reporter: isAnonymous ? null : req.user?.id,
      isAnonymous,
      incidentType: Array.isArray(incidentType) ? incidentType : [incidentType],
      severity,
      incident: {
        description: sanitizeInput(incident.description),
        dateOccurred: new Date(incident.dateOccurred),
        timeOccurred: incident.timeOccurred,
        platform: Array.isArray(incident.platform) ? incident.platform : [incident.platform],
        otherPlatform: incident.otherPlatform ? sanitizeInput(incident.otherPlatform) : undefined,
        location: incident.location
      },
      evidence,
      metadata: {
        ipAddress: req.ip,
        userAgent: req.get('User-Agent'),
        source: 'web'
      }
    };

    // Add optional fields if provided
    if (suspect) {
      reportData.suspect = {
        knownIdentity: suspect.knownIdentity || false,
        name: suspect.name ? sanitizeInput(suspect.name) : undefined,
        username: suspect.username ? sanitizeInput(suspect.username) : undefined,
        profileUrl: suspect.profileUrl,
        relationship: suspect.relationship,
        additionalInfo: suspect.additionalInfo ? sanitizeInput(suspect.additionalInfo) : undefined
      };
    }

    if (impact) reportData.impact = impact;
    if (actionsTaken) reportData.actionsTaken = actionsTaken;
    if (supportNeeded) reportData.supportNeeded = supportNeeded;
    if (privacy) reportData.privacy = privacy;

    // Determine priority based on severity and incident type
    if (incidentType.includes('child-exploitation') || severity === 'critical') {
      reportData.priority = 'urgent';
    } else if (severity === 'high') {
      reportData.priority = 'high';
    }

    const report = await Report.create(reportData);

    res.status(201).json({
      success: true,
      message: 'Report submitted successfully',
      caseId: report.caseId,
      report: {
        caseId: report.caseId,
        status: report.status,
        severity: report.severity,
        submittedAt: report.createdAt
      }
    });

  } catch (error) {
    console.error('Submit report error:', error);
    
    // Clean up uploaded files if report creation failed
    if (req.files && req.files.length > 0) {
      req.files.forEach(async (file) => {
        try {
          await fs.unlink(file.path);
        } catch (unlinkError) {
          console.error('Error deleting file:', unlinkError);
        }
      });
    }

    res.status(500).json({
      success: false,
      message: 'Server error submitting report'
    });
  }
};

// @desc    Get all reports (admin/moderator)
// @route   GET /api/reports
// @access  Private
const getReports = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 20,
      status,
      severity,
      priority,
      incidentType,
      assignedTo,
      dateFrom,
      dateTo,
      sortBy = 'createdAt',
      sortOrder = 'desc'
    } = req.query;

    // Build filter object
    const filter = {};
    if (status) filter.status = status;
    if (severity) filter.severity = severity;
    if (priority) filter.priority = priority;
    if (incidentType) filter.incidentType = { $in: [incidentType] };
    if (assignedTo) filter.assignedTo = assignedTo;
    
    if (dateFrom || dateTo) {
      filter.createdAt = {};
      if (dateFrom) filter.createdAt.$gte = new Date(dateFrom);
      if (dateTo) filter.createdAt.$lte = new Date(dateTo);
    }

    // If user is moderator, only show reports assigned to them or unassigned
    if (req.user.role === 'moderator') {
      filter.$or = [
        { assignedTo: req.user.id },
        { assignedTo: null }
      ];
    }

    const skip = (page - 1) * limit;
    const sortOptions = {};
    sortOptions[sortBy] = sortOrder === 'desc' ? -1 : 1;

    const reports = await Report.find(filter)
      .populate('reporter', 'name email')
      .populate('assignedTo', 'name email')
      .sort(sortOptions)
      .skip(skip)
      .limit(parseInt(limit))
      .select('-evidence -adminNotes -metadata');

    const total = await Report.countDocuments(filter);

    res.json({
      success: true,
      reports,
      pagination: {
        current: parseInt(page),
        pages: Math.ceil(total / limit),
        total,
        limit: parseInt(limit)
      }
    });

  } catch (error) {
    console.error('Get reports error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error fetching reports'
    });
  }
};

// @desc    Get report by ID
// @route   GET /api/reports/:id
// @access  Private
const getReportById = async (req, res) => {
  try {
    const report = await Report.findById(req.params.id)
      .populate('reporter', 'name email profile')
      .populate('assignedTo', 'name email')
      .populate('adminNotes.addedBy', 'name email');

    if (!report) {
      return res.status(404).json({
        success: false,
        message: 'Report not found'
      });
    }

    // Check permissions
    if (req.user.role === 'moderator' && 
        report.assignedTo && 
        report.assignedTo._id.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'Access denied'
      });
    }

    res.json({
      success: true,
      report
    });

  } catch (error) {
    console.error('Get report error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error fetching report'
    });
  }
};

// @desc    Update report
// @route   PUT /api/reports/:id
// @access  Private
const updateReport = async (req, res) => {
  try {
    const { status, priority, assignedTo, resolution, tags } = req.body;

    const report = await Report.findById(req.params.id);

    if (!report) {
      return res.status(404).json({
        success: false,
        message: 'Report not found'
      });
    }

    // Check permissions
    if (req.user.role === 'moderator' && 
        report.assignedTo && 
        report.assignedTo.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'Access denied'
      });
    }

    // Update fields
    if (status) {
      await report.updateStatus(status, req.user.id);
    }
    if (priority) report.priority = priority;
    if (assignedTo) report.assignedTo = assignedTo;
    if (resolution) report.resolution = resolution;
    if (tags) report.tags = tags;

    await report.save();

    res.json({
      success: true,
      message: 'Report updated successfully',
      report
    });

  } catch (error) {
    console.error('Update report error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error updating report'
    });
  }
};

// @desc    Delete report
// @route   DELETE /api/reports/:id
// @access  Private
const deleteReport = async (req, res) => {
  try {
    const report = await Report.findById(req.params.id);

    if (!report) {
      return res.status(404).json({
        success: false,
        message: 'Report not found'
      });
    }

    // Only admin can delete reports
    if (req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Access denied. Admin privileges required.'
      });
    }

    // Delete associated evidence files
    if (report.evidence && report.evidence.length > 0) {
      for (const evidence of report.evidence) {
        if (evidence.filename) {
          try {
            await fs.unlink(path.join(__dirname, '../uploads/evidence/', evidence.filename));
          } catch (fileError) {
            console.error('Error deleting evidence file:', fileError);
          }
        }
      }
    }

    await Report.findByIdAndDelete(req.params.id);

    res.json({
      success: true,
      message: 'Report deleted successfully'
    });

  } catch (error) {
    console.error('Delete report error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error deleting report'
    });
  }
};

// @desc    Add evidence to existing report
// @route   POST /api/reports/:id/evidence
// @access  Public
const addEvidence = async (req, res) => {
  try {
    const { caseId } = req.body;

    // Find report by case ID for public access
    const report = await Report.findOne({ caseId });

    if (!report) {
      return res.status(404).json({
        success: false,
        message: 'Report not found'
      });
    }

    // Process uploaded files
    const newEvidence = [];
    if (req.files && req.files.length > 0) {
      req.files.forEach(file => {
        newEvidence.push({
          type: file.mimetype.startsWith('image/') ? 'screenshot' : 
                file.mimetype.startsWith('video/') ? 'video' : 'document',
          filename: file.filename,
          originalName: file.originalname,
          path: `/uploads/evidence/${file.filename}`,
          size: file.size,
          mimetype: file.mimetype,
          uploadedAt: new Date()
        });
      });
    }

    // Add new evidence to report
    report.evidence.push(...newEvidence);
    await report.save();

    res.json({
      success: true,
      message: `Added ${newEvidence.length} evidence file(s) to report`,
      caseId: report.caseId
    });

  } catch (error) {
    console.error('Add evidence error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error adding evidence'
    });
  }
};

// @desc    Get report status by case ID
// @route   GET /api/reports/status/:caseId
// @access  Public
const getReportStatus = async (req, res) => {
  try {
    const report = await Report.findOne({ caseId: req.params.caseId })
      .select('caseId status severity priority createdAt updatedAt adminNotes')
      .populate('adminNotes.addedBy', 'name');

    if (!report) {
      return res.status(404).json({
        success: false,
        message: 'Report not found'
      });
    }

    // Filter admin notes to only show public ones
    const publicNotes = report.adminNotes.filter(note => !note.isInternal);

    res.json({
      success: true,
      report: {
        caseId: report.caseId,
        status: report.status,
        severity: report.severity,
        priority: report.priority,
        submittedAt: report.createdAt,
        lastUpdated: report.updatedAt,
        publicNotes
      }
    });

  } catch (error) {
    console.error('Get report status error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error fetching report status'
    });
  }
};

// @desc    Get public statistics
// @route   GET /api/reports/statistics
// @access  Public
const getPublicStatistics = async (req, res) => {
  try {
    const stats = await Report.getStatistics();

    // Only return non-sensitive statistics
    const publicStats = {
      totalReports: stats.totalReports[0]?.count || 0,
      resolvedReports: stats.byStatus.find(s => s._id === 'resolved')?.count || 0,
      reportsByType: stats.byType.slice(0, 5), // Top 5 types only
      recentTrends: stats.recentTrends
    };

    res.json({
      success: true,
      statistics: publicStats
    });

  } catch (error) {
    console.error('Get statistics error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error fetching statistics'
    });
  }
};

// @desc    Search reports
// @route   GET /api/reports/search
// @access  Private
const searchReports = async (req, res) => {
  try {
    const { q, page = 1, limit = 20 } = req.query;

    if (!q) {
      return res.status(400).json({
        success: false,
        message: 'Search query is required'
      });
    }

    const searchRegex = new RegExp(q, 'i');
    const filter = {
      $or: [
        { caseId: searchRegex },
        { 'incident.description': searchRegex },
        { 'suspect.name': searchRegex },
        { 'suspect.username': searchRegex }
      ]
    };

    // Apply role-based filtering
    if (req.user.role === 'moderator') {
      filter.$and = [
        filter.$or ? { $or: filter.$or } : {},
        {
          $or: [
            { assignedTo: req.user.id },
            { assignedTo: null }
          ]
        }
      ];
      delete filter.$or;
    }

    const skip = (page - 1) * limit;

    const reports = await Report.find(filter)
      .populate('reporter', 'name email')
      .populate('assignedTo', 'name email')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit))
      .select('-evidence -adminNotes -metadata');

    const total = await Report.countDocuments(filter);

    res.json({
      success: true,
      reports,
      pagination: {
        current: parseInt(page),
        pages: Math.ceil(total / limit),
        total,
        limit: parseInt(limit)
      }
    });

  } catch (error) {
    console.error('Search reports error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error searching reports'
    });
  }
};

module.exports = {
  submitReport,
  getReports,
  getReportById,
  updateReport,
  deleteReport,
  addEvidence,
  getReportStatus,
  getPublicStatistics,
  searchReports
};