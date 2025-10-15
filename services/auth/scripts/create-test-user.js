import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

// Simple User schema for this script
const userSchema = new mongoose.Schema({
  username: { type: String, required: true, unique: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  firstName: { type: String, required: true },
  lastName: { type: String, required: true },
  role: { type: String, enum: ['user', 'technician', 'manager', 'admin'], default: 'user' },
  isActive: { type: Boolean, default: true },
  approvalStatus: { type: String, enum: ['pending', 'approved', 'rejected'], default: 'pending' },
  approvedAt: { type: Date },
  createdAt: { type: Date, default: Date.now }
});

const User = mongoose.model('User', userSchema);

async function createTestUser() {
  try {
    console.log('Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB successfully');

    // Check if test user already exists
    const existingUser = await User.findOne({ email: 'testuser@confine.com' });
    if (existingUser) {
      console.log('Test user already exists:', existingUser.email);
      console.log('Current status:', {
        isActive: existingUser.isActive,
        approvalStatus: existingUser.approvalStatus,
        role: existingUser.role
      });
      mongoose.connection.close();
      return;
    }

    // Create new test user
    const hashedPassword = await bcrypt.hash('Test123!', 12);
    
    const testUser = new User({
      username: 'testuser',
      email: 'testuser@confine.com',
      password: hashedPassword,
      firstName: 'Test',
      lastName: 'User',
      role: 'user',
      isActive: true,
      approvalStatus: 'pending' // This user needs approval
    });

    await testUser.save();
    console.log('Test user created successfully:');
    console.log('Email: testuser@confine.com');
    console.log('Password: Test123!');
    console.log('Status: pending approval');
    
  } catch (error) {
    console.error('Error creating test user:', error);
  } finally {
    mongoose.connection.close();
  }
}

createTestUser();