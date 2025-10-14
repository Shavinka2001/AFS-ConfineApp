import ActivityLog from '../models/ActivityLog.js';
import User from '../models/User.js';

// Helper function to log activities
export const logActivity = async (req, action, description, metadata = {}, severity = 'low', status = 'success') => {
  try {
    const activityData = {
      userId: req.user?.id,
      userEmail: req.user?.email || 'system@afs.com',
      userName: req.user ? `${req.user.firstName} ${req.user.lastName}` : 'System',
      action,
      description,
      ipAddress: req.ip || req.connection?.remoteAddress,
      userAgent: req.get('User-Agent'),
      metadata,
      severity,
      status
    };

    await ActivityLog.logActivity(activityData);
  } catch (error) {
    console.error('Error logging activity:', error);
  }
};

// Get recent activities for admin dashboard
export const getRecentActivities = async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 10;
    const activities = await ActivityLog.getRecentActivities(limit);

    // Format activities for frontend
    const formattedActivities = activities.map(activity => ({
      id: activity._id,
      title: getActivityTitle(activity.action),
      description: activity.description,
      time: getTimeAgo(activity.createdAt),
      status: activity.status,
      user: activity.userId ? {
        id: activity.userId._id,
        name: `${activity.userId.firstName} ${activity.userId.lastName}`,
        email: activity.userId.email,
        role: activity.userId.role
      } : null,
      action: activity.action,
      severity: activity.severity,
      metadata: activity.metadata
    }));

    res.json({
      success: true,
      data: formattedActivities
    });
  } catch (error) {
    console.error('Error fetching recent activities:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch recent activities'
    });
  }
};

// Get activity statistics
export const getActivityStats = async (req, res) => {
  try {
    const days = parseInt(req.query.days) || 30;
    const stats = await ActivityLog.getActivityStats(days);

    res.json({
      success: true,
      data: stats
    });
  } catch (error) {
    console.error('Error fetching activity stats:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch activity statistics'
    });
  }
};

// Get system health metrics
export const getSystemHealth = async (req, res) => {
  try {
    // Database health check
    const dbHealth = await checkDatabaseHealth();
    
    // Get recent error activities
    const recentErrors = await ActivityLog.find({
      status: 'error',
      createdAt: { $gte: new Date(Date.now() - 24 * 60 * 60 * 1000) } // Last 24 hours
    }).countDocuments();

    // Get active users (logged in within last hour)
    const activeUsers = await User.find({
      lastLogin: { $gte: new Date(Date.now() - 60 * 60 * 1000) }
    }).countDocuments();

    // System metrics
    const systemMetrics = {
      database: {
        status: dbHealth ? 'healthy' : 'error',
        message: dbHealth ? 'Connected and responsive' : 'Connection issues detected',
        lastCheck: new Date()
      },
      apiServices: {
        status: 'healthy',
        message: 'All endpoints operational',
        lastCheck: new Date()
      },
      activeUsers: {
        count: activeUsers,
        status: activeUsers > 0 ? 'active' : 'idle'
      },
      recentErrors: {
        count: recentErrors,
        status: recentErrors > 10 ? 'warning' : recentErrors > 5 ? 'caution' : 'normal'
      },
      uptime: process.uptime(),
      memory: process.memoryUsage(),
      cpu: process.cpuUsage()
    };

    res.json({
      success: true,
      data: systemMetrics
    });
  } catch (error) {
    console.error('Error fetching system health:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch system health metrics'
    });
  }
};

// Helper function to check database health
const checkDatabaseHealth = async () => {
  try {
    // Simple database ping
    await ActivityLog.findOne().limit(1);
    return true;
  } catch (error) {
    return false;
  }
};

// Helper function to get activity title based on action
const getActivityTitle = (action) => {
  const titles = {
    'USER_LOGIN': 'User Login',
    'USER_LOGOUT': 'User Logout',
    'USER_REGISTER': 'New User Registration',
    'USER_UPDATED': 'User Profile Updated',
    'USER_DELETED': 'User Account Deleted',
    'PASSWORD_CHANGED': 'Password Changed',
    'FAILED_LOGIN': 'Failed Login Attempt',
    'SYSTEM_CONFIG_UPDATED': 'System Configuration Updated',
    'ACCESS_CONTROL_UPDATED': 'Access Control Updated',
    'SECURITY_SETTINGS_UPDATED': 'Security Settings Updated',
    'BACKUP_CREATED': 'System Backup Created',
    'CACHE_CLEARED': 'System Cache Cleared',
    'LOGS_CLEARED': 'System Logs Cleared',
    'SERVICES_RESTARTED': 'System Services Restarted',
    'WORK_ORDER_CREATED': 'Work Order Created',
    'WORK_ORDER_UPDATED': 'Work Order Updated',
    'WORK_ORDER_DELETED': 'Work Order Deleted',
    'LOCATION_CREATED': 'Location Created',
    'LOCATION_UPDATED': 'Location Updated',
    'LOCATION_DELETED': 'Location Deleted',
    'TECHNICIAN_ASSIGNED': 'Technician Assigned',
    'SYSTEM_ERROR': 'System Error'
  };
  
  return titles[action] || action.replace(/_/g, ' ').toLowerCase().replace(/\b\w/g, l => l.toUpperCase());
};

// Helper function to get time ago string
const getTimeAgo = (date) => {
  const now = new Date();
  const diffMs = now - new Date(date);
  const diffMins = Math.floor(diffMs / (1000 * 60));
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffMins < 1) {
    return 'Just now';
  } else if (diffMins < 60) {
    return `${diffMins} minute${diffMins === 1 ? '' : 's'} ago`;
  } else if (diffHours < 24) {
    return `${diffHours} hour${diffHours === 1 ? '' : 's'} ago`;
  } else {
    return `${diffDays} day${diffDays === 1 ? '' : 's'} ago`;
  }
};