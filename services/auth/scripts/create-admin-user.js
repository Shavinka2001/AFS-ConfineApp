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

async function createAdminUser() {
  try {
    console.log('Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB successfully');

    // Check if admin user already exists
    const existingAdmin = await User.findOne({ email: 'admin@confine.com' });
    if (existingAdmin) {
      console.log('Admin user already exists:', existingAdmin.email);
      console.log('Current status:', {
        isActive: existingAdmin.isActive,
        approvalStatus: existingAdmin.approvalStatus,
        role: existingAdmin.role
      });
      
      // Update admin user to be approved and active
      existingAdmin.approvalStatus = 'approved';
      existingAdmin.isActive = true;
      existingAdmin.approvedAt = new Date();
      await existingAdmin.save();
      console.log('Admin user updated to approved status');
      
      mongoose.connection.close();
      return;
    }

    // Create new admin user
    const hashedPassword = await bcrypt.hash('Admin123!', 12);
    
    const adminUser = new User({
      username: 'admin',
      email: 'admin@confine.com',
      password: hashedPassword,
      firstName: 'System',
      lastName: 'Administrator',
      role: 'admin',
      isActive: true,
      approvalStatus: 'approved',
      approvedAt: new Date()
    });

    await adminUser.save();
    console.log('Admin user created successfully:');
    console.log('Email: admin@confine.com');
    console.log('Password: Admin123!');
    
  } catch (error) {
    console.error('Error creating admin user:', error);
  } finally {
    mongoose.connection.close();
  }
}

createAdminUser();