require('dotenv').config();
const mongoose = require('mongoose');
const User = require('./models/User');

const resetAdminPassword = async () => {
  try {
    // Connect to MongoDB
    const mongoUri = process.env.MONGODB_URI || process.env.MONGO_URI;
    await mongoose.connect(mongoUri);
    console.log('Connected to MongoDB\n');

    const adminEmail = process.env.ADMIN_EMAIL || 'admin@safenetshield.org';
    const adminPassword = process.env.ADMIN_PASSWORD || 'SafeNet2024!';

    // Find admin user
    const user = await User.findOne({ email: adminEmail.toLowerCase() });

    if (!user) {
      console.log('❌ Admin user not found!');
      console.log('Run: node server/seedAdmin.js to create the admin user');
      process.exit(1);
    }

    // Reset password and unlock account
    user.password = adminPassword;
    user.loginAttempts = 0;
    user.lockUntil = undefined;
    await user.save();

    console.log('✓ Admin password reset successfully!');
    console.log('-----------------------------------');
    console.log('Email:', user.email);
    console.log('Password:', adminPassword);
    console.log('Role:', user.role);
    console.log('-----------------------------------');
    console.log('You can now login at: http://localhost:3000/login.html');

    process.exit(0);
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
};

resetAdminPassword();
