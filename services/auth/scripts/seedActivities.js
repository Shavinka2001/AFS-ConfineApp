import mongoose from 'mongoose';
import ActivityLog from '../models/ActivityLog.js';
import User from '../models/User.js';

const sampleActivities = [
  {
    action: 'USER_LOGIN',
    description: 'Admin user logged in successfully',
    severity: 'low',
    status: 'success',
    metadata: { role: 'admin' }
  },
  {
    action: 'SYSTEM_CONFIG_UPDATED',
    description: 'System configuration updated: maintenance mode enabled',
    severity: 'medium',
    status: 'success',
    metadata: { configFields: ['maintenanceMode'] }
  },
  {
    action: 'BACKUP_CREATED',
    description: 'System backup completed successfully',
    severity: 'low',
    status: 'success',
    metadata: { backupSize: '2.5GB' }
  },
  {
    action: 'FAILED_LOGIN',
    description: 'Failed login attempt detected from suspicious IP',
    severity: 'high',
    status: 'warning',
    metadata: { attempts: 3, ipAddress: '192.168.1.100' }
  },
  {
    action: 'USER_REGISTER',
    description: 'New technician user registered: John Smith',
    severity: 'medium',
    status: 'success',
    metadata: { role: 'technician', department: 'Field Operations' }
  },
  {
    action: 'SECURITY_SETTINGS_UPDATED',
    description: 'Security settings updated: encryption enabled',
    severity: 'high',
    status: 'success',
    metadata: { updatedSettings: ['encryption'] }
  },
  {
    action: 'WORK_ORDER_CREATED',
    description: 'New work order created for confined space inspection',
    severity: 'low',
    status: 'success',
    metadata: { workOrderId: 'WO-2024-001', location: 'Building A' }
  },
  {
    action: 'SYSTEM_ERROR',
    description: 'Database connection timeout detected',
    severity: 'critical',
    status: 'error',
    metadata: { errorCode: 'DB_TIMEOUT', duration: '30s' }
  }
];

export const seedActivities = async () => {
  try {
    // Find admin user for sample activities
    const adminUser = await User.findOne({ role: 'admin' });
    
    if (!adminUser) {
      console.log('No admin user found. Skipping activity seeding.');
      return;
    }

    // Clear existing activities
    await ActivityLog.deleteMany({});

    // Create sample activities with staggered timestamps
    const activities = sampleActivities.map((activity, index) => {
      const createdAt = new Date();
      createdAt.setMinutes(createdAt.getMinutes() - (index * 15)); // 15 minutes apart

      return {
        ...activity,
        userId: adminUser._id,
        userEmail: adminUser.email,
        userName: `${adminUser.firstName} ${adminUser.lastName}`,
        ipAddress: '127.0.0.1',
        userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        createdAt
      };
    });

    await ActivityLog.insertMany(activities);
    console.log('Sample activities seeded successfully');
  } catch (error) {
    console.error('Error seeding activities:', error);
  }
};