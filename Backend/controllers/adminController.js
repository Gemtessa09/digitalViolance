// controllers/adminController.js

const { Report, Admin, Activity } = require('../config/db');
const path = require('path');
const fs = require('fs').promises;

class AdminController {
    
    // ============ ADMIN AUTHENTICATION ============
    
    /**
     * Admin login
     */
    async login(req, res) {
        try {
            const { username, password } = req.body;
            
            // Find admin by username
            const admin = await Admin.findOne({ username });
            
            if (!admin) {
                return res.render('admin/login', {
                    error: 'Invalid credentials',
                    username
                });
            }
            
            // Check if account is locked
            if (admin.isLocked) {
                return res.render('admin/login', {
                    error: 'Account is temporarily locked. Try again later.',
                    username
                });
            }
            
            // Verify password
            const isValid = await admin.comparePassword(password);
            
            if (!isValid) {
                // Increment failed attempts
                await admin.incrementLoginAttempts();
                
                return res.render('admin/login', {
                    error: 'Invalid credentials',
                    username
                });
            }
            
            // Reset login attempts on successful login
            await Admin.findByIdAndUpdate(admin._id, {
                $set: { lastLogin: new Date(), loginAttempts: 0 },
                $unset: { lockUntil: 1 }
            });
            
            // Set session
            req.session.adminId = admin._id;
            req.session.adminUsername = admin.username;
            req.session.adminRole = admin.role;
            req.session.adminPermissions = admin.permissions;
            req.session.isAdmin = true;
            
            // Log activity
            await Activity.create({
                adminId: admin._id,
                action: 'login',
                ipAddress: req.ip,
                userAgent: req.get('User-Agent')
            });
            
            res.redirect('/admin/dashboard');
            
        } catch (error) {
            console.error('Login error:', error);
            res.render('admin/login', {
                error: 'An error occurred during login',
                username: req.body.username
            });
        }
    }
    
    /**
     * Admin logout
     */
    async logout(req, res) {
        try {
            // Log activity before destroying session
            if (req.session.adminId) {
                await Activity.create({
                    adminId: req.session.adminId,
                    action: 'logout',
                    ipAddress: req.ip
                });
            }
            
            req.session.destroy();
            res.redirect('/admin/login');
        } catch (error) {
            console.error('Logout error:', error);
            res.redirect('/admin/login');
        }
    }
    
    // ============ DASHBOARD ============
    
    /**
     * Dashboard overview
     */
    async dashboard(req, res) {
        try {
            const { filter = 'all', status, severity, dateFrom, dateTo, search } = req.query;
            
            // Build filter query
            const filterQuery = {};
            
            if (status && status !== 'all') {
                filterQuery.status = status;
            }
            
            if (severity && severity !== 'all') {
                filterQuery.severity = severity;
            }
            
            if (dateFrom || dateTo) {
                filterQuery.submittedAt = {};
                if (dateFrom) filterQuery.submittedAt.$gte = new Date(dateFrom);
                if (dateTo) filterQuery.submittedAt.$lte = new Date(dateTo + 'T23:59:59');
            }
            
            if (search) {
                filterQuery.$or = [
                    { caseId: { $regex: search, $options: 'i' } },
                    { description: { $regex: search, $options: 'i' } },
                    { 'reporter.name': { $regex: search, $options: 'i' } },
                    { 'reporter.email': { $regex: search, $options: 'i' } }
                ];
            }
            
            // Get reports with pagination
            const page = parseInt(req.query.page) || 1;
            const limit = 20;
            const skip = (page - 1) * limit;
            
            const [reports, totalReports] = await Promise.all([
                Report.find(filterQuery)
                    .sort({ submittedAt: -1 })
                    .skip(skip)
                    .limit(limit)
                    .populate('assignedTo', 'username fullName')
                    .populate('reviewedBy', 'username fullName'),
                Report.countDocuments(filterQuery)
            ]);
            
            // Get statistics
            const stats = await this.getDashboardStats();
            
            // Get recent activities
            const recentActivities = await Activity.find()
                .sort({ timestamp: -1 })
                .limit(10)
                .populate('adminId', 'username fullName');
            
            res.render('admin/dashboard', {
                admin: req.session.adminUsername,
                reports,
                stats,
                recentActivities,
                filter: req.query,
                pagination: {
                    page,
                    totalPages: Math.ceil(totalReports / limit),
                    hasNext: page < Math.ceil(totalReports / limit),
                    hasPrev: page > 1
                }
            });
            
        } catch (error) {
            console.error('Dashboard error:', error);
            res.render('admin/error', {
                message: 'Failed to load dashboard',
                error: process.env.NODE_ENV === 'development' ? error.message : null
            });
        }
    }
    
    /**
     * Get dashboard statistics
     */
    async getDashboardStats() {
        try {
            const [
                totalReports,
                pendingReports,
                resolvedReports,
                highSeverityReports,
                todayReports,
                anonymousReports
            ] = await Promise.all([
                Report.countDocuments(),
                Report.countDocuments({ status: 'pending' }),
                Report.countDocuments({ status: 'resolved' }),
                Report.countDocuments({ severity: 'high' }),
                Report.countDocuments({
                    submittedAt: {
                        $gte: new Date(new Date().setHours(0, 0, 0, 0))
                    }
                }),
                Report.countDocuments({ isAnonymous: true })
            ]);
            
            // Get reports by type
            const reportsByType = await Report.aggregate([
                { $unwind: '$incidentTypes' },
                { $group: { _id: '$incidentTypes', count: { $sum: 1 } } },
                { $sort: { count: -1 } }
            ]);
            
            // Get reports by status for chart
            const reportsByStatus = await Report.aggregate([
                { $group: { _id: '$status', count: { $sum: 1 } } }
            ]);
            
            // Get weekly report trend
            const weeklyTrend = await Report.aggregate([
                {
                    $match: {
                        submittedAt: {
                            $gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
                        }
                    }
                },
                {
                    $group: {
                        _id: {
                            $dateToString: { format: '%Y-%m-%d', date: '$submittedAt' }
                        },
                        count: { $sum: 1 }
                    }
                },
                { $sort: { _id: 1 } }
            ]);
            
            return {
                totalReports,
                pendingReports,
                resolvedReports,
                highSeverityReports,
                todayReports,
                anonymousReports,
                reportsByType: reportsByType.reduce((acc, curr) => {
                    acc[curr._id] = curr.count;
                    return acc;
                }, {}),
                reportsByStatus: reportsByStatus.reduce((acc, curr) => {
                    acc[curr._id] = curr.count;
                    return acc;
                }, {}),
                weeklyTrend
            };
            
        } catch (error) {
            console.error('Stats error:', error);
            return {};
        }
    }
    
    // ============ REPORT MANAGEMENT ============
    
    /**
     * View single report
     */
    async viewReport(req, res) {
        try {
            const { caseId } = req.params;
            
            const report = await Report.findOne({ caseId })
                .populate('assignedTo', 'username fullName')
                .populate('reviewedBy', 'username fullName');
            
            if (!report) {
                return res.render('admin/404');
            }
            
            // Increment view count
            report.viewedCount += 1;
            report.lastViewedAt = new Date();
            await report.save();
            
            // Log viewing activity
            await Activity.create({
                adminId: req.session.adminId,
                action: 'view_report',
                targetId: report._id,
                targetType: 'Report',
                details: { caseId },
                ipAddress: req.ip
            });
            
            // Get related reports
            const relatedReports = await Report.find({
                $or: [
                    { 'reporter.email': report.reporter?.email },
                    { incidentTypes: { $in: report.incidentTypes } }
                ],
                caseId: { $ne: caseId }
            })
            .limit(5)
            .select('caseId status severity submittedAt incidentTypes');
            
            res.render('admin/view-report', {
                admin: req.session.adminUsername,
                report,
                relatedReports
            });
            
        } catch (error) {
            console.error('View report error:', error);
            res.render('admin/error', {
                message: 'Failed to load report',
                error: process.env.NODE_ENV === 'development' ? error.message : null
            });
        }
    }
    
    /**
     * Update report status
     */
    async updateReportStatus(req, res) {
        try {
            const { caseId } = req.params;
            const { status, adminNotes, actionTaken, assignedTo, severity } = req.body;
            
            const updateData = {
                status,
                adminNotes,
                actionTaken,
                severity,
                updatedAt: new Date()
            };
            
            if (status === 'resolved') {
                updateData.resolvedAt = new Date();
            }
            
            if (assignedTo) {
                updateData.assignedTo = assignedTo;
            }
            
            if (status === 'under_review' || status === 'resolved') {
                updateData.reviewedBy = req.session.adminId;
                updateData.reviewedAt = new Date();
            }
            
            const report = await Report.findOneAndUpdate(
                { caseId },
                updateData,
                { new: true }
            );
            
            if (!report) {
                return res.status(404).json({ error: 'Report not found' });
            }
            
            // Log activity
            await Activity.create({
                adminId: req.session.adminId,
                action: 'update_report',
                targetId: report._id,
                targetType: 'Report',
                details: {
                    caseId,
                    status,
                    action: 'status_update'
                },
                ipAddress: req.ip
            });
            
            res.redirect(`/admin/view-report/${caseId}`);
            
        } catch (error) {
            console.error('Update report error:', error);
            res.status(500).render('admin/error', {
                message: 'Failed to update report',
                error: process.env.NODE_ENV === 'development' ? error.message : null
            });
        }
    }
    
    /**
     * Respond to report (send message to reporter)
     */
    async respondToReport(req, res) {
        try {
            const { caseId } = req.params;
            const { message, responseType, sendEmail } = req.body;
            
            const report = await Report.findOne({ caseId });
            
            if (!report) {
                return res.status(404).json({ error: 'Report not found' });
            }
            
            // Update report with response
            report.adminResponse = {
                message,
                responseType,
                sentAt: new Date(),
                sentBy: req.session.adminId,
                viaEmail: sendEmail === 'on'
            };
            
            await report.save();
            
            // Log activity
            await Activity.create({
                adminId: req.session.adminId,
                action: 'update_report',
                targetId: report._id,
                targetType: 'Report',
                details: {
                    caseId,
                    action: 'send_response',
                    responseType
                },
                ipAddress: req.ip
            });
            
            // TODO: Send email notification if requested
            if (sendEmail === 'on' && report.reporter?.email) {
                await this.sendEmailNotification(report, message);
            }
            
            res.redirect(`/admin/view-report/${caseId}`);
            
        } catch (error) {
            console.error('Respond error:', error);
            res.status(500).render('admin/error', {
                message: 'Failed to send response',
                error: process.env.NODE_ENV === 'development' ? error.message : null
            });
        }
    }
    
    /**
     * Delete report
     */
    async deleteReport(req, res) {
        try {
            const { caseId } = req.params;
            const { confirm } = req.body;
            
            if (confirm !== 'YES') {
                req.flash('error', 'Please type YES to confirm deletion');
                return res.redirect(`/admin/view-report/${caseId}`);
            }
            
            const report = await Report.findOne({ caseId });
            
            if (!report) {
                return res.status(404).json({ error: 'Report not found' });
            }
            
            // Delete associated files
            await this.deleteReportFiles(report);
            
            // Delete from database
            await Report.deleteOne({ caseId });
            
            // Log activity
            await Activity.create({
                adminId: req.session.adminId,
                action: 'delete_report',
                targetId: report._id,
                targetType: 'Report',
                details: { caseId },
                ipAddress: req.ip
            });
            
            req.flash('success', `Report ${caseId} deleted successfully`);
            res.redirect('/admin/dashboard');
            
        } catch (error) {
            console.error('Delete report error:', error);
            req.flash('error', 'Failed to delete report');
            res.redirect(`/admin/view-report/${req.params.caseId}`);
        }
    }
    
    /**
     * Bulk update reports
     */
    async bulkUpdateReports(req, res) {
        try {
            const { action, reportIds } = req.body;
            
            if (!reportIds || !Array.isArray(reportIds)) {
                return res.status(400).json({ error: 'No reports selected' });
            }
            
            let updateData = {};
            let actionName = '';
            
            switch (action) {
                case 'mark_reviewed':
                    updateData = { status: 'under_review', reviewedBy: req.session.adminId, reviewedAt: new Date() };
                    actionName = 'marked as reviewed';
                    break;
                case 'mark_resolved':
                    updateData = { status: 'resolved', resolvedAt: new Date() };
                    actionName = 'marked as resolved';
                    break;
                case 'assign_to_me':
                    updateData = { assignedTo: req.session.adminId };
                    actionName = 'assigned to you';
                    break;
                case 'change_severity_high':
                    updateData = { severity: 'high' };
                    actionName = 'changed severity to high';
                    break;
                default:
                    return res.status(400).json({ error: 'Invalid action' });
            }
            
            const result = await Report.updateMany(
                { _id: { $in: reportIds } },
                updateData
            );
            
            // Log activity
            await Activity.create({
                adminId: req.session.adminId,
                action: 'bulk_update',
                details: {
                    action,
                    reportCount: reportIds.length,
                    actionName
                },
                ipAddress: req.ip
            });
            
            req.flash('success', `${result.modifiedCount} reports ${actionName}`);
            res.redirect('/admin/dashboard');
            
        } catch (error) {
            console.error('Bulk update error:', error);
            req.flash('error', 'Failed to update reports');
            res.redirect('/admin/dashboard');
        }
    }
    
    // ============ STATUS MANAGEMENT ============
    
    /**
     * Get all status options
     */
    async getStatusOptions() {
        return [
            { value: 'pending', label: 'Pending', color: 'warning', icon: '⏳' },
            { value: 'under_review', label: 'Under Review', color: 'info', icon: '🔍' },
            { value: 'resolved', label: 'Resolved', color: 'success', icon: '✅' },
            { value: 'rejected', label: 'Rejected', color: 'danger', icon: '❌' },
            { value: 'archived', label: 'Archived', color: 'secondary', icon: '📁' }
        ];
    }
    
    /**
     * Get status statistics
     */
    async getStatusStatistics() {
        try {
            const stats = await Report.aggregate([
                {
                    $group: {
                        _id: '$status',
                        count: { $sum: 1 },
                        avgResolutionTime: { $avg: { $subtract: ['$resolvedAt', '$submittedAt'] } }
                    }
                }
            ]);
            
            const statusOptions = await this.getStatusOptions();
            
            return statusOptions.map(option => {
                const stat = stats.find(s => s._id === option.value);
                return {
                    ...option,
                    count: stat?.count || 0,
                    avgResolutionTime: stat?.avgResolutionTime || null
                };
            });
            
        } catch (error) {
            console.error('Status stats error:', error);
            return [];
        }
    }
    
    /**
     * Update multiple reports status
     */
    async updateBulkStatus(req, res) {
        try {
            const { status, reportIds, notes } = req.body;
            
            if (!reportIds || !Array.isArray(reportIds)) {
                return res.status(400).json({ error: 'No reports selected' });
            }
            
            const updateData = { status };
            
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
                action: 'bulk_status_update',
                details: {
                    status,
                    reportCount: reportIds.length,
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
            console.error('Bulk status update error:', error);
            res.status(500).json({ error: 'Failed to update status' });
        }
    }
    
    // ============ UTILITY METHODS ============
    
    /**
     * Delete report files from storage
     */
    async deleteReportFiles(report) {
        try {
            const filesToDelete = [];
            
            // Collect image files
            if (report.evidence?.images) {
                report.evidence.images.forEach(image => {
                    if (image.path) {
                        filesToDelete.push(
                            path.join(__dirname, '..', 'public', image.path.replace(/^\//, ''))
                        );
                    }
                });
            }
            
            // Collect video files
            if (report.evidence?.videos) {
                report.evidence.videos.forEach(video => {
                    if (video.path) {
                        filesToDelete.push(
                            path.join(__dirname, '..', 'public', video.path.replace(/^\//, ''))
                        );
                    }
                });
            }
            
            // Delete files
            for (const filePath of filesToDelete) {
                try {
                    await fs.unlink(filePath);
                } catch (err) {
                    console.warn(`Failed to delete file: ${filePath}`, err.message);
                }
            }
            
        } catch (error) {
            console.error('Delete files error:', error);
        }
    }
    
    /**
     * Send email notification
     */
    async sendEmailNotification(report, message) {
        // TODO: Implement email sending service
        // This is a placeholder for actual email implementation
        console.log(`Email would be sent to ${report.reporter.email}`, {
            subject: `Update on your report ${report.caseId}`,
            message
        });
    }
    
    /**
     * Export reports
     */
    async exportReports(req, res) {
        try {
            const { format = 'csv', filter } = req.query;
            
            // Build query based on filter
            const query = {};
            if (filter === 'resolved') query.status = 'resolved';
            if (filter === 'pending') query.status = 'pending';
            if (filter === 'high') query.severity = 'high';
            
            const reports = await Report.find(query)
                .select('caseId status severity incidentTypes submittedAt resolvedAt adminNotes')
                .sort({ submittedAt: -1 });
            
            let data;
            let filename;
            let contentType;
            
            if (format === 'csv') {
                // Convert to CSV
                const headers = ['Case ID', 'Status', 'Severity', 'Incident Types', 'Submitted At', 'Resolved At', 'Admin Notes'];
                const rows = reports.map(report => [
                    report.caseId,
                    report.status,
                    report.severity,
                    report.incidentTypes.join(', '),
                    new Date(report.submittedAt).toISOString(),
                    report.resolvedAt ? new Date(report.resolvedAt).toISOString() : '',
                    report.adminNotes || ''
                ]);
                
                data = [headers, ...rows].map(row => row.map(cell => `"${cell}"`).join(',')).join('\n');
                filename = `reports_${new Date().toISOString().split('T')[0]}.csv`;
                contentType = 'text/csv';
                
            } else if (format === 'json') {
                data = JSON.stringify(reports, null, 2);
                filename = `reports_${new Date().toISOString().split('T')[0]}.json`;
                contentType = 'application/json';
            }
            
            // Set headers for file download
            res.setHeader('Content-Type', contentType);
            res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
            
            res.send(data);
            
        } catch (error) {
            console.error('Export error:', error);
            res.status(500).json({ error: 'Failed to export reports' });
        }
    }
    
    /**
     * Get activity logs
     */
    async getActivityLogs(req, res) {
        try {
            const page = parseInt(req.query.page) || 1;
            const limit = 50;
            const skip = (page - 1) * limit;
            
            const [activities, total] = await Promise.all([
                Activity.find()
                    .sort({ timestamp: -1 })
                    .skip(skip)
                    .limit(limit)
                    .populate('adminId', 'username fullName')
                    .populate('targetId'),
                Activity.countDocuments()
            ]);
            
            res.render('admin/activity-logs', {
                admin: req.session.adminUsername,
                activities,
                pagination: {
                    page,
                    totalPages: Math.ceil(total / limit),
                    hasNext: page < Math.ceil(total / limit),
                    hasPrev: page > 1
                }
            });
            
        } catch (error) {
            console.error('Activity logs error:', error);
            res.render('admin/error', {
                message: 'Failed to load activity logs',
                error: process.env.NODE_ENV === 'development' ? error.message : null
            });
        }
    }
}

module.exports = new AdminController();