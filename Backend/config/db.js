const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
require('dotenv').config();

class Database {
    constructor() {
        this.mongoose = mongoose;
        this.models = {};
        this.isConnected = false;
        this.init();
    }

    async init() {
        try {
            const mongoURI = process.env.MONGODB_URI || 'mongodb://localhost:27017/reportsafe';
            
            // MongoDB connection options
            const options = {
                useNewUrlParser: true,
                useUnifiedTopology: true,
                serverSelectionTimeoutMS: 5000,
                socketTimeoutMS: 45000,
                family: 4 // Use IPv4, skip trying IPv6
            };

            // Connect to MongoDB
            await this.mongoose.connect(mongoURI, options);
            
            this.isConnected = true;
            console.log('✅ MongoDB connected successfully');
            
            // Define models
            this.defineModels();
            
            // Create indexes
            await this.createIndexes();
            
            // Create default admin if not exists
            await this.createDefaultAdmin();
            
        } catch (error) {
            console.error('❌ MongoDB connection failed:', error);
            process.exit(1);
        }
    }

    defineModels() {
        // Admin Schema
        const adminSchema = new mongoose.Schema({
            username: {
                type: String,
                required: true,
                unique: true,
                trim: true,
                minlength: 3,
                maxlength: 50
            },
            password: {
                type: String,
                required: true
            },
            email: {
                type: String,
                required: true,
                unique: true,
                lowercase: true,
                trim: true
            },
            fullName: {
                type: String,
                required: true,
                trim: true
            },
            role: {
                type: String,
                enum: ['superadmin', 'admin', 'reviewer'],
                default: 'admin'
            },
            isActive: {
                type: Boolean,
                default: true
            },
            lastLogin: {
                type: Date
            },
            loginAttempts: {
                type: Number,
                default: 0
            },
            lockUntil: {
                type: Date
            },
            permissions: {
                viewReports: { type: Boolean, default: true },
                editReports: { type: Boolean, default: true },
                deleteReports: { type: Boolean, default: false },
                manageUsers: { type: Boolean, default: false },
                systemSettings: { type: Boolean, default: false }
            },
            createdAt: {
                type: Date,
                default: Date.now
            },
            updatedAt: {
                type: Date,
                default: Date.now
            }
        }, {
            timestamps: true
        });

        // Hash password before saving
        adminSchema.pre('save', async function(next) {
            if (!this.isModified('password')) return next();
            
            try {
                const salt = await bcrypt.genSalt(10);
                this.password = await bcrypt.hash(this.password, salt);
                next();
            } catch (error) {
                next(error);
            }
        });

        // Compare password method
        adminSchema.methods.comparePassword = async function(candidatePassword) {
            return await bcrypt.compare(candidatePassword, this.password);
        };

        // Check if account is locked
        adminSchema.virtual('isLocked').get(function() {
            return !!(this.lockUntil && this.lockUntil > Date.now());
        });

        // Increment login attempts
        adminSchema.methods.incrementLoginAttempts = async function() {
            if (this.lockUntil && this.lockUntil < Date.now()) {
                return await this.updateOne({
                    $set: { loginAttempts: 1 },
                    $unset: { lockUntil: 1 }
                });
            }
            
            const updates = { $inc: { loginAttempts: 1 } };
            
            if (this.loginAttempts + 1 >= 5 && !this.isLocked) {
                updates.$set = { lockUntil: Date.now() + (2 * 60 * 60 * 1000) }; // Lock for 2 hours
            }
            
            return await this.updateOne(updates);
        };

        // Report Schema
        const reportSchema = new mongoose.Schema({
            caseId: {
                type: String,
                required: true,
                unique: true,
                index: true
            },
            status: {
                type: String,
                enum: ['pending', 'under_review', 'resolved', 'rejected', 'archived'],
                default: 'pending'
            },
            severity: {
                type: String,
                enum: ['low', 'medium', 'high', 'critical'],
                default: 'medium'
            },
            
            // Incident Information
            incidentTypes: [{
                type: String,
                enum: ['harassment', 'threats', 'image_abuse', 'cyberstalking', 'doxxing', 'deepfake']
            }],
            incidentDate: {
                type: Date,
                required: true
            },
            incidentTime: String,
            platforms: [String],
            otherPlatform: String,
            description: {
                type: String,
                required: true,
                minlength: 10,
                maxlength: 5000
            },
            
            // Evidence
            evidence: {
                images: [{
                    filename: String,
                    originalName: String,
                    path: String,
                    size: Number,
                    mimetype: String,
                    uploadedAt: Date
                }],
                videos: [{
                    filename: String,
                    originalName: String,
                    path: String,
                    size: Number,
                    mimetype: String,
                    duration: Number,
                    uploadedAt: Date
                }]
            },
            
            // Reporter Information
            isAnonymous: {
                type: Boolean,
                default: false
            },
            reporter: {
                name: String,
                email: String,
                phone: String,
                contactPreference: {
                    type: String,
                    enum: ['email', 'phone', 'none'],
                    default: 'email'
                }
            },
            
            // Privacy Settings
            privacy: {
                deleteAfterResolution: { type: Boolean, default: false },
                noDataSharing: { type: Boolean, default: true },
                allowFollowUp: { type: Boolean, default: true }
            },
            
            // Admin Fields
            assignedTo: {
                type: mongoose.Schema.Types.ObjectId,
                ref: 'Admin'
            },
            reviewedBy: {
                type: mongoose.Schema.Types.ObjectId,
                ref: 'Admin'
            },
            reviewedAt: Date,
            adminNotes: String,
            actionTaken: String,
            resolution: String,
            resolvedAt: Date,
            
            // Analytics
            viewedCount: {
                type: Number,
                default: 0
            },
            lastViewedAt: Date,
            
            // Metadata
            flags: [{
                type: String,
                enum: ['sensitive', 'urgent', 'legal', 'follow_up', 'external']
            }],
            tags: [String],
            
            // Timestamps
            submittedAt: {
                type: Date,
                default: Date.now,
                index: true
            },
            updatedAt: {
                type: Date,
                default: Date.now
            }
        }, {
            timestamps: true
        });

        // Activity Log Schema
        const activitySchema = new mongoose.Schema({
            adminId: {
                type: mongoose.Schema.Types.ObjectId,
                ref: 'Admin',
                required: true
            },
            action: {
                type: String,
                required: true,
                enum: ['login', 'logout', 'view_report', 'update_report', 'delete_report', 'create_admin']
            },
            targetId: mongoose.Schema.Types.ObjectId,
            targetType: String,
            details: mongoose.Schema.Types.Mixed,
            ipAddress: String,
            userAgent: String,
            timestamp: {
                type: Date,
                default: Date.now,
                index: true
            }
        });

        // Case Counter Schema (for generating sequential case IDs)
        const counterSchema = new mongoose.Schema({
            _id: { type: String, required: true },
            sequence_value: { type: Number, default: 0 }
        });

        // Define models
        this.models.Admin = mongoose.model('Admin', adminSchema);
        this.models.Report = mongoose.model('Report', reportSchema);
        this.models.Activity = mongoose.model('Activity', activitySchema);
        this.models.Counter = mongoose.model('Counter', counterSchema);
    }

    async createIndexes() {
        try {
            // Create compound indexes for better query performance
            await this.models.Report.createIndexes([
                { caseId: 1 },
                { status: 1, submittedAt: -1 },
                { severity: 1, submittedAt: -1 },
                { 'reporter.email': 1 },
                { incidentTypes: 1, submittedAt: -1 },
                { isAnonymous: 1, status: 1 },
                { submittedAt: -1 }
            ]);

            await this.models.Admin.createIndexes([
                { username: 1 },
                { email: 1 },
                { role: 1, isActive: 1 }
            ]);

            await this.models.Activity.createIndexes([
                { adminId: 1, timestamp: -1 },
                { action: 1, timestamp: -1 }
            ]);

            console.log('✅ Database indexes created successfully');
        } catch (error) {
            console.error('Error creating indexes:', error);
        }
    }

    async createDefaultAdmin() {
        try {
            const adminCount = await this.models.Admin.countDocuments();
            
            if (adminCount === 0) {
                const defaultAdmin = {
                    username: process.env.ADMIN_USERNAME || 'admin',
                    password: process.env.ADMIN_PASSWORD || 'Admin123!',
                    email: process.env.ADMIN_EMAIL || 'admin@reportsafe.com',
                    fullName: 'System Administrator',
                    role: 'superadmin',
                    permissions: {
                        viewReports: true,
                        editReports: true,
                        deleteReports: true,
                        manageUsers: true,
                        systemSettings: true
                    }
                };

                await this.models.Admin.create(defaultAdmin);
                console.log('✅ Default admin account created');
            }
        } catch (error) {
            console.error('Error creating default admin:', error);
        }
    }

    // Generate next case ID
    async getNextCaseId() {
        try {
            const counter = await this.models.Counter.findByIdAndUpdate(
                'caseId',
                { $inc: { sequence_value: 1 } },
                { new: true, upsert: true }
            );

            const year = new Date().getFullYear();
            const month = String(new Date().getMonth() + 1).padStart(2, '0');
            const sequence = String(counter.sequence_value).padStart(6, '0');
            
            return `RS-${year}${month}-${sequence}`;
        } catch (error) {
            console.error('Error generating case ID:', error);
            throw error;
        }
    }

    // Generate type-specific case ID
    async getNextTypeCaseId(incidentType) {
        const typeMap = {
            'harassment': 'HR',
            'threats': 'TH',
            'image_abuse': 'IA',
            'cyberstalking': 'CS',
            'doxxing': 'DX',
            'deepfake': 'DF'
        };

        const typeCode = typeMap[incidentType] || 'GN';
        const caseId = await this.getNextCaseId();
        return caseId.replace('RS-', `RS-${typeCode}-`);
    }

    // Log activity
    async logActivity(adminId, action, details = {}) {
        try {
            await this.models.Activity.create({
                adminId,
                action,
                targetId: details.targetId,
                targetType: details.targetType,
                details: details.data,
                ipAddress: details.ipAddress,
                userAgent: details.userAgent
            });
        } catch (error) {
            console.error('Error logging activity:', error);
        }
    }

    // Get database statistics
    async getStatistics() {
        try {
            const totalReports = await this.models.Report.countDocuments();
            const totalAdmins = await this.models.Admin.countDocuments();
            
            const reportsByStatus = await this.models.Report.aggregate([
                { $group: { _id: '$status', count: { $sum: 1 } } }
            ]);

            const reportsBySeverity = await this.models.Report.aggregate([
                { $group: { _id: '$severity', count: { $sum: 1 } } }
            ]);

            const reportsByMonth = await this.models.Report.aggregate([
                {
                    $group: {
                        _id: {
                            year: { $year: '$submittedAt' },
                            month: { $month: '$submittedAt' }
                        },
                        count: { $sum: 1 }
                    }
                },
                { $sort: { '_id.year': -1, '_id.month': -1 } },
                { $limit: 6 }
            ]);

            return {
                totalReports,
                totalAdmins,
                reportsByStatus: reportsByStatus.reduce((acc, curr) => {
                    acc[curr._id] = curr.count;
                    return acc;
                }, {}),
                reportsBySeverity: reportsBySeverity.reduce((acc, curr) => {
                    acc[curr._id] = curr.count;
                    return acc;
                }, {}),
                recentMonths: reportsByMonth
            };
        } catch (error) {
            console.error('Error getting statistics:', error);
            return null;
        }
    }

    // Backup database
    async backupDatabase() {
        try {
            const backupData = {
                timestamp: new Date(),
                reports: await this.models.Report.find({}).lean(),
                admins: await this.models.Admin.find({}, { password: 0 }).lean(),
                activities: await this.models.Activity.find({}).lean(),
                counters: await this.models.Counter.find({}).lean()
            };

            return backupData;
        } catch (error) {
            console.error('Error creating backup:', error);
            throw error;
        }
    }

    // Close database connection
    async close() {
        try {
            await this.mongoose.connection.close();
            console.log('Database connection closed');
        } catch (error) {
            console.error('Error closing database:', error);
        }
    }

    // Check connection health
    async healthCheck() {
        try {
            await this.mongoose.connection.db.admin().ping();
            return {
                status: 'healthy',
                connected: this.isConnected,
                uptime: process.uptime(),
                timestamp: new Date()
            };
        } catch (error) {
            return {
                status: 'unhealthy',
                connected: false,
                error: error.message,
                timestamp: new Date()
            };
        }
    }
}

// Create singleton instance
const database = new Database();

// Export the instance and models
module.exports = {
    db: database,
    Admin: database.models.Admin,
    Report: database.models.Report,
    Activity: database.models.Activity,
    Counter: database.models.Counter
};