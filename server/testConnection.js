/**
 * MongoDB Atlas Connection Test Script
 * Run this to verify your MongoDB Atlas connection works
 */

require('dotenv').config();
const mongoose = require('mongoose');

const testConnection = async () => {
  console.log('🔍 Testing MongoDB Atlas Connection...\n');
  
  // Display connection string (hide password)
  const uri = process.env.MONGODB_URI;
  const maskedUri = uri.replace(/:[^:@]+@/, ':****@');
  console.log('📍 Connection String:', maskedUri);
  console.log('📦 Database Name:', process.env.DB_NAME || 'Hackaton');
  console.log('');

  try {
    console.log('⏳ Connecting to MongoDB Atlas...');
    
    const conn = await mongoose.connect(uri, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });

    console.log('✅ Successfully connected to MongoDB Atlas!');
    console.log('📊 Host:', conn.connection.host);
    console.log('🗄️  Database:', conn.connection.name);
    console.log('🔌 Connection State:', conn.connection.readyState === 1 ? 'Connected' : 'Disconnected');
    console.log('');

    // Test database operations
    console.log('🧪 Testing database operations...');
    
    // List collections
    const collections = await conn.connection.db.listCollections().toArray();
    console.log('📚 Existing Collections:', collections.length > 0 ? collections.map(c => c.name).join(', ') : 'None (new database)');
    
    // Test write operation
    const testCollection = conn.connection.db.collection('connection_test');
    await testCollection.insertOne({ 
      test: true, 
      timestamp: new Date(),
      message: 'Connection test successful' 
    });
    console.log('✅ Write operation successful');
    
    // Test read operation
    const doc = await testCollection.findOne({ test: true });
    console.log('✅ Read operation successful');
    
    // Clean up test document
    await testCollection.deleteOne({ test: true });
    console.log('✅ Delete operation successful');
    
    console.log('');
    console.log('🎉 All tests passed! Your MongoDB Atlas connection is working perfectly.');
    console.log('');
    console.log('Next steps:');
    console.log('1. Run: npm run dev');
    console.log('2. Admin user will be created automatically');
    console.log('3. Access your app at: http://localhost:3000');
    
  } catch (error) {
    console.error('❌ Connection failed!');
    console.error('');
    console.error('Error details:', error.message);
    console.error('');
    
    // Provide helpful troubleshooting tips
    console.log('🔧 Troubleshooting tips:');
    
    if (error.message.includes('authentication failed')) {
      console.log('• Check your database password in .env file');
      console.log('• Verify the database user exists in MongoDB Atlas');
      console.log('• Ensure the user has proper permissions');
    } else if (error.message.includes('ENOTFOUND') || error.message.includes('timeout')) {
      console.log('• Check your internet connection');
      console.log('• Verify Network Access whitelist in MongoDB Atlas');
      console.log('• Add your IP address: 0.0.0.0/0 (for testing)');
    } else if (error.message.includes('bad auth')) {
      console.log('• Your password may contain special characters');
      console.log('• Try URL encoding special characters in password');
      console.log('• Or change password to use only alphanumeric characters');
    } else {
      console.log('• Check your MONGODB_URI in .env file');
      console.log('• Ensure connection string format is correct');
      console.log('• Visit MongoDB Atlas dashboard to verify cluster status');
    }
    
    console.log('');
    console.log('📖 Full documentation: https://docs.atlas.mongodb.com/');
    
    process.exit(1);
  } finally {
    // Close connection
    await mongoose.connection.close();
    console.log('🔌 Connection closed');
  }
};

// Run the test
testConnection();
