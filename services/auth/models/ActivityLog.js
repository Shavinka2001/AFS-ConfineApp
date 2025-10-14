import mongoose from 'mongoose';

const activityLogSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  userEmail: {
    type: String,
    required: true
  },
  userName: {
    type: String,
    required: true
  },
  action: {
    type: String,
    required: true,
    enum: [
      'USER_LOGIN',
      'USER_LOGOUT', 
      'USER_REGISTER',
      'USER_UPDATED',
      'USER_DELETED',
      'PASSWORD_CHANGED',
      'FAILED_LOGIN',
      'SYSTEM_CONFIG_UPDATED',
      'ACCESS_CONTROL_UPDATED',
      'SECURITY_SETTINGS_UPDATED',
      'BACKUP_CREATED',
      'CACHE_CLEARED',
      'LOGS_CLEARED',
      'SERVICES_RESTARTED',
      'WORK_ORDER_CREATED',
      'WORK_ORDER_UPDATED',
      'WORK_ORDER_DELETED',
      'LOCATION_CREATED',
      'LOCATION_UPDATED',
      'LOCATION_DELETED',
      'TECHNICIAN_ASSIGNED',
      'SYSTEM_ERROR'
    ]
  },
  description: {
    type: String,
    required: true
  },
  ipAddress: {
    type: String
  },
  userAgent: {
    type: String
  },
  metadata: {
    type: mongoose.Schema.Types.Mixed,
    default: {}
  },
  severity: {
    type: String,
    enum: ['low', 'medium', 'high', 'critical'],
    default: 'low'
  },
  status: {
    type: String,
    enum: ['success', 'warning', 'error'],
    default: 'success'
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

// Index for better query performance
activityLogSchema.index({ createdAt: -1 });
activityLogSchema.index({ userId: 1, createdAt: -1 });
activityLogSchema.index({ action: 1, createdAt: -1 });

// Helper method to log activity
activityLogSchema.statics.logActivity = async function(activityData) {
  try {
    const activity = new this(activityData);
    await activity.save();
    return activity;
  } catch (error) {
    console.error('Error logging activity:', error);
    return null;
  }
};

// Helper method to get recent activities
activityLogSchema.statics.getRecentActivities = async function(limit = 10) {
  try {
    return await this.find()
      .populate('userId', 'firstName lastName email role')
      .sort({ createdAt: -1 })
      .limit(limit)
      .lean();
  } catch (error) {
    console.error('Error fetching recent activities:', error);
    return [];
  }
};

// Helper method to get activity stats
activityLogSchema.statics.getActivityStats = async function(days = 30) {
  try {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    const stats = await this.aggregate([
      {
        $match: {
          createdAt: { $gte: startDate }
        }
      },
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 }
        }
      }
    ]);

    return stats.reduce((acc, stat) => {
      acc[stat._id] = stat.count;
      return acc;
    }, {});
  } catch (error) {
    console.error('Error fetching activity stats:', error);
    return {};
  }
};

export default mongoose.model('ActivityLog', activityLogSchema);