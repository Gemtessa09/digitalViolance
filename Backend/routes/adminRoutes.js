const express = require('express');
const router = express.Router();
const path = require('path');
const fs = require('fs');
const { isAdmin, verifyAdmin, generateCaseId } = require('../middleware/auth');

// Load reports data
function loadReports() {
    const reportsFile = path.join(__dirname, '..', 'data', 'reports.json');
    if (fs.existsSync(reportsFile)) {
        return JSON.parse(fs.readFileSync(reportsFile, 'utf8'));
    }
    return [];
}

// Save reports data
function saveReports(reports) {
    const reportsFile = path.join(__dirname, '..', 'data', 'reports.json');
    fs.writeFileSync(reportsFile, JSON.stringify(reports, null, 2));
}

// ADMIN LOGIN PAGE (GET)
router.get('/login', (req, res) => {
    // If already logged in, redirect to dashboard
    if (req.session.isAdmin) {
        return res.redirect('/admin/dashboard');
    }
    res.render('admin/login', { 
        error: null,
        returnTo: req.session.returnTo || '/admin/dashboard'
    });
});

// ADMIN LOGIN PROCESS (POST)
router.post('/login', async (req, res) => {
    const { username, password } = req.body;
    
    try {
        const isValid = await verifyAdmin(username, password);
        
        if (isValid) {
            // Set session variables
            req.session.isAdmin = true;
            req.session.adminUsername = username;
            req.session.loggedInAt = new Date();
            
            // Clear returnTo if it exists
            const returnTo = req.session.returnTo || '/admin/dashboard';
            delete req.session.returnTo;
            
            console.log(`✅ Admin login: ${username}`);
            res.redirect(returnTo);
        } else {
            res.render('admin/login', { 
                error: 'Invalid username or password',
                returnTo: req.session.returnTo
            });
        }
    } catch (error) {
        console.error('Login error:', error);
        res.render('admin/login', { 
            error: 'An error occurred during login',
            returnTo: req.session.returnTo
        });
    }
});

// ADMIN LOGOUT
router.get('/logout', (req, res) => {
    req.session.destroy((err) => {
        if (err) {
            console.error('Logout error:', err);
        }
        res.redirect('/admin/login');
    });
});

// ADMIN DASHBOARD (PROTECTED)
router.get('/dashboard', isAdmin, (req, res) => {
    const reports = loadReports();
    
    // Calculate statistics
    const stats = {
        total: reports.length,
        pending: reports.filter(r => r.status === 'pending').length,
        reviewed: reports.filter(r => r.status === 'reviewed').length,
        resolved: reports.filter(r => r.status === 'resolved').length,
        urgent: reports.filter(r => r.isEmergency).length
    };
    
    res.render('admin/dashboard', {
        admin: req.session.adminUsername,
        reports: reports,
        stats: stats,
        filter: req.query.filter || 'all'
    });
});

// VIEW SPECIFIC REPORT (PROTECTED)
router.get('/view-report/:caseId', isAdmin, (req, res) => {
    const reports = loadReports();
    const report = reports.find(r => r.caseId === req.params.caseId);
    
    if (!report) {
        return res.status(404).render('admin/404');
    }
    
    res.render('admin/view-report', {
        admin: req.session.adminUsername,
        report: report
    });
});

// RESPOND TO REPORT (PROTECTED)
router.get('/respond/:caseId', isAdmin, (req, res) => {
    const reports = loadReports();
    const report = reports.find(r => r.caseId === req.params.caseId);
    
    if (!report) {
        return res.status(404).render('admin/404');
    }
    
    res.render('admin/respond', {
        admin: req.session.adminUsername,
        report: report
    });
});

// UPDATE REPORT STATUS (PROTECTED - POST)
router.post('/update-status/:caseId', isAdmin, (req, res) => {
    const { status, adminNotes, actionTaken } = req.body;
    const reports = loadReports();
    const reportIndex = reports.findIndex(r => r.caseId === req.params.caseId);
    
    if (reportIndex === -1) {
        return res.status(404).send('Report not found');
    }
    
    // Update report
    reports[reportIndex].status = status;
    reports[reportIndex].adminNotes = adminNotes;
    reports[reportIndex].actionTaken = actionTaken;
    reports[reportIndex].reviewedBy = req.session.adminUsername;
    reports[reportIndex].reviewedAt = new Date().toISOString();
    
    saveReports(reports);
    
    res.redirect(`/admin/view-report/${req.params.caseId}`);
});

// GET ALL REPORTS (JSON API - PROTECTED)
router.get('/api/reports', isAdmin, (req, res) => {
    const reports = loadReports();
    res.json(reports);
});

// GET REPORT BY ID (JSON API - PROTECTED)
router.get('/api/reports/:caseId', isAdmin, (req, res) => {
    const reports = loadReports();
    const report = reports.find(r => r.caseId === req.params.caseId);
    
    if (!report) {
        return res.status(404).json({ error: 'Report not found' });
    }
    
    res.json(report);
});

module.exports = router;