// controllers/statusController.js

const { Report, Admin, Activity } = require('../config/db');

class StatusController {
    
    // ============ USER STATUS CHECK ============
    
    /**
     * Check report status for users
     */
    async checkStatus(req, res) {
        try {
            const { caseId, email } = req.query;
            
            if (!caseId && !email) {
                return res.render('user/status', {
                    caseId: '',
                    report: null,
                    error: null,
                    showForm: true
                });
            }
            
            let report = null;
            let error = null;
            
            if (caseId) {
                // Find by case ID
                report = await Report.findOne({ caseId });
                
                if (!report) {
                    error = 'Report not found. Please check your Case ID.';
                }
            } else if (email) {
                // Find by email (only non-anonymous reports)
                report = await Report.findOne({
                    'reporter.email': email,
                    isAnonymous: false
                }).sort({ submittedAt: -1 });
                
                if (!report) {
                    error = 'No reports found for this email address.';
                }
            }
            
            // If report found and not anonymous, verify email matches
            if (report && !report.isAnonymous && email && report.reporter.email !== email) {
                report = null;
                error = 'Email does not match the report.';
            }
            
            // Format dates for display
            if (report) {
                report = report.toObject();
                report.formattedDates = this.formatReportDates(report);
                report.statusInfo = this.getStatusInfo(report.status);
            }
            
            res.render('user/status', {
                caseId: caseId || (report ? report.caseId : ''),
                email: email || '',
                report,
                error,
                showForm: false
            });
            
        } catch (error) {
            console.error('Status check error:', error);
            res.render('user/status', {
                caseId: req.query.caseId || '',
                email: req.query.email || '',
                report: null,
                error: 'An error occurred while checking status. Please try again.',
                showForm: true
            });
        }
    }
    
    /**
     * API endpoint for status check (for AJAX)
     */
    async getStatusAPI(req, res) {
        try {
            const { caseId, email } = req.query;
            
            if (!caseId && !email) {
                return res.status(400).json({
                    error: 'Case ID or email is required'
                });
            }
            
            let report = null;
            
            if (caseId) {
                report = await Report.findOne({ caseId })
                    .select('caseId status submittedAt updatedAt adminNotes actionTaken reviewedAt resolvedAt severity')
                    .lean();
            } else if (email) {
                report = await Report.findOne({
                    'reporter.email': email,
                    isAnonymous: false
                })
                .select('caseId status submittedAt updatedAt adminNotes actionTaken reviewedAt resolvedAt severity')
                .sort({ submittedAt: -1 })
                .lean();
            }
            
            if (!report) {
                return res.status(404).json({
                    error: 'Report not found'
                });
            }
            
            // Add status information
            report.statusInfo = this.getStatusInfo(report.status);
            report.formattedDates = this.formatReportDates(report);
            
            res.json({
                success: true,
                report
            });
            
        } catch (error) {
            console.error('Status API error:', error);
            res.status(500).json({
                error: 'Failed to fetch report status'
            });
        }
    }
    
    // ============ ADMIN STATUS MANAGEMENT ============
    
    /**
     * Get all status options with statistics
     */
    async getAllStatuses(req, res) {
        try {
            const statuses = await this.getStatusStatistics();
            
            res.json({
                success: true,
                statuses
            });
            
        } catch (error) {
            console.error('Get statuses error:', error);
            res.status(500).json({
                error: 'Failed to fetch statuses'
            });
        }
    }
    
    /**
     * Update report status (admin)
     */
    async updateStatus(req, res) {
        try {
            const { caseId } = req.params;
            const { status, notes } = req.body;
            
            const validStatuses = ['pending', 'under_review', 'resolved', 'rejected', 'archived'];
            
            if (!validStatuses.includes(status)) {
                return res.status(400).json({
                    error: 'Invalid status'
                });
            }
            
            const updateData = {
                status,
                updatedAt: new Date()
            };
            
            if (notes) {
                updateData.adminNotes = notes;
            }
            
            // Set timestamp based on status
            if (status === 'resolved') {
                updateData.resolvedAt = new Date();
            }
            
            if (status === 'under_review') {
                updateData.reviewedAt = new Date();
                updateData.reviewedBy = req.session.adminId;
            }
            
            const report = await Report.findOneAndUpdate(
                { caseId },
                updateData,
                { new: true }
            );
            
            if (!report) {
                return res.status(404).json({
                    error: 'Report not found'
                });
            }
            
            // Log activity
            await Activity.create({
                adminId: req.session.adminId,
                action: 'update_status',
                targetId: report._id,
                targetType: 'Report',
                details: {
                    caseId,
                    oldStatus: report.status,
                    newStatus: status,
                    notes
                },
                ipAddress: req.ip
            });
            
            res.json({
                success: true,
                message: `Status updated to ${status}`,
                report: {
                    caseId: report.caseId,
                    status: report.status,
                    updatedAt: report.updatedAt
                }
            });
            
        } catch (error) {
            console.error('Update status error:', error);
            res.status(500).json({
                error: 'Failed to update status'
            });
        }
    }
    
    /**
     * Bulk update statuses
     */
    async bulkUpdateStatus(req, res) {
        try {
            const { status, reportIds, notes } = req.body;
            
            if (!reportIds || !Array.isArray(reportIds)) {
                return res.status(400).json({
                    error: 'No reports selected'
                });
            }
            
            const validStatuses = ['pending', 'under_review', 'resolved', 'rejected', 'archived'];
            
            if (!validStatuses.includes(status)) {
                return res.status(400).json({
                    error: 'Invalid status'
                });
            }
            
            const updateData = {
                status,
                updatedAt: new Date()
            };
            
            if (notes) {
                updateData.adminNotes = notes;
            }
            
            if (status === 'resolved') {
                updateData.resolvedAt = new Date();
            }
            
            const result = await Report.updateMany(
                { _id: { $in: reportIds } },
                updateData
            );
            
            // Log activity
            await Activity.create({
                adminId: req.session.adminId,
                action: 'bulk_update_status',
                details: {
                    status,
                    reportCount: reportIds.length,
                    modifiedCount: result.modifiedCount,
                    notes
                },
                ipAddress: req.ip
            });
            
            res.json({
                success: true,
                message: `Updated ${result.modifiedCount} reports to ${status}`,
                modifiedCount: result.modifiedCount
            });
            
        } catch (error) {
            console.error('Bulk update status error:', error);
            res.status(500).json({
                error: 'Failed to update statuses'
            });
        }
    }
    
    /**
     * Get status timeline for a report
     */
    async getStatusTimeline(req, res) {
        try {
            const { caseId } = req.params;
            
            const report = await Report.findOne({ caseId })
                .select('caseId status submittedAt reviewedAt resolvedAt updatedAt')
                .lean();
            
            if (!report) {
                return res.status(404).json({
                    error: 'Report not found'
                });
            }
            
            const timeline = [];
            
            // Submitted
            timeline.push({
                status: 'submitted',
                label: 'Report Submitted',
                timestamp: report.submittedAt,
                description: 'Report was submitted to the system'
            });
            
            // If reviewed
            if (report.reviewedAt) {
                timeline.push({
                    status: 'under_review',
                    label: 'Under Review',
                    timestamp: report.reviewedAt,
                    description: 'Report is being reviewed by an admin'
                });
            }
            
            // Current status
            timeline.push({
                status: report.status,
                label: this.getStatusLabel(report.status),
                timestamp: report.updatedAt,
                description: this.getStatusDescription(report.status),
                current: true
            });
            
            // If resolved
            if (report.resolvedAt) {
                timeline.push({
                    status: 'resolved',
                    label: 'Resolved',
                    timestamp: report.resolvedAt,
                    description: 'Report has been resolved'
                });
            }
            
            // Sort timeline by timestamp
            timeline.sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));
            
            res.json({
                success: true,
                caseId,
                timeline
            });
            
        } catch (error) {
            console.error('Status timeline error:', error);
            res.status(500).json({
                error: 'Failed to fetch status timeline'
            });
        }
    }
    
    /**
     * Get status statistics for dashboard
     */
    async getStatusStatistics() {
        try {
            const stats = await Report.aggregate([
                {
                    $group: {
                        _id: '$status',
                        count: { $sum: 1 },
                        avgProcessingTime: {
                            $avg: {
                                $cond: [
                                    { $eq: ['$status', 'resolved'] },
                                    { $subtract: ['$resolvedAt', '$submittedAt'] },
                                    { $subtract: [new Date(), '$submittedAt'] }
                                ]
                            }
                        },
                        highSeverityCount: {
                            $sum: {
                                $cond: [{ $eq: ['$severity', 'high'] }, 1, 0]
                            }
                        }
                    }
                }
            ]);
            
            const statusOptions = this.getAllStatusOptions();
            
            // Format statistics
            const formattedStats = statusOptions.map(option => {
                const stat = stats.find(s => s._id === option.value);
                const count = stat?.count || 0;
                const avgTime = stat?.avgProcessingTime || 0;
                
                return {
                    ...option,
                    count,
                    avgProcessingTime: this.formatTimeDuration(avgTime),
                    highSeverityPercentage: stat ? 
                        Math.round((stat.highSeverityCount / count) * 100) : 0,
                    color: this.getStatusColor(option.value)
                };
            });
            
            return formattedStats;
            
        } catch (error) {
            console.error('Status statistics error:', error);
            return [];
        }
    }
    
    /**
     * Get status distribution over time
     */
    async getStatusOverTime(req, res) {
        try {
            const { period = '30days' } = req.query;
            
            let dateFilter = {};
            const now = new Date();
            
            switch (period) {
                case '7days':
                    dateFilter = { $gte: new Date(now.setDate(now.getDate() - 7)) };
                    break;
                case '30days':
                    dateFilter = { $gte: new Date(now.setDate(now.getDate() - 30)) };
                    break;
                case '90days':
                    dateFilter = { $gte: new Date(now.setDate(now.getDate() - 90)) };
                    break;
                default:
                    dateFilter = { $gte: new Date(now.setDate(now.getDate() - 30)) };
            }
            
            const statusOverTime = await Report.aggregate([
                {
                    $match: {
                        submittedAt: dateFilter
                    }
                },
                {
                    $group: {
                        _id: {
                            date: { $dateToString: { format: '%Y-%m-%d', date: '$submittedAt' } },
                            status: '$status'
                        },
                        count: { $sum: 1 }
                    }
                },
                {
                    $sort: { '_id.date': 1 }
                }
            ]);
            
            // Format for chart
            const dates = [...new Set(statusOverTime.map(item => item._id.date))].sort();
            const statuses = [...new Set(statusOverTime.map(item => item._id.status))];
            
            const chartData = {
                labels: dates,
                datasets: statuses.map(status => {
                    const data = dates.map(date => {
                        const item = statusOverTime.find(
                            s => s._id.date === date && s._id.status === status
                        );
                        return item ? item.count : 0;
                    });
                    
                    return {
                        label: this.getStatusLabel(status),
                        data,
                        backgroundColor: this.getStatusColor(status),
                        borderColor: this.getStatusColor(status, 0.8),
                        borderWidth: 1
                    };
                })
            };
            
            res.json({
                success: true,
                period,
                chartData
            });
            
        } catch (error) {
            console.error('Status over time error:', error);
            res.status(500).json({
                error: 'Failed to fetch status over time data'
            });
        }
    }
    
    /**
     * Get pending reports that need attention
     */
    async getPendingReports(req, res) {
        try {
            const { limit = 20 } = req.query;
            
            const pendingReports = await Report.find({ 
                status: 'pending' 
            })
            .sort({ submittedAt: -1 })
            .limit(parseInt(limit))
            .select('caseId submittedAt severity incidentTypes description')
            .lean();
            
            // Add time elapsed
            const reportsWithTime = pendingReports.map(report => ({
                ...report,
                timeElapsed: this.formatTimeDuration(Date.now() - new Date(report.submittedAt)),
                isOverdue: this.isReportOverdue(report)
            }));
            
            res.json({
                success: true,
                count: pendingReports.length,
                reports: reportsWithTime
            });
            
        } catch (error) {
            console.error('Pending reports error:', error);
            res.status(500).json({
                error: 'Failed to fetch pending reports'
            });
        }
    }
    
    /**
     * Get status summary for dashboard
     */
    async getStatusSummary(req, res) {
        try {
            const [
                totalReports,
                pendingReports,
                resolvedToday,
                avgResolutionTime,
                statusDistribution
            ] = await Promise.all([
                Report.countDocuments(),
                Report.countDocuments({ status: 'pending' }),
                Report.countDocuments({ 
                    status: 'resolved',
                    resolvedAt: { 
                        $gte: new Date(new Date().setHours(0, 0, 0, 0))
                    }
                }),
                Report.aggregate([
                    { $match: { status: 'resolved' } },
                    {
                        $group: {
                            _id: null,
                            avgTime: { 
                                $avg: { $subtract: ['$resolvedAt', '$submittedAt'] }
                            }
                        }
                    }
                ]),
                Report.aggregate([
                    {
                        $group: {
                            _id: '$status',
                            count: { $sum: 1 }
                        }
                    }
                ])
            ]);
            
            const summary = {
                totalReports,
                pendingReports,
                resolvedToday,
                avgResolutionTime: this.formatTimeDuration(
                    avgResolutionTime[0]?.avgTime || 0
                ),
                statusDistribution: statusDistribution.reduce((acc, curr) => {
                    acc[curr._id] = curr.count;
                    return acc;
                }, {})
            };
            
            res.json({
                success: true,
                summary
            });
            
        } catch (error) {
            console.error('Status summary error:', error);
            res.status(500).json({
                error: 'Failed to fetch status summary'
            });
        }
    }
    
    // ============ HELPER METHODS ============
    
    /**
     * Get all status options
     */
    getAllStatusOptions() {
        return [
            { 
                value: 'pending', 
                label: 'Pending', 
                description: 'Report submitted, awaiting review',
                icon: '⏳',
                order: 1
            },
            { 
                value: 'under_review', 
                label: 'Under Review', 
                description: 'Report is being investigated',
                icon: '🔍',
                order: 2
            },
            { 
                value: 'resolved', 
                label: 'Resolved', 
                description: 'Report has been addressed',
                icon: '✅',
                order: 3
            },
            { 
                value: 'rejected', 
                label: 'Rejected', 
                description: 'Report was not accepted',
                icon: '❌',
                order: 4
            },
            { 
                value: 'archived', 
                label: 'Archived', 
                description: 'Report has been archived',
                icon: '📁',
                order: 5
            }
        ];
    }
    
    /**
     * Get status information
     */
    getStatusInfo(status) {
        const statuses = this.getAllStatusOptions();
        const statusInfo = statuses.find(s => s.value === status);
        
        return statusInfo || {
            value: status,
            label: 'Unknown',
            description: 'Status unknown',
            icon: '❓'
        };
    }
    
    /**
     * Get status label
     */
    getStatusLabel(status) {
        const info = this.getStatusInfo(status);
        return info.label;
    }
    
    /**
     * Get status description
     */
    getStatusDescription(status) {
        const info = this.getStatusInfo(status);
        return info.description;
    }
    
    /**
     * Get status color
     */
    getStatusColor(status, opacity = 0.2) {
        const colors = {
            'pending': `rgba(255, 193, 7, ${opacity})`,      // Amber
            'under_review': `rgba(0, 123, 255, ${opacity})`, // Blue
            'resolved': `rgba(40, 167, 69, ${opacity})`,     // Green
            'rejected': `rgba(220, 53, 69, ${opacity})`,     // Red
            'archived': `rgba(108, 117, 125, ${opacity})`    // Gray
        };
        
        return colors[status] || `rgba(108, 117, 125, ${opacity})`;
    }
    
    /**
     * Format report dates for display
     */
    formatReportDates(report) {
        const formatDate = (date) => {
            if (!date) return 'N/A';
            return new Date(date).toLocaleDateString('en-US', {
                year: 'numeric',
                month: 'short',
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
            });
        };
        
        return {
            submitted: formatDate(report.submittedAt),
            updated: formatDate(report.updatedAt),
            reviewed: formatDate(report.reviewedAt),
            resolved: formatDate(report.resolvedAt)
        };
    }
    
    /**
     * Format time duration
     */
    formatTimeDuration(milliseconds) {
        if (!milliseconds || milliseconds < 0) return 'N/A';
        
        const seconds = Math.floor(milliseconds / 1000);
        const minutes = Math.floor(seconds / 60);
        const hours = Math.floor(minutes / 60);
        const days = Math.floor(hours / 24);
        
        if (days > 0) {
            return `${days} day${days !== 1 ? 's' : ''}`;
        } else if (hours > 0) {
            return `${hours} hour${hours !== 1 ? 's' : ''}`;
        } else if (minutes > 0) {
            return `${minutes} minute${minutes !== 1 ? 's' : ''}`;
        } else {
            return `${seconds} second${seconds !== 1 ? 's' : ''}`;
        }
    }
    
    /**
     * Check if report is overdue
     */
    isReportOverdue(report) {
        const submittedDate = new Date(report.submittedAt);
        const now = new Date();
        const daysSinceSubmission = (now - submittedDate) / (1000 * 60 * 60 * 24);
        
        // Consider overdue if pending for more than 7 days
        return daysSinceSubmission > 7;
    }
    
    /**
     * Get next action for a status
     */
    getNextActions(status) {
        const actions = {
            'pending': [
                { action: 'under_review', label: 'Start Review', icon: '🔍' },
                { action: 'resolved', label: 'Mark Resolved', icon: '✅' },
                { action: 'rejected', label: 'Reject', icon: '❌' }
            ],
            'under_review': [
                { action: 'resolved', label: 'Mark Resolved', icon: '✅' },
                { action: 'pending', label: 'Return to Pending', icon: '⏳' },
                { action: 'rejected', label: 'Reject', icon: '❌' }
            ],
            'resolved': [
                { action: 'under_review', label: 'Re-open', icon: '🔍' },
                { action: 'archived', label: 'Archive', icon: '📁' }
            ],
            'rejected': [
                { action: 'pending', label: 'Re-open', icon: '⏳' },
                { action: 'archived', label: 'Archive', icon: '📁' }
            ],
            'archived': [
                { action: 'pending', label: 'Restore', icon: '⏳' }
            ]
        };
        
        return actions[status] || [];
    }
    
    /**
     * Get status transition history
     */
    async getStatusHistory(req, res) {
        try {
            const { caseId } = req.params;
            
            // Get activity logs for status changes
            const statusChanges = await Activity.find({
                targetId: caseId,
                action: { $in: ['update_status', 'bulk_update_status'] }
            })
            .sort({ timestamp: -1 })
            .populate('adminId', 'username fullName')
            .lean();
            
            res.json({
                success: true,
                history: statusChanges
            });
            
        } catch (error) {
            console.error('Status history error:', error);
            res.status(500).json({
                error: 'Failed to fetch status history'
            });
        }
    }
}

module.exports = new StatusController();