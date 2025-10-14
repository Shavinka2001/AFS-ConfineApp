import mongoose from 'mongoose';

const SecuritySettingsSchema = new mongoose.Schema({
  encryption: {
    algorithm: {
      type: String,
      enum: ['AES-256', 'AES-192', 'AES-128'],
      default: 'AES-256'
    },
    keyRotationDays: {
      type: Number,
      default: 30,
      min: 7,
      max: 365
    },
    encryptDatabase: {
      type: Boolean,
      default: true
    },
    encryptFiles: {
      type: Boolean,
      default: true
    }
  },
  audit: {
    enableAuditLog: {
      type: Boolean,
      default: true
    },
    logLevel: {
      type: String,
      enum: ['basic', 'detailed', 'verbose'],
      default: 'detailed'
    },
    retentionDays: {
      type: Number,
      default: 365,
      min: 30,
      max: 2555
    },
    alertOnFailedLogins: {
      type: Boolean,
      default: true
    },
    alertThreshold: {
      type: Number,
      default: 5,
      min: 1,
      max: 20
    }
  },
  backup: {
    autoBackup: {
      type: Boolean,
      default: true
    },
    frequency: {
      type: String,
      enum: ['hourly', 'daily', 'weekly', 'monthly'],
      default: 'daily'
    },
    retention: {
      type: Number,
      default: 30,
      min: 1,
      max: 365
    },
    location: {
      type: String,
      enum: ['local', 'cloud', 'both'],
      default: 'cloud'
    },
    encryption: {
      type: Boolean,
      default: true
    }
  },
  monitoring: {
    enableSystemMonitoring: {
      type: Boolean,
      default: true
    },
    performanceAlerts: {
      type: Boolean,
      default: true
    },
    securityAlerts: {
      type: Boolean,
      default: true
    },
    emailNotifications: {
      type: Boolean,
      default: true
    },
    slackIntegration: {
      type: Boolean,
      default: false
    }
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  },
  updatedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }
});

SecuritySettingsSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

export default mongoose.model('SecuritySettings', SecuritySettingsSchema);