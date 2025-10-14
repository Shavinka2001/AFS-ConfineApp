import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import dotenv from 'dotenv';
import User from '../models/User.js';

dotenv.config();

const seedUsers = [
  {
    username: 'admin',
    email: 'admin@confine.com',
    password: 'Admin123!',
    firstName: 'System',
    lastName: 'Administrator',
    role: 'admin',
    department: 'IT Administration',
    isActive: true
  },
  {
    username: 'manager1',
    email: 'manager@confine.com',
    password: 'Manager123!',
    firstName: 'John',
    lastName: 'Manager',
    role: 'manager',
    department: 'Operations',
    isActive: true
  },
  {
    username: 'tech1',
    email: 'technician@confine.com',
    password: 'Tech123!',
    firstName: 'Mike',
    lastName: 'Technician',
    role: 'technician',
    department: 'Maintenance',
    isActive: true
  },
  {
    username: 'user1',
    email: 'user@confine.com',
    password: 'User123!',
    firstName: 'Jane',
    lastName: 'User',
    role: 'user',
    department: 'General',
    isActive: true
  }
];

const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('MongoDB Connected');
  } catch (error) {
    console.error('Database connection error:', error);
    process.exit(1);
  }
};

const seedDatabase = async () => {
  try {
    await connectDB();
    
    // Clear existing users
    await User.deleteMany({});
    console.log('Cleared existing users');
    
    // Create seed users
    for (const userData of seedUsers) {
      const user = new User(userData);
      await user.save();
      console.log(`Created user: ${userData.username} (${userData.role})`);
    }
    
    console.log('✅ Database seeded successfully!');
    console.log('\n📋 Demo Accounts:');
    console.log('Admin: admin@confine.com / Admin123!');
    console.log('Manager: manager@confine.com / Manager123!');
    console.log('Technician: technician@confine.com / Tech123!');
    console.log('User: user@confine.com / User123!');
    
    process.exit(0);
  } catch (error) {
    console.error('Seeding error:', error);
    process.exit(1);
  }
};

seedDatabase();
