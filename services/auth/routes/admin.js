import express from 'express';
import SystemConfig from '../models/SystemConfig.js';
import AccessControl from '../models/AccessControl.js';
import SecuritySettings from '../models/SecuritySettings.js';
import { protect, authorize } from '../middleware/auth.js';
import { logActivity } from '../controllers/activityController.js';

const router = express.Router();

// System Configuration Routes
router.get('/system-config', protect, authorize('admin'), async (req, res) => {
  try {
    let config = await SystemConfig.findOne();
    
    if (!config) {
      // Create default system configuration
      config = new SystemConfig({
        systemName: 'Confine Management System',
        companyName: 'AFS Corporation',
        systemVersion: '1.0.0',
        maintenanceMode: false,
        registrationEnabled: true,
        maxFileSize: 10,
        sessionTimeout: 30,
        backupFrequency: 'daily',
        logLevel: 'info',
        timezoneOffset: '+00:00',
        dateFormat: 'MM/DD/YYYY',
        currency: 'USD',
        systemEmail: 'system@afs.com',
        supportEmail: 'support@afs.com',
        maxUsersPerRole: {
          admin: 5,
          manager: 20,
          technician: 100,
          user: 500
        }
      });
      await config.save();
    }
    
    res.json({
      success: true,
      data: config
    });
  } catch (error) {
    console.error('Error fetching system config:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch system configuration'
    });
  }
});

router.put('/system-config', protect, authorize('admin'), async (req, res) => {
  try {
    const {
      systemName,
      companyName,
      maintenanceMode,
      registrationEnabled,
      maxFileSize,
      sessionTimeout,
      backupFrequency,
      logLevel,
      systemEmail,
      supportEmail,
      maxUsersPerRole
    } = req.body;

    // Validation
    if (!systemName || !companyName || !systemEmail || !supportEmail) {
      return res.status(400).json({
        success: false,
        message: 'Required fields missing'
      });
    }

    if (maxFileSize < 1 || maxFileSize > 100) {
      return res.status(400).json({
        success: false,
        message: 'Max file size must be between 1 and 100 MB'
      });
    }

    if (sessionTimeout < 5 || sessionTimeout > 480) {
      return res.status(400).json({
        success: false,
        message: 'Session timeout must be between 5 and 480 minutes'
      });
    }

    let config = await SystemConfig.findOne();
    if (!config) {
      config = new SystemConfig();
    }

    // Update fields
    config.systemName = systemName;
    config.companyName = companyName;
    config.maintenanceMode = maintenanceMode;
    config.registrationEnabled = registrationEnabled;
    config.maxFileSize = maxFileSize;
    config.sessionTimeout = sessionTimeout;
    config.backupFrequency = backupFrequency;
    config.logLevel = logLevel;
    config.systemEmail = systemEmail;
    config.supportEmail = supportEmail;
    config.maxUsersPerRole = maxUsersPerRole;
    config.updatedAt = new Date();
    config.updatedBy = req.user.id;

    await config.save();

    // Log system configuration update
    await logActivity(
      req,
      'SYSTEM_CONFIG_UPDATED',
      `System configuration updated by ${req.user.firstName} ${req.user.lastName}`,
      { configFields: Object.keys(req.body) },
      'medium',
      'success'
    );

    res.json({
      success: true,
      message: 'System configuration updated successfully',
      data: config
    });
  } catch (error) {
    console.error('Error updating system config:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update system configuration'
    });
  }
});

// Access Control Routes
router.get('/access-control', protect, authorize('admin'), async (req, res) => {
  try {
    let accessControl = await AccessControl.findOne();
    
    if (!accessControl) {
      // Create default access control settings
      accessControl = new AccessControl({
        passwordPolicy: {
          minLength: 8,
          requireUppercase: true,
          requireLowercase: true,
          requireNumbers: true,
          requireSpecialChars: true,
          maxAge: 90
        },
        sessionSettings: {
          maxSessions: 3,
          idleTimeout: 30,
          rememberMe: true,
          twoFactorAuth: false
        },
        apiLimits: {
          rateLimit: 1000,
          dailyLimit: 10000,
          enableThrottling: true
        },
        permissions: {
          allowUserRegistration: true,
          allowPasswordReset: true,
          allowProfileEdit: true,
          allowRoleChange: false,
          allowDataExport: true,
          allowDataImport: false
        }
      });
      await accessControl.save();
    }
    
    res.json({
      success: true,
      data: accessControl
    });
  } catch (error) {
    console.error('Error fetching access control:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch access control settings'
    });
  }
});

router.put('/access-control', protect, authorize('admin'), async (req, res) => {
  try {
    const { passwordPolicy, sessionSettings, apiLimits, permissions } = req.body;

    // Validation
    if (passwordPolicy.minLength < 6 || passwordPolicy.minLength > 32) {
      return res.status(400).json({
        success: false,
        message: 'Password minimum length must be between 6 and 32 characters'
      });
    }

    if (sessionSettings.maxSessions < 1 || sessionSettings.maxSessions > 10) {
      return res.status(400).json({
        success: false,
        message: 'Max sessions must be between 1 and 10'
      });
    }

    let accessControl = await AccessControl.findOne();
    if (!accessControl) {
      accessControl = new AccessControl();
    }

    // Update fields
    accessControl.passwordPolicy = passwordPolicy;
    accessControl.sessionSettings = sessionSettings;
    accessControl.apiLimits = apiLimits;
    accessControl.permissions = permissions;
    accessControl.updatedAt = new Date();
    accessControl.updatedBy = req.user.id;

    await accessControl.save();

    // Log access control update
    await logActivity(
      req,
      'ACCESS_CONTROL_UPDATED',
      `Access control settings updated by ${req.user.firstName} ${req.user.lastName}`,
      { updatedSettings: Object.keys(req.body) },
      'high',
      'success'
    );

    res.json({
      success: true,
      message: 'Access control settings updated successfully',
      data: accessControl
    });
  } catch (error) {
    console.error('Error updating access control:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update access control settings'
    });
  }
});

// Security Settings Routes
router.get('/security-settings', protect, authorize('admin'), async (req, res) => {
  try {
    let securitySettings = await SecuritySettings.findOne();
    
    if (!securitySettings) {
      // Create default security settings
      securitySettings = new SecuritySettings({
        encryption: {
          algorithm: 'AES-256',
          keyRotationDays: 30,
          encryptDatabase: true,
          encryptFiles: true
        },
        audit: {
          enableAuditLog: true,
          logLevel: 'detailed',
          retentionDays: 365,
          alertOnFailedLogins: true,
          alertThreshold: 5
        },
        backup: {
          autoBackup: true,
          frequency: 'daily',
          retention: 30,
          location: 'cloud',
          encryption: true
        },
        monitoring: {
          enableSystemMonitoring: true,
          performanceAlerts: true,
          securityAlerts: true,
          emailNotifications: true,
          slackIntegration: false
        }
      });
      await securitySettings.save();
    }
    
    res.json({
      success: true,
      data: securitySettings
    });
  } catch (error) {
    console.error('Error fetching security settings:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch security settings'
    });
  }
});

router.put('/security-settings', protect, authorize('admin'), async (req, res) => {
  try {
    const { encryption, audit, backup, monitoring } = req.body;

    // Validation
    if (encryption.keyRotationDays < 7 || encryption.keyRotationDays > 365) {
      return res.status(400).json({
        success: false,
        message: 'Key rotation days must be between 7 and 365'
      });
    }

    if (audit.retentionDays < 30 || audit.retentionDays > 2555) {
      return res.status(400).json({
        success: false,
        message: 'Log retention days must be between 30 and 2555'
      });
    }

    let securitySettings = await SecuritySettings.findOne();
    if (!securitySettings) {
      securitySettings = new SecuritySettings();
    }

    // Update fields
    securitySettings.encryption = encryption;
    securitySettings.audit = audit;
    securitySettings.backup = backup;
    securitySettings.monitoring = monitoring;
    securitySettings.updatedAt = new Date();
    securitySettings.updatedBy = req.user.id;

    await securitySettings.save();

    // Log security settings update
    await logActivity(
      req,
      'SECURITY_SETTINGS_UPDATED',
      `Security settings updated by ${req.user.firstName} ${req.user.lastName}`,
      { updatedSettings: Object.keys(req.body) },
      'high',
      'success'
    );

    res.json({
      success: true,
      message: 'Security settings updated successfully',
      data: securitySettings
    });
  } catch (error) {
    console.error('Error updating security settings:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update security settings'
    });
  }
});

// System Status Route
router.get('/system-status', protect, authorize('admin'), async (req, res) => {
  try {
    // This would normally check actual system status
    // For now, returning mock data
    const status = {
      database: {
        status: 'healthy',
        message: 'Connected and responsive',
        lastCheck: new Date()
      },
      apiServices: {
        status: 'healthy',
        message: 'All endpoints operational',
        lastCheck: new Date()
      },
      fileStorage: {
        status: 'healthy',
        message: '85% capacity used',
        lastCheck: new Date()
      },
      network: {
        status: 'healthy',
        message: 'Low latency, high availability',
        lastCheck: new Date()
      },
      security: {
        status: 'warning',
        message: '2 security alerts pending',
        lastCheck: new Date()
      },
      performance: {
        status: 'healthy',
        message: 'Response time: 45ms avg',
        lastCheck: new Date()
      }
    };

    res.json({
      success: true,
      data: status
    });
  } catch (error) {
    console.error('Error fetching system status:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch system status'
    });
  }
});

// System Action Route
router.post('/system-action', protect, authorize('admin'), async (req, res) => {
  try {
    const { action } = req.body;

    const validActions = ['restart-services', 'create-backup', 'clear-cache', 'clear-logs'];
    if (!validActions.includes(action)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid system action'
      });
    }

    // Log the action
    console.log(`Admin ${req.user.email} performed system action: ${action}`);

    // Log system action
    await logActivity(
      req,
      action.toUpperCase().replace('-', '_'),
      `System action performed: ${action.replace('-', ' ')} by ${req.user.firstName} ${req.user.lastName}`,
      { action },
      'medium',
      'success'
    );

    // Here you would implement the actual system actions
    // For now, we'll simulate success
    switch (action) {
      case 'restart-services':
        // Simulate service restart
        setTimeout(() => {
          console.log('Services restarted successfully');
        }, 2000);
        break;
      case 'create-backup':
        // Simulate backup creation
        console.log('Backup creation initiated');
        break;
      case 'clear-cache':
        // Simulate cache clearing
        console.log('Cache cleared successfully');
        break;
      case 'clear-logs':
        // Simulate log clearing
        console.log('Logs cleared successfully');
        break;
    }

    res.json({
      success: true,
      message: `${action.replace('-', ' ')} completed successfully`
    });
  } catch (error) {
    console.error('Error performing system action:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to perform system action'
    });
  }
});

export default router;