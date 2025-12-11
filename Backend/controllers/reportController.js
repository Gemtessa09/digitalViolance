// controllers/reportController.js

const { Report } = require('../config/db');
const { getNextCaseId, getNextTypeCaseId } = require('../utils/caseIdGenerator');
const multer = require('multer');
const path = require('path');
const fs = require('fs').promises;

class ReportController {
    
    // ============ USER REPORT SUBMISSION ============
    
    /**
     * Submit new report
     */
    async submitReport(req, res) {
        try {
            const formData = req.body;
            const files = req.files;
            
            // Generate case ID based on incident type
            const incidentType = Array.isArray(formData.incidentType) ? formData.incidentType[0] : formData.incidentType;
            const caseId = await getNextTypeCaseId(incidentType);
            
            // Process uploaded files
            const evidence = await this.processUploadedFiles(files);
            
            // Create report object
            const reportData = {
                caseId,
                incidentTypes: Array.isArray(formData.incidentType) ? formData.incidentType : [formData.incidentType],
                incidentDate: new Date(formData.incidentDate),
                incidentTime: formData.incidentTime,
                platforms: Array.isArray(formData.platform) ? formData.platform : [formData.platform],
                otherPlatform: formData.otherPlatform,
                description: formData.description,
                evidence,
                isAnonymous: formData.anonymous === 'on' || formData.anonymous === true,
                isEmergency: formData.consent_emergency === 'on',
                severity: formData.consent_emergency === 'on' ? 'high' : 'medium'
            };
            
            // Add reporter info if not anonymous
            if (!reportData.isAnonymous) {
                reportData.reporter = {
                    name: formData.name,
                    email: formData.email,
                    phone: formData.phone,
                    contactPreference: formData.contactPreference || 'email'
                };
            }
            
            // Add privacy preferences
            reportData.privacy = {
                deleteAfterResolution: formData.privacy_no_evidence_storage === 'on',
                noDataSharing: formData.privacy_no_data_share === 'on' || true,
                allowFollowUp: !reportData.isAnonymous
            };
            
            // Save report to database
            const report = await Report.create(reportData);
            
            // Redirect to success page
            res.redirect(`/user/success?caseId=${caseId}`);
            
        } catch (error) {
            console.error('Submit report error:', error);
            res.status(500).render('user/error', {
                message: 'Failed to submit report. Please try again.',
                error: process.env.NODE_ENV === 'development' ? error.message : null
            });
        }
    }
    
    /**
     * Process uploaded files
     */
    async processUploadedFiles(files) {
        const evidence = {
            images: [],
            videos: []
        };
        
        try {
            // Process images
            if (files.images && Array.isArray(files.images)) {
                evidence.images = files.images.map(file => ({
                    filename: file.filename,
                    originalName: file.originalname,
                    path: `/uploads/images/${file.filename}`,
                    size: file.size,
                    mimetype: file.mimetype,
                    uploadedAt: new Date()
                }));
            }
            
            // Process videos
            if (files.videos && Array.isArray(files.videos)) {
                evidence.videos = files.videos.map(file => ({
                    filename: file.filename,
                    originalName: file.originalname,
                    path: `/uploads/videos/${file.filename}`,
                    size: file.size,
                    mimetype: file.mimetype,
                    uploadedAt: new Date()
                }));
            }
            
        } catch (error) {
            console.error('File processing error:', error);
        }
        
        return evidence;
    }
    
    /**
     * Check report status
     */
    async checkStatus(req, res) {
        try {
            const { caseId, email } = req.query;
            
            if (!caseId) {
                return res.render('user/status', {
                    caseId: '',
                    report: null,
                    error: null
                });
            }
            
            // Find report by case ID
            let report = await Report.findOne({ caseId });
            
            // If not found by case ID, try searching by email
            if (!report && email) {
                report = await Report.findOne({
                    'reporter.email': email,
                    'reporter.email': { $exists: true, $ne: '' }
                }).sort({ submittedAt: -1 });
            }
            
            if (!report) {
                return res.render('user/status', {
                    caseId,
                    report: null,
                    error: 'Report not found. Please check your Case ID.'
                });
            }
            
            res.render('user/status', {
                caseId,
                report,
                error: null
            });
            
        } catch (error) {
            console.error('Check status error:', error);
            res.render('user/status', {
                caseId: req.query.caseId,
                report: null,
                error: 'An error occurred while checking status'
            });
        }
    }
    
    /**
     * Get report by ID (public API)
     */
    async getReportById(req, res) {
        try {
            const { caseId } = req.params;
            
            const report = await Report.findOne({ caseId })
                .select('caseId status submittedAt adminNotes actionTaken')
                .lean();
            
            if (!report) {
                return res.status(404).json({ error: 'Report not found' });
            }
            
            // Don't expose sensitive information
            const publicReport = {
                caseId: report.caseId,
                status: report.status,
                submittedAt: report.submittedAt,
                adminNotes: report.adminNotes,
                actionTaken: report.actionTaken,
                updatedAt: report.updatedAt
            };
            
            res.json(publicReport);
            
        } catch (error) {
            console.error('Get report error:', error);
            res.status(500).json({ error: 'Failed to fetch report' });
        }
    }
    
    /**
     * Upload evidence to existing report
     */
    async uploadAdditionalEvidence(req, res) {
        try {
            const { caseId } = req.params;
            const files = req.files;
            
            const report = await Report.findOne({ caseId });
            
            if (!report) {
                return res.status(404).json({ error: 'Report not found' });
            }
            
            // Process new files
            const newEvidence = await this.processUploadedFiles(files);
            
            // Merge with existing evidence
            if (newEvidence.images.length > 0) {
                report.evidence.images.push(...newEvidence.images);
            }
            
            if (newEvidence.videos.length > 0) {
                report.evidence.videos.push(...newEvidence.videos);
            }
            
            report.updatedAt = new Date();
            await report.save();
            
            res.json({
                success: true,
                message: `Uploaded ${newEvidence.images.length} images and ${newEvidence.videos.length} videos`,
                caseId
            });
            
        } catch (error) {
            console.error('Upload evidence error:', error);
            res.status(500).json({ error: 'Failed to upload evidence' });
        }
    }
    
    /**
     * Delete report (user request)
     */
    async deleteReportByUser(req, res) {
        try {
            const { caseId, email } = req.body;
            
            if (!caseId || !email) {
                return res.status(400).json({ error: 'Case ID and email are required' });
            }
            
            const report = await Report.findOne({ 
                caseId,
                'reporter.email': email 
            });
            
            if (!report) {
                return res.status(404).json({ error: 'Report not found or email does not match' });
            }
            
            // Check if report can be deleted
            if (report.status === 'resolved' && report.privacy?.deleteAfterResolution) {
                // Delete files
                await this.deleteReportFiles(report);
                
                // Delete from database
                await Report.deleteOne({ caseId });
                
                return res.json({
                    success: true,
                    message: 'Report deleted successfully as per your privacy settings'
                });
            }
            
            // Mark for deletion instead of immediate deletion
            report.status = 'pending_deletion';
            report.deletionRequestedAt = new Date();
            report.deletionReason = 'User requested deletion';
            await report.save();
            
            res.json({
                success: true,
                message: 'Deletion request submitted. An admin will review your request.'
            });
            
        } catch (error) {
            console.error('Delete report error:', error);
            res.status(500).json({ error: 'Failed to delete report' });
        }
    }
    
    /**
     * Get report statistics for public display
     */
    async getPublicStatistics(req, res) {
        try {
            const stats = await Report.aggregate([
                {
                    $facet: {
                        totalReports: [{ $count: 'count' }],
                        resolvedReports: [{ $match: { status: 'resolved' } }, { $count: 'count' }],
                        reportsByType: [
                            { $unwind: '$incidentTypes' },
                            { $group: { _id: '$incidentTypes', count: { $sum: 1 } } },
                            { $sort: { count: -1 } },
                            { $limit: 5 }
                        ],
                        recentActivity: [
                            { $sort: { submittedAt: -1 } },
                            { $limit: 10 },
                            { 
                                $project: {
                                    caseId: 1,
                                    status: 1,
                                    submittedAt: 1,
                                    severity: 1,
                                    incidentTypes: { $slice: ['$incidentTypes', 1] }
                                }
                            }
                        ]
                    }
                }
            ]);
            
            const publicStats = {
                totalReports: stats[0]?.totalReports[0]?.count || 0,
                resolvedReports: stats[0]?.resolvedReports[0]?.count || 0,
                reportsByType: stats[0]?.reportsByType || [],
                recentActivity: stats[0]?.recentActivity || []
            };
            
            res.json(publicStats);
            
        } catch (error) {
            console.error('Public stats error:', error);
            res.status(500).json({ error: 'Failed to fetch statistics' });
        }
    }
    
    /**
     * Get similar reports (for recommendation)
     */
    async getSimilarReports(req, res) {
        try {
            const { incidentTypes, excludeCaseId } = req.query;
            
            if (!incidentTypes) {
                return res.json([]);
            }
            
            const types = Array.isArray(incidentTypes) ? incidentTypes : [incidentTypes];
            
            const similarReports = await Report.find({
                incidentTypes: { $in: types },
                caseId: { $ne: excludeCaseId },
                status: { $ne: 'pending' }
            })
            .limit(5)
            .select('caseId status severity submittedAt adminNotes')
            .sort({ submittedAt: -1 });
            
            res.json(similarReports);
            
        } catch (error) {
            console.error('Similar reports error:', error);
            res.status(500).json({ error: 'Failed to fetch similar reports' });
        }
    }
    
    /**
     * Validate report before submission
     */
    validateReport(data) {
        const errors = [];
        
        // Check required fields
        if (!data.description || data.description.trim().length < 10) {
            errors.push('Description must be at least 10 characters');
        }
        
        if (!data.incidentDate) {
            errors.push('Incident date is required');
        }
        
        if (!data.incidentType || (Array.isArray(data.incidentType) && data.incidentType.length === 0)) {
            errors.push('Please select at least one incident type');
        }
        
        // Check file sizes
        if (data.files) {
            const maxImageSize = 10 * 1024 * 1024; // 10MB
            const maxVideoSize = 100 * 1024 * 1024; // 100MB
            
            if (data.files.images) {
                data.files.images.forEach((file, index) => {
                    if (file.size > maxImageSize) {
                        errors.push(`Image ${index + 1} exceeds maximum size (10MB)`);
                    }
                });
            }
            
            if (data.files.videos) {
                data.files.videos.forEach((file, index) => {
                    if (file.size > maxVideoSize) {
                        errors.push(`Video ${index + 1} exceeds maximum size (100MB)`);
                    }
                });
            }
        }
        
        return errors;
    }
    
    /**
     * Delete report files
     */
    async deleteReportFiles(report) {
        try {
            const filesToDelete = [];
            
            // Collect image files
            if (report.evidence?.images) {
                report.evidence.images.forEach(image => {
                    if (image.path) {
                        const filePath = path.join(__dirname, '..', 'public', image.path);
                        filesToDelete.push(filePath);
                    }
                });
            }
            
            // Collect video files
            if (report.evidence?.videos) {
                report.evidence.videos.forEach(video => {
                    if (video.path) {
                        const filePath = path.join(__dirname, '..', 'public', video.path);
                        filesToDelete.push(filePath);
                    }
                });
            }
            
            // Delete files
            for (const filePath of filesToDelete) {
                try {
                    await fs.unlink(filePath);
                } catch (err) {
                    console.warn(`Failed to delete file: ${filePath}`);
                }
            }
            
        } catch (error) {
            console.error('Delete files error:', error);
        }
    }
}

module.exports = new ReportController();