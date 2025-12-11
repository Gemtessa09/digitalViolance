const express = require('express');
const session = require('express-session');
const path = require('path');
const fs = require('fs');
const bcrypt = require('bcryptjs');
require('dotenv').config();

const app = express();

// Create necessary directories
const uploadDirs = [
    'public/uploads/images',
    'public/uploads/videos',
    'data'
];

uploadDirs.forEach(dir => {
    if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
    }
});

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static('public'));

// Session Configuration
app.use(session({
    secret: process.env.SESSION_SECRET || 'fallback-secret-key',
    resave: false,
    saveUninitialized: false,
    cookie: {
        secure: process.env.NODE_ENV === 'production',
        maxAge: 2 * 60 * 60 * 1000, // 2 hours
        httpOnly: true
    }
}));

// Authentication Middleware
const { isAdmin, isLoggedIn } = require('./middleware/auth');

// View Engine Setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'html');
app.engine('html', require('ejs').renderFile);

// Initialize Admin Account (runs once on server start)
async function initializeAdmin() {
    const adminFile = path.join(__dirname, 'data', 'admin.json');
    
    if (!fs.existsSync(adminFile)) {
        const hashedPassword = await bcrypt.hash(process.env.ADMIN_PASSWORD, 10);
        const adminData = {
            username: process.env.ADMIN_USERNAME,
            password: hashedPassword,
            created_at: new Date().toISOString()
        };
        
        fs.writeFileSync(adminFile, JSON.stringify(adminData, null, 2));
        console.log('✅ Admin account created successfully');
    }
}
initializeAdmin();

// Import Routes
const userRoutes = require('./routes/user');
const adminRoutes = require('./routes/admin');
const uploadRoutes = require('./routes/upload');

// Use Routes
app.use('/', userRoutes);
app.use('/admin', adminRoutes);
app.use('/upload', uploadRoutes);

// Error Handling Middleware
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).render('error', { 
        message: 'Something went wrong!',
        error: process.env.NODE_ENV === 'development' ? err : {}
    });
});

// 404 Handler
app.use((req, res) => {
    res.status(404).render('404');
});

// Start Server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`🚀 Server running on http://localhost:${PORT}`);
    console.log(`🔐 Admin login: ${process.env.ADMIN_USERNAME} / ${process.env.ADMIN_PASSWORD}`);
    console.log('⚠️  Change default admin credentials in .env file!');
});