import mongoose from 'mongoose';
import jwt from 'jsonwebtoken';
import dotenv from 'dotenv';
import User from '../models/User.js';

dotenv.config();

const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('MongoDB Connected');
  } catch (error) {
    console.error('Database connection error:', error);
    process.exit(1);
  }
};

const generateToken = (id, role = null, userInfo = {}) => {
  const payload = { 
    id,
    userId: id,
    role: role || userInfo.role || 'user',
    email: userInfo.email || '',
    firstName: userInfo.firstName || '',
    lastName: userInfo.lastName || ''
  };
  
  console.log('Generating token with payload:', payload);
  
  return jwt.sign(payload, process.env.JWT_SECRET || 'your-secret-key', {
    expiresIn: '7d'
  });
};

const testAuth = async () => {
  try {
    await connectDB();
    
    // Find admin user
    const adminUser = await User.findOne({ role: 'admin' });
    if (!adminUser) {
      console.error('❌ Admin user not found!');
      process.exit(1);
    }
    
    console.log('✅ Admin user found:', {
      id: adminUser._id,
      email: adminUser.email,
      role: adminUser.role,
      firstName: adminUser.firstName,
      lastName: adminUser.lastName
    });
    
    // Generate token for admin
    const token = generateToken(adminUser._id, adminUser.role, {
      email: adminUser.email,
      firstName: adminUser.firstName,
      lastName: adminUser.lastName,
      role: adminUser.role
    });
    
    console.log('✅ Generated token for admin (first 50 chars):', token.substring(0, 50) + '...');
    
    // Decode and verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key');
    console.log('✅ Decoded token payload:', decoded);
    
    // Test role authorization
    const requiredRoles = ['admin', 'manager'];
    const hasPermission = requiredRoles.includes(decoded.role);
    console.log(`✅ Role authorization test: ${hasPermission ? 'PASSED' : 'FAILED'}`);
    console.log(`   User role: ${decoded.role}`);
    console.log(`   Required roles: ${requiredRoles.join(', ')}`);
    
    if (hasPermission) {
      console.log('\n🎉 Admin user should be able to delete all work orders!');
      console.log('\n📋 Use these credentials to test:');
      console.log('Email: admin@confine.com');
      console.log('Password: Admin123!');
    } else {
      console.log('\n❌ Admin user will NOT be able to delete all work orders!');
    }
    
    process.exit(0);
  } catch (error) {
    console.error('Test failed:', error);
    process.exit(1);
  }
};

testAuth();