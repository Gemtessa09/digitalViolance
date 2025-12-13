require('dotenv').config();
const mongoose = require('mongoose');
const User = require('./models/User');

const checkAdmin = async () => {
  try {
    // Connect to MongoDB
    const mongoUri = process.env.MONGODB_URI || process.env.MONGO_URI;
    await mongoose.connect(mongoUri);
    console.log('Connected to MongoDB\n');

    // Find admin user
    const adminEmail = process.env.ADMIN_EMAIL || 'admin@safenetshield.org';
    const user = await User.findOne({ email: adminEmail.toLowerCase() }).select('+password');

    if (!user) {
      console.log('❌ Admin user NOT found in database!');
      console.log(`Looking for: ${adminEmail}`);
      console.log('\nRun: node server/seedAdmin.js to create the admin user');
    } else {
      console.log('✓ Admin user found!');
      console.log('Email:', user.email);
      console.log('Name:', user.name);
      console.log('Role:', user.role);
      console.log('Login Attempts:', user.loginAttempts || 0);
      console.log('Locked:', user.isLocked ? 'Yes' : 'No');
      console.log('Password Hash:', user.password ? 'Set' : 'Not Set');
      console.log('\nExpected credentials:');
      console.log('Email:', process.env.ADMIN_EMAIL);
      console.log('Password:', process.env.ADMIN_PASSWORD);
    }

    process.exit(0);
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
};

checkAdmin();
