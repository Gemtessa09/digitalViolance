const path = require('path');
const fs = require('fs');
const bcrypt = require('bcryptjs');

// Check if user is authenticated as admin
function isAdmin(req, res, next) {
    if (req.session && req.session.isAdmin) {
        return next();
    }
    
    // Store the original URL they tried to access
    req.session.returnTo = req.originalUrl;
    res.redirect('/admin/login');
}

// Check if user is logged in (for user reports)
function isLoggedIn(req, res, next) {
    if (req.session && req.session.userId) {
        return next();
    }
    res.redirect('/user/login');
}

// Verify admin credentials
async function verifyAdmin(username, password) {
    try {
        const adminFile = path.join(__dirname, '..', 'data', 'admin.json');
        
        if (!fs.existsSync(adminFile)) {
            return false;
        }
        
        const adminData = JSON.parse(fs.readFileSync(adminFile, 'utf8'));
        
        if (adminData.username !== username) {
            return false;
        }
        
        const isValid = await bcrypt.compare(password, adminData.password);
        return isValid;
        
    } catch (error) {
        console.error('Error verifying admin:', error);
        return false;
    }
}

// Generate unique case ID
function generateCaseId() {
    const prefix = 'RS';
    const year = new Date().getFullYear();
    const random = Math.random().toString(36).substr(2, 6).toUpperCase();
    return `${prefix}-${year}-${random}`;
}

module.exports = {
    isAdmin,
    isLoggedIn,
    verifyAdmin,
    generateCaseId
};