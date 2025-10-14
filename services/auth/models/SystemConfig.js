import mongoose from 'mongoose';

const SystemConfigSchema = new mongoose.Schema({
  systemName: {
    type: String,
    required: true,
    default: 'Confine Management System'
  },
  companyName: {
    type: String,
    required: true,
    default: 'AFS Corporation'
  },
  systemVersion: {
    type: String,
    default: '1.0.0'
  },
  maintenanceMode: {
    type: Boolean,
    default: false
  },
  registrationEnabled: {
    type: Boolean,
    default: true
  },
  maxFileSize: {
    type: Number,
    default: 10,
    min: 1,
    max: 100
  },
  sessionTimeout: {
    type: Number,
    default: 30,
    min: 5,
    max: 480
  },
  backupFrequency: {
    type: String,
    enum: ['hourly', 'daily', 'weekly', 'monthly'],
    default: 'daily'
  },
  logLevel: {
    type: String,
    enum: ['error', 'warn', 'info', 'debug'],
    default: 'info'
  },
  timezoneOffset: {
    type: String,
    default: '+00:00'
  },
  dateFormat: {
    type: String,
    default: 'MM/DD/YYYY'
  },
  currency: {
    type: String,
    default: 'USD'
  },
  systemEmail: {
    type: String,
    required: true,
    default: 'system@afs.com'
  },
  supportEmail: {
    type: String,
    required: true,
    default: 'support@afs.com'
  },
  maxUsersPerRole: {
    admin: {
      type: Number,
      default: 5
    },
    manager: {
      type: Number,
      default: 20
    },
    technician: {
      type: Number,
      default: 100
    },
    user: {
      type: Number,
      default: 500
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

SystemConfigSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

export default mongoose.model('SystemConfig', SystemConfigSchema);