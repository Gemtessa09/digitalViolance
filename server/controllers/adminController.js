const Report = require('../models/Report');
const User = require('../models/User');

// @desc    Get dashboard statistics
// @route   GET /api/admin/dashboard
// @access  Private (Admin/Moderator)
exports.getDashboardStats = async (req, res, next) => {
  try {
    const totalReports = await Report.countDocuments();
    const pendingReports = await Report.countDocuments({ status: 'pending' });
    const underReviewReports = await Report.countDocuments({ status: 'under-review' });
    const resolvedReports = await Report.countDocuments({ status: 'resolved' });
    const activeUsers = await User.countDocuments({ isActive: true });

    // Get recent reports
    const recentReports = await Report.find()
      .sort('-createdAt')
      .limit(5)
      .select('caseId type status severity createdAt');

    // Get priority cases (high severity and pending/under-review)
    const priorityCases = await Report.find({
      severity: { $in: ['high', 'critical'] },
      status: { $in: ['pending', 'under-review'] }
    })
      .sort('-createdAt')
      .limit(5)
      .select('caseId type status severity createdAt');

    res.json({
      success: true,
      data: {
        stats: {
          totalReports,
          pendingReports,
          underReviewReports,
          resolvedReports,
          activeUsers
        },
        recentReports,
        priorityCases
      }
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get all reports with filters
// @route   GET /api/admin/reports
// @access  Private (Admin/Moderator)
exports.getAllReports = async (req, res, next) => {
  try {
    console.log('📊 getAllReports called by:', req.user?.email);
    
    const {
      status,
      severity,
      type,
      dateFrom,
      dateTo,
      page = 1,
      limit = 20,
      sort = '-createdAt'
    } = req.query;

    const query = {};

    if (status) query.status = status;
    if (severity) query.severity = severity;
    if (type) query.type = type;
    if (dateFrom || dateTo) {
      query.createdAt = {};
      if (dateFrom) query.createdAt.$gte = new Date(dateFrom);
      if (dateTo) query.createdAt.$lte = new Date(dateTo);
    }

    const skip = (page - 1) * limit;

    const reports = await Report.find(query)
      .sort(sort)
      .limit(parseInt(limit))
      .skip(skip)
      .populate('assignedTo', 'name email');

    const total = await Report.countDocuments(query);

    res.json({
      success: true,
      count: reports.length,
      total,
      page: parseInt(page),
      pages: Math.ceil(total / limit),
      data: reports
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get detailed report information
// @route   GET /api/admin/reports/:id
// @access  Private (Admin/Moderator)
exports.getReportDetails = async (req, res, next) => {
  try {
    const report = await Report.findById(req.params.id)
      .populate('assignedTo', 'name email role')
      .populate('submittedBy', 'name email');

    if (!report) {
      return res.status(404).json({
        success: false,
        message: 'Report not found'
      });
    }

    res.json({
      success: true,
      data: report
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Update report status
// @route   PUT /api/admin/reports/:id/status
// @access  Private (Admin/Moderator)
exports.updateReportStatus = async (req, res, next) => {
  try {
    const { status, resolution } = req.body;

    const report = await Report.findById(req.params.id);

    if (!report) {
      return res.status(404).json({
        success: false,
        message: 'Report not found'
      });
    }

    report.status = status;
    if (resolution) report.resolution = resolution;
    if (status === 'resolved' || status === 'closed') {
      report.resolvedAt = new Date();
      report.resolvedBy = req.user._id;
    }

    // Add status change to timeline
    report.timeline.push({
      action: `Status changed to ${status}`,
      performedBy: req.user._id,
      timestamp: new Date()
    });

    await report.save();

    res.json({
      success: true,
      message: 'Report status updated successfully',
      data: report
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Add admin note to report
// @route   POST /api/admin/reports/:id/notes
// @access  Private (Admin/Moderator)
exports.addAdminNote = async (req, res, next) => {
  try {
    const { note, isInternal } = req.body;

    const report = await Report.findById(req.params.id);

    if (!report) {
      return res.status(404).json({
        success: false,
        message: 'Report not found'
      });
    }

    if (!report.adminNotes) {
      report.adminNotes = [];
    }

    report.adminNotes.push({
      note,
      addedBy: req.user._id,
      isInternal: isInternal || false,
      timestamp: new Date()
    });

    // Add to timeline
    report.timeline.push({
      action: 'Admin note added',
      performedBy: req.user._id,
      timestamp: new Date()
    });

    await report.save();

    res.json({
      success: true,
      message: 'Note added successfully',
      data: report
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Assign report to admin/moderator
// @route   PUT /api/admin/reports/:id/assign
// @access  Private (Admin/Moderator)
exports.assignReport = async (req, res, next) => {
  try {
    const { assignedTo } = req.body;

    const report = await Report.findById(req.params.id);

    if (!report) {
      return res.status(404).json({
        success: false,
        message: 'Report not found'
      });
    }

    const assignee = await User.findById(assignedTo);

    if (!assignee || !['admin', 'moderator'].includes(assignee.role)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid assignee'
      });
    }

    report.assignedTo = assignedTo;
    report.timeline.push({
      action: `Assigned to ${assignee.name}`,
      performedBy: req.user._id,
      timestamp: new Date()
    });

    await report.save();

    res.json({
      success: true,
      message: 'Report assigned successfully',
      data: report
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Bulk update multiple reports
// @route   PUT /api/admin/reports/bulk-update
// @access  Private (Admin only)
exports.bulkUpdateReports = async (req, res, next) => {
  try {
    const { reportIds, updates } = req.body;

    if (!reportIds || !Array.isArray(reportIds) || reportIds.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Please provide report IDs'
      });
    }

    const result = await Report.updateMany(
      { _id: { $in: reportIds } },
      { $set: updates }
    );

    res.json({
      success: true,
      message: `${result.modifiedCount} reports updated successfully`,
      data: {
        matched: result.matchedCount,
        modified: result.modifiedCount
      }
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Export reports data
// @route   GET /api/admin/reports/export
// @access  Private (Admin only)
exports.exportReports = async (req, res, next) => {
  try {
    const { format = 'json', ...filters } = req.query;

    const query = {};
    if (filters.status) query.status = filters.status;
    if (filters.severity) query.severity = filters.severity;
    if (filters.type) query.type = filters.type;

    const reports = await Report.find(query)
      .select('-__v')
      .lean();

    if (format === 'csv') {
      // In a real application, you would convert to CSV format
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', 'attachment; filename=reports.csv');
      // CSV conversion logic would go here
      return res.send('CSV export not yet implemented');
    }

    res.json({
      success: true,
      count: reports.length,
      data: reports
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get all users
// @route   GET /api/admin/users
// @access  Private (Admin only)
exports.getUsers = async (req, res, next) => {
  try {
    const { role, isActive, page = 1, limit = 20 } = req.query;

    const query = {};
    if (role) query.role = role;
    if (isActive !== undefined) query.isActive = isActive === 'true';

    const skip = (page - 1) * limit;

    const users = await User.find(query)
      .select('-password')
      .sort('-createdAt')
      .limit(parseInt(limit))
      .skip(skip);

    const total = await User.countDocuments(query);

    res.json({
      success: true,
      count: users.length,
      total,
      page: parseInt(page),
      pages: Math.ceil(total / limit),
      data: users
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get user details
// @route   GET /api/admin/users/:id
// @access  Private (Admin only)
exports.getUserDetails = async (req, res, next) => {
  try {
    const user = await User.findById(req.params.id)
      .select('-password')
      .populate('completedModules', 'title slug');

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Get user's reports
    const reports = await Report.find({ submittedBy: req.params.id })
      .select('caseId type status createdAt');

    res.json({
      success: true,
      data: {
        user,
        reports
      }
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Update user role
// @route   PUT /api/admin/users/:id/role
// @access  Private (Admin only)
exports.updateUserRole = async (req, res, next) => {
  try {
    const { role } = req.body;

    if (!['user', 'moderator', 'admin'].includes(role)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid role'
      });
    }

    const user = await User.findByIdAndUpdate(
      req.params.id,
      { role },
      { new: true }
    ).select('-password');

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    res.json({
      success: true,
      message: 'User role updated successfully',
      data: user
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Deactivate user account
// @route   PUT /api/admin/users/:id/deactivate
// @access  Private (Admin only)
exports.deactivateUser = async (req, res, next) => {
  try {
    const user = await User.findByIdAndUpdate(
      req.params.id,
      { isActive: false },
      { new: true }
    ).select('-password');

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    res.json({
      success: true,
      message: 'User account deactivated successfully',
      data: user
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get system analytics
// @route   GET /api/admin/analytics
// @access  Private (Admin only)
exports.getAnalytics = async (req, res, next) => {
  try {
    const { period = '30' } = req.query;
    const days = parseInt(period);
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    // Reports by type
    const reportsByType = await Report.aggregate([
      { $match: { createdAt: { $gte: startDate } } },
      { $group: { _id: '$type', count: { $sum: 1 } } }
    ]);

    // Reports by status
    const reportsByStatus = await Report.aggregate([
      { $group: { _id: '$status', count: { $sum: 1 } } }
    ]);

    // Reports by severity
    const reportsBySeverity = await Report.aggregate([
      { $group: { _id: '$severity', count: { $sum: 1 } } }
    ]);

    // Monthly trends
    const monthlyTrends = await Report.aggregate([
      { $match: { createdAt: { $gte: startDate } } },
      {
        $group: {
          _id: {
            year: { $year: '$createdAt' },
            month: { $month: '$createdAt' }
          },
          count: { $sum: 1 }
        }
      },
      { $sort: { '_id.year': 1, '_id.month': 1 } }
    ]);

    // Average response time (in hours)
    const resolvedReports = await Report.find({
      status: { $in: ['resolved', 'closed'] },
      resolvedAt: { $exists: true }
    });

    let totalResponseTime = 0;
    resolvedReports.forEach(report => {
      const responseTime = (report.resolvedAt - report.createdAt) / (1000 * 60 * 60);
      totalResponseTime += responseTime;
    });

    const avgResponseTime = resolvedReports.length > 0
      ? (totalResponseTime / resolvedReports.length).toFixed(2)
      : 0;

    res.json({
      success: true,
      data: {
        reportsByType,
        reportsByStatus,
        reportsBySeverity,
        monthlyTrends,
        avgResponseTime: `${avgResponseTime}h`,
        period: `${days} days`
      }
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get system logs
// @route   GET /api/admin/logs
// @access  Private (Admin only)
exports.getSystemLogs = async (req, res, next) => {
  try {
    // In a real application, this would fetch from a logging system
    const logs = [
      {
        timestamp: new Date(),
        level: 'info',
        message: 'System logs endpoint accessed',
        user: req.user.email
      }
    ];

    res.json({
      success: true,
      message: 'System logs feature coming soon',
      data: logs
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get moderator-specific statistics
// @route   GET /api/admin/moderator-stats
// @access  Private (Moderator)
exports.getModeratorStats = async (req, res, next) => {
  try {
    const assignedReports = await Report.countDocuments({
      assignedTo: req.user._id
    });

    const resolvedByMe = await Report.countDocuments({
      resolvedBy: req.user._id
    });

    const pendingAssigned = await Report.countDocuments({
      assignedTo: req.user._id,
      status: { $in: ['pending', 'under-review'] }
    });

    res.json({
      success: true,
      data: {
        assignedReports,
        resolvedByMe,
        pendingAssigned
      }
    });
  } catch (error) {
    next(error);
  }
};
