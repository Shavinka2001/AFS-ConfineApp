import mongoose from 'mongoose';

const AccessControlSchema = new mongoose.Schema({
  passwordPolicy: {
    minLength: {
      type: Number,
      default: 8,
      min: 6,
      max: 32
    },
    requireUppercase: {
      type: Boolean,
      default: true
    },
    requireLowercase: {
      type: Boolean,
      default: true
    },
    requireNumbers: {
      type: Boolean,
      default: true
    },
    requireSpecialChars: {
      type: Boolean,
      default: true
    },
    maxAge: {
      type: Number,
      default: 90,
      min: 30,
      max: 365
    }
  },
  sessionSettings: {
    maxSessions: {
      type: Number,
      default: 3,
      min: 1,
      max: 10
    },
    idleTimeout: {
      type: Number,
      default: 30,
      min: 5,
      max: 480
    },
    rememberMe: {
      type: Boolean,
      default: true
    },
    twoFactorAuth: {
      type: Boolean,
      default: false
    }
  },
  apiLimits: {
    rateLimit: {
      type: Number,
      default: 1000
    },
    dailyLimit: {
      type: Number,
      default: 10000
    },
    enableThrottling: {
      type: Boolean,
      default: true
    }
  },
  permissions: {
    allowUserRegistration: {
      type: Boolean,
      default: true
    },
    allowPasswordReset: {
      type: Boolean,
      default: true
    },
    allowProfileEdit: {
      type: Boolean,
      default: true
    },
    allowRoleChange: {
      type: Boolean,
      default: false
    },
    allowDataExport: {
      type: Boolean,
      default: true
    },
    allowDataImport: {
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

AccessControlSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

export default mongoose.model('AccessControl', AccessControlSchema);