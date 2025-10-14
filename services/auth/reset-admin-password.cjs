const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

// MongoDB URI - using the actual connection string from .env (without specifying database)
const MONGODB_URI = "mongodb+srv://shavinka:123shavi@cluster0.tmj36kj.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0";

// Connect to auth database and reset admin password
const resetAdminPassword = async () => {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Connected to MongoDB');
    
    // Define User schema
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
    
    // Find admin user
    const adminUser = await User.findOne({ email: 'admin@confine.com' });
    if (!adminUser) {
      console.log('❌ Admin user not found!');
      return;
    }
    
    console.log('👤 Found admin user:', adminUser.email);
    
    // Hash new password
    const newPassword = 'admin123';
    const saltRounds = 12;
    const hashedPassword = await bcrypt.hash(newPassword, saltRounds);
    
    // Update password
    adminUser.password = hashedPassword;
    await adminUser.save();
    
    console.log('✅ Admin password updated successfully!');
    console.log('Email: admin@confine.com');
    console.log('Password: admin123');
    
    // Test the new password
    const isPasswordValid = await bcrypt.compare(newPassword, adminUser.password);
    console.log(`Password verification test: ${isPasswordValid ? '✅ PASS' : '❌ FAIL'}`);
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await mongoose.disconnect();
    console.log('\n🔌 Disconnected from MongoDB');
    process.exit(0);
  }
};

resetAdminPassword();
