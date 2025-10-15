import mongoose from 'mongoose';
import User from '../models/User.js';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

const approveAdminUsers = async () => {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/confine_auth');
    console.log('Connected to MongoDB');

    // Find all admin users that are pending approval
    const pendingAdmins = await User.find({
      role: 'admin',
      approvalStatus: 'pending'
    });

    console.log(`Found ${pendingAdmins.length} pending admin users`);

    if (pendingAdmins.length > 0) {
      // Update all pending admin users to approved
      const result = await User.updateMany(
        {
          role: 'admin',
          approvalStatus: 'pending'
        },
        {
          $set: {
            approvalStatus: 'approved',
            approvedAt: new Date(),
            isActive: true
          }
        }
      );

      console.log(`Updated ${result.modifiedCount} admin users to approved status`);

      // List the updated users
      const updatedAdmins = await User.find({
        role: 'admin',
        approvalStatus: 'approved'
      }).select('firstName lastName email approvalStatus');

      console.log('\nAdmin users now approved:');
      updatedAdmins.forEach(admin => {
        console.log(`- ${admin.firstName} ${admin.lastName} (${admin.email})`);
      });
    } else {
      console.log('No pending admin users found');
    }

  } catch (error) {
    console.error('Error approving admin users:', error);
  } finally {
    await mongoose.disconnect();
    console.log('Disconnected from MongoDB');
  }
};

// Run the script
approveAdminUsers();