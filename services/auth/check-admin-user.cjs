const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

// MongoDB URI - using the actual connection string from .env (without specifying database)
const MONGODB_URI = "mongodb+srv://shavinka:123shavi@cluster0.tmj36kj.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0";

// Connect to auth database
const connectDB = async () => {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Connected to MongoDB (auth database)');
    
    // Import User model from auth service
    const UserSchema = new mongoose.Schema({
      username: String,
      firstName: String,
      lastName: String,
      email: String,
      password: String,
      role: String,
      isActive: Boolean,
      emailVerified: Boolean
    }, { timestamps: true });
    
    const User = mongoose.model('User', UserSchema);
    
    // Find all users first to see what's in the database
    const allUsers = await User.find({});
    console.log(`📊 Found ${allUsers.length} total users:`);
    
    allUsers.forEach((user, index) => {
      console.log(`${index + 1}. Email: ${user.email}`);
      console.log(`   Username: ${user.username}`);
      console.log(`   Name: ${user.firstName} ${user.lastName}`);
      console.log(`   Role: ${user.role}`);
      console.log(`   Active: ${user.isActive}`);
      console.log(`   Email Verified: ${user.emailVerified}`);
      console.log(`   Created: ${user.createdAt}`);
      console.log('   ---');
    });
    
    // Find admin users
    const adminUsers = await User.find({ role: 'admin' });
    console.log(`📊 Found ${adminUsers.length} admin users:`);
    
    adminUsers.forEach((user, index) => {
      console.log(`${index + 1}. Email: ${user.email}`);
      console.log(`   Username: ${user.username}`);
      console.log(`   Name: ${user.firstName} ${user.lastName}`);
      console.log(`   Role: ${user.role}`);
      console.log(`   Active: ${user.isActive}`);
      console.log(`   Email Verified: ${user.emailVerified}`);
      console.log(`   Created: ${user.createdAt}`);
      console.log('   ---');
    });
    
    // Find any user with username 'admin'
    const adminUser = await User.findOne({ username: 'admin' });
    if (adminUser) {
      console.log('\n👤 Admin user details:');
      console.log('Email:', adminUser.email);
      console.log('Username:', adminUser.username);
      console.log('Role:', adminUser.role);
      console.log('Active:', adminUser.isActive);
      
      // Test password
      const testPassword = 'admin123';
      const isPasswordValid = await bcrypt.compare(testPassword, adminUser.password);
      console.log(`Password "admin123" is valid: ${isPasswordValid}`);
    }
    
    // Also check if there's a user with email 'admin@confined.com'
    const adminByEmail = await User.findOne({ email: 'admin@confined.com' });
    if (adminByEmail) {
      console.log('\n📧 User with admin@confined.com:');
      console.log('Username:', adminByEmail.username);
      console.log('Role:', adminByEmail.role);
      console.log('Active:', adminByEmail.isActive);
      
      // Test password
      const testPassword = 'admin123';
      const isPasswordValid = await bcrypt.compare(testPassword, adminByEmail.password);
      console.log(`Password "admin123" is valid: ${isPasswordValid}`);
    }
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await mongoose.disconnect();
    console.log('\n🔌 Disconnected from MongoDB');
    process.exit(0);
  }
};

connectDB();
