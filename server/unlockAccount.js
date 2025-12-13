require('dotenv').config();
const mongoose = require('mongoose');
const User = require('./models/User');

const unlockAccount = async () => {
  try {
    // Connect to MongoDB
    const mongoUri = process.env.MONGODB_URI || process.env.MONGO_URI;
    if (!mongoUri) {
      console.error('MongoDB URI not found in environment variables');
      process.exit(1);
    }
    await mongoose.connect(mongoUri);
    console.log('Connected to MongoDB');

    // Get email from command line argument or use default admin email
    const email = process.argv[2] || 'admin@safehaven.com';

    // Find the user
    const user = await User.findOne({ email: email.toLowerCase() });

    if (!user) {
      console.log(`No user found with email: ${email}`);
      process.exit(1);
    }

    // Check if account is locked
    if (user.isLocked) {
      console.log(`Account ${email} is currently locked until: ${user.lockUntil}`);
    } else {
      console.log(`Account ${email} is not locked`);
    }

    // Reset login attempts and unlock
    await user.updateOne({
      $unset: { loginAttempts: 1, lockUntil: 1 }
    });

    console.log(`✓ Account ${email} has been unlocked successfully!`);
    console.log('You can now login with your credentials.');

    process.exit(0);
  } catch (error) {
    console.error('Error unlocking account:', error);
    process.exit(1);
  }
};

unlockAccount();
