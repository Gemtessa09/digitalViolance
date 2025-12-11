const fs = require('fs').promises;
const path = require('path');
const caseIdGenerator = require('./caseIdGenerator');

class ReportModel {
    constructor() {
        this.dataDir = path.join(__dirname, '..', 'data');
        this.reportsFile = path.join(this.dataDir, 'reports.json');
        this.counterFile = path.join(this.dataDir, 'counter.json');
        this.ensureDataDirectory();
    }

    async ensureDataDirectory() {
        try {
            await fs.mkdir(this.dataDir, { recursive: true });
            
            // Initialize reports file if it doesn't exist
            if (!await this.fileExists(this.reportsFile)) {
                await fs.writeFile(this.reportsFile, JSON.stringify([], null, 2));
            }
            
            // Initialize counter file if it doesn't exist
            if (!await this.fileExists(this.counterFile)) {
                await fs.writeFile(this.counterFile, JSON.stringify({ counter: 0 }, null, 2));
            }
        } catch (error) {
            console.error('Error ensuring data directory:', error);
            throw error;
        }
    }

    async fileExists(filePath) {
        try {
            await fs.access(filePath);
            return true;
        } catch {
            return false;
        }
    }

    /**
     * Create a new report
     * @param {Object} reportData - Report data from form
     * @param {Array} files - Uploaded files metadata
     */
    async create(reportData, files = []) {
        try {
            const reports = await this.getAll();
            const caseId = caseIdGenerator.generateWithType(reportData.incidentType?.[0] || 'general');
            const now = new Date().toISOString();

            // Process evidence files
            const evidence = {
                images: [],
                videos: [],
                documents: []
            };

            if (files && files.length > 0) {
                files.forEach(file => {
                    if (file.mimetype.startsWith('image/')) {
                        evidence.images.push({
                            filename: file.filename,
                            originalName: file.originalname,
                            path: `/uploads/images/${file.filename}`,
                            size: file.size,
                            mimetype: file.mimetype,
                            uploadedAt: now
                        });
                    } else if (file.mimetype.startsWith('video/')) {
                        evidence.videos.push({
                            filename: file.filename,
                            originalName: file.originalname,
                            path: `/uploads/videos/${file.filename}`,
                            size: file.size,
                            mimetype: file.mimetype,
                            duration: null, // Could extract from metadata
                            uploadedAt: now
                        });
                    }
                });
            }

            // Create report object
            const newReport = {
                caseId,
                status: 'pending',
                severity: reportData.isEmergency ? 'high' : 'medium',
                isAnonymous: reportData.anonymous === 'on' || reportData.anonymous === true,
                isEmergency: reportData.consent_emergency === 'on' || reportData.isEmergency === true,
                
                // Incident details
                incidentType: reportData.incidentType || [],
                incidentDate: reportData.incidentDate,
                incidentTime: reportData.incidentTime,
                platforms: reportData.platform || [],
                otherPlatform: reportData.otherPlatform || '',
                description: reportData.description || '',
                
                // Evidence
                evidence,
                
                // Reporter information (if not anonymous)
                reporter: reportData.isAnonymous ? null : {
                    name: reportData.name || '',
                    email: reportData.email || '',
                    phone: reportData.phone || '',
                    contactPreference: reportData.contactPreference || 'email'
                },
                
                // Privacy preferences
                privacy: {
                    deleteAfterResolution: reportData.privacy_no_evidence_storage === 'on',
                    noDataSharing: reportData.privacy_no_data_share === 'on' || true,
                    allowFollowUp: !reportData.isAnonymous
                },
                
                // Timestamps
                submittedAt: now,
                updatedAt: now,
                
                // Admin fields (to be filled later)
                assignedTo: null,
                reviewedBy: null,
                reviewedAt: null,
                adminNotes: null,
                actionTaken: null,
                resolution: null,
                resolvedAt: null,
                
                // System fields
                viewedCount: 0,
                lastViewedAt: null,
                flags: [],
                tags: []
            };

            // Add report to array
            reports.push(newReport);
            
            // Save to file
            await this.saveAll(reports);
            
            // Update counter
            await this.incrementCounter();
            
            console.log(`📋 New report created: ${caseId}`);
            return newReport;
            
        } catch (error) {
            console.error('Error creating report:', error);
            throw error;
        }
    }

    /**
     * Get all reports
     * @param {Object} filters - Optional filters
     */
    async getAll(filters = {}) {
        try {
            const data = await fs.readFile(this.reportsFile, 'utf8');
            let reports = JSON.parse(data);
            
            // Apply filters if provided
            if (Object.keys(filters).length > 0) {
                reports = reports.filter(report => {
                    for (const [key, value] of Object.entries(filters)) {
                        if (key === 'status' && report.status !== value) return false;
                        if (key === 'severity' && report.severity !== value) return false;
                        if (key === 'isEmergency' && report.isEmergency !== value) return false;
                        if (key === 'dateFrom' && new Date(report.submittedAt) < new Date(value)) return false;
                        if (key === 'dateTo' && new Date(report.submittedAt) > new Date(value)) return false;
                        if (key === 'incidentType' && !report.incidentType.includes(value)) return false;
                        if (key === 'search' && !this.searchInReport(report, value)) return false;
                    }
                    return true;
                });
            }
            
            return reports;
        } catch (error) {
            console.error('Error reading reports:', error);
            return [];
        }
    }

    /**
     * Get report by case ID
     * @param {string} caseId - The case ID
     */
    async getById(caseId) {
        const reports = await this.getAll();
        return reports.find(report => report.caseId === caseId);
    }

    /**
     * Update report
     * @param {string} caseId - The case ID
     * @param {Object} updates - Fields to update
     */
    async update(caseId, updates) {
        try {
            const reports = await this.getAll();
            const index = reports.findIndex(report => report.caseId === caseId);
            
            if (index === -1) {
                throw new Error(`Report ${caseId} not found`);
            }
            
            // Preserve existing data, apply updates
            reports[index] = {
                ...reports[index],
                ...updates,
                updatedAt: new Date().toISOString()
            };
            
            // If status changed to resolved, set resolvedAt
            if (updates.status === 'resolved' && !reports[index].resolvedAt) {
                reports[index].resolvedAt = new Date().toISOString();
            }
            
            // If being reviewed, update reviewed fields
            if (updates.status === 'reviewed' && updates.reviewedBy) {
                reports[index].reviewedAt = new Date().toISOString();
            }
            
            await this.saveAll(reports);
            return reports[index];
            
        } catch (error) {
            console.error('Error updating report:', error);
            throw error;
        }
    }

    /**
     * Delete report
     * @param {string} caseId - The case ID
     */
    async delete(caseId) {
        try {
            let reports = await this.getAll();
            const initialLength = reports.length;
            
            reports = reports.filter(report => report.caseId !== caseId);
            
            if (reports.length === initialLength) {
                throw new Error(`Report ${caseId} not found`);
            }
            
            await this.saveAll(reports);
            return true;
            
        } catch (error) {
            console.error('Error deleting report:', error);
            throw error;
        }
    }

    /**
     * Get statistics
     */
    async getStatistics() {
        const reports = await this.getAll();
        
        const stats = {
            total: reports.length,
            byStatus: {
                pending: reports.filter(r => r.status === 'pending').length,
                reviewed: reports.filter(r => r.status === 'reviewed').length,
                resolved: reports.filter(r => r.status === 'resolved').length
            },
            bySeverity: {
                high: reports.filter(r => r.severity === 'high').length,
                medium: reports.filter(r => r.severity === 'medium').length,
                low: reports.filter(r => r.severity === 'low').length
            },
            byType: {},
            anonymousCount: reports.filter(r => r.isAnonymous).length,
            emergencyCount: reports.filter(r => r.isEmergency).length,
            todayCount: reports.filter(r => {
                const today = new Date().toDateString();
                return new Date(r.submittedAt).toDateString() === today;
            }).length,
            last7Days: reports.filter(r => {
                const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
                return new Date(r.submittedAt) >= weekAgo;
            }).length
        };
        
        // Count by incident type
        reports.forEach(report => {
            report.incidentType?.forEach(type => {
                stats.byType[type] = (stats.byType[type] || 0) + 1;
            });
        });
        
        return stats;
    }

    /**
     * Search in report content
     * @param {Object} report - The report object
     * @param {string} searchTerm - Search term
     */
    searchInReport(report, searchTerm) {
        const term = searchTerm.toLowerCase();
        
        const searchFields = [
            report.caseId,
            report.description,
            report.reporter?.name,
            report.reporter?.email,
            report.adminNotes,
            report.actionTaken
        ].filter(Boolean).join(' ').toLowerCase();
        
        return searchFields.includes(term);
    }

    /**
     * Save all reports to file
     * @param {Array} reports - Array of reports
     */
    async saveAll(reports) {
        try {
            await fs.writeFile(this.reportsFile, JSON.stringify(reports, null, 2));
        } catch (error) {
            console.error('Error saving reports:', error);
            throw error;
        }
    }

    /**
     * Increment report counter
     */
    async incrementCounter() {
        try {
            const data = await fs.readFile(this.counterFile, 'utf8');
            const counter = JSON.parse(data);
            counter.counter += 1;
            await fs.writeFile(this.counterFile, JSON.stringify(counter, null, 2));
            return counter.counter;
        } catch (error) {
            console.error('Error incrementing counter:', error);
            return 0;
        }
    }

    /**
     * Get report counter
     */
    async getCounter() {
        try {
            const data = await fs.readFile(this.counterFile, 'utf8');
            const counter = JSON.parse(data);
            return counter.counter;
        } catch (error) {
            console.error('Error reading counter:', error);
            return 0;
        }
    }

    /**
     * Add flag to report
     * @param {string} caseId - The case ID
     * @param {string} flag - Flag to add
     * @param {string} reason - Reason for flag
     */
    async addFlag(caseId, flag, reason) {
        const report = await this.getById(caseId);
        if (!report) throw new Error('Report not found');
        
        report.flags = report.flags || [];
        report.flags.push({
            flag,
            reason,
            addedAt: new Date().toISOString(),
            addedBy: 'system'
        });
        
        return await this.update(caseId, { flags: report.flags });
    }

    /**
     * Add tag to report
     * @param {string} caseId - The case ID
     * @param {string} tag - Tag to add
     */
    async addTag(caseId, tag) {
        const report = await this.getById(caseId);
        if (!report) throw new Error('Report not found');
        
        report.tags = report.tags || [];
        if (!report.tags.includes(tag)) {
            report.tags.push(tag);
        }
        
        return await this.update(caseId, { tags: report.tags });
    }

    /**
     * Increment view count
     * @param {string} caseId - The case ID
     */
    async incrementViewCount(caseId) {
        const report = await this.getById(caseId);
        if (!report) throw new Error('Report not found');
        
        report.viewedCount = (report.viewedCount || 0) + 1;
        report.lastViewedAt = new Date().toISOString();
        
        return await this.update(caseId, {
            viewedCount: report.viewedCount,
            lastViewedAt: report.lastViewedAt
        });
    }

    /**
     * Get recent reports
     * @param {number} limit - Number of recent reports to return
     */
    async getRecent(limit = 10) {
        const reports = await this.getAll();
        return reports
            .sort((a, b) => new Date(b.submittedAt) - new Date(a.submittedAt))
            .slice(0, limit);
    }

    /**
     * Get reports needing attention (pending + high severity)
     */
    async getNeedAttention() {
        const reports = await this.getAll();
        return reports.filter(report => 
            report.status === 'pending' || 
            report.severity === 'high' ||
            report.isEmergency === true
        );
    }
}

// Export singleton instance
module.exports = new ReportModel();

// Alternative: Export class for testing
module.exports.ReportModel = ReportModel;